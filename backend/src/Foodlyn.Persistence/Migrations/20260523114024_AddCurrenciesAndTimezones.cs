using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814

namespace Foodlyn.Persistence.Migrations
{
    public partial class AddCurrenciesAndTimezones : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "currencies",
                columns: table => new
                {
                    Code = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    Name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Symbol = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    RateToEur = table.Column<decimal>(type: "numeric(18,6)", precision: 18, scale: 6, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_currencies", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "timezones",
                columns: table => new
                {
                    IanaName = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_timezones", x => x.IanaName);
                });

            migrationBuilder.InsertData(
                table: "currencies",
                columns: new[] { "Code", "IsActive", "Name", "RateToEur", "Symbol", "UpdatedAt" },
                values: new object[,]
                {
                    { "AUD", true, "Australian Dollar", 1.62m, "A$", null },
                    { "CAD", true, "Canadian Dollar", 1.47m, "C$", null },
                    { "CHF", true, "Swiss Franc", 0.95m, "Fr", null },
                    { "CNY", true, "Chinese Yuan", 7.85m, "¥", null },
                    { "EUR", true, "Euro", 1m, "€", null },
                    { "GBP", true, "British Pound", 0.85m, "£", null },
                    { "JPY", true, "Japanese Yen", 161.50m, "¥", null },
                    { "NOK", true, "Norwegian Krone", 11.50m, "kr", null },
                    { "RSD", true, "Serbian Dinar", 117.20m, "дин", null },
                    { "USD", true, "US Dollar", 1.08m, "$", null }
                });

            migrationBuilder.InsertData(
                table: "timezones",
                columns: new[] { "IanaName", "DisplayName", "IsActive" },
                values: new object[,]
                {
                    { "America/Los_Angeles", "Los Angeles (PST/PDT)", true },
                    { "America/New_York", "New York (EST/EDT)", true },
                    { "Asia/Tokyo", "Tokyo (JST)", true },
                    { "Australia/Sydney", "Sydney (AEST/AEDT)", true },
                    { "Europe/Belgrade", "Belgrade (CET/CEST)", true },
                    { "Europe/Berlin", "Berlin (CET/CEST)", true },
                    { "Europe/London", "London (GMT/BST)", true },
                    { "Europe/Madrid", "Madrid (CET/CEST)", true },
                    { "Europe/Paris", "Paris (CET/CEST)", true },
                    { "Europe/Vienna", "Vienna (CET/CEST)", true },
                    { "UTC", "UTC", true }
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "currencies");

            migrationBuilder.DropTable(
                name: "timezones");
        }
    }
}
