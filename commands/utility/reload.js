const { SlashCommandBuilder } = require("discord.js");
const { guildId, devId } = require("../../config.json");

module.exports = {
  category: "utility",
  data: new SlashCommandBuilder()
    .setName("reload")
    .setDescription("Reloads a command.")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command to reload.")
        .setRequired(true)
    ),
  async execute(interaction) {
    if (interaction.guild.id === guildId || devId === interaction.user.id) {
      const commandName = interaction.options
        .getString("command", true)
        .toLowerCase();
      const command = interaction.client.commands.get(commandName);

      if (!command) {
        return interaction.reply(
          `There is no command with name \`${commandName}\`!`
        );
      }

      delete require.cache[
        require.resolve(`../${command.category}/${command.data.name}.js`)
      ];

      try {
        interaction.client.commands.delete(command.data.name);
        const newCommand = require(`../${command.category}/${command.data.name}.js`);
        interaction.client.commands.set(newCommand.data.name, newCommand);
        await interaction.reply({
          content: `Command \`${newCommand.data.name}\` was reloaded!`,
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);
        await interaction.reply(
          `There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``
        );
      }
    } else {
      await interaction.reply("This command is not available here.");
    }
  },
};
