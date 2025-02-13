import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType, EmbedBuilder } from "discord.js";
import { getRandomEmojis } from "./emojis.js";
import { colors, getIcon } from "#settings";
import { getUserLocale } from "#database";
import { translate } from "#translete";

export async function executeSolo(interaction: ChatInputCommandInteraction<"cached">) {
    const { user, locale } = interaction;

    const userLocale = await getUserLocale(user);

    const currentLocale = userLocale ?? locale;

    const gridSize = 4;
    const totalPairs = (gridSize * gridSize) / 2;
    const emojis = getRandomEmojis(totalPairs);

    const cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);

    let revealedCards: number[] = [];
    let matchedPairs: number[] = [];
    let attempts = 0;

    const createGrid = (): ActionRowBuilder<ButtonBuilder>[] => {
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

    const isGameOver = (): boolean => matchedPairs.length === cards.length;

    const embed = new EmbedBuilder()
        .setDescription(translate(currentLocale, "memory.alone.embed.description_init_game"))
        .setColor(colors.default);

    const message = await interaction.reply({
        withResponse,
        embeds: [embed],
        components: createGrid(),
    });

    const collector = message.resource?.message?.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300_000,
    });

    collector?.on("collect", async (i) => {
        if (i.user.id !== user.id) return;

        const index = parseInt(i.customId);
        revealedCards.push(index);

        if (revealedCards.length === 2) {
            attempts++;

            const [firstIndex, secondIndex] = revealedCards;

            if (cards[firstIndex] === cards[secondIndex]) {
                matchedPairs.push(firstIndex, secondIndex);
                revealedCards = [];

                if (isGameOver()) {
                    collector.stop();
                    await i.update({
                        embeds: [embed.setDescription(
                            translate(currentLocale, "memory.alone.embed.description_finish_game", { attempts })
                        )],
                        components: [],
                    });
                    return;
                }
            } else {
                await i.update({ components: createGrid() });
                await new Promise((resolve) => setTimeout(resolve, 1000));
                revealedCards = [];
                await i.editReply({ components: createGrid() });
                return;
            }
        }

        await i.update({ components: createGrid() });
    });

    collector?.on("end", async () => {
        if (!isGameOver()) {
            await message.resource?.message?.edit({
                embeds: [embed.setDescription(
                    translate(currentLocale, "memory.alone.timeout", {
                        clock: getIcon("clock")
                    })
                )],
                components: [],
            });
        }
    });
}