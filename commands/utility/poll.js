const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create a poll.")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("Question of the poll")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("choice1").setDescription("Poll Choices").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("choice2").setDescription("Poll Choices")
    )
    .addStringOption((option) =>
      option.setName("choice3").setDescription("Poll Choices")
    )
    .addStringOption((option) =>
      option.setName("choice4").setDescription("Poll Choices")
    )
    .addStringOption((option) =>
      option.setName("choice5").setDescription("Poll Choices")
    )
    .addStringOption((option) =>
      option.setName("choice6").setDescription("Poll Choices")
    )
    .addStringOption((option) =>
      option.setName("choice7").setDescription("Poll Choices")
    )
    .addStringOption((option) =>
      option.setName("choice8").setDescription("Poll Choices")
    )
    .addStringOption((option) =>
      option.setName("choice9").setDescription("Poll Choices")
    )
    .addStringOption((option) =>
      option.setName("choice10").setDescription("Poll Choices")
    )
    .setDMPermission(false),
  category: "utility",
  async execute(interaction) {
    const question = interaction.options.getString("question");
    const choices = [];

    const pollEmbed = new EmbedBuilder().setTitle(question);

    for (let i = 1; i <= 10; i++) {
      const choice = interaction.options.getString(`choice${i}`);
      if (choice) {
        choices.push(choice);
        pollEmbed.addFields({
          name: `:${numberToWords(i - 1).toLowerCase()}: ${choices[i - 1]}`,
          value: " ",
        });
      }
    }
    interaction.reply({ embeds: [pollEmbed] });
    for (let i = 0; i < choices.length; i++) {
      const message = await interaction.fetchReply();
      message.react(`${i}\u20e3`);
    }
  },
};
function numberToWords(number) {
  const singleDigits = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  if (number >= 0 && number <= 9) {
    return singleDigits[number];
  }
  return "Out of range";
}
