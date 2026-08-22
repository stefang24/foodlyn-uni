using Foodlyn.Modules.Identity.Application.DTOs;
using Foodlyn.Modules.Identity.Application.Repositories;
using Foodlyn.Modules.Identity.Domain.Entities;
using Foodlyn.Modules.Identity.Domain.Enums;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Helpers;
using Mapster;

namespace Foodlyn.Modules.Identity.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _repository;
        private static readonly UserRole[] ManagerCreatableRoles =
        {
            UserRole.Cook,
            UserRole.Waiter,
            UserRole.Cashier,
            UserRole.StatusDisplay,
        };

        public UserService(IUserRepository repository)
        {
            _repository = repository;
        }

        public async Task<Result<List<UserDto>>> GetAllAsync()
        {
            var users = await _repository.GetAllWithAssignmentsAsync();
            return Result<List<UserDto>>.Success(users.Adapt<List<UserDto>>());
        }

        public async Task<Result<PagedResult<UserDto>>> GetPagedAsync(PagedUserQueryDto query)
        {
            var (items, total) = await _repository.GetPagedAsync(query);
            return Result<PagedResult<UserDto>>.Success(new PagedResult<UserDto>
            {
                Items = items.Adapt<List<UserDto>>(),
                TotalCount = total,
                Page = query.SafePage,
                PageSize = query.SafePageSize,
            });
        }

        public async Task<Result<List<UserDto>>> GetByRestaurantIdsAsync(IEnumerable<long> restaurantIds)
        {
            var idSet = restaurantIds.ToHashSet();
            var users = await _repository.GetAllWithAssignmentsAsync();
            var filtered = users
                .Where(u =>
                    (u.RestaurantId.HasValue && idSet.Contains(u.RestaurantId.Value)) ||
                    u.RestaurantAssignments.Any(a => idSet.Contains(a.RestaurantId)))
                .ToList()
                .Adapt<List<UserDto>>();
            return Result<List<UserDto>>.Success(filtered);
        }

        public async Task<Result<UserDto>> GetByIdAsync(long id)
        {
            var user = await _repository.GetByIdWithAssignmentsAsync(id);
            if (user is null)
                return Result<UserDto>.Failure("User not found");

            return Result<UserDto>.Success(user.Adapt<UserDto>());
        }

        public async Task<Result<string>> CreateAccountAsync(RegisterDto dto, long creatorId, UserRole creatorRole)
        {
            if (!Enum.TryParse<UserRole>(dto.Role, true, out var role))
                return Result<string>.Failure("Unknown role");

            if (creatorRole == UserRole.Manager)
            {
                if (!ManagerCreatableRoles.Contains(role))
                    return Result<string>.Failure("Manager can only create Cook, Waiter or Cashier accounts");

                var assigned = await _repository.GetAssignedRestaurantIdsAsync(creatorId);
                if (!assigned.Contains(dto.RestaurantId))
                    return Result<string>.Failure("You are not assigned to this restaurant");
            }
            else if (creatorRole == UserRole.SuperAdmin)
            {
                if (!await _repository.RestaurantExistsAsync(dto.RestaurantId))
                    return Result<string>.Failure("Restaurant not found");
            }
            else
            {
                return Result<string>.Failure("You are not allowed to create accounts");
            }

            if (await _repository.EmailExistsAsync(dto.Email) || await _repository.UsernameExistsAsync(dto.Username))
                return Result<string>.Failure("User already exists");

            var user = dto.Adapt<User>();
            user.PasswordHash = PasswordHelper.HashPassword(dto.Password);
            user.Role = role;
            user.RestaurantId = dto.RestaurantId;
            user.CreatedBy = creatorId;

            await _repository.AddAsync(user);
            await _repository.SaveChangesAsync();

            await _repository.AddAssignmentAsync(new RestaurantAssignment
            {
                UserId = user.Id,
                RestaurantId = dto.RestaurantId,
            });
            await _repository.SaveChangesAsync();

            return Result<string>.Success("Account created successfuly");
        }

        public async Task<Result<UserDto>> UpdateAsync(long id, UpdateUserDto dto, long updaterId)
        {
            var user = await _repository.GetByIdWithAssignmentsAsync(id);
            if (user is null)
                return Result<UserDto>.Failure("User not found");

            if (!Enum.TryParse<UserRole>(dto.Role, true, out var role))
                return Result<UserDto>.Failure("Unknown role");

            var email = dto.Email.Trim().ToLower();
            var username = dto.Username.Trim();

            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(username))
                return Result<UserDto>.Failure("Email and username are required");

            if (await _repository.EmailExistsForOtherAsync(email, id))
                return Result<UserDto>.Failure("Email already in use");

            if (await _repository.UsernameExistsForOtherAsync(username, id))
                return Result<UserDto>.Failure("Username already in use");

            dto.Adapt(user);
            user.Role = role;
            user.UpdatedBy = updaterId;

            await _repository.ClearAssignmentsAsync(id);
            foreach (var rid in dto.RestaurantIds.Distinct())
            {
                await _repository.AddAssignmentAsync(new RestaurantAssignment
                {
                    UserId = id,
                    RestaurantId = rid,
                });
            }

            await _repository.SaveChangesAsync();

            var fresh = await _repository.GetByIdWithAssignmentsAsync(id);
            return Result<UserDto>.Success(fresh!.Adapt<UserDto>());
        }

        public async Task<Result<UserDto>> UpdateAsManagerAsync(long id, UpdateUserDto dto, long managerId)
        {
            var manager = await _repository.GetByIdWithAssignmentsAsync(managerId);
            if (manager is null) return Result<UserDto>.Failure("Manager not found");

            var managerRestaurantIds = manager.RestaurantAssignments.Select(a => a.RestaurantId).ToHashSet();
            if (manager.RestaurantId.HasValue) managerRestaurantIds.Add(manager.RestaurantId.Value);

            var user = await _repository.GetByIdWithAssignmentsAsync(id);
            if (user is null) return Result<UserDto>.Failure("User not found");

            var userRestaurantIds = user.RestaurantAssignments.Select(a => a.RestaurantId).ToHashSet();
            if (user.RestaurantId.HasValue) userRestaurantIds.Add(user.RestaurantId.Value);

            if (!userRestaurantIds.Any(rid => managerRestaurantIds.Contains(rid)))
                return Result<UserDto>.Failure("This user is not in any of your restaurants");

            if (user.Role == UserRole.SuperAdmin || user.Role == UserRole.Manager)
                return Result<UserDto>.Failure("You can't edit this account");

            if (!Enum.TryParse<UserRole>(dto.Role, true, out var role))
                return Result<UserDto>.Failure("Unknown role");

            if (role != UserRole.Cook && role != UserRole.Waiter && role != UserRole.Cashier && role != UserRole.StatusDisplay)
                return Result<UserDto>.Failure("Managers can only assign Cook, Waiter, Cashier, or StatusDisplay roles");

            var username = dto.Username.Trim();

            if (string.IsNullOrEmpty(username))
                return Result<UserDto>.Failure("Username is required");

            if (await _repository.UsernameExistsForOtherAsync(username, id))
                return Result<UserDto>.Failure("Username already in use");

            var allowedRestaurantIds = dto.RestaurantIds
                .Distinct()
                .Where(rid => managerRestaurantIds.Contains(rid))
                .ToList();

            if (allowedRestaurantIds.Count == 0)
                return Result<UserDto>.Failure("Assign at least one of your restaurants");

            var preservedEmail = user.Email;
            dto.Adapt(user);
            user.Email = preservedEmail;
            user.Role = role;
            user.RestaurantId = allowedRestaurantIds.Contains(dto.RestaurantId ?? -1)
                ? dto.RestaurantId
                : allowedRestaurantIds.First();
            user.UpdatedBy = managerId;

            await _repository.ClearAssignmentsAsync(id);
            foreach (var rid in allowedRestaurantIds)
            {
                await _repository.AddAssignmentAsync(new RestaurantAssignment
                {
                    UserId = id,
                    RestaurantId = rid,
                });
            }

            await _repository.SaveChangesAsync();

            var fresh = await _repository.GetByIdWithAssignmentsAsync(id);
            return Result<UserDto>.Success(fresh!.Adapt<UserDto>());
        }

        public async Task<Result<string>> ResetPasswordByAdminAsync(long targetUserId, AdminResetPasswordDto dto, long actorId)
        {
            if (string.IsNullOrEmpty(dto.NewPassword) || dto.NewPassword.Length < 6)
                return Result<string>.Failure("New password must be at least 6 characters");
            if (dto.NewPassword != dto.ConfirmPassword)
                return Result<string>.Failure("Passwords do not match");

            var actor = await _repository.GetByIdWithAssignmentsAsync(actorId);
            if (actor is null) return Result<string>.Failure("Actor not found");

            var target = await _repository.GetByIdWithAssignmentsAsync(targetUserId);
            if (target is null) return Result<string>.Failure("User not found");

            if (actor.Role != UserRole.SuperAdmin)
            {
                if (actor.Role != UserRole.Manager)
                    return Result<string>.Failure("Not authorized");

                if (target.Role == UserRole.SuperAdmin || target.Role == UserRole.Manager)
                    return Result<string>.Failure("You can't reset this account's password");

                var actorRestaurantIds = actor.RestaurantAssignments.Select(a => a.RestaurantId).ToHashSet();
                if (actor.RestaurantId.HasValue) actorRestaurantIds.Add(actor.RestaurantId.Value);

                var targetRestaurantIds = target.RestaurantAssignments.Select(a => a.RestaurantId).ToHashSet();
                if (target.RestaurantId.HasValue) targetRestaurantIds.Add(target.RestaurantId.Value);

                if (!targetRestaurantIds.Any(rid => actorRestaurantIds.Contains(rid)))
                    return Result<string>.Failure("This user is not in any of your restaurants");
            }

            target.PasswordHash = PasswordHelper.HashPassword(dto.NewPassword);
            target.UpdatedBy = actorId;
            await _repository.SaveChangesAsync();
            return Result<string>.Success("Password updated");
        }

        public async Task<Result<UserDto>> UpdateMyProfileAsync(long userId, UpdateMyProfileDto dto)
        {
            var user = await _repository.GetByIdWithAssignmentsAsync(userId);
            if (user is null) return Result<UserDto>.Failure("User not found");

            var username = dto.Username?.Trim();

            if (string.IsNullOrEmpty(username))
                return Result<UserDto>.Failure("Username is required");

            if (await _repository.UsernameExistsForOtherAsync(username, userId))
                return Result<UserDto>.Failure("Username already in use");

            var preservedEmail = user.Email;
            dto.Adapt(user);
            user.Email = preservedEmail;
            user.UpdatedBy = userId;

            await _repository.SaveChangesAsync();
            var fresh = await _repository.GetByIdWithAssignmentsAsync(userId);
            return Result<UserDto>.Success(fresh!.Adapt<UserDto>());
        }

        public async Task<Result<string>> ChangePasswordAsync(long userId, ChangePasswordDto dto)
        {
            if (string.IsNullOrEmpty(dto.NewPassword) || dto.NewPassword.Length < 6)
                return Result<string>.Failure("New password must be at least 6 characters");
            if (dto.NewPassword != dto.ConfirmPassword)
                return Result<string>.Failure("Passwords do not match");

            var user = await _repository.GetByIdWithAssignmentsAsync(userId);
            if (user is null) return Result<string>.Failure("User not found");

            if (!PasswordHelper.VerifyPassword(dto.CurrentPassword ?? string.Empty, user.PasswordHash))
                return Result<string>.Failure("Current password is incorrect");

            user.PasswordHash = PasswordHelper.HashPassword(dto.NewPassword);
            user.UpdatedBy = userId;
            await _repository.SaveChangesAsync();
            return Result<string>.Success("Password updated");
        }

        public async Task<List<long>> GetAssignedRestaurantIdsAsync(long userId)
        {
            var user = await _repository.GetByIdWithAssignmentsAsync(userId);
            if (user is null) return new List<long>();
            return user.RestaurantAssignments.Select(a => a.RestaurantId).ToList();
        }
    }
}
