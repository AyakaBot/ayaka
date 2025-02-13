import { ApplicationCommandOptionType, ChatInputCommandInteraction, InteractionContextType, User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { getOrCreateUser, getUserRankingPosition } from "#database";
import { getLocalizations, translate } from "#translete";

@Discord()
export class Wallet {
    @Slash({
        name: "wallet",
        nameLocalizations: getLocalizations("wallet.name"),
        description: "View your wallet",
        descriptionLocalizations: getLocalizations("wallet.description"),
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages"]
    })
    async run(
        @SlashOption({
            name: "target",
            nameLocalizations: getLocalizations("wallet.options.user.name"),
            description: "Target user to view wallet",
            descriptionLocalizations: getLocalizations("wallet.options.user.description"),
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
