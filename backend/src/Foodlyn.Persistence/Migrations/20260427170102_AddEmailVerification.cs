using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Foodlyn.Persistence.Migrations
{
    public partial class AddEmailVerification : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EmailVerificationCodeExpiresAt",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailVerificationCodeHash",
                table: "users",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsEmailVerified",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastVerificationCodeSentAt",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailVerificationCodeExpiresAt",
                table: "users");

            migrationBuilder.DropColumn(
                name: "EmailVerificationCodeHash",
                table: "users");

            migrationBuilder.DropColumn(
                name: "IsEmailVerified",
                table: "users");

            migrationBuilder.DropColumn(
                name: "LastVerificationCodeSentAt",
                table: "users");
        }
    }
}
