using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Foodlyn.Modules.Restaurants.Application.DTOs;
using Foodlyn.Modules.Restaurants.Application.Repositories;
using Foodlyn.Modules.Restaurants.Domain.Entities;
using Foodlyn.Shared.Application;
using Mapster;

namespace Foodlyn.Modules.Restaurants.Application.Services
{
    public class RestaurantService : IRestaurantService
    {
        private readonly IRestaurantRepository _repository;

        public RestaurantService(IRestaurantRepository repository)
        {
            _repository = repository;
        }

        public async Task<Result<RestaurantDto>> CreateAsync(CreateRestaurantDto dto, long userId)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return Result<RestaurantDto>.Failure("Name is required");

            if (await _repository.NameExistsAsync(dto.Name.Trim()))
                return Result<RestaurantDto>.Failure("A restaurant with this name already exists");

            var slug = string.IsNullOrWhiteSpace(dto.Slug) ? Slugify(dto.Name) : Slugify(dto.Slug);
            if (string.IsNullOrEmpty(slug))
                return Result<RestaurantDto>.Failure("Could not generate a valid slug");

            if (await _repository.SlugExistsAsync(slug))
                return Result<RestaurantDto>.Failure("A restaurant with this slug already exists");

            var restaurant = dto.Adapt<Restaurant>();
            restaurant.Slug = slug;
            restaurant.CreatedBy = userId;

            await _repository.AddAsync(restaurant);
            await _repository.SaveChangesAsync();

            return Result<RestaurantDto>.Success(restaurant.Adapt<RestaurantDto>());
        }

        public async Task<Result<List<RestaurantDto>>> GetAllAsync()
        {
            var items = await _repository.GetAllAsync();
            return Result<List<RestaurantDto>>.Success(items.Adapt<List<RestaurantDto>>());
        }

        public async Task<Result<List<RestaurantDto>>> GetByIdsAsync(IEnumerable<long> ids)
        {
            var items = await _repository.GetByIdsAsync(ids);
            return Result<List<RestaurantDto>>.Success(items.Adapt<List<RestaurantDto>>());
        }

        public async Task<Result<RestaurantDto>> GetByIdAsync(long id)
        {
            var restaurant = await _repository.GetByIdAsync(id);
            if (restaurant is null)
                return Result<RestaurantDto>.Failure("Restaurant not found");

            return Result<RestaurantDto>.Success(restaurant.Adapt<RestaurantDto>());
        }

        public async Task<Result<RestaurantDto>> GetBySlugAsync(string slug)
        {
            if (string.IsNullOrWhiteSpace(slug))
                return Result<RestaurantDto>.Failure("Slug is required");

            var restaurant = await _repository.GetBySlugAsync(slug.Trim().ToLowerInvariant());
            if (restaurant is null)
                return Result<RestaurantDto>.Failure("Restaurant not found");

            return Result<RestaurantDto>.Success(restaurant.Adapt<RestaurantDto>());
        }

        public async Task<Result<PagedResult<RestaurantDto>>> GetPagedAsync(PagedRestaurantQueryDto query)
        {
            var (items, total) = await _repository.GetPagedAsync(query);
            return Result<PagedResult<RestaurantDto>>.Success(new PagedResult<RestaurantDto>
            {
                Items = items.Adapt<List<RestaurantDto>>(),
                TotalCount = total,
                Page = query.SafePage,
                PageSize = query.SafePageSize,
            });
        }

        public async Task<Result<List<RestaurantDto>>> GetPublicActiveAsync()
        {
            var items = await _repository.GetAllAsync();
            var active = items.Where(r => r.IsActive).ToList().Adapt<List<RestaurantDto>>();
            return Result<List<RestaurantDto>>.Success(active);
        }

        public async Task<Result<RestaurantDto>> UpdateAsync(long id, UpdateRestaurantDto dto, long userId, bool allowRename)
        {
            var restaurant = await _repository.GetByIdAsync(id);
            if (restaurant is null)
                return Result<RestaurantDto>.Failure("Restaurant not found");

            if (allowRename && !string.IsNullOrWhiteSpace(dto.Name))
            {
                var newName = dto.Name.Trim();
                if (!string.Equals(newName, restaurant.Name, StringComparison.Ordinal))
                {
                    if (await _repository.NameExistsAsync(newName))
                        return Result<RestaurantDto>.Failure("A restaurant with this name already exists");

                    restaurant.Name = newName;
                }
            }

            dto.Adapt(restaurant);

            if (allowRename && dto.IsActive.HasValue)
                restaurant.IsActive = dto.IsActive.Value;
            restaurant.UpdatedBy = userId;

            await _repository.SaveChangesAsync();

            return Result<RestaurantDto>.Success(restaurant.Adapt<RestaurantDto>());
        }

        public async Task<Result<List<RestaurantOpeningHourDto>>> GetOpeningHoursAsync(long restaurantId)
        {
            var hours = await _repository.GetOpeningHoursAsync(restaurantId);
            return Result<List<RestaurantOpeningHourDto>>.Success(hours.Adapt<List<RestaurantOpeningHourDto>>());
        }

        public async Task<Result<List<RestaurantOpeningHourDto>>> SaveOpeningHoursAsync(long restaurantId, UpdateOpeningHoursDto dto)
        {
            var entities = new List<RestaurantOpeningHour>();
            foreach (var d in dto.Days)
            {
                if (d.DayOfWeek < 0 || d.DayOfWeek > 6)
                    return Result<List<RestaurantOpeningHourDto>>.Failure("DayOfWeek must be 0..6");

                TimeOnly? open = null;
                TimeOnly? close = null;
                if (d.IsOpen)
                {
                    if (!TryParseTime(d.OpenTime, out var o) || !TryParseTime(d.CloseTime, out var c))
                        return Result<List<RestaurantOpeningHourDto>>.Failure("Invalid time format (expected HH:mm)");
                    if (c == o)
                        return Result<List<RestaurantOpeningHourDto>>.Failure("Close time cannot equal open time");
                    open = o;
                    close = c;
                }

                entities.Add(new RestaurantOpeningHour
                {
                    RestaurantId = restaurantId,
                    DayOfWeek = d.DayOfWeek,
                    IsOpen = d.IsOpen,
                    OpenTime = open,
                    CloseTime = close,
                });
            }

            await _repository.ReplaceOpeningHoursAsync(restaurantId, entities);
            await _repository.SaveChangesAsync();

            var saved = await _repository.GetOpeningHoursAsync(restaurantId);
            return Result<List<RestaurantOpeningHourDto>>.Success(saved.Adapt<List<RestaurantOpeningHourDto>>());
        }

        private static bool TryParseTime(string? value, out TimeOnly result)
        {
            result = default;
            if (string.IsNullOrWhiteSpace(value)) return false;
            return TimeOnly.TryParse(value, out result);
        }

        private static string Slugify(string input)
        {
            var normalized = input.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder(normalized.Length);
            foreach (var ch in normalized)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                    sb.Append(ch);
            }

            var ascii = sb.ToString().Normalize(NormalizationForm.FormC);
            var slug = Regex.Replace(ascii, "[^a-z0-9\\s-]", "");
            slug = Regex.Replace(slug, "[\\s-]+", "-").Trim('-');
            return slug.Length > 100 ? slug[..100] : slug;
        }
    }
}
