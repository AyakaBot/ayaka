import {
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    User,
    InteractionContextType,
} from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { processTransfer } from "../../functions/pay/pay.js";
import { getLocalizations, translate } from "#translate";
import { getUserLocale } from "#database";

@Discord()
export class Pay {
    @Slash({
        nameLocalizations: getLocalizations("commands.pay.name"),
        description: "Send pamonhas to another user",
        descriptionLocalizations: getLocalizations("commands.pay.description"),
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages"]
    })
    async pay(
        @SlashOption({
            name: "target",
            nameLocalizations: getLocalizations("commands.pay.options.user.name"),
            description: "Target user to send pamonhas",
            descriptionLocalizations: getLocalizations("commands.pay.options.user.description"),
            type: ApplicationCommandOptionType.User,
            required,
        })
        target: User,
        @SlashOption({
            name: "value",
            nameLocalizations: getLocalizations("commands.pay.options.amount.name"),
            description: "Value of pamonhas to transfer",
            descriptionLocalizations: getLocalizations("commands.pay.options.amount.description"),
            type: ApplicationCommandOptionType.Number,
            required,
        })
        value: number,
        interaction: ChatInputCommandInteraction<"cached">
    ) {
        const { locale, user } = interaction;
        const userLocale = await getUserLocale(user);

        const targetMember = await interaction.guild.members.fetch(target.id);
        if (targetMember.user.bot) {
            return interaction.reply({
                flags,
                content: translate(userLocale ?? locale, "user.economy.errors.pay.botTransfer"),
            });
        }

        await interaction.deferReply();

        const { content, embed } = await processTransfer(interaction, target, value, locale, userLocale);

        if (content) {
            await interaction.editReply({ content });
        } else {
            await interaction.editReply({ embeds: [embed!] });
        }
    }
}
