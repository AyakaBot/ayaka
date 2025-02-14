import { getLocalizations } from "#translate";
import { execute } from "../../functions/minecraft/skin.js";
import { ApplicationCommandOptionType, ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import { Discord, Slash, SlashGroup, SlashOption } from "discordx";

@Discord()
@SlashGroup({
    name: "minecraft",
    description: "View skin any player.",
    descriptionLocalizations: getLocalizations("commands.mincraft.principal_description"),
    contexts: [InteractionContextType.Guild],
    defaultMemberPermissions: ["SendMessages"]
})
@SlashGroup("minecraft")
export class Minecraft {
    @Slash({
        description: "Get a Minecraft skin",
        descriptionLocalizations: getLocalizations("commands.minecraft.description")
    })
    async skin(
        @SlashOption({
            name: "nickname",
            nameLocalizations: getLocalizations("commands.minecraft.options.nick.name"),
            description: "Player nickname",
            descriptionLocalizations: getLocalizations("commands.minecraft.options.nick.description"),
            type: ApplicationCommandOptionType.String,
            required
        })
        nickname: string,
        interaction: ChatInputCommandInteraction<"cached">
    ) {
        await execute(interaction, nickname);
    }
}
