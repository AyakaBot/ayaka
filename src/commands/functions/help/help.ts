import { getUserLocale } from "#database";
import { colors } from "#settings";
import { translate } from "#translate";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { createPagination } from "../pagination.js";

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
        name: translate(locale, "help.commands.general"),
        commands: [
            { name: translate(locale, "commands.help.name"), description: translate(locale, "commands.help.description") },
            { name: translate(locale, "commands.ping.name"), description: translate(locale, "commands.ping.description") },
            { name: "minecraft skin", description: translate(locale, "commands.minecraft.description") },
            { name: translate(locale, "commands.language.name"), description: translate(locale, "commands.language.description") },
        ],
    },
    {
        name: translate(locale, "help.commands.economy"),
        commands: [
            { name: translate(locale, "commands.wallet.name"), description: translate(locale, "commands.wallet.description") },
            { name: translate(locale, "commands.pay.name"), description: translate(locale, "commands.pay.description") },
            { name: translate(locale, "commands.rewards.name"), description: translate(locale, "commands.rewards.description") },
        ],
    },
    {
        name: translate(locale, "help.commands.games"),
        commands: [
            { name: translate(locale, "commands.memory.principal_name") + " " + translate(locale, "commands.memory.alone.name"), description: translate(locale, "commands.memory.alone.description") },
            { name: translate(locale, "commands.memory.principal_name") + " " + translate(locale, "commands.memory.cooperative.name"), description: translate(locale, "commands.memory.cooperative.description") },
            { name: translate(locale, "commands.memory.principal_name") + " " + translate(locale, "commands.memory.versus.name"), description: translate(locale, "commands.memory.versus.description") },
            { name: translate(locale, "commands.miner.name"), description: translate(locale, "commands.miner.description") },
        ],
    },
];

const createHelpPages = (locale: string, interaction: ChatInputCommandInteraction<"cached">): EmbedBuilder[] => {
    const { client, user } = interaction;
    const commandCategories = getCommandCategories(locale);

    const initialPage = new EmbedBuilder()
        .setTitle(translate(locale, "help.embed.title"))
        .setDescription(translate(locale, "help.embed.description", { username: user.username }))
        .addFields(
            { name: translate(locale, "help.embed.commands"), value: translate(locale, "help.embed.instructions"), inline: true }
        )
        .setColor(colors.fuchsia)
        .setThumbnail(client.user?.displayAvatarURL())
        .setFooter({ text: translate(locale, "help.embed.footer", { page: 1, totalPages: commandCategories.length + 1 }) });

    const commandPages = commandCategories.map((category, index) =>
        new EmbedBuilder()
            .setTitle(translate(locale, "help.embed.categoryTitle", { category: category.name }))
            .setDescription(category.commands.map(cmd => `**/${cmd.name}**: ${cmd.description}`).join("\n"))
            .setColor(colors.default)
            .setFooter({ text: translate(locale, "help.embed.footer", { page: index + 2, totalPages: commandCategories.length + 1 }) })
    );

    return [initialPage, ...commandPages];
};

export async function execute(interaction: ChatInputCommandInteraction<"cached">) {
    const { user } = interaction;

    const userLocale = await getUserLocale(user);
    const locale = userLocale ?? interaction.locale;

    const pages = createHelpPages(locale, interaction);

    const response = await interaction.reply({
        withResponse,
        embeds: [pages[0]],
    });

    await createPagination(response, {
        user,
        pages,
    });
}
