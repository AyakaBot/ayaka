import { getLocalizations } from "#translate";
import { executeVersus } from "../../functions/memory/versus/versus.js";
import { executeCooperative } from "../../functions/memory/cooperative/cooperative.js";
import { executeAlone } from "../../functions/memory/alone/alone.js";
import { betAutocomplete } from "../../functions/betAutocomplete.js";
import { ApplicationCommandOptionType, ChatInputCommandInteraction, InteractionContextType, User } from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";

@Discord()
@SlashGroup({
    name: "memory",
    nameLocalizations: getLocalizations("commands.memory.principal_name"),
    description: "Play the memory game",
    descriptionLocalizations: getLocalizations("commands.memory.principal_descriptions"),
})
@SlashGroup("memory")
export class Memory {
    @Slash({
        nameLocalizations: getLocalizations("commands.memory.alone.name"),
        description: "play alone",
        descriptionLocalizations: getLocalizations("commands.memory.alone.description"),
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages", "EmbedLinks"]
    })
    async alone(interaction: ChatInputCommandInteraction<"cached">) {
        await executeAlone(interaction);
    }

    @Slash({
        nameLocalizations: getLocalizations("commands.memory.cooperative.name"),
        description: "play with friend",
        descriptionLocalizations: getLocalizations("commands.memory.cooperative.description"),
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages", "EmbedLinks"]
    })
    async cooperative(
        @SlashOption({
            name: "friend",
            nameLocalizations: getLocalizations("commands.memory.cooperative.options.name"),
            description: "Friend to play",
            descriptionLocalizations: getLocalizations("commands.memory.cooperative.options.description"),
            type: ApplicationCommandOptionType.User,
            required
        })
        friend: User,
        interaction: ChatInputCommandInteraction<"cached">) {
        await executeCooperative(interaction, friend);
    }

    @Slash({
        nameLocalizations: getLocalizations("commands.memory.versus.name"),
        description: "play versus",
        descriptionLocalizations: getLocalizations("commands.memory.versus.description"),
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages", "EmbedLinks"]
    })
    async versus(
        @SlashOption({
            name: "oponnet",
            nameLocalizations: getLocalizations("commands.memory.versus.options.opponent.name"),
            description: "Opponent to play.",
            descriptionLocalizations: getLocalizations("commands.memory.versus.options.opponent.description"),
            type: ApplicationCommandOptionType.User,
            required
        })
        opponent: User,
        @SlashOption({
            name: "bet",
            nameLocalizations: getLocalizations("commands.memory.versus.options.bet.name"),
            descriptionLocalizations: getLocalizations("commands.memory.versus.options.bet.description"),
            description: "Value",
            type: ApplicationCommandOptionType.Number,
            async autocomplete(interaction) {
                await betAutocomplete(interaction);
            },
        })
        bet: number,
        interaction: ChatInputCommandInteraction<"cached">) {
        await executeVersus(interaction, opponent, bet);
    }
}