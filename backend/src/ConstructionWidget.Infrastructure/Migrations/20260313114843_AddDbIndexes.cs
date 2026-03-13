using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConstructionWidget.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDbIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Conversations_TenantId_SessionId",
                table: "Conversations");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_Status",
                table: "Leads",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_TenantId_CreatedAt",
                table: "Leads",
                columns: new[] { "TenantId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_CreatedAt",
                table: "Conversations",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_TenantId_SessionId",
                table: "Conversations",
                columns: new[] { "TenantId", "SessionId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Leads_Status",
                table: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_Leads_TenantId_CreatedAt",
                table: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_Conversations_CreatedAt",
                table: "Conversations");

            migrationBuilder.DropIndex(
                name: "IX_Conversations_TenantId_SessionId",
                table: "Conversations");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_TenantId_SessionId",
                table: "Conversations",
                columns: new[] { "TenantId", "SessionId" });
        }
    }
}
