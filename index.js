const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  Collection,
} = require("discord.js");
const { token, mongoUri, boostChannel } = require("./config.json");
const { MongoClient } = require("mongodb");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

const uri = mongoUri;
const mongodb = new MongoClient(uri);

client.on("guildMemberUpdate", (oldMember, newMember) => {
  const oldStatus = oldMember.premiumSince;
  const newStatus = newMember.premiumSince;

  if (!oldStatus && newStatus) {
    client.channels.cache
      .get(boostChannel)
      .send(`Thank you ${newMember} (:`);
  }

  if (oldStatus && !newStatus) {
    client.channels.cache
      .get(boostChannel)
      .send(`woah ${newMember}, unboost this server`);
  }
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  // When a reaction is received, check if the structure is partial
  if (reaction.partial) {
    // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("Something went wrong when fetching the message:", error);
      // Return as `reaction.message.author` may be undefined/null
      return;
    }
  }
  if (user.bot) return; // Ignore reactions from bots

  emoji = reaction.emoji.name; // Get the reacted emoji
  const regexExp =
    /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;
  if (!regexExp.test(emoji)) {
    emoji = `:${emoji}:`;
  }
  const messageId = reaction.message.id;

  try {
    // Connect to the database and retrieve the corresponding role documents for the emoji
    await mongodb.connect();
    const database = mongodb.db("Discord");
    const collection = database.collection("reactionRole");

    // Get all documents with the same messageId and emoji
    const regex = new RegExp(emoji);
    const docs = await collection.findOne({
      messageId,
      emoji: { $regex: regex },
    });
    if (docs) {
      const guild = reaction.message.guild;
      const member = guild.members.cache.get(user.id);
      const amountCollection = database.collection("amount");
      if (member) {
        const maxReactions = docs.max;
        const role = docs.role;

        const amountDocument = await amountCollection.findOne({
          messageId,
          user: user.id,
        });
        const currentValue = amountDocument ? amountDocument.value : 0;
        const amountDoc = await amountCollection.findOneAndUpdate(
          { messageId, user: user.id },
          { $inc: { value: 1 } }, // Increment the value by 1 or create the document if it doesn't exist
          { upsert: true } // Create a new document if not found
        );
        if (currentValue >= maxReactions) {
          user.send(
            `You have selected the maximum allowed roles for ${messageId} (${maxReactions})`
          );
          try {
            // Fetch all reactions on the message
            const message = reaction.message;
            const allReactions = message.reactions.cache;

            // Iterate through all reactions and users
            for (const [emoji, reactionInstance] of allReactions) {
              const users = await reactionInstance.users.fetch();

              // Check if it's not the current user's reaction
              if (emoji == reaction.emoji.name) {
                // Remove the current user's reaction from other users
                if (users.has(user.id)) {
                  reactionInstance.users.remove(user.id);
                }
              }
            }
          } catch (error) {
            console.error("Error removing reactions:", error);
          }
          return;
        }

        // Check if the user has the role
        if (!member.roles.cache.has(role)) {
          // If not, give them the role
          member.roles.add(role).catch(console.error);
        }

        // Check if the document has "only" set to true
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongodb.close();
  }
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
  // When a reaction is received, check if the structure is partial
  if (reaction.partial) {
    // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("Something went wrong when fetching the message:", error);
      // Return as `reaction.message.author` may be undefined/null
      return;
    }
  }
  if (user.bot) return; // Ignore reactions from bots

  emoji = reaction.emoji.name; // Get the reacted emoji
  const regexExp =
    /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;
  if (!regexExp.test(emoji)) {
    emoji = `:${emoji}:`;
  }
  const messageId = reaction.message.id;

  try {
    // Connect to the database and retrieve the corresponding role for the emoji
    await mongodb.connect();
    const database = mongodb.db("Discord");
    const collection = database.collection("reactionRole");
    const amountCollection = database.collection("amount");
    const regex = new RegExp(emoji);
    const doc = await collection.findOne({
      messageId,
      emoji: { $regex: regex },
    });
    if (doc) {
      const role = doc.role;
      const guild = reaction.message.guild;
      const member = guild.members.cache.get(user.id);

      if (member) {
        // Check if the user has the role

        member.roles.remove(role).catch(console.error);
        const amountDoc = await amountCollection.findOneAndUpdate(
          { messageId, user: user.id },
          { $inc: { value: -1 } }, // Increment the value by 1 or create the document if it doesn't exist
          { upsert: true } // Create a new document if not found
        );
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongodb.close();
  }
});

async function getMuteRole(guildId) {
  const mongodb = new MongoClient(mongoUri);

  try {
    await mongodb.connect();
    const db = mongodb.db("Discord");
    const collection = db.collection("muteRoles");

    const muteRoleDocument = await collection.findOne({ guildId: guildId });

    if (muteRoleDocument) {
      return muteRoleDocument.muteRoleName;
    }

    return null;
  } finally {
    await mongodb.close();
  }
}
async function unmuteUser(guildId, userId) {
  const guild = client.guilds.cache.get(guildId);

  if (!guild) {
    return;
  }

  const member = await guild.members.fetch(userId);
  if (!member) {
    return;
  }
  const muteRoleName = await getMuteRole(guildId);
  const mutedRole = guild.roles.cache.find(
    (role) => role.name === muteRoleName
  );
  if (mutedRole) {
    await member.roles.remove(mutedRole);
  }
}

async function checkUnmuteTime() {
  const now = Date.now();
  const mongodb = new MongoClient(mongoUri);

  try {
    await mongodb.connect();
    const db = mongodb.db("Discord");
    const collection = db.collection("muted");

    const cursor = collection.find({ unmuteTime: { $lte: now } });
    const entries = await cursor.toArray();

    for (const entry of entries) {
      await unmuteUser(entry.guildId, entry.userId);
      await collection.deleteOne({ _id: entry._id });
    }
  } finally {
    await mongodb.close();
  }
}
setInterval(checkUnmuteTime, 1000);

// Log in to Discord
client.login(token);
//require('http').createServer((req, res) => res.end('Bot is alive!')).listen(3000)
