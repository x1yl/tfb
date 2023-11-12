const {
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");

const {
  supportName,
  closedTicketCategory,
  openTicketCategory,
} = require("../../config.json");

module.exports = {
  category: "utility",
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket related commands.")
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
      subcommand.setName("close").setDescription("Close ticket.")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("open").setDescription("Open ticket.")
    ),
  async execute(interaction) {
    // Get the support role (adjust role ID accordingly)
    const supportRole = interaction.guild.roles.cache.find(
      (role) => role.name === supportName
    );
    if (interaction.options.getSubcommand() === "open") {
      const channel = await interaction.guild.channels.create({
        name: `ticket-by-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guildId,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.AttachFiles,
              PermissionsBitField.Flags.UseApplicationCommands,
            ],
          },
          {
            id: supportRole.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.AttachFiles,
              PermissionsBitField.Flags.UseApplicationCommands,
            ],
          },
        ],
      });

      await interaction.reply({ content: "Ticket created!", ephemeral: true });

      // Additional actions (e.g., send a message to the channel)
      const welcomeMessage = `Welcome ${interaction.user.username}! A support representative will assist you shortly. <@&${supportRole.id}>`;
      channel.send(welcomeMessage);
      let category = interaction.guild.channels.cache.find(
        (channel) => channel.name === openTicketCategory
      );

      if (!category) {
        interaction.guild.channels.create({
          name: `${openTicketCategory}`,
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: interaction.guildId,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: supportRole.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.UseApplicationCommands,
              ],
            },
          ],
        });
      }

      category = interaction.guild.channels.cache.find(
        (channel) => channel.name === openTicketCategory
      );
      await channel.setParent(category, {
        lockPermissions: false,
      });
    } else if (interaction.options.getSubcommand() === "close") {
      try {
        if (interaction.channel.name.toLowerCase().includes("ticket")) {
          if (interaction.member.roles.cache.has(supportRole.id)) {
            // Fetch the target category by name
            let category = interaction.guild.channels.cache.find(
              (channel) => channel.name === closedTicketCategory
            );

            if (!category) {
              interaction.guild.channels.create({
                name: `${closedTicketCategory}`,
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                  {
                    id: interaction.guildId,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                  },
                  {
                    id: supportRole.id,
                    allow: [
                      PermissionsBitField.Flags.ViewChannel,
                      PermissionsBitField.Flags.SendMessages,
                      PermissionsBitField.Flags.ReadMessageHistory,
                      PermissionsBitField.Flags.AttachFiles,
                      PermissionsBitField.Flags.UseApplicationCommands,
                    ],
                  },
                ],
              });
            }
            await interaction.reply("Ticket closed!");

            category = interaction.guild.channels.cache.find(
              (channel) => channel.name === closedTicketCategory
            );
            await interaction.channel.setParent(category, {
              lockPermissions: true,
            });
          }
        }
      } catch (error) {
        console.log(error);
        await interaction.reply(
          "Make sure you have the Support role and that you are in a ticket channel!"
        );
      }
    }
  },
};
