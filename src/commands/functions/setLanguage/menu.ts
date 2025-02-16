import { db, getUserLocale, Languages } from "#database";
import { colors, getIcon } from "#settings";
import { translate } from "#translate";
import { ChatInputCommandInteraction, ComponentType, EmbedBuilder, InteractionCallbackResponse } from "discord.js";

export async function selectLanguageMenu(interaction: ChatInputCommandInteraction<"cached">, response: InteractionCallbackResponse) {
    const collector = response.resource?.message?.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60_000,
    });

    collector?.on("collect", async (i) => {
        if (i.customId !== "setlanguage") return;

        const { user } = i;

        const language = i.values[0] as Languages;

        await db.users.upset(db.users.id(user.id), {
            options: { language }
        });

        const embed = new EmbedBuilder()
            .setDescription(
                translate(language, "set_language.final_embed.description",
                    { emoji: getIcon("accept") }
                )
            )
            .setColor(colors.success);

        await i.update({ embeds: [embed], components: [] });
    });

    collector?.on("end", async () => {
        await interaction.deleteReply();
    });
}