const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  category: "fun",
  data: new SlashCommandBuilder()
    .setName("meme")
    .setDescription("Get a meme! (not copying dank memer frfr)"),
  async execute(interaction) {
    try {
      const { default: got } = await import("got");
      const embed = new EmbedBuilder();

      const response = await got("https://www.reddit.com/r/memes/top/.json?t=month");
      const data = JSON.parse(response.body).data.children;

      if (!data || data.length === 0) {
        throw new Error("No memes found in the response.");
      }

      // Select a random meme from the top posts
      const randomIndex = Math.floor(Math.random() * data.length);
      const post = data[randomIndex];

      const permalink = post.data.permalink;
      const memeUrl = `https://reddit.com${permalink}`;
      const memeImage = post.data.url;
      const memeTitle = post.data.title;
      const memeUpvotes = post.data.ups;
      const memeNumComments = post.data.num_comments;

      embed.setTitle(`${memeTitle}`);
      embed.setURL(`${memeUrl}`);
      embed.setColor("Random");
      embed.setImage(memeImage);
      embed.setFooter({
        text: `👍 ${memeUpvotes} 💬 ${memeNumComments}`,
      });

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching meme:", error);
      interaction.reply("Error fetching meme. Please try again later.");
    }
  },
};
