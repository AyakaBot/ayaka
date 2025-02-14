import { icon } from "#settings";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    InteractionCallbackResponse,
    User
} from "discord.js";

export enum PaginationButtonIds {
    Previous = "previous",
    Next = "next",
    Close = "close",
    Home = "home" 
}

export interface PaginationOptions {
    user: User;
    pages: EmbedBuilder[];
    initialPage?: number;
    timeout?: number;
}

export async function createPagination(message: InteractionCallbackResponse, options: PaginationOptions) {
    const { user, pages, initialPage = 1, timeout = 60_000 } = options;
    let currentPage = initialPage;

    const createNavigationButtons = (): ActionRowBuilder<ButtonBuilder> => {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
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
        );
    };

    const response = await message.resource?.message?.edit({
        embeds: [pages[currentPage - 1]],
        components: [createNavigationButtons()],
    });

    const collector = response?.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: timeout,
    });

    collector?.on("collect", async (i) => {
        if (i.user.id !== user.id) return; 

        switch (i.customId) {
            case PaginationButtonIds.Previous:
                currentPage--;
                break;
            case PaginationButtonIds.Home:
                currentPage = 1;
                break;
            case PaginationButtonIds.Next:
                currentPage++; 
                break;
            case PaginationButtonIds.Close:
                await i.update({ components: [] });
                collector.stop(); 
                return;
        }

        await i.update({
            embeds: [pages[currentPage - 1]],
            components: [createNavigationButtons()],
        });
    });

    collector?.on("end", () => {
        response?.edit({ components: [] }).catch(() => { });
    });
}
