import { ChatInputCommandInteraction } from "discord.js";
import { getUserLocale } from "#database";
import { createHelpPages } from "./createPages.js";
import { createPagination } from "../pagination.js";

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
