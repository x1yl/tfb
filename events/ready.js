const { Events } = require("discord.js");
const { GatewayIntentBits, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    client.user.setPresence({
		activities: [{ name: `You`, type: ActivityType.Watching }],
		status: 'dnd',
	  });
  },
};
