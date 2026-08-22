using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Foodlyn.Persistence.Migrations
{
    public partial class AddOrderCurrency : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "orders",
                type: "character varying(3)",
                maxLength: 3,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Currency",
                table: "orders");
        }
    }
}
