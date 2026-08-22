using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Foodlyn.Persistence.Migrations
{
    public partial class DropMenuCurrency : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Currency",
                table: "menus");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "menu_items");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "menus",
                type: "character varying(3)",
                maxLength: 3,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "menu_items",
                type: "character varying(3)",
                maxLength: 3,
                nullable: true);
        }
    }
}
