const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { MongoClient } = require('mongodb');
const { mongoUri } = require('../../config.json'); // Replace with your mongoUri configuration

const client = new MongoClient(mongoUri); 
async function createAutoReactCategory(category, emoji) {
  try {
    await client.connect();
    const db = client.db('Discord'); // Specify the database name as a string
    const collection = db.collection('autoreact'); // Specify the collection name as a string

    const document = {
      category: category,
      emoji: emoji,
    };

    const result = await collection.insertOne(document);
    console.log('AutoReact category document inserted:', result.insertedId);
  } finally {
    await client.close();
  }
}

module.exports = {
	category: "utility",
	data: new SlashCommandBuilder()
		.setName('autoreact')
		.setDescription('Auto React to all messages in a certain category')
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("Category to autoreact. Use Id.")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reaction')
        .setDescription('Enter the reaction emoji')
        .setRequired(true)
    ),
	async execute(interaction) {
    const category = interaction.options.getString("category", true)
    const reactionEmoji = interaction.options.getString('reaction');

    if (
      interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageRoles
      ) == false
    ) {
      return interaction.reply({
        content: "You don't have permission to run this command (Manage Roles).",
        ephemeral: true,
      });
    }

    try {
      let emoji;

      if (reactionEmoji.includes(':')) {
        const emojiName = reactionEmoji.split(':')[1];

        // Search for the emoji in the cache
        const emojiCache = interaction.client.emojis.cache;
        for (const cachedEmoji of emojiCache.values()) {
          if (cachedEmoji.name === emojiName) {
            emoji = cachedEmoji;
            emoji2 = emoji.name;
            break;
          }
        }
      } else {
        emoji = reactionEmoji;
        emoji2 = emoji;
      }

      if (!emoji) {
        return interaction.reply({content: 'Invalid emoji.', ephemeral: true});
      }

      // Create autoreact document

      await createAutoReactCategory(category, emoji2);
      

      // Confirmation message
      await interaction.reply({content: 'Autoreact Category set up successfully.', ephemeral: true});
    } catch (error) {
      console.error(error);
      await interaction.reply({content: 'An error occurred.', ephemeral: true});
    }
  }
}