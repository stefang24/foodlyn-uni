using Foodlyn.Persistence;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Foodlyn.API.Controllers
{
    [Route("api/reference")]
    [ApiController]
    public class ReferenceController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ReferenceController(AppDbContext db) => _db = db;

        [HttpGet("currencies")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCurrencies()
        {
            var items = await _db.Currencies
                .AsNoTracking()
                .Where(c => c.IsActive)
                .OrderBy(c => c.Code)
                .Select(c => new CurrencyDto
                {
                    Code = c.Code,
                    Name = c.Name,
                    Symbol = c.Symbol,
                    RateToEur = c.RateToEur,
                    IsActive = c.IsActive,
                })
                .ToListAsync();

            return Ok(Result<List<CurrencyDto>>.Success(items));
        }

        [HttpGet("currencies/all")]
        [Authorize(Policy = Policies.SuperAdmin)]
        public async Task<IActionResult> GetAllCurrencies()
        {
            var items = await _db.Currencies
                .AsNoTracking()
                .OrderBy(c => c.Code)
                .Select(c => new CurrencyDto
                {
                    Code = c.Code,
                    Name = c.Name,
                    Symbol = c.Symbol,
                    RateToEur = c.RateToEur,
                    IsActive = c.IsActive,
                })
                .ToListAsync();

            return Ok(Result<List<CurrencyDto>>.Success(items));
        }

        [HttpPut("currencies/{code}/rate")]
        [Authorize(Policy = Policies.SuperAdmin)]
        public async Task<IActionResult> UpdateRate(string code, UpdateCurrencyRateDto dto)
        {
            if (dto.RateToEur <= 0)
                return BadRequest(Result<CurrencyDto>.Failure("Rate must be positive"));

            var currency = await _db.Currencies.FirstOrDefaultAsync(c => c.Code == code.ToUpper());
            if (currency is null)
                return NotFound(Result<CurrencyDto>.Failure("Currency not found"));

            currency.RateToEur = dto.RateToEur;
            currency.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(Result<CurrencyDto>.Success(new CurrencyDto
            {
                Code = currency.Code,
                Name = currency.Name,
                Symbol = currency.Symbol,
                RateToEur = currency.RateToEur,
                IsActive = currency.IsActive,
            }));
        }

        [HttpGet("timezones")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTimezones()
        {
            var items = await _db.Timezones
                .AsNoTracking()
                .Where(t => t.IsActive)
                .OrderBy(t => t.DisplayName)
                .Select(t => new TimezoneDto
                {
                    IanaName = t.IanaName,
                    DisplayName = t.DisplayName,
                    IsActive = t.IsActive,
                })
                .ToListAsync();

            return Ok(Result<List<TimezoneDto>>.Success(items));
        }
    }
}
