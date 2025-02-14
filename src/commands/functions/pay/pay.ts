import { ChatInputCommandInteraction, EmbedBuilder, User } from "discord.js";
import { db, transferPamonhas } from "#database";
import { colors } from "#settings";
import { translate } from "#translate";

export async function processTransfer(
    interaction: ChatInputCommandInteraction<"cached">,
    target: User,
    value: number,
    locale: string,
    userLocale?: string | null
) {
    if (target.id === interaction.member.id) {
        return {
            content: translate(userLocale ?? locale, "user.economy.errors.pay.selfTransfer"),
            embed: null,
        };
    }

    if (value <= 0) {
        return {
            content: translate(userLocale ?? locale, "user.economy.errors.pay.invalidValue"),
            embed: null,
        };
    }

    try {
        const transferResult = await transferPamonhas(
            interaction.member.id,
            target.id,
            value,
            interaction.id
        );

        const embed = new EmbedBuilder();

        if (transferResult.success) {
            const targetUser = target.toString();
            const payerUser = interaction.user.toString();

            embed
                .setTitle(translate(userLocale ?? locale, "user.economy.transfer.success.title"))
                .setDescription(
                    translate(userLocale ?? locale, "user.economy.transfer.success.description", {
                        value,
                        payerUser,
                        targetUser,
                    })
                )
                .setColor(colors.success);

            if (transferResult.payId) {
                const payId = db.pays.id(transferResult.payId);
                await db.pays.remove(payId);
            }

            return { content: null, embed };
        } else {
            embed
                .setTitle(translate(userLocale ?? locale, "user.economy.transfer.error.title"))
                .setDescription(
                    transferResult.error ?? translate(userLocale ?? locale, "user.economy.errors.pay.unknown")
                )
                .setColor(colors.danger);

            return { content: null, embed };
        }
    } catch (error) {
        console.error(error);
        return {
            content: translate(userLocale ?? locale, "user.economy.errors.pay.processing"),
            embed: null,
        };
    }
}
