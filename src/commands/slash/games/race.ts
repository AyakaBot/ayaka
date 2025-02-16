import { getLocalizations } from "#translate";
import { execute } from "../../functions/race/race.js";
import { ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import { Discord, Slash } from "discordx";

@Discord()
export class Race {
    @Slash({
        nameLocalizations: getLocalizations("commands.race.name"),
        description: "Start a race between animals!",
        descriptionLocalizations: getLocalizations("commands.race.description"),
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages"]
    })
    async race(interaction: ChatInputCommandInteraction<"cached">) {
        await execute(interaction);
    }
}