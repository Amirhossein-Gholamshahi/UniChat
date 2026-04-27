using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatApp.Migrations
{
    /// <inheritdoc />
    public partial class modefidContactRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Contacts_Users_ComalekId",
                schema: "dbo",
                table: "Contacts");

            migrationBuilder.RenameColumn(
                name: "ComalekId",
                schema: "dbo",
                table: "Contacts",
                newName: "OwnerUserId");

            migrationBuilder.RenameIndex(
                name: "IX_Contacts_ComalekId",
                schema: "dbo",
                table: "Contacts",
                newName: "IX_Contacts_OwnerUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Contacts_Users_OwnerUserId",
                schema: "dbo",
                table: "Contacts",
                column: "OwnerUserId",
                principalSchema: "dbo",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Contacts_Users_OwnerUserId",
                schema: "dbo",
                table: "Contacts");

            migrationBuilder.RenameColumn(
                name: "OwnerUserId",
                schema: "dbo",
                table: "Contacts",
                newName: "ComalekId");

            migrationBuilder.RenameIndex(
                name: "IX_Contacts_OwnerUserId",
                schema: "dbo",
                table: "Contacts",
                newName: "IX_Contacts_ComalekId");

            migrationBuilder.AddForeignKey(
                name: "FK_Contacts_Users_ComalekId",
                schema: "dbo",
                table: "Contacts",
                column: "ComalekId",
                principalSchema: "dbo",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
