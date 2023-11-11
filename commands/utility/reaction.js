const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const { PermissionFlagsBits } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const { mongoUri } = require("../../config.json");
const { MongoClient } = require("mongodb");
const uri = mongoUri;
const mongodb = new MongoClient(uri);

async function reactionRole(messageId, emo, role, max) {
  try {
    const database = mongodb.db("Discord");
    const collection = database.collection("reactionRole");
    const doc = { messageId: messageId, emoji: emo, role: role, only: max };
    const result = await collection.insertOne(doc);
  } finally {
    // Ensures that the client will close when you finish/error
    await mongodb.close();
  }
}

module.exports = {
  category: "utility",
  data: new SlashCommandBuilder()
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false)
    .setName("reaction")
    .setDescription("Assign roles based on reactions.")
    .addStringOption((option) =>
      option
        .setName("reaction_emojis")
        .setDescription("Enter the reaction emojis separated by spaces")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("roles")
        .setDescription(
          "Enter the roles separated by spaces (in the same order as emojis)"
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("title").setDescription("Title of embed").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("1")
        .setDescription("true (max 1) or false (no max)")
        .setRequired(true)
    ),
  async execute(interaction) {
    const reactionEmojis = interaction.options
      .getString("reaction_emojis")
      .split(" ");
    const roles = interaction.options.getString("roles").split(" ");
    const title = interaction.options.getString("title");
    const max = interaction.options.getString("1");

    if (
      interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageRoles
      ) == false
    ) {
      return interaction.reply({
        content:
          "You don't have permission to run this command (Manage Roles).",
        ephemeral: true,
      });
    }

    if (reactionEmojis.length !== roles.length) {
      return interaction.reply({
        content: "The number of emojis and roles must match.",
        ephemeral: true,
      });
    }

    try {
      // Create an embed for the reaction role setup
      const reactEmbed = new EmbedBuilder().setTitle(title);

      for (let i = 0; i < reactionEmojis.length; i++) {
        reactEmbed.addFields({
          name: " ",
          value: `${reactionEmojis[i]} ${roles[i]}`,
        });
      }

      // Send the embed
      await interaction.reply({ embeds: [reactEmbed] });

      // React to the message with the provided emojis
      const message = await interaction.fetchReply();
      for (const emoji of reactionEmojis) {
        await message.react(emoji);
      }

      // Create reaction role documents
      const messageId = message.id;

      for (let i = 0; i < reactionEmojis.length; i++) {
        roleId = roles[i].replace(/\D/g, "");
        reactionRole(messageId, reactionEmojis[i], roleId, max);
      }

      // Confirmation message
      await interaction.followUp({
        content: "Reaction roles set up successfully.",
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.followUp({
        content: "An error occurred.",
        ephemeral: true,
      });
    }
  },
};
