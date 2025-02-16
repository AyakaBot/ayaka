import { ActionRowBuilder, ButtonBuilder, ButtonStyle, User, EmbedBuilder } from "discord.js";
import { GameConfig, GameState } from "./types/memory.js";
import { colors, getIcon } from "#settings";
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
                    .setLabel(isRevealed || isMatched ? cards[index] : charInvisible)
                    .setStyle(isMatched ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(isMatched)
            );
        }

        rows.push(row);
    }

    return rows;
};

export const createEmbed = (
    locale: string,
    user: User,
    state: GameState,
    options: {
        mode: "versus" | "cooperative" | "solo";
        opponent?: User;
        bet?: number;
    }
): EmbedBuilder => {
    const { currentPlayer, playerScores } = state;
    const { mode, opponent, bet } = options;

    let description: string;

    switch (mode) {
        case "versus":
            description = translate(locale, "memory.versus.embed.description_init_game", {
                crownEmoji: getIcon("crown"),
                currentPlayer: currentPlayer.toString(),
                authorEmoji: getIcon("user"),
                author: user.toString(),
                authorScore: playerScores[user.id],
                opponentEmoji: getIcon("user"),
                opponent: opponent!.toString(),
                opponentScore: playerScores[opponent!.id],
                betEmoji: getIcon("dolar"),
                bet: bet ? bet.toString() : "0",
            });
            break;

        case "cooperative":
            description = translate(locale, "memory.cooperative.embed.description_init_game", {
                crownEmoji: getIcon("crown"),
                currentPlayer: currentPlayer.toString(),
                authorEmoji: getIcon("user"),
                author: user.toString(),
                authorScore: playerScores[user.id],
                friendEmoji: getIcon("user"),
                friend: opponent!.toString(),
                friendScore: playerScores[opponent!.id],
            });
            break;

        case "solo":
            description = translate(locale, "memory.alone.embed.description_init_game", {
                user: user.toString(),
                score: playerScores[user.id],
            });
            break;
    }

    return new EmbedBuilder()
        .setDescription(description)
        .setColor(colors.default);
};

export const isGameOver = (config: GameConfig, state: GameState): boolean => {
    return state.matchedPairs.length === config.cards.length;
};