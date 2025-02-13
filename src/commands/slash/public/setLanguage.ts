import { Languages } from "#database";
import { getLocalizations } from "#translete";
import { launcher } from "../../functions/setLanguage/launcher.js";
import { ApplicationCommandOptionType, ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import { Discord, Slash, SlashChoice, SlashOption } from "discordx";

@Discord()
export class SetLanguage {
    @Slash({
        name: "setlanguage",
        nameLocalizations: getLocalizations("commands.language.name"),
        description: "Set the language of the bot",
        descriptionLocalizations: getLocalizations("commands.language.description"),
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages"]
    })
    async run(
        @SlashChoice({name: "English", value: "en-us"})
        @SlashChoice({name: "Portuguese", value: "pt-br"})
        @SlashChoice({name: "Spanish", value: "es-es"})
        @SlashChoice({name: "Russian", value: "ru"})
        @SlashOption({
            name: "language",
            nameLocalizations: getLocalizations("commands.language.options.language.name"),
            description: "Language",
            descriptionLocalizations: getLocalizations("commands.language.options.language.description"),
            type: ApplicationCommandOptionType.String,
            required
        })
        language: Languages, 
        interaction: ChatInputCommandInteraction<"cached">) {
        await launcher(interaction, language); 
    }
}
