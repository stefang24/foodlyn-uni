using System.Text.Json;
using Foodlyn.Modules.Identity.Domain.Enums;
using Foodlyn.Modules.Notifications.Application.DTOs;
using Foodlyn.Modules.Notifications.Application.Repositories;
using Foodlyn.Modules.Notifications.Application.Services;
using Foodlyn.Modules.Notifications.Domain.Entities;
using Foodlyn.Persistence;
using Mapster;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Foodlyn.API.Hubs
{
    public class NotificationDispatcher : INotificationDispatcher
    {
        private readonly AppDbContext _db;
        private readonly INotificationRepository _notifications;
        private readonly IHubContext<OrderHub> _hub;

        public NotificationDispatcher(
            AppDbContext db,
            INotificationRepository notifications,
            IHubContext<OrderHub> hub)
        {
            _db = db;
            _notifications = notifications;
            _hub = hub;
        }

        public async Task DispatchToRoleAsync(
            long restaurantId,
            string role,
            string type,
            string title,
            string? body = null,
            object? data = null)
        {
            if (!Enum.TryParse<UserRole>(role, true, out var parsedRole)) return;

            var userIds = await _db.Users
                .IgnoreQueryFilters()
                .Where(u => u.IsActive && u.Role == parsedRole)
                .Where(u => u.RestaurantId == restaurantId
                    || u.RestaurantAssignments.Any(a => a.RestaurantId == restaurantId))
                .Select(u => u.Id)
                .ToListAsync();

            if (userIds.Count == 0) return;

            var serializedData = data is null ? null : JsonSerializer.Serialize(data);
            var now = DateTime.UtcNow;

            var entities = userIds.Select(uid => new Notification
            {
                UserId = uid,
                RestaurantId = restaurantId,
                Type = type,
                Title = title,
                Body = body,
                Data = serializedData,
                IsRead = false,
                CreatedAt = now,
            }).ToList();

            await _notifications.AddRangeAsync(entities);
            await _notifications.SaveChangesAsync();

            foreach (var entity in entities)
            {
                var dto = entity.Adapt<NotificationDto>();
                await _hub.Clients
                    .Group(OrderHub.UserGroup(entity.UserId))
                    .SendAsync("notificationCreated", dto);
            }
        }

        public async Task DispatchToUserAsync(
            long userId,
            string type,
            string title,
            string? body = null,
            long? restaurantId = null,
            object? data = null)
        {
            var serializedData = data is null ? null : JsonSerializer.Serialize(data);
            var entity = new Notification
            {
                UserId = userId,
                RestaurantId = restaurantId,
                Type = type,
                Title = title,
                Body = body,
                Data = serializedData,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
            };

            await _notifications.AddRangeAsync(new[] { entity });
            await _notifications.SaveChangesAsync();

            var dto = entity.Adapt<NotificationDto>();
            await _hub.Clients
                .Group(OrderHub.UserGroup(userId))
                .SendAsync("notificationCreated", dto);
        }
    }
}
