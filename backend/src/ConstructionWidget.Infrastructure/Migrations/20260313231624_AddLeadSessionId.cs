using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConstructionWidget.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLeadSessionId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SessionId",
                table: "Leads",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Leads_SessionId",
                table: "Leads",
                column: "SessionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Leads_SessionId",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "Leads");
        }
    }
}
