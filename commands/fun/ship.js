const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  category: "fun",
  data: new SlashCommandBuilder()
    .setName("ship")
    .setDescription("Ship two users and check their compatibility!"),
  async execute(interaction) {
    try {
      const embed = new EmbedBuilder();

      // Get all members from the interaction's guild
      await interaction.guild.members.fetch({ withPresences: false, withTimestamps: false });
      const guildMembers = interaction.guild.members.cache.filter(member => !member.user.bot);
      // Select two random users
      let user1, user2;
      do {
        user1 = guildMembers.random().user;
        user2 = guildMembers.random().user;
      } while (user1.id === user2.id);

      // Generate a random ship percentage
      const shipPercentage = Math.floor(Math.random() * 101);

      embed.setColor("#FF5733");
      if (shipPercentage < 50) {
        embed.setDescription(`Compatibility: ${shipPercentage}% 💔`);
      } else {
        embed.setDescription(`Compatibility: ${shipPercentage}% ❤️`);
      }

      interaction.reply({
        content: `💗 MATCHMAKING 💗\n🔻\`${user1.username}\`\n🔺\`${user2.username}\``,
        embeds: [embed],
      });
    } catch (error) {
      console.error("Error shipping users:", error);
      interaction.reply("Error shipping users. Please try again later.");
    }
  },
};
