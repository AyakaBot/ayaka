import { ButtonInteraction } from "discord.js";
import { getOrCreateUser, getUserLocale, isCooldownActive, updateUserCooldown, updateUserPamonhas } from "#database";
import { colors, icon } from "#settings";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { translate } from "#translete";

export function toCooldownType(type: string): "daily" | "weekly" | "monthly" {
    if (type === "daily" || type === "weekly" || type === "monthly") {
        return type;
    }
    throw new Error("Invalid cooldown type");
}

export function getButtonCooldown(user: any, type: "Daily" | "Weekly" | "Monthly") {
    const rewards = user?.data.cooldowns?.rewards;
    const lastClaimKey = `lastClaim${type}` as keyof typeof rewards;
    const lastClaim = rewards?.[lastClaimKey];

    if (lastClaim) {
        return isCooldownActive(lastClaim, toCooldownType(type.toLowerCase()));
    }

    return { isActive: false, cooldownEnd: new Date() };
}

export function createButtonRow(locale: string, cooldowns: Record<string, { isActive: boolean }>, userLocale?: string | null) {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        Object.entries(cooldowns).map(([type, { isActive }]) =>
            new ButtonBuilder()
                .setCustomId(type.toLowerCase())
                .setLabel(translate(userLocale ?? locale, `rewards.button.label.${type.toLowerCase()}`))
                .setEmoji(icon.dolar)
                .setStyle(
                    type === "Daily"
                        ? ButtonStyle.Success
                        : type === "Weekly"
                            ? ButtonStyle.Primary
                            : ButtonStyle.Danger
                )
                .setDisabled(isActive)
        )
    );
}

export async function claimReward(interaction: ButtonInteraction<"cached">, type: "Daily" | "Weekly" | "Monthly", amount: number) {
    const { locale } = interaction;

    const userLocale = await getUserLocale(interaction.user);

    await updateUserPamonhas(interaction.member.id, amount);
    await updateUserCooldown(interaction.member.id, type);

    const embed = new EmbedBuilder()
        .setTitle(translate(userLocale ?? locale, `rewards.collected.title`, { type }))
        .setDescription(translate(userLocale ?? locale, `rewards.collected.description`, { amount }))
        .setColor(colors.success);

    const userUpdated = await getOrCreateUser(interaction.member.id);
    const updatedCooldowns = {
        Daily: getButtonCooldown(userUpdated, "Daily"),
        Weekly: getButtonCooldown(userUpdated, "Weekly"),
        Monthly: getButtonCooldown(userUpdated, "Monthly"),
    };

    const row = createButtonRow(userLocale ?? locale, updatedCooldowns);

    await interaction.update({ embeds: [embed], components: [row] });
}

export function generateRandomReward(type: "Daily" | "Weekly" | "Monthly"): number {
    switch (type) {
        case "Daily":
            return Math.floor(Math.random() * (2000 - 500 + 1)) + 500;
        case "Weekly":
            return Math.floor(Math.random() * (10000 - 3000 + 1)) + 3000;
        case "Monthly":
            return Math.floor(Math.random() * (30000 - 10000 + 1)) + 10000;
        default:
            return 0;
    }
}