const { Events } = require("discord.js");
const { MongoClient } = require("mongodb");
const emojiRegex = require("emoji-regex");
const { mongoUri } = require("../config.json");

// Function to retrieve the autoreact document based on category
async function getAutoreactDocument(category) {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db("Discord");
    const collection = db.collection("autoreact");

    return await collection.findOne({ category: category });
  } finally {
    await client.close();
  }
}

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    try {
      let category;
      if (message.channel.parent) {
        category = message.channel.parent.id;
      }

      // Retrieve the autoreact document
      const autoreactDocument = await getAutoreactDocument(category);
      if (message.attachments.size <= 0) {return}
      if (autoreactDocument) {
        let emoji = autoreactDocument.emoji; // Assuming the field name for the emoji is "emoji"
        console.log("Retrieved emoji:", emoji);

        // Check if emoji is a valid emoji using emoji-regex
        const isEmoji = emojiRegex().test(emoji);

        if (isEmoji) {
          await message.react(emoji);
        } else {
          const emojiCache = message.client.emojis.cache;
          for (const cachedEmoji of emojiCache.values()) {
            if (cachedEmoji.name === emoji) {
              emoji = cachedEmoji;
              console.log("Found emoji in cache:", emoji);
              await message.react(emoji);
              break;
            }
          }
        }
      } else {
        console.warn("Emoji not found in cache.");
      }
      const randomChance = Math.random();
      const chanceThreshold = 0.0; // Adjust this value for the desired chance (e.g., 0.1 for 10% chance)
      console.log(message.channel.parent.id, randomChance);
      if (
        randomChance < chanceThreshold &&
        !message.author.bot &&
        message.channel.parent.id == "1196954246206206062"
      ) {
        await message.reply({
          content: "",
          stickers: [
            {
              id: "1198783217516421240",
              name: "gay now",
              tags: "🤨",
              type: 2,
              format_type: 1,
              description: "",
              asset: "",
              available: true,
              guild_id: "1196954245669322853",
              user: {
                id: "1146889559922184292",
                username: "math_phobic",
                avatar: "1ca819e6afba4b4775350a353ab3d122",
                discriminator: "0",
                public_flags: 0,
                premium_type: 0,
                flags: 0,
                banner: null,
                accent_color: null,
                global_name: "lovelee12’s ultimate carry C:",
                avatar_decoration_data: null,
                banner_color: null,
              },
            },
          ],
        });
      }
      if (
        message.mentions.has(message.client.user.id) &&
        !message.author.bot &&
        !message.reference
      ) {
        // Respond with "hello!"
        await message.reply("hello!");
        return; // Exit the function to avoid further processing for this message
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  },
};
