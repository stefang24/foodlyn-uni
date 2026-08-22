using System;
using System.Collections.Generic;
using Foodlyn.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Foodlyn.Persistence.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260523221058_AddOrderCurrency")]
    partial class AddOrderCurrency
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "10.0.5")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);

            modelBuilder.Entity("Foodlyn.Modules.Identity.Domain.Entities.RefreshToken", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<long>("Id"));

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime>("ExpiresAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<bool>("IsRevoked")
                        .HasColumnType("boolean");

                    b.Property<string>("ReplacedByToken")
                        .HasMaxLength(200)
                        .HasColumnType("character varying(200)");

                    b.Property<DateTime?>("RevokedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Token")
                        .IsRequired()
                        .HasMaxLength(200)
                        .HasColumnType("character varying(200)");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long>("UserId")
                        .HasColumnType("bigint");

                    b.HasKey("Id");

                    b.HasIndex("Token")
                        .IsUnique();

                    b.HasIndex("UserId");

                    b.ToTable("refresh_tokens", (string)null);
                });

            modelBuilder.Entity("Foodlyn.Modules.Identity.Domain.Entities.RestaurantAssignment", b =>
                {
                    b.Property<long>("UserId")
                        .HasColumnType("bigint");

                    b.Property<long>("RestaurantId")
                        .HasColumnType("bigint");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("UserId", "RestaurantId");

                    b.HasIndex("RestaurantId");

                    b.ToTable("restaurant_assignments", (string)null);
                });

            modelBuilder.Entity("Foodlyn.Modules.Identity.Domain.Entities.User", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<long>("Id"));

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("CreatedBy")
                        .HasColumnType("bigint");

                    b.Property<string>("Email")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<DateTime?>("EmailVerificationCodeExpiresAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("EmailVerificationCodeHash")
                        .HasMaxLength(200)
                        .HasColumnType("character varying(200)");

                    b.Property<string>("FirstName")
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<bool>("IsActive")
                        .HasColumnType("boolean");

                    b.Property<bool>("IsEmailVerified")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("boolean")
                        .HasDefaultValue(false);

                    b.Property<DateTime?>("LastLoginAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("LastName")
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<DateTime?>("LastVerificationCodeSentAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("PasswordHash")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<long?>("RestaurantId")
                        .HasColumnType("bigint");

                    b.Property<string>("Role")
                        .IsRequired()
                        .HasMaxLength(20)
                        .HasColumnType("character varying(20)");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("UpdatedBy")
                        .HasColumnType("bigint");

                    b.Property<string>("Username")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.HasKey("Id");

                    b.HasIndex("Email")
                        .IsUnique();

                    b.HasIndex("RestaurantId");

                    b.HasIndex("Username")
                        .IsUnique();

                    b.ToTable("users", (string)null);
                });

            modelBuilder.Entity("Foodlyn.Modules.Menus.Domain.Entities.Menu", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<long>("Id"));

                    b.Property<string>("BannerImageUrl")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("CreatedBy")
                        .HasColumnType("bigint");

                    b.Property<string>("Currency")
                        .HasMaxLength(3)
                        .HasColumnType("character varying(3)");

                    b.Property<string>("Description")
                        .HasMaxLength(1000)
                        .HasColumnType("character varying(1000)");

                    b.Property<DateTime?>("EndDate")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("ImageUrl")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)");

                    b.Property<bool>("IsActive")
                        .HasColumnType("boolean");

                    b.Property<bool>("IsPublished")
                        .HasColumnType("boolean");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(150)
                        .HasColumnType("character varying(150)");

                    b.Property<long?>("RestaurantId")
                        .HasColumnType("bigint");

                    b.Property<int>("SortOrder")
                        .HasColumnType("integer");

                    b.Property<DateTime?>("StartDate")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("UpdatedBy")
                        .HasColumnType("bigint");

                    b.HasKey("Id");

                    b.HasIndex("RestaurantId");

                    b.HasIndex("RestaurantId", "Name");

                    b.ToTable("menus", (string)null);
                });

            modelBuilder.Entity("Foodlyn.Modules.Menus.Domain.Entities.MenuCategory", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<long>("Id"));

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("CreatedBy")
                        .HasColumnType("bigint");

                    b.Property<string>("Description")
                        .HasMaxLength(1000)
                        .HasColumnType("character varying(1000)");

                    b.Property<string>("Icon")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<string>("ImageUrl")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)");

                    b.Property<bool>("IsActive")
                        .HasColumnType("boolean");

                    b.Property<long>("MenuId")
                        .HasColumnType("bigint");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(150)
                        .HasColumnType("character varying(150)");

                    b.Property<long?>("RestaurantId")
                        .HasColumnType("bigint");

                    b.Property<int>("SortOrder")
                        .HasColumnType("integer");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("UpdatedBy")
                        .HasColumnType("bigint");

                    b.HasKey("Id");

                    b.HasIndex("MenuId");

                    b.HasIndex("RestaurantId");

                    b.ToTable("menu_categories", (string)null);
                });

            modelBuilder.Entity("Foodlyn.Modules.Menus.Domain.Entities.MenuItem", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<long>("Id"));

                    b.PrimitiveCollection<List<string>>("Allergens")
                        .IsRequired()
                        .HasColumnType("text[]");

                    b.Property<int?>("Calories")
                        .HasColumnType("integer");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("CreatedBy")
                        .HasColumnType("bigint");

                    b.Property<string>("Currency")
                        .HasMaxLength(3)
                        .HasColumnType("character varying(3)");

                    b.Property<string>("Description")
                        .HasMaxLength(2000)
                        .HasColumnType("character varying(2000)");

                    b.Property<decimal?>("DiscountedPrice")
                        .HasPrecision(12, 2)
                        .HasColumnType("numeric(12,2)");

                    b.Property<string>("ImageUrl")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)");

                    b.PrimitiveCollection<List<string>>("Ingredients")
                        .IsRequired()
                        .HasColumnType("text[]");

                    b.Property<bool>("IsActive")
                        .HasColumnType("boolean");

                    b.Property<bool>("IsAvailable")
                        .HasColumnType("boolean");

                    b.Property<bool>("IsDairyFree")
                        .HasColumnType("boolean");

                    b.Property<bool>("IsFeatured")
                        .HasColumnType("boolean");

                    b.Property<bool>("IsGlutenFree")
                        .HasColumnType("boolean");

                    b.Property<bool>("IsHalal")
                        .HasColumnType("boolean");

                    b.Property<bool>("IsKosher")
                        .HasColumnType("boolean");

                    b.Property<bool>("IsNew")
                        .HasColumnType("boolean");

                    b.Property<bool>("IsVegan")
                        .HasColumnType("boolean");

                    b.Property<bool>("IsVegetarian")
                        .HasColumnType("boolean");

                    b.Property<long>("MenuCategoryId")
                        .HasColumnType("bigint");

                    b.Property<long>("MenuId")
                        .HasColumnType("bigint");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(150)
                        .HasColumnType("character varying(150)");

                    b.Property<int?>("PreparationTimeMinutes")
                        .HasColumnType("integer");

                    b.Property<decimal>("Price")
                        .HasPrecision(12, 2)
                        .HasColumnType("numeric(12,2)");

                    b.Property<long?>("RestaurantId")
                        .HasColumnType("bigint");

                    b.Property<int?>("ServingSizeGrams")
                        .HasColumnType("integer");

                    b.Property<string>("ShortDescription")
                        .HasMaxLength(300)
                        .HasColumnType("character varying(300)");

                    b.Property<int>("SortOrder")
                        .HasColumnType("integer");

                    b.Property<int>("SpicinessLevel")
                        .HasColumnType("integer");

                    b.Property<int?>("StockQuantity")
                        .HasColumnType("integer");

                    b.PrimitiveCollection<List<string>>("Tags")
                        .IsRequired()
                        .HasColumnType("text[]");

                    b.Property<string>("ThumbnailUrl")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("UpdatedBy")
                        .HasColumnType("bigint");

                    b.HasKey("Id");

                    b.HasIndex("MenuCategoryId");

                    b.HasIndex("MenuId");

                    b.HasIndex("RestaurantId");

                    b.ToTable("menu_items", (string)null);
                });

            modelBuilder.Entity("Foodlyn.Modules.Menus.Domain.Entities.MenuItemModifier", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<long>("Id"));

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("CreatedBy")
                        .HasColumnType("bigint");

                    b.Property<bool>("IsActive")
                        .HasColumnType("boolean");

                    b.Property<long>("MenuItemModifierGroupId")
                        .HasColumnType("bigint");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(150)
                        .HasColumnType("character varying(150)");

                    b.Property<decimal>("PriceDelta")
                        .HasPrecision(12, 2)
                        .HasColumnType("numeric(12,2)");

                    b.Property<long?>("RestaurantId")
                        .HasColumnType("bigint");

                    b.Property<int>("SortOrder")
                        .HasColumnType("integer");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("UpdatedBy")
                        .HasColumnType("bigint");

                    b.HasKey("Id");

                    b.HasIndex("MenuItemModifierGroupId");

                    b.HasIndex("RestaurantId");

                    b.ToTable("menu_item_modifiers", (string)null);
                });

            modelBuilder.Entity("Foodlyn.Modules.Menus.Domain.Entities.MenuItemModifierGroup", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<long>("Id"));

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("CreatedBy")
                        .HasColumnType("bigint");

                    b.Property<bool>("IsActive")
                        .HasColumnType("boolean");

                    b.Property<int>("MaxSelect")
                        .HasColumnType("integer");

                    b.Property<long>("MenuItemId")
                        .HasColumnType("bigint");

                    b.Property<int>("MinSelect")
                        .HasColumnType("integer");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(150)
                        .HasColumnType("character varying(150)");

                    b.Property<long?>("RestaurantId")
                        .HasColumnType("bigint");

                    b.Property<int>("SortOrder")
                        .HasColumnType("integer");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("UpdatedBy")
                        .HasColumnType("bigint");

                    b.HasKey("Id");

                    b.HasIndex("MenuItemId");

                    b.HasIndex("RestaurantId");

                    b.ToTable("menu_item_modifier_groups", (string)null);
                });

            modelBuilder.Entity("Foodlyn.Modules.Ordering.Domain.Entities.Order", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<long>("Id"));

                    b.Property<DateTime?>("ApprovedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("ApprovedBy")
                        .HasColumnType("bigint");

                    b.Property<DateTime?>("CancelledAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime?>("CompletedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("CreatedBy")
                        .HasColumnType("bigint");

                    b.Property<string>("Currency")
                        .HasMaxLength(3)
                        .HasColumnType("character varying(3)");

                    b.Property<string>("CustomerName")
                        .HasMaxLength(150)
                        .HasColumnType("character varying(150)");

                    b.Property<string>("DeliveryNotes")
                        .HasMaxLength(1000)
                        .HasColumnType("character varying(1000)");

                    b.Property<DateTime?>("PaidAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("PaidBy")
                        .HasColumnType("bigint");

                    b.Property<int>("PartySize")
                        .HasColumnType("integer");

                    b.Property<int?>("PaymentMethod")
                        .HasColumnType("integer");

                    b.Property<int?>("PrepTimeMinutes")
                        .HasColumnType("integer");

                    b.Property<long?>("PreparedBy")
                        .HasColumnType("bigint");

                    b.Property<DateTime?>("PreparingStartedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime?>("ReadyAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime?>("RejectedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("RejectedReason")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)");

                    b.Property<long?>("RestaurantId")
                        .HasColumnType("bigint");

                    b.Property<DateTime?>("ServedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("ServedBy")
                        .HasColumnType("bigint");

                    b.Property<string>("SessionId")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<int>("Status")
                        .HasColumnType("integer");

                    b.Property<long>("TableId")
                        .HasColumnType("bigint");

                    b.Property<string>("TableLabel")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<int>("TableNumber")
                        .HasColumnType("integer");

                    b.Property<decimal>("TotalAmount")
                        .HasPrecision(12, 2)
                        .HasColumnType("numeric(12,2)");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("UpdatedBy")
                        .HasColumnType("bigint");

                    b.HasKey("Id");

                    b.HasIndex("RestaurantId");

                    b.HasIndex("SessionId");

                    b.HasIndex("Status");

                    b.HasIndex("TableId");

                    b.ToTable("orders", (string)null);
                });

            modelBuilder.Entity("Foodlyn.Modules.Ordering.Domain.Entities.OrderItem", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<long>("Id"));

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long>("MenuItemId")
                        .HasColumnType("bigint");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(200)
                        .HasColumnType("character varying(200)");

                    b.Property<string>("Notes")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)");

                    b.Property<long>("OrderId")
                        .HasColumnType("bigint");

                    b.Property<decimal>("Price")
                        .HasPrecision(12, 2)
                        .HasColumnType("numeric(12,2)");

                    b.Property<int>("Quantity")
                        .HasColumnType("integer");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("Id");

                    b.HasIndex("MenuItemId");

                    b.HasIndex("OrderId");

                    b.ToTable("order_items", (string)null);
                });

            modelBuilder.Entity("Foodlyn.Modules.Ordering.Domain.Entities.OrderItemModifier", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<long>("Id"));

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("GroupName")
                        .IsRequired()
                        .HasMaxLength(150)
                        .HasColumnType("character varying(150)");

                    b.Property<long?>("MenuItemModifierId")
                        .HasColumnType("bigint");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(150)
                        .HasColumnType("character varying(150)");

                    b.Property<long>("OrderItemId")
                        .HasColumnType("bigint");

                    b.Property<decimal>("Price")
                        .HasPrecision(12, 2)
                        .HasColumnType("numeric(12,2)");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("Id");

                    b.HasIndex("OrderItemId");

                    b.ToTable("order_item_modifiers", (string)null);
                });

            modelBuilder.Entity("Foodlyn.Modules.Restaurants.Domain.Entities.Restaurant", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<long>("Id"));

                    b.Property<string>("City")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<string>("Country")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<string>("CoverImageUrl")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("CreatedBy")
                        .HasColumnType("bigint");

                    b.Property<string>("Cuisine")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<string>("Currency")
                        .HasMaxLength(3)
                        .HasColumnType("character varying(3)");

                    b.Property<string>("Description")
                        .HasMaxLength(1000)
                        .HasColumnType("character varying(1000)");

                    b.Property<string>("Email")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<bool>("IsActive")
                        .HasColumnType("boolean");

                    b.Property<decimal?>("Latitude")
                        .HasPrecision(9, 6)
                        .HasColumnType("numeric(9,6)");

                    b.Property<string>("LogoUrl")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)");

                    b.Property<decimal?>("Longitude")
                        .HasPrecision(9, 6)
                        .HasColumnType("numeric(9,6)");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(150)
                        .HasColumnType("character varying(150)");

                    b.Property<string>("OpeningHours")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)");

                    b.Property<string>("PhoneNumber")
                        .HasMaxLength(30)
                        .HasColumnType("character varying(30)");

                    b.Property<string>("PostalCode")
                        .HasMaxLength(20)
                        .HasColumnType("character varying(20)");

                    b.Property<string>("Slug")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<string>("StreetAddress")
                        .HasMaxLength(200)
                        .HasColumnType("character varying(200)");

                    b.Property<string>("TaxId")
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<string>("TimeZone")
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("UpdatedBy")
                        .HasColumnType("bigint");

                    b.Property<string>("Website")
                        .HasMaxLength(200)
                        .HasColumnType("character varying(200)");

                    b.HasKey("Id");

                    b.HasIndex("Name");

                    b.HasIndex("Slug")
                        .IsUnique();

                    b.ToTable("restaurants", (string)null);
                });

            modelBuilder.Entity("Foodlyn.Modules.Restaurants.Domain.Entities.RestaurantOpeningHour", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<long>("Id"));

                    b.Property<TimeOnly?>("CloseTime")
                        .HasColumnType("time without time zone");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<int>("DayOfWeek")
                        .HasColumnType("integer");

                    b.Property<bool>("IsOpen")
                        .HasColumnType("boolean");

                    b.Property<TimeOnly?>("OpenTime")
                        .HasColumnType("time without time zone");

                    b.Property<long>("RestaurantId")
                        .HasColumnType("bigint");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("Id");

                    b.HasIndex("RestaurantId", "DayOfWeek")
                        .IsUnique();

                    b.ToTable("restaurant_opening_hours", (string)null);
                });

            modelBuilder.Entity("Foodlyn.Modules.Restaurants.Domain.Entities.RestaurantTable", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<long>("Id"));

                    b.Property<int>("Capacity")
                        .HasColumnType("integer");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("CreatedBy")
                        .HasColumnType("bigint");

                    b.Property<int>("CurrentPartySize")
                        .HasColumnType("integer");

                    b.Property<bool>("IsActive")
                        .HasColumnType("boolean");

                    b.Property<string>("Label")
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<string>("Location")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<string>("Notes")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)");

                    b.Property<int>("Number")
                        .HasColumnType("integer");

                    b.Property<DateTime?>("OccupiedSince")
                        .HasColumnType("timestamp with time zone");

                    b.Property<Guid>("QrToken")
                        .HasColumnType("uuid");

                    b.Property<DateTime?>("QrTokenRotatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("RestaurantId")
                        .HasColumnType("bigint");

                    b.Property<string>("Status")
                        .IsRequired()
                        .HasMaxLength(30)
                        .HasColumnType("character varying(30)");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("UpdatedBy")
                        .HasColumnType("bigint");

                    b.HasKey("Id");

                    b.HasIndex("QrToken")
                        .IsUnique();

                    b.HasIndex("RestaurantId");

                    b.HasIndex("RestaurantId", "Number")
                        .IsUnique();

                    b.ToTable("restaurant_tables", (string)null);
                });

            modelBuilder.Entity("Foodlyn.Shared.Domain.Currency", b =>
                {
                    b.Property<string>("Code")
                        .HasMaxLength(3)
                        .HasColumnType("character varying(3)");

                    b.Property<bool>("IsActive")
                        .HasColumnType("boolean");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(80)
                        .HasColumnType("character varying(80)");

                    b.Property<decimal>("RateToEur")
                        .HasPrecision(18, 6)
                        .HasColumnType("numeric(18,6)");

                    b.Property<string>("Symbol")
                        .HasMaxLength(10)
                        .HasColumnType("character varying(10)");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("Code");

                    b.ToTable("currencies", (string)null);

                    b.HasData(
                        new
                        {
                            Code = "EUR",
                            IsActive = true,
                            Name = "Euro",
                            RateToEur = 1m,
                            Symbol = "€"
                        },
                        new
                        {
                            Code = "USD",
                            IsActive = true,
                            Name = "US Dollar",
                            RateToEur = 1.08m,
                            Symbol = "$"
                        },
                        new
                        {
                            Code = "GBP",
                            IsActive = true,
                            Name = "British Pound",
                            RateToEur = 0.85m,
                            Symbol = "£"
                        },
                        new
                        {
                            Code = "RSD",
                            IsActive = true,
                            Name = "Serbian Dinar",
                            RateToEur = 117.20m,
                            Symbol = "дин"
                        },
                        new
                        {
                            Code = "CHF",
                            IsActive = true,
                            Name = "Swiss Franc",
                            RateToEur = 0.95m,
                            Symbol = "Fr"
                        },
                        new
                        {
                            Code = "JPY",
                            IsActive = true,
                            Name = "Japanese Yen",
                            RateToEur = 161.50m,
                            Symbol = "¥"
                        },
                        new
                        {
                            Code = "CNY",
                            IsActive = true,
                            Name = "Chinese Yuan",
                            RateToEur = 7.85m,
                            Symbol = "¥"
                        },
                        new
                        {
                            Code = "AUD",
                            IsActive = true,
                            Name = "Australian Dollar",
                            RateToEur = 1.62m,
                            Symbol = "A$"
                        },
                        new
                        {
                            Code = "CAD",
                            IsActive = true,
                            Name = "Canadian Dollar",
                            RateToEur = 1.47m,
                            Symbol = "C$"
                        },
                        new
                        {
                            Code = "NOK",
                            IsActive = true,
                            Name = "Norwegian Krone",
                            RateToEur = 11.50m,
                            Symbol = "kr"
                        });
                });

            modelBuilder.Entity("Foodlyn.Shared.Domain.SystemLog", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<long>("Id"));

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("ExceptionType")
                        .HasMaxLength(200)
                        .HasColumnType("character varying(200)");

                    b.Property<string>("IpAddress")
                        .HasMaxLength(64)
                        .HasColumnType("character varying(64)");

                    b.Property<string>("Level")
                        .IsRequired()
                        .HasMaxLength(20)
                        .HasColumnType("character varying(20)");

                    b.Property<string>("Message")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Method")
                        .HasMaxLength(10)
                        .HasColumnType("character varying(10)");

                    b.Property<string>("Path")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)");

                    b.Property<string>("QueryString")
                        .HasMaxLength(2000)
                        .HasColumnType("character varying(2000)");

                    b.Property<long?>("RestaurantId")
                        .HasColumnType("bigint");

                    b.Property<string>("Source")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<string>("StackTrace")
                        .HasColumnType("text");

                    b.Property<int?>("StatusCode")
                        .HasColumnType("integer");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("UserAgent")
                        .HasMaxLength(500)
                        .HasColumnType("character varying(500)");

                    b.Property<long?>("UserId")
                        .HasColumnType("bigint");

                    b.Property<string>("UserRole")
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<string>("Username")
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.HasKey("Id");

                    b.HasIndex("CreatedAt");

                    b.HasIndex("Level");

                    b.HasIndex("UserId");

                    b.ToTable("system_logs", (string)null);
                });

            modelBuilder.Entity("Foodlyn.Shared.Domain.Timezone", b =>
                {
                    b.Property<string>("IanaName")
                        .HasMaxLength(64)
                        .HasColumnType("character varying(64)");

                    b.Property<string>("DisplayName")
                        .IsRequired()
                        .HasMaxLength(120)
                        .HasColumnType("character varying(120)");

                    b.Property<bool>("IsActive")
                        .HasColumnType("boolean");

                    b.HasKey("IanaName");

                    b.ToTable("timezones", (string)null);

                    b.HasData(
                        new
                        {
                            IanaName = "Europe/Belgrade",
                            DisplayName = "Belgrade (CET/CEST)",
                            IsActive = true
                        },
                        new
                        {
                            IanaName = "Europe/Berlin",
                            DisplayName = "Berlin (CET/CEST)",
                            IsActive = true
                        },
                        new
                        {
                            IanaName = "Europe/Vienna",
                            DisplayName = "Vienna (CET/CEST)",
                            IsActive = true
                        },
                        new
                        {
                            IanaName = "Europe/London",
                            DisplayName = "London (GMT/BST)",
                            IsActive = true
                        },
                        new
                        {
                            IanaName = "Europe/Paris",
                            DisplayName = "Paris (CET/CEST)",
                            IsActive = true
                        },
                        new
                        {
                            IanaName = "Europe/Madrid",
                            DisplayName = "Madrid (CET/CEST)",
                            IsActive = true
                        },
                        new
                        {
                            IanaName = "America/New_York",
                            DisplayName = "New York (EST/EDT)",
                            IsActive = true
                        },
                        new
                        {
                            IanaName = "America/Los_Angeles",
                            DisplayName = "Los Angeles (PST/PDT)",
                            IsActive = true
                        },
                        new
                        {
                            IanaName = "Asia/Tokyo",
                            DisplayName = "Tokyo (JST)",
                            IsActive = true
                        },
                        new
                        {
                            IanaName = "Australia/Sydney",
                            DisplayName = "Sydney (AEST/AEDT)",
                            IsActive = true
                        },
                        new
                        {
                            IanaName = "UTC",
                            DisplayName = "UTC",
                            IsActive = true
                        });
                });

            modelBuilder.Entity("Foodlyn.Modules.Identity.Domain.Entities.RefreshToken", b =>
                {
                    b.HasOne("Foodlyn.Modules.Identity.Domain.Entities.User", "User")
                        .WithMany("RefreshTokens")
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("User");
                });

            modelBuilder.Entity("Foodlyn.Modules.Identity.Domain.Entities.RestaurantAssignment", b =>
                {
                    b.HasOne("Foodlyn.Modules.Identity.Domain.Entities.User", "User")
                        .WithMany("RestaurantAssignments")
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("User");
                });

            modelBuilder.Entity("Foodlyn.Modules.Menus.Domain.Entities.MenuCategory", b =>
                {
                    b.HasOne("Foodlyn.Modules.Menus.Domain.Entities.Menu", "Menu")
                        .WithMany("Categories")
                        .HasForeignKey("MenuId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Menu");
                });

            modelBuilder.Entity("Foodlyn.Modules.Menus.Domain.Entities.MenuItem", b =>
                {
                    b.HasOne("Foodlyn.Modules.Menus.Domain.Entities.MenuCategory", "Category")
                        .WithMany("Items")
                        .HasForeignKey("MenuCategoryId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Category");
                });

            modelBuilder.Entity("Foodlyn.Modules.Menus.Domain.Entities.MenuItemModifier", b =>
                {
                    b.HasOne("Foodlyn.Modules.Menus.Domain.Entities.MenuItemModifierGroup", "Group")
                        .WithMany("Modifiers")
                        .HasForeignKey("MenuItemModifierGroupId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Group");
                });

            modelBuilder.Entity("Foodlyn.Modules.Menus.Domain.Entities.MenuItemModifierGroup", b =>
                {
                    b.HasOne("Foodlyn.Modules.Menus.Domain.Entities.MenuItem", "MenuItem")
                        .WithMany("ModifierGroups")
                        .HasForeignKey("MenuItemId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("MenuItem");
                });

            modelBuilder.Entity("Foodlyn.Modules.Ordering.Domain.Entities.OrderItem", b =>
                {
                    b.HasOne("Foodlyn.Modules.Ordering.Domain.Entities.Order", "Order")
                        .WithMany("Items")
                        .HasForeignKey("OrderId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Order");
                });

            modelBuilder.Entity("Foodlyn.Modules.Ordering.Domain.Entities.OrderItemModifier", b =>
                {
                    b.HasOne("Foodlyn.Modules.Ordering.Domain.Entities.OrderItem", "OrderItem")
                        .WithMany("Modifiers")
                        .HasForeignKey("OrderItemId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("OrderItem");
                });

            modelBuilder.Entity("Foodlyn.Modules.Identity.Domain.Entities.User", b =>
                {
                    b.Navigation("RefreshTokens");

                    b.Navigation("RestaurantAssignments");
                });

            modelBuilder.Entity("Foodlyn.Modules.Menus.Domain.Entities.Menu", b =>
                {
                    b.Navigation("Categories");
                });

            modelBuilder.Entity("Foodlyn.Modules.Menus.Domain.Entities.MenuCategory", b =>
                {
                    b.Navigation("Items");
                });

            modelBuilder.Entity("Foodlyn.Modules.Menus.Domain.Entities.MenuItem", b =>
                {
                    b.Navigation("ModifierGroups");
                });

            modelBuilder.Entity("Foodlyn.Modules.Menus.Domain.Entities.MenuItemModifierGroup", b =>
                {
                    b.Navigation("Modifiers");
                });

            modelBuilder.Entity("Foodlyn.Modules.Ordering.Domain.Entities.Order", b =>
                {
                    b.Navigation("Items");
                });

            modelBuilder.Entity("Foodlyn.Modules.Ordering.Domain.Entities.OrderItem", b =>
                {
                    b.Navigation("Modifiers");
                });
#pragma warning restore 612, 618
        }
    }
}
