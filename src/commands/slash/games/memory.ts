import { getLocalizations } from "#translate";
import { executeCooperative } from "../../functions/memory/cooperative/index.js";
import { executeSolo } from "../../functions/memory/solo.js";
import { ApplicationCommandOptionType, ChatInputCommandInteraction, InteractionContextType, User } from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";

@Discord()
@SlashGroup({ 
    name: "memory",
    nameLocalizations: getLocalizations("commands.memory.principal_name"), 
    description: "Play the memory game",
    descriptionLocalizations: getLocalizations("commands.memory.principal_descriptions"),
    contexts: [InteractionContextType.Guild],
    defaultMemberPermissions: ["SendMessages", "EmbedLinks"]
})
@SlashGroup("memory")
export class Memory {
    @Slash({
        name: "alone",
        nameLocalizations: getLocalizations("commands.memory.alone.name"),
        description: "play alone",
        descriptionLocalizations: getLocalizations("commands.memory.alone.description")
    })
    async runAlone(interaction: ChatInputCommandInteraction<"cached">) {
        await executeSolo(interaction);
    }

    @Slash({
        name: "cooperative",
        nameLocalizations: getLocalizations("commands.memory.cooperative.name"),
        description: "play with friend",
        descriptionLocalizations: getLocalizations("commands.memory.cooperative.description")
    })
    async runCooperative(
        @SlashOption({
            name: "friend",
            description: "Friend to play",
            type: ApplicationCommandOptionType.User,
            required
        })
        friend: User,
        interaction: ChatInputCommandInteraction<"cached">) {
        await executeCooperative(interaction, friend);
    }

    // TODO: create versus
}