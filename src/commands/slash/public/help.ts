import { getLocalizations } from "#translate";
import { ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import { Discord, Slash } from "discordx";
import { execute } from "../../functions/utils/help/help.js";

@Discord()
export class Info {
    @Slash({
        nameLocalizations: getLocalizations("commands.help.name"),
        description: "See my commands and some information",
        descriptionLocalizations: getLocalizations("commands.help.description"),
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages"]
    })
    async help(interaction: ChatInputCommandInteraction<"cached">) {
        await execute(interaction);
    }
}