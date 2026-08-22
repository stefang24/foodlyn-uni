using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Foodlyn.Persistence.Migrations
{
    public partial class AddSystemLogs : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "system_logs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Level = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    StatusCode = table.Column<int>(type: "integer", nullable: true),
                    Message = table.Column<string>(type: "text", nullable: false),
                    ExceptionType = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    StackTrace = table.Column<string>(type: "text", nullable: true),
                    Path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Method = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    QueryString = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    UserId = table.Column<long>(type: "bigint", nullable: true),
                    Username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UserRole = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    RestaurantId = table.Column<long>(type: "bigint", nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Source = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_system_logs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_system_logs_CreatedAt",
                table: "system_logs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_system_logs_Level",
                table: "system_logs",
                column: "Level");

            migrationBuilder.CreateIndex(
                name: "IX_system_logs_UserId",
                table: "system_logs",
                column: "UserId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "system_logs");
        }
    }
}
