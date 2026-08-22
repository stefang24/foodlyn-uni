using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Foodlyn.Persistence.Migrations
{
    public partial class AddPaymentMethodAndAwaitingPayment : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PaidAt",
                table: "orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "PaidBy",
                table: "orders",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PaymentMethod",
                table: "orders",
                type: "integer",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "PaidAt",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "PaidBy",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "orders");
        }
    }
}
