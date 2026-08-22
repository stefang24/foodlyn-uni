using Foodlyn.Modules.Identity.Application.Repositories;
using Foodlyn.Modules.Identity.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Foodlyn.Persistence.Repositories
{
    public class AdminRepository : IAdminRepository
    {
        private readonly AppDbContext _db;

        public AdminRepository(AppDbContext db)
        {
            _db = db;
        }
    }
}
