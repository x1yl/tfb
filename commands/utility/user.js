const { SlashCommandBuilder } = require('discord.js');


module.exports = {
	category: "utility",
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Provides information about the user.'),
	async execute(interaction) {
		const seconds = interaction.member.joinedTimestamp / 1000
		await interaction.reply(`This command was run by ${interaction.user.username}, who joined on <t:${Math.round(seconds)}:f>.`);
	},
};
