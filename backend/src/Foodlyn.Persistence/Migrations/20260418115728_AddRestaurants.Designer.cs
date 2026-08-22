using System;
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
    [Migration("20260418115728_AddRestaurants")]
    partial class AddRestaurants
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

                    b.Property<string>("FirstName")
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.Property<bool>("IsActive")
                        .HasColumnType("boolean");

                    b.Property<DateTime?>("LastLoginAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("LastName")
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

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

            modelBuilder.Entity("Foodlyn.Modules.Ordering.Domain.Entities.Order", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("bigint");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<long>("Id"));

                    b.Property<DateTime?>("AcceptedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime?>("ClosedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("CreatedBy")
                        .HasColumnType("bigint");

                    b.Property<DateTime?>("DeliveredAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("DeliveryNotes")
                        .HasColumnType("text");

                    b.Property<string>("PaymentMethod")
                        .HasColumnType("text");

                    b.Property<DateTime?>("ReadyAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("RestaurantId")
                        .HasColumnType("bigint");

                    b.Property<string>("SessionId")
                        .HasColumnType("text");

                    b.Property<int>("Status")
                        .HasColumnType("integer");

                    b.Property<long>("TableId")
                        .HasColumnType("bigint");

                    b.Property<decimal>("TotalAmount")
                        .HasColumnType("numeric");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<long?>("UpdatedBy")
                        .HasColumnType("bigint");

                    b.HasKey("Id");

                    b.ToTable("Orders");
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
                        .HasColumnType("text");

                    b.Property<long>("OrderId")
                        .HasColumnType("bigint");

                    b.Property<decimal>("Price")
                        .HasColumnType("numeric");

                    b.Property<long>("Quantity")
                        .HasColumnType("bigint");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("Id");

                    b.HasIndex("OrderId");

                    b.ToTable("OrderItems");
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

            modelBuilder.Entity("Foodlyn.Modules.Identity.Domain.Entities.RefreshToken", b =>
                {
                    b.HasOne("Foodlyn.Modules.Identity.Domain.Entities.User", "User")
                        .WithMany("RefreshTokens")
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("User");
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

            modelBuilder.Entity("Foodlyn.Modules.Identity.Domain.Entities.User", b =>
                {
                    b.Navigation("RefreshTokens");
                });

            modelBuilder.Entity("Foodlyn.Modules.Ordering.Domain.Entities.Order", b =>
                {
                    b.Navigation("Items");
                });
#pragma warning restore 612, 618
        }
    }
}
