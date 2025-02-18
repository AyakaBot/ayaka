import { colors, getIcon } from "#settings";
import { ActionRowBuilder, ChatInputCommandInteraction, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import { selectLanguageMenu } from "./menu.js";
import { translate } from "#translate";
import { getUserLocale } from "#database";

export async function execute(interaction: ChatInputCommandInteraction<"cached">) {
    const message = await interaction.deferReply({ withResponse, flags });

    const { user, locale } = interaction;

    const currentLocale = await (getUserLocale(user)) ?? locale;

    const embed = new EmbedBuilder()
        .setDescription(
            translate(currentLocale, "set_language.initial_embed.description",
                { translateEmoji: getIcon("translate") }
            )
        )
        .setColor(colors.default);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("setlanguage")
                .addOptions([
                    {
                        label: "Portuguese",
                        value: "pt-br",
                        emoji: getIcon("translate")
                    },
                    {
                        label: "English",
                        value: "en-us",
                        emoji: getIcon("translate")
                    },
                    {
                        label: "Spanish",
                        value: "es-es",
                        emoji: getIcon("translate")
                    },
                ])
        )

    await interaction.followUp({ embeds: [embed], components: [row] })

    await selectLanguageMenu(interaction, message);
}
