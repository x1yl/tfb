const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    category: "utility",
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription(
      "Get the avatar URL of the selected user, or your own avatar."
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Get users avatar")
    ),
  async execute(interaction) {
    const user = interaction.options.getMember("user");

    // Check if a user was provided, else use the interaction user
    const userAvatar = user || interaction.user;

    if (user) {
         embed = new EmbedBuilder()
          .setTitle(`${userAvatar.user.tag}'s Avatar`)
          .setImage(userAvatar.displayAvatarURL({ dynamic: true, size: 1024 }))
          .setColor("#0099ff");
      } else {
         embed = new EmbedBuilder()
          .setTitle(`${userAvatar.tag}'s Avatar`)
          .setImage(userAvatar.displayAvatarURL({ dynamic: true, size: 1024 }))
          .setColor("#0099ff");
      }
    await interaction.reply({ embeds: [embed] });
  },
};
