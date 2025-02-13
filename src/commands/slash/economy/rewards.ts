import { ButtonInteraction, ChatInputCommandInteraction, EmbedBuilder, InteractionContextType, time, TimestampStyles } from "discord.js";
import { ButtonComponent, Discord, Slash } from "discordx";
import { getOrCreateUser, getUserLocale } from "#database";
import { colors, getIcon } from "#settings";
import { claimReward, getButtonCooldown, createButtonRow, generateRandomReward } from "../../functions/rewards/rewards.js";
import { getLocalizations, translate } from "#translete";

@Discord()
export class Rewards {
    @Slash({
        name: "rewards",
        nameLocalizations: getLocalizations("commands.rewards.name"),
        description: "Claim your rewards",
        descriptionLocalizations: getLocalizations("commands.rewards.description"),
        defaultMemberPermissions: ["SendMessages"],
        contexts: [InteractionContextType.Guild],
    })
    async run(interaction: ChatInputCommandInteraction<"cached">) {
        await interaction.deferReply({ flags });

        const user = await getOrCreateUser(interaction.member.id);
        const userLocale = await getUserLocale(interaction.user);
        const { locale } = interaction;

        const cooldowns = {
            Daily: getButtonCooldown(user, "Daily"),
            Weekly: getButtonCooldown(user, "Weekly"),
            Monthly: getButtonCooldown(user, "Monthly"),
        };

        const embed = new EmbedBuilder()
            .setTitle(translate(locale, "rewards.available.title", undefined, userLocale))
            .setDescription(translate(locale, "rewards.available.description", undefined, userLocale))
            .setColor(colors.success)
            .addFields(
                Object.entries(cooldowns).map(([type, { isActive, cooldownEnd }]) => {
                    const key = `rewards.types.${type.toLowerCase()}.name`;
                    return {
                        name: translate(locale, key, undefined, userLocale),
                        value: isActive
                            ? `${getIcon("clock")} ${translate(locale, "rewards.status.onCooldown", { time: time(cooldownEnd, TimestampStyles.RelativeTime) }, userLocale)}`
                            : `${getIcon("clock_check")} ${translate(locale, "rewards.status.available"), userLocale}`,
                    };
                })
            );

        const row = createButtonRow(locale, cooldowns, userLocale);

        await interaction.editReply({ embeds: [embed], components: [row] });
    }

    @ButtonComponent({ id: "daily" })
    async runDaily(interaction: ButtonInteraction<"cached">) {
        const reward = generateRandomReward("Daily");
        await claimReward(interaction, "Daily", reward);
    }

    @ButtonComponent({ id: "weekly" })
    async runWeekly(interaction: ButtonInteraction<"cached">) {
        const reward = generateRandomReward("Weekly");
        await claimReward(interaction, "Weekly", reward);
    }

    @ButtonComponent({ id: "monthly" })
    async runMonthly(interaction: ButtonInteraction<"cached">) {
        const reward = generateRandomReward("Monthly");
        await claimReward(interaction, "Monthly", reward);
    }
}