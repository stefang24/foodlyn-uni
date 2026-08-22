using Foodlyn.Modules.Identity.Application.DTOs;
using Foodlyn.Modules.Identity.Application.Repositories;
using Foodlyn.Modules.Identity.Domain.Entities;
using Foodlyn.Modules.Identity.Domain.Enums;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Helpers;

namespace Foodlyn.Modules.Identity.Application.Services
{
    public class AdminService : IAdminService
    {
        private readonly IAdminRepository _repository;

        public AdminService(IAdminRepository repository)
        {
            _repository = repository;
        }
    }
}
