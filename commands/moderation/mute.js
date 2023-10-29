const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { MongoClient } = require('mongodb');
const { mongoUri } = require('../../config.json');

async function muteUser(guildId, userId, length, currentTime, unmuteTime) {
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db('Discord');
    const collection = db.collection('muted');

    const muteDocument = {
      guildId: guildId,
      userId: userId,
      length: length,
      currentTime: currentTime,
      unmuteTime: unmuteTime,
    };

    const result = await collection.insertOne(muteDocument);

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
    .setName('mute')
    .setDescription('Mute a user for a specified length of time.')
    .addUserOption(option =>
      option.setName('user') 
        .setDescription('The user to mute')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('length')
        .setDescription('The length of the mute (e.g., 1h, 30m)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Optional reason for the mute')),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
      return interaction.reply({
        content: "You don't have permission to mute members.",
        ephemeral: true,
      });
    }
    
    const user = interaction.options.getMember('user'); // Get the user as a GuildMember
    const userId = user.id;
    const length = interaction.options.getString('length');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const guildId = interaction.guild.id;

    // Calculate unmute time based on the current time and the specified length
    const currentTime = Date.now();
    const lengthInMillis = parseTimeToMilliseconds(length);
    const unmuteTime = new Date(currentTime + lengthInMillis).getTime();

    const muteRoleName = await getMuteRole(guildId);

    if (!muteRoleName) {
      return interaction.reply('Mute role not set for this server. Set up the mute role with /mute-role.');
    }

    // Get the mute role from the guild's cache
    const mutedRole = interaction.guild.roles.cache.find(role => role.name === muteRoleName);

    if (!mutedRole) {
      return interaction.reply('Mute role not found in this server. Make sure the mute role exists.');
    }

    if (user.roles.cache.has(mutedRole.id)) {
      return interaction.reply(`${user.user.tag} is already muted.`);
    }

    try {
      await user.roles.add(mutedRole); 
      await muteUser(guildId, userId, length, currentTime, unmuteTime);
      interaction.reply(`Muted ${user.user.tag} for ${length} due to: ${reason}`);
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while muting the user.');
    }
  },
};  

// Helper function to parse time strings into milliseconds
function parseTimeToMilliseconds(timeString) {
  const timeUnitMap = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const regex = /(\d+)([smhd])/;
  const match = timeString.match(regex);

  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    return value * timeUnitMap[unit];
  }

  return 0;
}
