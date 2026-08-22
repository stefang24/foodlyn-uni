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
    [Migration("20260410135408_InitialCreate")]
    partial class InitialCreate
    {
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "10.0.5")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);

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

                    b.Property<long>("RestaurantId")
                        .HasColumnType("bigint");

                    b.Property<string>("SessionId")
                        .HasColumnType("text");

                    b.Property<int>("Status")
                        .HasColumnType("integer");

                    b.Property<int>("TableId")
                        .HasColumnType("integer");

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

                    b.Property<int>("Quantity")
                        .HasColumnType("integer");

                    b.Property<DateTime?>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("Id");

                    b.HasIndex("OrderId");

                    b.ToTable("OrderItems");
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

            modelBuilder.Entity("Foodlyn.Modules.Ordering.Domain.Entities.Order", b =>
                {
                    b.Navigation("Items");
                });
#pragma warning restore 612, 618
        }
    }
}
