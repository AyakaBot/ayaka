import { ChatInputCommandInteraction, } from "discord.js";
import { RaceStatus, serverStates } from "./models.js";
import { createAnimalButtons, createStartButton, createRaceEmbed } from "./utils.js";
import { handleInteractions } from "./interactions.js";
import { getUserLocale } from "#database";
import { translate } from "#translate";

export async function execute(interaction: ChatInputCommandInteraction<"cached">): Promise<void> {
    const { locale, guildId, user } = interaction;

    const currentLocale = (await getUserLocale(user)) ?? locale;

    if (!serverStates[guildId]) {
        serverStates[guildId] = {
            players: [],
            raceStatus: RaceStatus.NotStarted,
        };
    }

    const serverState = serverStates[guildId];

    if (serverState.raceStatus === RaceStatus.InProgress) {
        await interaction.reply({ flags, content: translate(currentLocale, "race.errors.game_started") });
        return;
    }

    const animalRows = createAnimalButtons(serverState.players);
    const startRow = createStartButton(currentLocale, serverState.players);
    const embed = createRaceEmbed(currentLocale, serverState.players);

    const message = await interaction.reply({
        withResponse,
        embeds: [embed],
        components: [...animalRows, startRow],
    });

    handleInteractions(currentLocale, interaction, message, guildId);
}