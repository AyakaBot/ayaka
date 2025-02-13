import { getLocalizations } from "#translete";
import { ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import { Discord, Slash } from "discordx";
import { execute } from "../../functions/help/help.js";

@Discord()
export class Info {
    @Slash({
        name: "help",
        nameLocalizations: getLocalizations("commands.help.name"),
        description: "See my commands and some information",
        descriptionLocalizations: getLocalizations("commands.help.description"),
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages"]
    })
    async run(interaction: ChatInputCommandInteraction<"cached">) {
        await execute(interaction);
    }
}