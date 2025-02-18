import { ActionRowBuilder, ChatInputCommandInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction, EmbedBuilder, ComponentType } from "discord.js";
import { getRanking, getUserLocale, RankingType } from "#database";
import { createPagination } from "../../../utils/pagination.js";
import { colors } from "#settings";
import { translate } from "#translate";

export class Rank {
    private readonly interaction: ChatInputCommandInteraction<"cached">;
    private readonly pageSize: number = 5;

    constructor(interaction: ChatInputCommandInteraction<"cached">) {
        this.interaction = interaction;
    }

    private createRow(locale: string): ActionRowBuilder<StringSelectMenuBuilder> {
        return new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("rank")
                    .addOptions([
                        {
                            label: "Pamonhas",
                            value: "pamonhas",
                            description: translate(locale, "rank.menu.pamonhas_description"),
                            emoji: "🌽"
                        },
                        {
                            label: "Termo",
                            value: "termo",
                            description: translate(locale, "rank.menu.termo_description"),
                            emoji: "📝"
                        },
                        {
                            label: "Color",
                            value: "color",
                            description: translate(locale, "rank.menu.game_color_description"),
                            emoji: "🎈"
                        }
                    ])
            );
    }

    public async showMenu() {
        const { locale, user } = this.interaction;

        const currentLocale = (await getUserLocale(user)) ?? locale;

        const row = this.createRow(currentLocale);
        const embed = new EmbedBuilder()
            .setTitle(translate(currentLocale, "rank.initial_embed.title"))
            .setDescription(translate(currentLocale, "rank.initial_embed.description"))
            .setColor(colors.default);

        const message = await this.interaction.reply({
            withResponse,
            embeds: [embed],
            components: [row],
        });

        const collector = message.resource?.message?.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60_000
        });

        collector?.on("collect", async (i: StringSelectMenuInteraction) => {
            if (i.user.id !== this.interaction.user.id) return;

            const selectedValue = i.values[0];

            let type: RankingType;
            switch (selectedValue) {
                case "pamonhas":
                    type = RankingType.Pamonhas;
                    break;
                case "termo":
                    type = RankingType.Termo;
                    break;
                case "color":
                    type = RankingType.Color;
                    break;
                default:
                    return;
            }

            const pages = await this.getRankingPages(type, currentLocale);

            const message = await i.update({
                withResponse,
                embeds: [pages[0]],
                components: [],
            });

            await createPagination(message, {
                user: i.user,
                pages,
                originalEmbed: embed,
                originalComponents: [row],
            });
        });

        collector?.on("end", async () => {
            await this.interaction.editReply({ components: [] });
        });
    }

    private async getRankingPages(type: RankingType, locale: string): Promise<EmbedBuilder[]> {
        const ranking = await getRanking(type);

        const pages: EmbedBuilder[] = [];

        for (let i = 0; i < ranking.length; i += this.pageSize) {
            const currentPageUsers = ranking.slice(i, i + this.pageSize);
            const embed = new EmbedBuilder();

            const userDescriptions = await Promise.all(currentPageUsers.map(async (user, index) => {
                const position = i + index + 1;
                const fetchedUser = await this.interaction.client.users.fetch(user.userId);

                switch (type) {
                    case RankingType.Pamonhas:
                        return `${position}. ${fetchedUser} - ${user.pamonhas} pamonhas`;
                    case RankingType.Termo:
                        return translate(locale, "rank.second_embed.termo_description", {
                            position,
                            user: fetchedUser.toString(),
                            victories: user.victories!,
                            total: user.totalGuesses!,
                            average: user.averageGuesses?.toFixed(2)!
                        });
                    case RankingType.Color:
                        return translate(locale, "rank.second_embed.game_color_description", {
                            position,
                            user: fetchedUser.toString(),
                            max: user.maxSequence!,
                            total: user.totalSequences!,
                            average: user.averageSequence?.toFixed(2)!
                        });
                }
            }));

            embed.setDescription(userDescriptions.join("\n"));

            switch (type) {
                case RankingType.Pamonhas:
                    embed.setTitle(translate(locale, "rank.second_embed.pamonhas_title"));
                    break;
                case RankingType.Termo:
                    embed.setTitle(translate(locale, "rank.second_embed.termo_title"));
                    break;
                case RankingType.Color:
                    embed.setTitle(translate(locale, "rank.second_embed.game_color_title"));
                    break;
            }

            pages.push(embed);
        }

        return pages;
    }
}