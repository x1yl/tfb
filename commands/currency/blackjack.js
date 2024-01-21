const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  category: "currency",
  data: new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription("Gamble with blackjack")
    .addIntegerOption((option) =>
      option.setName("bet").setDescription("Amount to gamble").setRequired(true)
    ),
  async execute(interaction) {
    const betAmount = interaction.options.getInteger("bet");
    if (!betAmount || betAmount <= 0) {
      return interaction.reply(
        "Invalid bet amount. Please enter a positive value."
      );
    }

    startGame(interaction, betAmount);
  },
};

const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
const values = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

function createDeck() {
  const deck = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value });
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function calculateHandValue(hand) {
  let sum = 0;
  let hasAce = false;

  for (let card of hand) {
    if (card.value === "A") {
      hasAce = true;
    }
    sum += getCardValue(card.value);
  }

  if (hasAce && sum + 10 <= 21) {
    sum += 10;
  }

  return sum;
}

function getCardValue(cardValue) {
  if (cardValue === "K" || cardValue === "Q" || cardValue === "J") {
    return 10;
  } else if (cardValue === "A") {
    return 1;
  } else {
    return parseInt(cardValue);
  }
}

function dealCard(deck, hand) {
  const card = deck.pop();
  hand.push(card);
}

async function startGame(interaction, betAmount) {
  const deck = createDeck();
  shuffleDeck(deck);

  const playerHand = [];
  const dealerHand = [];

  dealCard(deck, playerHand);
  dealCard(deck, dealerHand);
  dealCard(deck, playerHand);
  dealCard(deck, dealerHand);

  // Display initial hands
  const playerHandString = playerHand
    .map((card) => getCardEmoji(card))
    .join(" ");
  const dealerHandString = `${getCardEmoji(dealerHand[0])} Hidden Card`;

  const initialEmbed = {
    author: {
      name: `${interaction.user.tag}`,
      iconURL: `${interaction.user.displayAvatarURL()}`,
    },
    description: `Game started with a bet of ${betAmount}!`,
    fields: [
      {
        name: "Your Hand",
        value: `${playerHandString}\n\nValue: ${calculateHandValue(
          playerHand
        )}`,
        inline: true,
      },
      {
        name: "Dealers Hand",
        value: dealerHandString,
        inline: true,
      },
    ],
    color: parseInt("00b0f4", 16),
  };

  const message = await interaction.reply({
    embeds: [initialEmbed],
    fetchReply: true,
  });
  const checkEmoji = "✅";
  const xEmoji = "❌";

  // Player's turn
  while (calculateHandValue(playerHand) < 21) {
    await message.react(checkEmoji);
    await message.react(xEmoji);

    const filter = (reaction, user) =>
      [checkEmoji, xEmoji].includes(reaction.emoji.name) &&
      user.id === interaction.user.id;
    const collected = await message.awaitReactions({
      filter,
      max: 1,
      time: 30000,
      errors: ["time"],
    });

    if (collected.first().emoji.name === checkEmoji) {
      dealCard(deck, playerHand);
      const updatedPlayerHandString = playerHand
        .map((card) => getCardEmoji(card))
        .join(" ");
      const playerTurnEmbed = {
        author: {
          name: `${interaction.user.tag}`,
          iconURL: `${interaction.user.displayAvatarURL()}`,
        },
        description: "Player's turn...",
        fields: [
          {
            name: "Your Hand",
            value: `${updatedPlayerHandString}\nValue: ${calculateHandValue(
              playerHand
            )}`,
            inline: true,
          },
          {
            name: "Dealers Hand",
            value: dealerHandString,
            inline: true,
          },
        ],
        color: parseInt("00b0f4", 16),
      };
      await interaction.editReply({ embeds: [playerTurnEmbed] });

      const userReaction = message.reactions.cache.find((reaction) =>
        reaction.users.cache.has(interaction.user.id)
      );
      if (userReaction) {
        setTimeout(() => {
          userReaction.users
            .remove(interaction.user.id)
            .catch((error) =>
              console.error("Failed to remove user reaction:", error)
            );
        }, 1000);
      }
    } else {
      break;
    }
  }

  // Dealer's turn
  while (calculateHandValue(dealerHand) < 17) {
    dealCard(deck, dealerHand);
  }

  // Display final hands
  const finalPlayerHandString = playerHand
    .map((card) => getCardEmoji(card))
    .join(" ");
  const finalDealerHandString = dealerHand
    .map((card) => getCardEmoji(card))
    .join(" ");

  const finalEmbed = {
    author: {
      name: `${interaction.user.tag}`,
      iconURL: `${interaction.user.displayAvatarURL()}`,
    },
    description: "Game over!",
    fields: [
      {
        name: "Your Hand",
        value: `${finalPlayerHandString}\n\nValue: ${calculateHandValue(
          playerHand
        )}`,
        inline: true,
      },
      {
        name: "Dealers Hand",
        value: `${finalDealerHandString}\n\nValue: ${calculateHandValue(
          dealerHand
        )}`,
        inline: true,
      },
    ],
    color: parseInt("00b0f4", 16),
  };

  await interaction.editReply({ embeds: [finalEmbed] });

  // Determine the winner
  const playerValue = calculateHandValue(playerHand);
  const dealerValue = calculateHandValue(dealerHand);

  let resultMessage = "";
  if (playerValue > 21 || (dealerValue <= 21 && dealerValue >= playerValue)) {
    resultMessage = `Dealer wins! -${betAmount}`;
  } else if (playerValue === dealerValue) {
    resultMessage = `Tie! +${betAmount/2}`;
  } else {
    resultMessage = `Player wins! +${betAmount}`;
  }

  // Update the final embed with the result
  finalEmbed.description = `Result: ${resultMessage}`;
  await interaction.editReply({ embeds: [finalEmbed] });
}

function getCardEmoji(card) {
  const suitsEmoji = {
    Hearts: "♥️",
    Diamonds: "♦️",
    Clubs: "♣️",
    Spades: "♠️",
  };

  return `${card.value}${suitsEmoji[card.suit]}`;
}
