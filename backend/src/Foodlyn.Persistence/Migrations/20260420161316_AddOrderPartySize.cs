using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Foodlyn.Persistence.Migrations
{
    public partial class AddOrderPartySize : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PartySize",
                table: "orders",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PartySize",
                table: "orders");
        }
    }
}
