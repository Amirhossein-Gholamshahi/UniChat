using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatApp.Migrations
{
    /// <inheritdoc />
    public partial class addGroupKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Group_Users_OwnerId",
                schema: "dbo",
                table: "Group");

            migrationBuilder.DropForeignKey(
                name: "FK_GroupUser_Group_GroupsGroupId",
                schema: "dbo",
                table: "GroupUser");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Group",
                schema: "dbo",
                table: "Group");

            migrationBuilder.RenameTable(
                name: "Group",
                schema: "dbo",
                newName: "Groups",
                newSchema: "dbo");

            migrationBuilder.RenameIndex(
                name: "IX_Group_OwnerId",
                schema: "dbo",
                table: "Groups",
                newName: "IX_Groups_OwnerId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Groups",
                schema: "dbo",
                table: "Groups",
                column: "GroupId");

            migrationBuilder.CreateTable(
                name: "UserGroupKeys",
                schema: "dbo",
                columns: table => new
                {
                    UserGroupKeyId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GroupId = table.Column<long>(type: "bigint", nullable: false),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    EncryptedGroupKey = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserGroupKeys", x => x.UserGroupKeyId);
                });

            migrationBuilder.AddForeignKey(
                name: "FK_Groups_Users_OwnerId",
                schema: "dbo",
                table: "Groups",
                column: "OwnerId",
                principalSchema: "dbo",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_GroupUser_Groups_GroupsGroupId",
                schema: "dbo",
                table: "GroupUser",
                column: "GroupsGroupId",
                principalSchema: "dbo",
                principalTable: "Groups",
                principalColumn: "GroupId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Groups_Users_OwnerId",
                schema: "dbo",
                table: "Groups");

            migrationBuilder.DropForeignKey(
                name: "FK_GroupUser_Groups_GroupsGroupId",
                schema: "dbo",
                table: "GroupUser");

            migrationBuilder.DropTable(
                name: "UserGroupKeys",
                schema: "dbo");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Groups",
                schema: "dbo",
                table: "Groups");

            migrationBuilder.RenameTable(
                name: "Groups",
                schema: "dbo",
                newName: "Group",
                newSchema: "dbo");

            migrationBuilder.RenameIndex(
                name: "IX_Groups_OwnerId",
                schema: "dbo",
                table: "Group",
                newName: "IX_Group_OwnerId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Group",
                schema: "dbo",
                table: "Group",
                column: "GroupId");

            migrationBuilder.AddForeignKey(
                name: "FK_Group_Users_OwnerId",
                schema: "dbo",
                table: "Group",
                column: "OwnerId",
                principalSchema: "dbo",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_GroupUser_Group_GroupsGroupId",
                schema: "dbo",
                table: "GroupUser",
                column: "GroupsGroupId",
                principalSchema: "dbo",
                principalTable: "Group",
                principalColumn: "GroupId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
