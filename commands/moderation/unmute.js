const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { MongoClient } = require('mongodb');
const { mongoUri } = require('../../config.json');

async function unmuteUser(guildId, userId) {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db('Discord');
    const collection = db.collection('muted');

    // Delete the mute document for the specified user and guild
    await collection.deleteOne({ guildId: guildId, userId: userId });
  } finally {
    await client.close();
  }
}

async function getMuteRole(guildId) {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db('Discord');
    const collection = db.collection('muteRoles');

    const muteRoleDocument = await collection.findOne({ guildId: guildId });

    if (muteRoleDocument) {
      return muteRoleDocument.muteRoleName;
    }

    return null;
  } finally {
    await client.close();
  }
}

module.exports = {
  category: 'moderation',
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a user.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to unmute')
        .setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
      return interaction.reply({
        content: "You don't have permission to unmute members.",
        ephemeral: true,
      });
    }

    const user = interaction.options.getMember('user'); // Get the user as a GuildMember
    const userId = user.id;
    const guildId = interaction.guild.id;
    const muteRoleName = await getMuteRole(guildId)
    // Assuming you have a "Muted" role in your server
    const mutedRole = interaction.guild.roles.cache.find(role => role.name === muteRoleName);

    if (!mutedRole) {
      return interaction.reply('Muted role not found for this server. Make sure the role exists.');
    }

    if (!user.roles.cache.has(mutedRole.id)) {
      return interaction.reply(`${user.user.tag} is not currently muted.`);
    }

    try {
      await user.roles.remove(mutedRole);
      await unmuteUser(guildId, userId);
      interaction.reply({content: `Unmuted ${user.user.tag}.`, ephemeral: true,});
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while unmuting the user.');
    }
  },
};
