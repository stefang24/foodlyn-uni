using Foodlyn.Modules.Restaurants.Application.DTOs;
using Foodlyn.Modules.Restaurants.Application.Repositories;
using Foodlyn.Modules.Restaurants.Domain.Entities;
using Foodlyn.Modules.Restaurants.Domain.Enums;
using Foodlyn.Shared.Application;
using Mapster;

namespace Foodlyn.Modules.Restaurants.Application.Services
{
    public class RestaurantTableService : IRestaurantTableService
    {
        private readonly IRestaurantTableRepository _repository;
        private readonly IRestaurantRepository _restaurantRepository;

        public RestaurantTableService(
            IRestaurantTableRepository repository,
            IRestaurantRepository restaurantRepository)
        {
            _repository = repository;
            _restaurantRepository = restaurantRepository;
        }

        public async Task<Result<List<RestaurantTableDto>>> GetByRestaurantAsync(long restaurantId)
        {
            var tables = await _repository.GetByRestaurantAsync(restaurantId);
            return Result<List<RestaurantTableDto>>.Success(tables.Adapt<List<RestaurantTableDto>>());
        }

        public async Task<Result<RestaurantTableDto>> GetByIdAsync(long id)
        {
            var table = await _repository.GetByIdAsync(id);
            return table is null
                ? Result<RestaurantTableDto>.Failure("Table not found")
                : Result<RestaurantTableDto>.Success(table.Adapt<RestaurantTableDto>());
        }

        public async Task<Result<RestaurantTableDto>> CreateAsync(CreateRestaurantTableDto dto, long userId)
        {
            if (dto.Number <= 0)
                return Result<RestaurantTableDto>.Failure("Table number must be positive");

            if (dto.Capacity <= 0)
                return Result<RestaurantTableDto>.Failure("Capacity must be positive");

            if (await _repository.NumberExistsAsync(dto.RestaurantId, dto.Number))
                return Result<RestaurantTableDto>.Failure($"Table #{dto.Number} already exists in this restaurant");

            var table = dto.Adapt<RestaurantTable>();
            table.Status = RestaurantTableStatus.Free;
            table.QrToken = Guid.NewGuid();
            table.CreatedBy = userId;

            await _repository.AddAsync(table);
            await _repository.SaveChangesAsync();

            return Result<RestaurantTableDto>.Success(table.Adapt<RestaurantTableDto>());
        }

        public async Task<Result<List<RestaurantTableDto>>> BulkCreateAsync(BulkCreateRestaurantTablesDto dto, long userId)
        {
            if (dto.Count <= 0 || dto.Count > 200)
                return Result<List<RestaurantTableDto>>.Failure("Count must be between 1 and 200");

            if (dto.Capacity <= 0)
                return Result<List<RestaurantTableDto>>.Failure("Capacity must be positive");

            var start = dto.StartingNumber > 0 ? dto.StartingNumber : (await _repository.GetMaxNumberAsync(dto.RestaurantId)) + 1;
            var tables = new List<RestaurantTable>();

            for (var i = 0; i < dto.Count; i++)
            {
                var number = start + i;
                if (await _repository.NumberExistsAsync(dto.RestaurantId, number))
                    return Result<List<RestaurantTableDto>>.Failure($"Table #{number} already exists - pick a different starting number");

                tables.Add(new RestaurantTable
                {
                    RestaurantId = dto.RestaurantId,
                    Number = number,
                    Capacity = dto.Capacity,
                    Location = dto.Location?.Trim(),
                    Status = RestaurantTableStatus.Free,
                    QrToken = Guid.NewGuid(),
                    CreatedBy = userId,
                });
            }

            await _repository.AddRangeAsync(tables);
            await _repository.SaveChangesAsync();

            return Result<List<RestaurantTableDto>>.Success(tables.Adapt<List<RestaurantTableDto>>());
        }

