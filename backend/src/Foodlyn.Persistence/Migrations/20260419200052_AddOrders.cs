using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Foodlyn.Persistence.Migrations
{
    public partial class AddOrders : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_Orders_OrderId",
                table: "OrderItems");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Orders",
                table: "Orders");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OrderItems",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "Orders");

            migrationBuilder.RenameTable(
                name: "Orders",
                newName: "orders");

            migrationBuilder.RenameTable(
                name: "OrderItems",
                newName: "order_items");

            migrationBuilder.RenameColumn(
                name: "DeliveredAt",
                table: "orders",
                newName: "ServedAt");

            migrationBuilder.RenameColumn(
                name: "ClosedAt",
                table: "orders",
                newName: "RejectedAt");

            migrationBuilder.RenameColumn(
                name: "AcceptedAt",
                table: "orders",
                newName: "PreparingStartedAt");

            migrationBuilder.RenameIndex(
                name: "IX_OrderItems_OrderId",
                table: "order_items",
                newName: "IX_order_items_OrderId");

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalAmount",
                table: "orders",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<string>(
                name: "SessionId",
                table: "orders",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DeliveryNotes",
                table: "orders",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ApprovedBy",
                table: "orders",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAt",
                table: "orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerName",
                table: "orders",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PrepTimeMinutes",
                table: "orders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "PreparedBy",
                table: "orders",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectedReason",
                table: "orders",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ServedBy",
                table: "orders",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TableLabel",
                table: "orders",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TableNumber",
                table: "orders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<int>(
                name: "Quantity",
                table: "order_items",
                type: "integer",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint");

            migrationBuilder.AlterColumn<decimal>(
                name: "Price",
                table: "order_items",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "order_items",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "order_items",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_orders",
                table: "orders",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_order_items",
                table: "order_items",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_orders_RestaurantId",
                table: "orders",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_orders_SessionId",
                table: "orders",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_orders_Status",
                table: "orders",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_orders_TableId",
                table: "orders",
                column: "TableId");

            migrationBuilder.CreateIndex(
                name: "IX_order_items_MenuItemId",
                table: "order_items",
                column: "MenuItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_order_items_orders_OrderId",
                table: "order_items",
                column: "OrderId",
                principalTable: "orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_order_items_orders_OrderId",
                table: "order_items");

            migrationBuilder.DropPrimaryKey(
                name: "PK_orders",
                table: "orders");

            migrationBuilder.DropIndex(
                name: "IX_orders_RestaurantId",
                table: "orders");

            migrationBuilder.DropIndex(
                name: "IX_orders_SessionId",
                table: "orders");

            migrationBuilder.DropIndex(
                name: "IX_orders_Status",
                table: "orders");

            migrationBuilder.DropIndex(
                name: "IX_orders_TableId",
                table: "orders");

            migrationBuilder.DropPrimaryKey(
                name: "PK_order_items",
                table: "order_items");

            migrationBuilder.DropIndex(
                name: "IX_order_items_MenuItemId",
                table: "order_items");

            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "ApprovedBy",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "CustomerName",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "PrepTimeMinutes",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "PreparedBy",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "RejectedReason",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "ServedBy",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "TableLabel",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "TableNumber",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "order_items");

            migrationBuilder.RenameTable(
                name: "orders",
                newName: "Orders");

            migrationBuilder.RenameTable(
                name: "order_items",
                newName: "OrderItems");

            migrationBuilder.RenameColumn(
                name: "ServedAt",
                table: "Orders",
                newName: "DeliveredAt");

            migrationBuilder.RenameColumn(
                name: "RejectedAt",
                table: "Orders",
                newName: "ClosedAt");

            migrationBuilder.RenameColumn(
                name: "PreparingStartedAt",
                table: "Orders",
                newName: "AcceptedAt");

            migrationBuilder.RenameIndex(
                name: "IX_order_items_OrderId",
                table: "OrderItems",
                newName: "IX_OrderItems_OrderId");

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalAmount",
                table: "Orders",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(12,2)",
                oldPrecision: 12,
                oldScale: 2);

            migrationBuilder.AlterColumn<string>(
                name: "SessionId",
                table: "Orders",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DeliveryNotes",
                table: "Orders",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<long>(
                name: "Quantity",
                table: "OrderItems",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<decimal>(
                name: "Price",
                table: "OrderItems",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(12,2)",
                oldPrecision: 12,
                oldScale: 2);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "OrderItems",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Orders",
                table: "Orders",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrderItems",
                table: "OrderItems",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_Orders_OrderId",
                table: "OrderItems",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
