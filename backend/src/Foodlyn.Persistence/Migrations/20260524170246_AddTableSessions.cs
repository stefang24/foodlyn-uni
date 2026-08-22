using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Foodlyn.Persistence.Migrations
{
    public partial class AddTableSessions : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "table_sessions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RestaurantId = table.Column<long>(type: "bigint", nullable: false),
                    TableId = table.Column<long>(type: "bigint", nullable: false),
                    TableNumber = table.Column<int>(type: "integer", nullable: false),
                    TableLabel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PartySize = table.Column<int>(type: "integer", nullable: false),
                    OwnerKind = table.Column<int>(type: "integer", nullable: false),
                    OwnerUserId = table.Column<long>(type: "bigint", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    OpenedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ClosedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_table_sessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "table_session_cart_lines",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TableSessionId = table.Column<long>(type: "bigint", nullable: false),
                    LineKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    MenuItemId = table.Column<long>(type: "bigint", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AddedByLabel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    AddedByUserId = table.Column<long>(type: "bigint", nullable: true),
                    AddedBySessionId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_table_session_cart_lines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_table_session_cart_lines_table_sessions_TableSessionId",
                        column: x => x.TableSessionId,
                        principalTable: "table_sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "table_session_cart_line_modifiers",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TableSessionCartLineId = table.Column<long>(type: "bigint", nullable: false),
                    MenuItemModifierId = table.Column<long>(type: "bigint", nullable: true),
                    GroupName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_table_session_cart_line_modifiers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_table_session_cart_line_modifiers_table_session_cart_lines_~",
                        column: x => x.TableSessionCartLineId,
                        principalTable: "table_session_cart_lines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_table_session_cart_line_modifiers_TableSessionCartLineId",
                table: "table_session_cart_line_modifiers",
                column: "TableSessionCartLineId");

            migrationBuilder.CreateIndex(
                name: "IX_table_session_cart_lines_TableSessionId_LineKey",
                table: "table_session_cart_lines",
                columns: new[] { "TableSessionId", "LineKey" });

            migrationBuilder.CreateIndex(
                name: "IX_table_sessions_RestaurantId_Status",
                table: "table_sessions",
                columns: new[] { "RestaurantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_table_sessions_TableId_Status",
                table: "table_sessions",
                columns: new[] { "TableId", "Status" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "table_session_cart_line_modifiers");

            migrationBuilder.DropTable(
                name: "table_session_cart_lines");

            migrationBuilder.DropTable(
                name: "table_sessions");
        }
    }
}
