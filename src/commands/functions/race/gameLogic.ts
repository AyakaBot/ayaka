import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Player, RaceStatus, ServerState, serverStates } from "./models.js";
import { raceTrack, raceTrackSize } from "./utils.js";
import { translate } from "#translate";
import { colors } from "#settings";

export async function startRace(locale: string, interaction: ButtonInteraction, guildId: string): Promise<void> {
    const serverState = serverStates[guildId];

    const raceTrackEmbed = new EmbedBuilder()
        .setTitle(translate(locale, "race.second_embed.title"))
        .setDescription(translate(locale, "race.second_embed.description"))
        .setColor(colors.developer)

    const interval = setInterval(async () => {
        updatePlayerPositions(serverState);

        const updatedRaceTrackEmbed = updateRaceEmbedWithPositions(locale, raceTrackEmbed, serverState.players);
        const updatedRaceTrackButtons = updateRaceTrack(serverState.players);

        await interaction.editReply({
            embeds: [updatedRaceTrackEmbed],
            components: updatedRaceTrackButtons,
        });

        const winner = checkForWinner(serverState.players);
        if (winner) {
            clearInterval(interval);
            await endRace(locale, interaction, raceTrackEmbed, winner, guildId);
        }
    }, 800);
}

function updatePlayerPositions(serverState: ServerState): void {
    serverState.players = serverState.players.map((player) => {
        const newPosition = Math.min(
            player.position + Math.floor(Math.random() * 2),
            raceTrackSize * raceTrackSize - 1
        );
        return { ...player, position: newPosition };
    });
}

function updateRaceEmbedWithPositions(locale: string, raceTrackEmbed: EmbedBuilder, players: Player[]): EmbedBuilder {
    const sortedPlayers = [...players].sort((a, b) => b.position - a.position);
    const playerPositions = sortedPlayers
        .map((player, index) => `${index + 1} - ${player.animal} <@${player.userId}>`)
        .join("\n");

    return raceTrackEmbed.setFields({
        name: translate(locale, "race.field_name"),
        value: playerPositions || translate(locale, "race.field_value"),
    });
}

function updateRaceTrack(players: Player[]): ActionRowBuilder<ButtonBuilder>[] {
    return raceTrack.map((row, rowIndex) => {
        const buttons = row.map((cell, colIndex) => {
            if (cell === "🏁") {
                return new ButtonBuilder()
                    .setCustomId(`cell-${rowIndex}-${colIndex}`)
                    .setLabel(cell)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true);
            }

            const player = players.find((p) => p.position === rowIndex * raceTrackSize + colIndex);
            return new ButtonBuilder()
                .setCustomId(`cell-${rowIndex}-${colIndex}`)
                .setLabel(player ? player.animal : cell)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);
        });
        return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
    });
}

function checkForWinner(players: Player[]): Player | undefined {
    return players.find((p) => p.position >= raceTrackSize * raceTrackSize - 1);
}

async function endRace(locale: string, interaction: ButtonInteraction, raceTrackEmbed: EmbedBuilder, winner: Player, guildId: string): Promise<void> {
    const serverState = serverStates[guildId];
    serverState.raceStatus = RaceStatus.Finished;

    const winnerButtons = updateRaceTrackWithWinner(winner.userId, serverState.players);

    await interaction.editReply({
        embeds: [raceTrackEmbed.setDescription(translate(locale, "race.win", { userId: winner.userId, animal: winner.animal })).setColor(colors.success)],
        components: winnerButtons,
    });

    serverState.players = [];
    serverState.raceStatus = RaceStatus.NotStarted;
}

function updateRaceTrackWithWinner(winnerId: string, players: Player[]): ActionRowBuilder<ButtonBuilder>[] {
    return raceTrack.map((row, rowIndex) => {
        const buttons = row.map((cell, colIndex) => {
            const player = players.find((p) => p.position === rowIndex * raceTrackSize + colIndex);

            if (player) {
                const isWinner = player.userId === winnerId;

                return new ButtonBuilder()
                    .setCustomId(`cell-${rowIndex}-${colIndex}`)
                    .setLabel(player.animal)
                    .setStyle(isWinner ? ButtonStyle.Success : ButtonStyle.Danger)
                    .setDisabled(true);
            }

            return new ButtonBuilder()
                .setCustomId(`cell-${rowIndex}-${colIndex}`)
                .setLabel(cell)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);
        });

        return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
    });
}