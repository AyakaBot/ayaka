import { getUserLocale } from "#database";
import { colors, icon } from "#settings";
import { translate } from "#translete";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder
} from "discord.js";

enum ButtonIds {
    Previous = "previous",
    Next = "next",
    Close = "close"
}

type Command = {
    name: string;
    description: string;
};

type CommandCategory = {
    name: string;
    commands: Command[];
};

const getCommandCategories = (locale: string): CommandCategory[] => [
    {
        name: translate(locale, "help.commands.general.title"),
        commands: [
            { name: translate(locale, "commands.help.name"), description: translate(locale, "commands.help.description") },
            { name: translate(locale, "commands.ping.name"), description: translate(locale, "commands.ping.description") },
            { name: translate(locale, "commands.language.name"), description: translate(locale, "commands.language.description") },
        ],
    },
    {
        name: translate(locale, "help.commands.economy.title"),
        commands: [
            { name: translate(locale, "commands.wallet.name"), description: translate(locale, "commands.wallet.description") },
            { name: translate(locale, "commands.pay.name"), description: translate(locale, "commands.pay.description") },
            { name: translate(locale, "commands.rewards.name"), description: translate(locale, "commands.rewards.description") },
        ],
    },
];

const createHelpEmbed = (page: number, locale: string, interaction: ChatInputCommandInteraction<"cached">): EmbedBuilder => {
    const { client, user } = interaction;
    const commandCategories = getCommandCategories(locale);
    const totalPages = commandCategories.length + 1;

    if (page === 1) {
        return new EmbedBuilder()
            .setTitle(translate(locale, "help.embed.title"))
            .setDescription(translate(locale, "help.embed.description", { username: user.username }))
            .addFields(
                { name: translate(locale, "help.embed.commands"), value: translate(locale, "help.embed.instructions"), inline: true }
            )
            .setColor(colors.fuchsia)
            .setThumbnail(client.user?.displayAvatarURL())
            .setFooter({ text: translate(locale, "help.embed.footer", { page: 1, totalPages }) });
    }

    const category = commandCategories[page - 2];
    return new EmbedBuilder()
        .setTitle(translate(locale, "help.embed.categoryTitle", { category: category.name }))
        .setDescription(category.commands.map(cmd => `**/${cmd.name}**: ${cmd.description}`).join("\n"))
        .setColor(colors.default)
        .setFooter({ text: translate(locale, "help.embed.footer", { page, totalPages }) });
};

const createNavigationButtons = (currentPage: number, totalPages: number): ActionRowBuilder<ButtonBuilder> => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(ButtonIds.Previous)
            .setEmoji(icon.arrowLeft)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 1),
        new ButtonBuilder()
            .setCustomId(ButtonIds.Next)
            .setEmoji(icon.arrowRight)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages),
        new ButtonBuilder()
            .setCustomId(ButtonIds.Close)
            .setEmoji(icon.trash)
            .setStyle(ButtonStyle.Danger)
    );
};

export async function execute(interaction: ChatInputCommandInteraction<"cached">) {
    const { user } = interaction;

    const userLocale = await getUserLocale(user);

    const locale = userLocale ?? interaction.locale;

    const commandCategories = getCommandCategories(locale);
    const totalPages = commandCategories.length + 1;
    let currentPage = 1;

    const response = await interaction.reply({
        embeds: [createHelpEmbed(currentPage, locale, interaction)],
        components: [createNavigationButtons(currentPage, totalPages)],
        withResponse,
    });

    const collector = response.resource?.message?.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60_000,
    });

    collector?.on("collect", async (i) => {
        if (i.user.id !== user.id) return;

        switch (i.customId) {
            case ButtonIds.Previous:
                currentPage--;
                break;
            case ButtonIds.Next:
                currentPage++;
                break;
            case ButtonIds.Close:
                await i.update({ components: [] });
                collector.stop();
                return;
        }

        await i.update({
            embeds: [createHelpEmbed(currentPage, locale, interaction)],
            components: [createNavigationButtons(currentPage, totalPages)],
        });
    });

    collector?.on("end", () => response.resource?.message?.edit({ components: [] }).catch(() => { }));
}
