import { getLocalizations } from "#translate";
import { betAutocomplete } from "../../functions/betAutocomplete.js";
import { execute } from "../../functions/miner/miner.js";
import { ApplicationCommandOptionType, ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

@Discord()
export class Miner {
    @Slash({
        nameLocalizations: getLocalizations("commands.miner.name"),
        description: "The miner game.",
        descriptionLocalizations: getLocalizations("commands.miner.description"),
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages"]
    })
    async miner(
        @SlashOption({
            name: "bet",
            nameLocalizations: getLocalizations("commands.miner.options.name"),
            description: "Bet amount",
            descriptionLocalizations: getLocalizations("commands.miner.options.description"),
            type: ApplicationCommandOptionType.Number,
            async autocomplete(interaction) {
                await betAutocomplete(interaction)
            },
            required
        })
        bet: number,
        interaction: ChatInputCommandInteraction<"cached">) {
        await execute(interaction, bet);
    }
}