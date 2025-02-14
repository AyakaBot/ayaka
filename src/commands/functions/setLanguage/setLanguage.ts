import { db, getUserLocale, Languages } from "#database";
import { colors } from "#settings";
import { translate } from "#translate";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export async function execute(interaction: ChatInputCommandInteraction<"cached">, language: Languages | undefined) {
    await interaction.deferReply({ flags });

    const { locale, user } = interaction;

    await db.users.upset(db.users.id(user.id), {
        options: { language }
    });

    const userLocale = await getUserLocale(user);

    const embed = new EmbedBuilder()
        .setDescription(translate(userLocale ?? locale, "set_language.embed.description"))
        .setColor(colors.success);

    await interaction.editReply({ embeds: [embed] });
}
