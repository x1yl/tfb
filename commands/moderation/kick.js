const { SlashCommandBuilder } = require("discord.js");
const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Select a member and kick them (but not really).")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to kick")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false),
  category: "moderation",
  async execute(interaction) {
    const member = interaction.options.getMember("target");

    // Attempt to kick the member
    try {
      await member.kick();
      return interaction.reply({
        content: `Kicked ${member.user.tag} successfully.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content:
          "An error occurred while trying to kick the member. Make sure they do not have a higher role.",
        ephemeral: true,
      });
    }
  },
};
