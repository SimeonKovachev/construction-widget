using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConstructionWidget.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantBranding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AgentAvatarUrl",
                table: "Tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AgentName",
                table: "Tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "Tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrimaryColor",
                table: "Tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SecondaryColor",
                table: "Tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WelcomeMessage",
                table: "Tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WidgetPosition",
                table: "Tenants",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AgentAvatarUrl",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "AgentName",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "PrimaryColor",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "SecondaryColor",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "WelcomeMessage",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "WidgetPosition",
                table: "Tenants");
        }
    }
}
