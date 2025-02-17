import { getLocalizations } from "#translate";
import { ColorGame } from "../../functions/colorGame/ColorGame.js";
import { ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import { Discord, Slash } from "discordx";

@Discord()
export class Color {
    @Slash({
        description: "Start a color memory game",
        nameLocalizations: getLocalizations("commands.color_game.name"),
        descriptionLocalizations: getLocalizations("commands.color_game.description"),
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages"]
    })
    async color(interaction: ChatInputCommandInteraction<"cached">) {
        const game = ColorGame.startNewGame(interaction);
        await game.start();
    }
}
