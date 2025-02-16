import { ChatInputCommandInteraction, User } from "discord.js";
import { MemoryGame } from "../MemoryGame.js";
import { translate } from "#translate";
import { getOrCreateUser, getUserLocale } from "#database";
import { GameMode } from "../models.js";

export async function executeVersus(interaction: ChatInputCommandInteraction<"cached">, opponentUser: User, bet?: number) {
    const { user, locale } = interaction;

    const userLocale = await getUserLocale(user);
    const currentLocale = userLocale ?? locale;

    if (user.id === opponentUser.id) {
        return interaction.reply({
            flags,
            content: translate(currentLocale, "memory.errors.self_play"),
        });
    }

    if (opponentUser.bot) {
        return interaction.reply({
            flags,
            content: translate(currentLocale, "memory.errors.bot"),
        });
    }

    if (bet) {
        const [userData, opponentData] = await Promise.all([
            getOrCreateUser(user.id),
            getOrCreateUser(opponentUser.id),
        ]);

        if (!userData || !userData.data.wallet || userData.data.wallet.pamonhas < bet || !opponentData || !opponentData.data.wallet || opponentData.data.wallet.pamonhas < bet) {
            return interaction.reply({
                flags,
                content: translate(currentLocale, "memory.errors.insufficient_funds"),
            });
        }
    }

    const game = new MemoryGame(interaction, user, opponentUser, currentLocale, GameMode.Versus, bet);
    await game.start();
}