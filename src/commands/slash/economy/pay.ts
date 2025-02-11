import {
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    User,
    GuildMember,
    InteractionContextType,
} from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { processTransfer } from "../../functions/pay/pay.js";
import { translate } from "#translete";

@Discord()
export class Pay {
    @Slash({
        name: "pay",
        nameLocalizations: { "pt-BR": "pagar" },
        description: "Send pamonhas to another user",
        descriptionLocalizations: { "pt-BR": "Envie pamonhas para outro usuário" },
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages"]
    })
    async run(
        @SlashOption({
            name: "target",
            nameLocalizations: { "pt-BR": "alvo" },
            description: "Target user to send pamonhas",
            descriptionLocalizations: { "pt-BR": "Usuário alvo para enviar pamonhas" },
            type: ApplicationCommandOptionType.User,
            required: true,
        })
        target: User,
        @SlashOption({
            name: "value",
            nameLocalizations: { "pt-BR": "valor" },
            description: "Value of pamonhas to transfer",
            descriptionLocalizations: { "pt-BR": "Valor de pamonhas para transferir" },
            type: ApplicationCommandOptionType.Number,
            required: true,
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
