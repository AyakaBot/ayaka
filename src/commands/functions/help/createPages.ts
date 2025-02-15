import { EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import { CommandCategory, getCommandCategories } from "./categories.js";
import { colors } from "#settings";
import { translate } from "#translate";

export const createHelpPages = (locale: string, interaction: ChatInputCommandInteraction<"cached">): EmbedBuilder[] => {
    const { client, user } = interaction;
    const commandCategories: CommandCategory[] = getCommandCategories(locale);

    const initialPage = new EmbedBuilder()
        .setTitle(translate(locale, "help.embed.title"))
        .setDescription(translate(locale, "help.embed.description", { username: user.username }))
        .addFields({
            name: translate(locale, "help.embed.commands"),
            value: translate(locale, "help.embed.instructions"),
            inline: true,
        })
        .setColor(colors.fuchsia)
        .setThumbnail(client.user?.displayAvatarURL())
        .setFooter({
            text: translate(locale, "help.embed.footer", {
                page: 1,
                totalPages: commandCategories.length + 1,
            }),
        });

    const commandPages = commandCategories.map((category, index) =>
        new EmbedBuilder()
            .setTitle(translate(locale, "help.embed.categoryTitle", { category: category.name }))
            .setDescription(
                category.commands
                    .map((cmd) => `**/${cmd.name}**: ${cmd.description}`)
                    .join("\n")
            )
            .setColor(colors.default)
            .setFooter({
                text: translate(locale, "help.embed.footer", {
                    page: index + 2,
                    totalPages: commandCategories.length + 1,
                }),
            })
    );

    return [initialPage, ...commandPages];
};
