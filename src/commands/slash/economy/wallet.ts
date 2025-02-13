import { ApplicationCommandOptionType, ChatInputCommandInteraction, InteractionContextType, User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { getOrCreateUser, getUserLocale, getUserRankingPosition } from "#database";
import { getLocalizations, translate } from "#translete";

@Discord()
export class Wallet {
    @Slash({
        name: "wallet",
        nameLocalizations: getLocalizations("commands.wallet.name"),
        description: "View your wallet",
        descriptionLocalizations: getLocalizations("commands.wallet.description"),
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages"]
    })
    async run(
        @SlashOption({
            name: "target",
            nameLocalizations: getLocalizations("commands.wallet.options.user.name"),
            description: "Target user to view wallet",
            descriptionLocalizations: getLocalizations("commands.wallet.options.user.description"),
            type: ApplicationCommandOptionType.User,
        })
        target: User,
        interaction: ChatInputCommandInteraction<"cached">) {
        const { locale } = interaction;

        const userLocale = await getUserLocale(interaction.user);

        const targetMember = await interaction.guild.members.fetch(target.id);
        if (targetMember.user.bot) {
            return interaction.reply({
                flags,
                content: translate(locale, "user.economy.errors.pay.botWallet", undefined, userLocale),
            });
        }

        await interaction.deferReply();

        const targetUser = targetMember ?? interaction.user;
        const user = await getOrCreateUser(targetUser.id);

        const pamonhas = user?.data.wallet?.pamonhas ?? 0;
        const userPosition = await getUserRankingPosition(targetUser.id);

        await interaction.editReply(translate(locale, "user.economy.wallet", {
            targetUser: targetUser.toString(), pamonhas, userPosition
        }, userLocale));
    }
}
