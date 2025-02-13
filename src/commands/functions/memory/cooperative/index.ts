import { ChatInputCommandInteraction, User, ComponentType } from "discord.js";
import { getRandomEmojis } from "../emojis.js";
import { GameConfig, GameState } from "./types.js";
import { updateEmbed, createGrid, isGameOver } from "./utils.js";
import { getUserLocale } from "#database";
import { translate } from "#translete";

export async function executeCooperative(interaction: ChatInputCommandInteraction<"cached">, friendUser: User) {
    const { user, client, locale } = interaction;

    const userLocale = await getUserLocale(user);
    const currentLocale = userLocale ?? locale;

    const friend = await client.users.fetch(friendUser.id);

    if (user.id === friendUser.id) {
        return interaction.reply({
            flags,
            content: translate(currentLocale, "memory.cooperative.errors.self_play"),
        });
    }

    if (friend.bot) {
        return interaction.reply({
            flags,
            content: translate(currentLocale, "memory.cooperative.errors.bot")
        });
    }

    const gridSize = 4;
    const totalPairs = (gridSize * gridSize) / 2;
    const emojis = getRandomEmojis(totalPairs);

    const cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);

    const gameConfig: GameConfig = {
        gridSize,
        totalPairs,
        emojis,
        cards,
    };

    const gameState: GameState = {
        revealedCards: [],
        matchedPairs: [],
        attempts: 0,
        currentPlayer: user,
        playerScores: {
            [user.id]: 0,
            [friend.id]: 0,
        },
    };

    const message = await interaction.reply({
        withResponse,
        embeds: [updateEmbed(currentLocale, user, friend, gameState)],
        components: createGrid(gameConfig, gameState),
    });

    const collector = message.resource?.message?.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300_000,
    });

    collector?.on("collect", async (i) => {
        if (i.user.id !== user.id && i.user.id !== friend.id) return;
        if (i.user.id !== gameState.currentPlayer.id) return;

        const index = parseInt(i.customId);
        gameState.revealedCards.push(index);

        if (gameState.revealedCards.length === 2) {
            gameState.attempts++;

            const [firstIndex, secondIndex] = gameState.revealedCards;

            if (gameConfig.cards[firstIndex] === gameConfig.cards[secondIndex]) {
                gameState.matchedPairs.push(firstIndex, secondIndex);
                gameState.playerScores[gameState.currentPlayer.id]++;
                gameState.revealedCards = [];

                if (isGameOver(gameConfig, gameState)) {
                    collector.stop();
                    await i.update({
                        embeds: [updateEmbed(currentLocale, user, friend, gameState).setDescription(
                            translate(currentLocale, "memory.cooperative.embed.description_finish_game", {
                                user: user.toString(),
                                friend: friend.toString(),
                                attempts: gameState.attempts,
                                author: user.toString(),
                                authorScore: gameState.playerScores[user.id],
                                friendFinal: friend.toString(),
                                friendScore: gameState.playerScores[friend.id]
                            })
                        )],
                        components: [],
                    });
                    return;
                }

                await i.update({
                    embeds: [updateEmbed(currentLocale, user, friend, gameState).setDescription(
                        translate(currentLocale, "memory.cooperative.embed.description_turn", {
                            currentPlayer: gameState.currentPlayer.toString(),
                            author: user.toString(),
                            authorScore: gameState.playerScores[user.id],
                            friend: friend.toString(),
                            friendScore: gameState.playerScores[friend.id]
                        })
                    )],
                    components: createGrid(gameConfig, gameState),
                });
            } else {
                await i.update({ components: createGrid(gameConfig, gameState) });
                await new Promise((resolve) => setTimeout(resolve, 1000));
                gameState.revealedCards = [];
                gameState.currentPlayer = gameState.currentPlayer.id === user.id ? friend : user;

                await message.resource?.message?.edit({
                    embeds: [updateEmbed(currentLocale, user, friend, gameState)],
                    components: createGrid(gameConfig, gameState),
                });
            }
        } else {
            await i.update({ components: createGrid(gameConfig, gameState) });
        }
    });

    collector?.on("end", async () => {
        if (!isGameOver(gameConfig, gameState)) {
            await message.resource?.message?.edit({
                embeds: [updateEmbed(currentLocale, user, friend, gameState).setDescription(
                    translate(currentLocale, "memory.cooperative.embed.description_timeout", {
                        author: user.toString(),
                        authorScore: gameState.playerScores[user.id],
                        friend: friend.toString(),
                        friendScore: gameState.playerScores[friend.id]
                    })
                )],
                components: [],
            });
        }
    });
}