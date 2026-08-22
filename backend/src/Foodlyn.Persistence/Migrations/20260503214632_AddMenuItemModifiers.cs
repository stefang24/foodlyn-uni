using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Foodlyn.Persistence.Migrations
{
    public partial class AddMenuItemModifiers : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "menu_item_modifier_groups",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantId = table.Column<long>(type: "bigint", nullable: true),
                    MenuItemId = table.Column<long>(type: "bigint", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    MinSelect = table.Column<int>(type: "integer", nullable: false),
                    MaxSelect = table.Column<int>(type: "integer", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: true),
                    UpdatedBy = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_menu_item_modifier_groups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_menu_item_modifier_groups_menu_items_MenuItemId",
                        column: x => x.MenuItemId,
                        principalTable: "menu_items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "order_item_modifiers",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrderItemId = table.Column<long>(type: "bigint", nullable: false),
                    MenuItemModifierId = table.Column<long>(type: "bigint", nullable: true),
                    GroupName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order_item_modifiers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_order_item_modifiers_order_items_OrderItemId",
                        column: x => x.OrderItemId,
                        principalTable: "order_items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "menu_item_modifiers",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantId = table.Column<long>(type: "bigint", nullable: true),
                    MenuItemModifierGroupId = table.Column<long>(type: "bigint", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    PriceDelta = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedBy = table.Column<long>(type: "bigint", nullable: true),
                    UpdatedBy = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_menu_item_modifiers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_menu_item_modifiers_menu_item_modifier_groups_MenuItemModif~",
                        column: x => x.MenuItemModifierGroupId,
                        principalTable: "menu_item_modifier_groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_menu_item_modifier_groups_MenuItemId",
                table: "menu_item_modifier_groups",
                column: "MenuItemId");

            migrationBuilder.CreateIndex(
                name: "IX_menu_item_modifier_groups_RestaurantId",
                table: "menu_item_modifier_groups",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_menu_item_modifiers_MenuItemModifierGroupId",
                table: "menu_item_modifiers",
                column: "MenuItemModifierGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_menu_item_modifiers_RestaurantId",
                table: "menu_item_modifiers",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_order_item_modifiers_OrderItemId",
                table: "order_item_modifiers",
                column: "OrderItemId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "menu_item_modifiers");

            migrationBuilder.DropTable(
                name: "order_item_modifiers");

            migrationBuilder.DropTable(
                name: "menu_item_modifier_groups");
        }
    }
}
