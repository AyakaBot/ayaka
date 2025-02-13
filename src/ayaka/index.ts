import { dirname, importx } from "@discordx/importer";
import { ActivityType, Interaction, Message, TextChannel } from "discord.js";
import { IntentsBitField } from "discord.js";
import { Client } from "discordx";
import "#database";
import "#settings";
import "#translete";

export const bot = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.MessageContent,
    ],

    // simpleCommand: {
    //     prefix: []
    // },
    silent: true,
    botGuilds: [process.env.DEV_GUILD, "1301901686226419843"],
    presence: {
        activities: [{
            name: "with your heart",
            type: ActivityType.Playing
        }]
    }
});

bot.once("ready", () => {
    void bot.initApplicationCommands();
});

bot.on("interactionCreate", async (interaction: Interaction) => {
    try {
        await bot.executeInteraction(interaction);
    } catch (error) {
        console.error("Error handling interaction:", error);
        const channelId = interaction.channel?.id;
        const channel = await interaction.guild?.channels.fetch(channelId!) as TextChannel;

        channel.send({ content: `Error handling interaction: ${error}` });
    }
});

// bot.on("messageCreate", (message: Message) => {
//   void bot.executeCommand(message);
// });

export async function run() {
    const path = `${dirname(import.meta.url)}/../{events,commands}/**/*.{ts,js}`;
    await importx(path);

    await bot.login(process.env.BOT_TOKEN);
}