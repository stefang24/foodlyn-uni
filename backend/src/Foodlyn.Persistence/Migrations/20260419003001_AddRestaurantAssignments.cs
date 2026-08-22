using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Foodlyn.Persistence.Migrations
{
    public partial class AddRestaurantAssignments : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "restaurant_assignments",
                columns: table => new
                {
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    RestaurantId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_restaurant_assignments", x => new { x.UserId, x.RestaurantId });
                    table.ForeignKey(
                        name: "FK_restaurant_assignments_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_restaurant_assignments_RestaurantId",
                table: "restaurant_assignments",
                column: "RestaurantId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "restaurant_assignments");
        }
    }
}
