import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { Player } from "./models.js";
import { translate } from "#translate";
import { colors } from "#settings";

export const animals: readonly string[] = ["🐎", "🐕", "🐧", "🐆"];

export const raceTrackSize = 5;
export const raceTrack: string[][] = Array.from({ length: raceTrackSize }, () => Array(raceTrackSize).fill(charInvisible));

raceTrack[0][0] = "🏁";
raceTrack[raceTrackSize - 1][raceTrackSize - 1] = "🏁";

export function createAnimalButtons(players: Player[]): ActionRowBuilder<ButtonBuilder>[] {
    const animalButtons = animals.map((animal) => {
        const isAnimalTaken = players.some((p) => p.animal === animal);
        return new ButtonBuilder()
            .setCustomId(animal)
            .setLabel(animal)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(isAnimalTaken);
    });

    const animalRows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < animalButtons.length; i += 5) {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(animalButtons.slice(i, i + 5));
        animalRows.push(row);
    }

    return animalRows;
}

export function createStartButton(locale: string, players: Player[]): ActionRowBuilder<ButtonBuilder> {
    const startButton = new ButtonBuilder()
        .setCustomId("start")
        .setLabel(translate(locale, "race.buttons.start"))
        .setStyle(ButtonStyle.Success)
        .setDisabled(players.length < 2);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(startButton);
}

export function createRaceEmbed(locale: string, players: Player[]): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle(translate(locale, "race.initial_embed.title"))
        .setDescription(translate(locale, "race.initial_embed.description"))
        .setColor(colors.developer)
        .addFields({
            name: translate(locale, "race.field_name"),
            value: players.length > 0
                ? players.map((p) => `${p.animal} <@${p.userId}>`).join("\n")
                : translate(locale, "race.field_value"),
        });
}