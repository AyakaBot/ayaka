import { getLocalizations } from "#translate";
import { Rank } from "../../functions/utils/rank/rank.js";
import { ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import { Discord, Slash } from "discordx";

@Discord()
export class RankCommand {
    @Slash({
        description: "Shows rank any category.",
        descriptionLocalizations: getLocalizations("commands.rank.description"),
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages"]
    })
    async rank(interaction: ChatInputCommandInteraction<"cached">) {
        const rank = new Rank(interaction);

        await rank.showMenu();
    }
}