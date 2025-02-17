import { icon } from "#settings";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, InteractionCallbackResponse, User } from "discord.js";

export enum PaginationButtonIds {
    Previous = "previous",
    Next = "next",
    Close = "close",
    Home = "home",
    Back = "back",
}

export interface PaginationOptions {
    user: User;
    pages: EmbedBuilder[];
    initialPage?: number;
    timeout?: number;
    originalEmbed?: EmbedBuilder;
    originalComponents?: ActionRowBuilder<any>[];
}

export async function createPagination(response: InteractionCallbackResponse, options: PaginationOptions) {
    const { user, pages, initialPage = 1, timeout = 60_000, originalEmbed, originalComponents } = options;
    let currentPage = initialPage;

    const createNavigationButtons = (): ActionRowBuilder<ButtonBuilder> => {
        const buttons = [
            new ButtonBuilder()
                .setCustomId(PaginationButtonIds.Previous)
                .setEmoji(icon.arrowLeft)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 1),
            new ButtonBuilder()
                .setCustomId(PaginationButtonIds.Home)
                .setEmoji(icon.home)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 1),
            new ButtonBuilder()
                .setCustomId(PaginationButtonIds.Next)
                .setEmoji(icon.arrowRight)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === pages.length),
            new ButtonBuilder()
                .setCustomId(PaginationButtonIds.Close)
                .setEmoji(icon.trash)
                .setStyle(ButtonStyle.Danger)
        ];

        if (originalEmbed && originalComponents) {
            buttons.push(
                new ButtonBuilder()
                    .setCustomId(PaginationButtonIds.Back)
                    .setEmoji(icon.arrowRefresh)
                    .setStyle(ButtonStyle.Secondary)
            );
        }

        return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
    };

    const updateMessage = async () => {
        try {
            await response.resource?.message?.edit({
                embeds: [pages[currentPage - 1]],
                components: [createNavigationButtons()],
            });
        } catch (error) {
            console.error(error);
        }
    };

    await updateMessage();

    const collector = response.resource?.message?.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: timeout,
    });

    collector?.on("collect", async (i) => {
        if (i.user.id !== user.id) return;

        let pageChanged = false;
        try {
            switch (i.customId) {
                case PaginationButtonIds.Previous:
                    if (currentPage > 1) {
                        currentPage--;
                        pageChanged = true;
                    }
                    break;
                case PaginationButtonIds.Home:
                    if (currentPage !== 1) {
                        currentPage = 1;
                        pageChanged = true;
                    }
                    break;
                case PaginationButtonIds.Next:
                    if (currentPage < pages.length) {
                        currentPage++;
                        pageChanged = true;
                    }
                    break;
                case PaginationButtonIds.Close:
                    await i.update({ components: [] });
                    collector.stop();
                    return;
                case PaginationButtonIds.Back:
                    if (originalEmbed && originalComponents) {
                        await i.update({
                            embeds: [originalEmbed],
                            components: originalComponents,
                        });
                        collector.stop();
                        return;
                    }
                    break;
            }

            if (pageChanged) {
                await i.update({
                    embeds: [pages[currentPage - 1]],
                    components: [createNavigationButtons()],
                });
            } else {
                await i.deferUpdate();
            }
        } catch (error) {
            console.error(error);
        }
    });

    collector?.on("end", () => {
        try {
            if (!originalEmbed || !originalComponents) {
                response.resource?.message?.edit({ components: [] }).catch(() => { });
            }
        } catch (error) {
            console.error(error);
        }
    });
}
