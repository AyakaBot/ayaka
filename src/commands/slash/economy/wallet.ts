import { ApplicationCommandOptionType, ChatInputCommandInteraction, InteractionContextType, User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { getOrCreateUser, getUserRankingPosition } from "#database";
import { translate } from "#translete";

@Discord()
export class Wallet {
    @Slash({
        name: "wallet",
        nameLocalizations: { "pt-BR": "carteira" },
        description: "View your wallet",
        descriptionLocalizations: { "pt-BR": "Visualize sua carteira" },
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages"]
    })
    async run(
        @SlashOption({
            name: "target",
            nameLocalizations: { "pt-BR": "alvo" },
            description: "Target user to view wallet",
            descriptionLocalizations: { "pt-BR": "Usuário alvo para visualizar a carteira" },
            type: ApplicationCommandOptionType.User,
        })
        target: User,
        interaction: ChatInputCommandInteraction<"cached">) {
        const { locale } = interaction;

        const targetMember = await interaction.guild.members.fetch(target.id);
        if (targetMember.user.bot) {
            return interaction.reply({
                flags,
                content: translate(locale, "user.economy.errors.pay.botWallet"),
            });
        }

        await interaction.deferReply();

        const targetUser = targetMember ?? interaction.user;
        const user = await getOrCreateUser(targetUser.id);

        const pamonhas = user?.data.wallet?.pamonhas ?? 0;
        const userPosition = await getUserRankingPosition(targetUser.id);

        await interaction.editReply(translate(locale, "user.economy.wallet", {
            targetUser: targetUser.toString(), pamonhas, userPosition
        }));
    }
}
