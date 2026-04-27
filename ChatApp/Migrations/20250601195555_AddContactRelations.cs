using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatApp.Migrations
{
    /// <inheritdoc />
    public partial class AddContactRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Contact_Users_ContactUserId",
                schema: "dbo",
                table: "Contact");

            migrationBuilder.DropForeignKey(
                name: "FK_Contact_Users_OwnerUserId",
                schema: "dbo",
                table: "Contact");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Contact",
                schema: "dbo",
                table: "Contact");

            migrationBuilder.RenameTable(
                name: "Contact",
                schema: "dbo",
                newName: "Contacts",
                newSchema: "dbo");

            migrationBuilder.RenameIndex(
                name: "IX_Contact_OwnerUserId",
                schema: "dbo",
                table: "Contacts",
                newName: "IX_Contacts_OwnerUserId");

            migrationBuilder.RenameIndex(
                name: "IX_Contact_ContactUserId",
                schema: "dbo",
                table: "Contacts",
                newName: "IX_Contacts_ContactUserId");

            migrationBuilder.AlterColumn<long>(
                name: "ContactId",
                schema: "dbo",
                table: "Contacts",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("SqlServer:Identity", "1, 1")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Contacts",
                schema: "dbo",
                table: "Contacts",
                column: "ContactId");

            migrationBuilder.AddForeignKey(
                name: "FK_Contacts_Users_ContactUserId",
                schema: "dbo",
                table: "Contacts",
                column: "ContactUserId",
                principalSchema: "dbo",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

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
                name: "FK_Contacts_Users_ContactUserId",
                schema: "dbo",
                table: "Contacts");

            migrationBuilder.DropForeignKey(
                name: "FK_Contacts_Users_OwnerUserId",
                schema: "dbo",
                table: "Contacts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Contacts",
                schema: "dbo",
                table: "Contacts");

            migrationBuilder.RenameTable(
                name: "Contacts",
                schema: "dbo",
                newName: "Contact",
                newSchema: "dbo");

            migrationBuilder.RenameIndex(
                name: "IX_Contacts_OwnerUserId",
                schema: "dbo",
                table: "Contact",
                newName: "IX_Contact_OwnerUserId");

            migrationBuilder.RenameIndex(
                name: "IX_Contacts_ContactUserId",
                schema: "dbo",
                table: "Contact",
                newName: "IX_Contact_ContactUserId");

            migrationBuilder.AlterColumn<int>(
                name: "ContactId",
                schema: "dbo",
                table: "Contact",
                type: "int",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .Annotation("SqlServer:Identity", "1, 1")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Contact",
                schema: "dbo",
                table: "Contact",
                column: "ContactId");

            migrationBuilder.AddForeignKey(
                name: "FK_Contact_Users_ContactUserId",
                schema: "dbo",
                table: "Contact",
                column: "ContactUserId",
                principalSchema: "dbo",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Contact_Users_OwnerUserId",
                schema: "dbo",
                table: "Contact",
                column: "OwnerUserId",
                principalSchema: "dbo",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
