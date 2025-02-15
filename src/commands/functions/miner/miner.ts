import { ChatInputCommandInteraction } from "discord.js";
import { MinesweeperGame } from "./MinerGame.js";

export async function execute(interaction: ChatInputCommandInteraction<"cached">, bet: number) {
    const game = new MinesweeperGame(bet, interaction);
    await game.start();
}