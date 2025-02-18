import { ChatInputCommandInteraction } from "discord.js";
import { MemoryGame } from "../MemoryGame.js";
import { getUserLocale } from "#database";
import { GameMode } from "../models.js";

export async function executeAlone(interaction: ChatInputCommandInteraction<"cached">) {
    const { user, locale } = interaction;
    const currentLocale = (await getUserLocale(user)) ?? locale;

    const game = new MemoryGame(interaction, user, null, currentLocale, GameMode.Solo);
    game.start();
}
