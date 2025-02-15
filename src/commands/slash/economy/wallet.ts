import { ApplicationCommandOptionType, ChatInputCommandInteraction, InteractionContextType, User } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { getOrCreateUser, getUserLocale, getUserRankingPosition } from "#database";
import { getLocalizations, translate } from "#translate";

@Discord()
export class Wallet {
    @Slash({
        nameLocalizations: getLocalizations("commands.wallet.name"),
        description: "Shows the user's coin balance.",
        descriptionLocalizations: getLocalizations("commands.wallet.description"),
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages"],
    })
    async wallet(
        @SlashOption({
            name: "target",
            nameLocalizations: getLocalizations("commands.wallet.options.user.name"),
            description: "The user to show the balance of",
            descriptionLocalizations: getLocalizations("commands.wallet.options.user.description"),
            type: ApplicationCommandOptionType.User,
        })
        target: User | undefined, 
        interaction: ChatInputCommandInteraction<"cached">
    ) {
        const { locale } = interaction;

        const userLocale = await getUserLocale(interaction.user);

        const targetMember = target
            ? await interaction.guild.members.fetch(target.id)
            : null; 

        if (targetMember?.user.bot) {
            return interaction.reply({
                flags,
                content: translate(
                    userLocale ?? locale,
                    "user.economy.errors.pay.botWallet",
                    undefined
                ),
            });
        }

        await interaction.deferReply();

        const targetUser = target ?? interaction.user; 
        const user = await getOrCreateUser(targetUser.id);

        const pamonhas = user?.data.wallet?.pamonhas ?? 0;
        const userPosition = await getUserRankingPosition(targetUser.id);

        await interaction.editReply(
            translate(userLocale ?? locale, "user.economy.wallet", {
                targetUser: targetUser.toString(),
                pamonhas,
                userPosition,
            })
        );
    }
}
