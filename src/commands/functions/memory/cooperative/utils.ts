import { ActionRowBuilder, ButtonBuilder, ButtonStyle, User, EmbedBuilder } from "discord.js";
import { GameConfig, GameState } from "./types.js";
import { colors } from "#settings";
import { translate } from "#translate";

export const createGrid = (config: GameConfig, state: GameState): ActionRowBuilder<ButtonBuilder>[] => {
    const { gridSize, cards } = config;
    const { revealedCards, matchedPairs } = state;

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];

    for (let i = 0; i < gridSize; i++) {
        const row = new ActionRowBuilder<ButtonBuilder>();

        for (let j = 0; j < gridSize; j++) {
            const index = i * gridSize + j;
            const isRevealed = revealedCards.includes(index);
            const isMatched = matchedPairs.includes(index);

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(index.toString())
                    .setLabel(isRevealed || isMatched ? cards[index] : "❓")
                    .setStyle(isMatched ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(isMatched)
            );
        }

        rows.push(row);
    }

    return rows;
};

export const updateEmbed = (locale: string, user: User, friend: User, state: GameState): EmbedBuilder => {
    const { currentPlayer, playerScores } = state;

    return new EmbedBuilder()
        .setDescription(
            translate(locale, "memory.cooperative.embed.description_init_game", {
                currentPlayer: currentPlayer.toString(),
                author: user.toString(), authorScore: playerScores[user.id],
                friend: friend.toString(), friendScore: playerScores[friend.id]
            })
        )
        .setColor(colors.default);
};

export const isGameOver = (config: GameConfig, state: GameState): boolean => {
    return state.matchedPairs.length === config.cards.length;
};