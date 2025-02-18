import { ButtonInteraction, ChatInputCommandInteraction, ComponentType, InteractionCallbackResponse } from "discord.js";
import { serverStates, RaceStatus } from "./models.js";
import { createAnimalButtons, createStartButton, createRaceEmbed } from "./utils.js";
import { startRace } from "./gameLogic.js";
import { translate } from "#translate";
import { getIcon } from "#settings";

export function handleInteractions(locale: string, interaction: ChatInputCommandInteraction<"cached">, message: InteractionCallbackResponse, guildId: string): void {
    const serverState = serverStates[guildId];
    const collector = message.resource?.message?.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30_000,
    });

    collector?.on("collect", async (i) => {
        if (i.customId === "start") {
            if (i.user.id !== interaction.user.id) return;
            
            handleStartRace(locale, i, guildId);
            collector.stop();
            return;
        }

        handlePlayerSelection(locale, i, guildId);
    });

    collector?.on("end", async () => {
        if (serverState.raceStatus === RaceStatus.NotStarted) {
            serverState.players = [];
            serverState.raceStatus = RaceStatus.NotStarted;
            serverState.messageId = undefined;

            await message.resource?.message?.edit({
                content: translate(locale, "race.errors.timeout", { clock: getIcon("clock") }),
                embeds: [],
                components: [],
            });
        }
    });
}

async function handleStartRace(locale: string, interaction: ButtonInteraction, guildId: string): Promise<void> {
    const serverState = serverStates[guildId];

    serverState.raceStatus = RaceStatus.InProgress;
    await interaction.deferUpdate();
    await startRace(locale, interaction, guildId);
}

async function handlePlayerSelection(locale: string, interaction: ButtonInteraction, guildId: string): Promise<void> {
    const serverState = serverStates[guildId];

    if (serverState.players.some((p) => p.userId === interaction.user.id)) return;

    serverState.players.push({ userId: interaction.user.id, animal: interaction.customId, position: 0 });

    const updatedEmbed = createRaceEmbed(locale, serverState.players);
    const startRow = createStartButton(locale, serverState.players);

    await interaction.update({
        embeds: [updatedEmbed],
        components: [...createAnimalButtons(serverState.players), startRow],
    });
}