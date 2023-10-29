const { SlashCommandBuilder } = require("discord.js");
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Select a member and unban them.")
    .addStringOption((option) =>
      option
        .setName("user")
        .setDescription("The member to unban")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for unbanning the member")
    )
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setDMPermission(false),
  category: "moderation",
  async execute(interaction) {
    const member = interaction.options.getString("user");
    const reason = interaction.options.getString("reason");

    // Attempt to kick the member
    try {
        await interaction.guild.bans.remove(member, reason)
      return interaction.reply({
        content: `Unbanned ${member.user.tag} successfully for the reason: ${reason}.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content:
          "An error occurred while trying to ban the member. Make sure they do not have a higher role.",
        ephemeral: true,
      });
    }
  },
};
