using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Foodlyn.Persistence.Migrations
{
    public partial class AddIsStaffOrder : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsStaffOrder",
                table: "orders",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsStaffOrder",
                table: "orders");
        }
    }
}
