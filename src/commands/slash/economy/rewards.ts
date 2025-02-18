import { ButtonInteraction, ChatInputCommandInteraction, EmbedBuilder, InteractionContextType, time, TimestampStyles } from "discord.js";
import { ButtonComponent, Discord, Slash } from "discordx";
import { getOrCreateUser, getUserLocale } from "#database";
import { colors, getIcon } from "#settings";
import { claimReward, getButtonCooldown, createButtonRow, generateRandomReward } from "../../functions/economy/rewards/rewards.js";
import { getLocalizations, translate } from "#translate";

@Discord()
export class Rewards {
    @Slash({
        nameLocalizations: getLocalizations("commands.rewards.name"),
        description: "Claim your rewards",
        descriptionLocalizations: getLocalizations("commands.rewards.description"),
        defaultMemberPermissions: ["SendMessages"],
        contexts: [InteractionContextType.Guild],
    })
    async rewards(interaction: ChatInputCommandInteraction<"cached">) {
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
            .setTitle(translate(userLocale ?? locale, "rewards.available.title"))
            .setDescription(translate(userLocale ?? locale, "rewards.available.description"))
            .setColor(colors.success)
            .addFields(
                Object.entries(cooldowns).map(([type, { isActive, cooldownEnd }]) => {
                    const key = `rewards.types.${type.toLowerCase()}.name`;
                    return {
                        name: translate(userLocale ?? locale, key),
                        value: isActive
                            ? `${getIcon("clock")} ${translate(userLocale ?? locale, "rewards.status.onCooldown", { time: time(cooldownEnd, TimestampStyles.RelativeTime) })}`
                            : `${getIcon("clock_check")} ${translate(userLocale ?? locale, "rewards.status.available")}`,
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