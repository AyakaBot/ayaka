import { ChatInputCommandInteraction, User } from "discord.js";
import { getUserLocale } from "#database";
import { translate } from "#translate";
import { MemoryGame } from "../MemoryGame.js";
import { GameMode } from "../types/memory.js";

export async function executeCooperative(interaction: ChatInputCommandInteraction<"cached">, friendUser: User) {
    const { user, client, locale } = interaction;
    const userLocale = await getUserLocale(user);
    const currentLocale = userLocale ?? locale;

    const friend = await client.users.fetch(friendUser.id);

    if (user.id === friend.id) {
        return interaction.reply({
            flags,
            content: translate(currentLocale, "memory.errors.self_play"),
        });
    }

    if (friend.bot) {
        return interaction.reply({
            flags,
            content: translate(currentLocale, "memory.errors.bot"),
        });
    }

    const game = new MemoryGame(interaction, user, friend, currentLocale, GameMode.Cooperative);

    game.start();
}
