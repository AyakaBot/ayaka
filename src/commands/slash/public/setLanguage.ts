import { getLocalizations } from "#translate";
import { execute } from "../../functions/setLanguage/setLanguage.js";
import { ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import { Discord, Slash } from "discordx";

@Discord()
export class SetLanguage {
    @Slash({
        nameLocalizations: getLocalizations("commands.language.name"),
        description: "Set the language of the bot",
        descriptionLocalizations: getLocalizations("commands.language.description"),
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages"]
    })
    async setlanguage(
        interaction: ChatInputCommandInteraction<"cached">) {
        await execute(interaction);
    }
}
