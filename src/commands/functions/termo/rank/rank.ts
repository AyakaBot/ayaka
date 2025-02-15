import { getTermoRanking } from "#database";
import { colors, getIcon } from "#settings";
import { createPagination } from "../../pagination.js";
import { bold, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export async function executeRank(interaction: ChatInputCommandInteraction<"cached">) {
    const message = await interaction.deferReply({ withResponse });

    const { client } = interaction;

    const ranking = await getTermoRanking();

    const pages: EmbedBuilder[] = [];
    const usersPerPage = 3;

    for (let i = 0; i < ranking.length; i += usersPerPage) {
        const pageUsers = ranking.slice(i, i + usersPerPage);

        const embed = new EmbedBuilder()
            .setTitle("🏆 Ranking do Termo")
            .setDescription("### Aqui estão os melhores jogadores do Termo!")
            .setColor(colors.fuchsia)
            .addFields(
                await Promise.all(pageUsers.map(async (user, index) => {
                    const discordUser = await client.users.fetch(user.userId);

                    const rankPosition = i + index + 1;
                    const isTop1 = rankPosition === 1 ? `${getIcon("crown")}` : "";

                    return {
                        name: `${isTop1} #${rankPosition} - ${bold(discordUser.displayName)}`,
                        value:
                            `- Vitórias: **${user.victories}**\n` +
                            `- Total de Palpites: **${user.totalGuesses}**\n` +
                            `- Média de Palpites: **${user.averageGuesses.toFixed(2)}**`,
                        inline: false,
                    };
                }))
            )
            .setFooter({ text: `Página ${Math.floor(i / usersPerPage) + 1} de ${Math.ceil(ranking.length / usersPerPage)}` });

        pages.push(embed);
    }

    if (pages.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle("🏆 Ranking do Termo")
            .setDescription("Nenhum jogador encontrado no ranking.")
            .setColor(colors.fuchsia);

        await interaction.followUp({ embeds: [embed] });
        return;
    }

    await interaction.followUp({
        embeds: [pages[0]],
    });

    await createPagination(message, {
        user: interaction.user,
        pages,
    });
}
