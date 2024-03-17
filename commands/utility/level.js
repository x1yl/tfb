const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { AmariBot } = require("amaribot.js");
const { Amari_Key } = require("../../config.json");
const client = new AmariBot(Amari_Key);

module.exports = {
  category: "utility",
  data: new SlashCommandBuilder()
    .setName("level")
    .addUserOption((option) =>
      option.setName("user").setDescription("Get users rank")
    )
    .setDescription("Check ur levels"),
  async execute(interaction) {
    try {
      const user = interaction.options.getMember("user");
      let user2 = interaction.user.id;
      if (user) {
        user2 = user.user.id;
      }
      const embed = new EmbedBuilder();
      const leaderboard = await client.getRawLeaderboard(interaction.guildId);
      leaderboard.data.forEach((entry) => {
        if (entry.id == user2) {
          console.log(entry.username, entry.exp, entry.level);
          embed.setAuthor({
            name: "Level Info",
          });
          embed.setTitle(`${entry.username}'s Profile`);
          embed.addFields(
            {
              name: "Username",
              value: `*${entry.username.toUpperCase()}*`,
              inline: true,
            },
            {
              name: "Level",
              value: `${entry.level}`,
              inline: true,
            },
            {
              name: "Experience",
              value: `${entry.exp}`,
              inline: true,
            }
          );
          embed.setColor("#00b0f4");
          embed.setFooter({
            text: `${entry.username}`,
            iconURL: interaction.guild.iconURL({ dynamic: true }),
          });
          embed.setTimestamp();
        }
      });
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error shipping users:", error);
      interaction.reply("Error shipping users. Please try again later.");
    }
  },
};
