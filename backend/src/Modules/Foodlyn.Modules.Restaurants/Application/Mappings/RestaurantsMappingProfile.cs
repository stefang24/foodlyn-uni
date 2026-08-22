using Foodlyn.Modules.Restaurants.Application.DTOs;
using Foodlyn.Modules.Restaurants.Domain.Entities;
using Mapster;

namespace Foodlyn.Modules.Restaurants.Application.Mappings
{
    public class RestaurantsMappingProfile : IRegister
    {
        public void Register(TypeAdapterConfig config)
        {
            config.NewConfig<Restaurant, RestaurantDto>();

            config.NewConfig<RestaurantTable, RestaurantTableDto>()
                .Map(d => d.Status, s => s.Status.ToString());

            config.NewConfig<RestaurantOpeningHour, RestaurantOpeningHourDto>()
                .Map(d => d.OpenTime, s => s.OpenTime.HasValue ? s.OpenTime.Value.ToString("HH:mm") : null)
                .Map(d => d.CloseTime, s => s.CloseTime.HasValue ? s.CloseTime.Value.ToString("HH:mm") : null);

            config.NewConfig<CreateRestaurantDto, Restaurant>()
                .Ignore(d => d.Id)
                .Ignore(d => d.Slug)
                .Ignore(d => d.IsActive)
                .Ignore(d => d.CreatedAt)
                .Ignore(d => d.UpdatedAt)
                .Ignore(d => d.CreatedBy)
                .Ignore(d => d.UpdatedBy)
                .Map(d => d.Name, s => s.Name.Trim())
                .Map(d => d.Description, s => s.Description != null ? s.Description.Trim() : null)
                .Map(d => d.Email, s => string.IsNullOrWhiteSpace(s.Email) ? null : s.Email!.Trim().ToLower())
                .Map(d => d.PhoneNumber, s => s.PhoneNumber != null ? s.PhoneNumber.Trim() : null)
                .Map(d => d.Website, s => s.Website != null ? s.Website.Trim() : null)
                .Map(d => d.StreetAddress, s => s.StreetAddress != null ? s.StreetAddress.Trim() : null)
                .Map(d => d.City, s => s.City != null ? s.City.Trim() : null)
                .Map(d => d.PostalCode, s => s.PostalCode != null ? s.PostalCode.Trim() : null)
                .Map(d => d.Country, s => s.Country != null ? s.Country.Trim() : null)
                .Map(d => d.LogoUrl, s => s.LogoUrl != null ? s.LogoUrl.Trim() : null)
                .Map(d => d.CoverImageUrl, s => s.CoverImageUrl != null ? s.CoverImageUrl.Trim() : null)
                .Map(d => d.Currency, s => string.IsNullOrWhiteSpace(s.Currency) ? null : s.Currency!.Trim().ToUpper())
                .Map(d => d.TimeZone, s => s.TimeZone != null ? s.TimeZone.Trim() : null)
                .Map(d => d.Cuisine, s => s.Cuisine != null ? s.Cuisine.Trim() : null)
                .Map(d => d.OpeningHours, s => s.OpeningHours != null ? s.OpeningHours.Trim() : null)
                .Map(d => d.TaxId, s => s.TaxId != null ? s.TaxId.Trim() : null);

            config.NewConfig<UpdateRestaurantDto, Restaurant>()
                .Ignore(d => d.Id)
                .Ignore(d => d.Name)
                .Ignore(d => d.Slug)
                .Ignore(d => d.IsActive)
                .Ignore(d => d.CreatedAt)
                .Ignore(d => d.UpdatedAt)
                .Ignore(d => d.CreatedBy)
                .Ignore(d => d.UpdatedBy)
                .Map(d => d.Description, s => s.Description != null ? s.Description.Trim() : null)
                .Map(d => d.Email, s => string.IsNullOrWhiteSpace(s.Email) ? null : s.Email!.Trim().ToLower())
                .Map(d => d.PhoneNumber, s => s.PhoneNumber != null ? s.PhoneNumber.Trim() : null)
                .Map(d => d.Website, s => s.Website != null ? s.Website.Trim() : null)
                .Map(d => d.StreetAddress, s => s.StreetAddress != null ? s.StreetAddress.Trim() : null)
                .Map(d => d.City, s => s.City != null ? s.City.Trim() : null)
                .Map(d => d.PostalCode, s => s.PostalCode != null ? s.PostalCode.Trim() : null)
                .Map(d => d.Country, s => s.Country != null ? s.Country.Trim() : null)
                .Map(d => d.LogoUrl, s => s.LogoUrl != null ? s.LogoUrl.Trim() : null)
                .Map(d => d.CoverImageUrl, s => s.CoverImageUrl != null ? s.CoverImageUrl.Trim() : null)
                .Map(d => d.Currency, s => string.IsNullOrWhiteSpace(s.Currency) ? null : s.Currency!.Trim().ToUpper())
                .Map(d => d.TimeZone, s => s.TimeZone != null ? s.TimeZone.Trim() : null)
                .Map(d => d.Cuisine, s => s.Cuisine != null ? s.Cuisine.Trim() : null)
                .Map(d => d.OpeningHours, s => s.OpeningHours != null ? s.OpeningHours.Trim() : null)
                .Map(d => d.TaxId, s => s.TaxId != null ? s.TaxId.Trim() : null);

            config.NewConfig<CreateRestaurantTableDto, RestaurantTable>()
                .Ignore(d => d.Id)
                .Ignore(d => d.Status)
                .Ignore(d => d.QrToken)
                .Ignore(d => d.QrTokenRotatedAt)
                .Ignore(d => d.OccupiedSince)
                .Ignore(d => d.CurrentPartySize)
                .Ignore(d => d.CreatedAt)
                .Ignore(d => d.UpdatedAt)
                .Ignore(d => d.CreatedBy)
                .Ignore(d => d.UpdatedBy)
                .Map(d => d.Label, s => s.Label != null ? s.Label.Trim() : null)
                .Map(d => d.Location, s => s.Location != null ? s.Location.Trim() : null)
                .Map(d => d.Notes, s => s.Notes != null ? s.Notes.Trim() : null);

            config.NewConfig<UpdateRestaurantTableDto, RestaurantTable>()
                .Ignore(d => d.Id)
                .Ignore(d => d.RestaurantId)
                .Ignore(d => d.Status)
                .Ignore(d => d.QrToken)
                .Ignore(d => d.QrTokenRotatedAt)
                .Ignore(d => d.OccupiedSince)
                .Ignore(d => d.CreatedAt)
                .Ignore(d => d.UpdatedAt)
                .Ignore(d => d.CreatedBy)
                .Ignore(d => d.UpdatedBy)
                .Map(d => d.Label, s => s.Label != null ? s.Label.Trim() : null)
                .Map(d => d.Location, s => s.Location != null ? s.Location.Trim() : null)
                .Map(d => d.Notes, s => s.Notes != null ? s.Notes.Trim() : null)
                .Map(d => d.CurrentPartySize, s => s.CurrentPartySize < 0 ? 0 : s.CurrentPartySize);
        }
    }
}
