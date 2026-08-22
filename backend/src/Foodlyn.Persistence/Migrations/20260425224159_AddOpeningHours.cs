using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Foodlyn.Persistence.Migrations
{
    public partial class AddOpeningHours : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "restaurant_opening_hours",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantId = table.Column<long>(type: "bigint", nullable: false),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    IsOpen = table.Column<bool>(type: "boolean", nullable: false),
                    OpenTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    CloseTime = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_restaurant_opening_hours", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_restaurant_opening_hours_RestaurantId_DayOfWeek",
                table: "restaurant_opening_hours",
                columns: new[] { "RestaurantId", "DayOfWeek" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "restaurant_opening_hours");
        }
    }
}