        public async Task<Result<RestaurantTableDto>> UpdateAsync(long id, UpdateRestaurantTableDto dto, long userId)
        {
            var table = await _repository.GetByIdAsync(id);
            if (table is null)
                return Result<RestaurantTableDto>.Failure("Table not found");

            if (dto.Number <= 0)
                return Result<RestaurantTableDto>.Failure("Table number must be positive");

            if (dto.Capacity <= 0)
                return Result<RestaurantTableDto>.Failure("Capacity must be positive");

            if (!Enum.TryParse<RestaurantTableStatus>(dto.Status, true, out var status))
                return Result<RestaurantTableDto>.Failure("Unknown status");

            if (dto.Number != table.Number
                && await _repository.NumberExistsAsync(table.RestaurantId ?? 0, dto.Number, excludeId: table.Id))
                return Result<RestaurantTableDto>.Failure($"Table #{dto.Number} already exists in this restaurant");

            dto.Adapt(table);
            table.UpdatedBy = userId;

            if (status != table.Status)
            {
                table.Status = status;
                table.OccupiedSince = status == RestaurantTableStatus.Occupied ? DateTime.UtcNow : null;
                if (status != RestaurantTableStatus.Occupied)
                    table.CurrentPartySize = 0;
            }

            await _repository.SaveChangesAsync();

            return Result<RestaurantTableDto>.Success(table.Adapt<RestaurantTableDto>());
        }

        public async Task<Result<string>> DeleteAsync(long id)
        {
            var table = await _repository.GetByIdAsync(id);
            if (table is null)
                return Result<string>.Failure("Table not found");

            _repository.Remove(table);
            await _repository.SaveChangesAsync();

            return Result<string>.Success("Table deleted");
        }

        public async Task<Result<RestaurantTableDto>> RotateQrTokenAsync(long id, long userId)
        {
            var table = await _repository.GetByIdAsync(id);
            if (table is null)
                return Result<RestaurantTableDto>.Failure("Table not found");

            table.QrToken = Guid.NewGuid();
            table.QrTokenRotatedAt = DateTime.UtcNow;
            table.UpdatedBy = userId;

            await _repository.SaveChangesAsync();

            return Result<RestaurantTableDto>.Success(table.Adapt<RestaurantTableDto>());
        }

        public async Task<Result<RestaurantTableDto>> SetStatusAsync(long id, RestaurantTableStatus status, long userId)
        {
            var table = await _repository.GetByIdAsync(id);
            if (table is null)
                return Result<RestaurantTableDto>.Failure("Table not found");

            table.Status = status;
            table.UpdatedBy = userId;

            if (status == RestaurantTableStatus.Free)
            {
                table.CurrentPartySize = 0;
                table.OccupiedSince = null;
            }
            else if (status == RestaurantTableStatus.Occupied || status == RestaurantTableStatus.Eating)
            {
                table.OccupiedSince ??= DateTime.UtcNow;
            }

            await _repository.SaveChangesAsync();

            return Result<RestaurantTableDto>.Success(table.Adapt<RestaurantTableDto>());
        }

        public async Task<Result<TableQrResolveDto>> ResolveQrTokenAsync(Guid token)
        {
            if (token == Guid.Empty)
                return Result<TableQrResolveDto>.Failure("Invalid token");

            var table = await _repository.GetByQrTokenAsync(token);
            if (table is null || !table.IsActive || table.RestaurantId is null)
                return Result<TableQrResolveDto>.Failure("This QR code is no longer valid");

            var restaurant = await _restaurantRepository.GetByIdAsync(table.RestaurantId.Value);
            if (restaurant is null || !restaurant.IsActive)
                return Result<TableQrResolveDto>.Failure("Restaurant not available");

            return Result<TableQrResolveDto>.Success(new TableQrResolveDto
            {
                Status = table.Status.ToString(),
                TableId = table.Id,
                TableNumber = table.Number,
                TableLabel = table.Label,
                RestaurantId = restaurant.Id,
                RestaurantName = restaurant.Name,
                RestaurantSlug = restaurant.Slug,
                RestaurantLogoUrl = restaurant.LogoUrl,
                Currency = restaurant.Currency,
            });
        }
    }
}
