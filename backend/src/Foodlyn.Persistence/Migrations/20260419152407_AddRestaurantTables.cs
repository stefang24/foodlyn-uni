using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Foodlyn.Persistence.Migrations
{
    public partial class AddRestaurantTables : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "restaurant_tables",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantId = table.Column<long>(type: "bigint", nullable: true),
                    Number = table.Column<int>(type: "integer", nullable: false),
                    Label = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Capacity = table.Column<int>(type: "integer", nullable: false),
                    Location = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CurrentPartySize = table.Column<int>(type: "integer", nullable: false),
                    OccupiedSince = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    QrToken = table.Column<Guid>(type: "uuid", nullable: false),
                    QrTokenRotatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: true),
                    UpdatedBy = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_restaurant_tables", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_restaurant_tables_QrToken",
                table: "restaurant_tables",
                column: "QrToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_restaurant_tables_RestaurantId",
                table: "restaurant_tables",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_restaurant_tables_RestaurantId_Number",
                table: "restaurant_tables",
                columns: new[] { "RestaurantId", "Number" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "restaurant_tables");
        }
    }
}
