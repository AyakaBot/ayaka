import {
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    User,
    GuildMember,
    InteractionContextType,
} from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { processTransfer } from "../../functions/pay/pay.js";
import { getLocalizations, translate } from "#translete";

@Discord()
export class Pay {
    @Slash({
        name: "pay",
        nameLocalizations: getLocalizations("pay.name"),
        description: "Send pamonhas to another user",
        descriptionLocalizations: getLocalizations("pay.description"),
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages"]
    })
    async run(
        @SlashOption({
            name: "target",
            nameLocalizations: getLocalizations("pay.options.user.name"),
            description: "Target user to send pamonhas",
            descriptionLocalizations: getLocalizations("pay.options.user.description"),
            type: ApplicationCommandOptionType.User,
            required,
        })
        target: User,
        @SlashOption({
            name: "value",
            nameLocalizations: getLocalizations("pay.options.amount.name"),
            description: "Value of pamonhas to transfer",
            descriptionLocalizations: getLocalizations("pay.options.amount.description"),
            type: ApplicationCommandOptionType.Number,
            required,
        })
        value: number,
        interaction: ChatInputCommandInteraction<"cached">
    ) {
        const { locale } = interaction;

        const targetMember = await interaction.guild.members.fetch(target.id);
        if (targetMember.user.bot) {
            return interaction.reply({
                flags,
                content: translate(locale, "user.economy.errors.pay.botTransfer"),
            });
        }

        await interaction.deferReply();

        const { content, embed } = await processTransfer(interaction, target, value, locale);

        if (content) {
            await interaction.editReply({ content });
        } else {
            await interaction.editReply({ embeds: [embed!] });
        }
    }
}
