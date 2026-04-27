using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatApp.Migrations
{
    /// <inheritdoc />
    public partial class ModifySeedDefaultData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "Users",
                keyColumn: "UserId",
                keyValue: 5000000L,
                column: "IdentityUserId",
                value: "ai-1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                schema: "dbo",
                table: "Users",
                keyColumn: "UserId",
                keyValue: 5000000L,
                column: "IdentityUserId",
                value: "AI Assitant");
        }
    }
}
