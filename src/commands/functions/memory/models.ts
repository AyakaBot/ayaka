import { User } from "discord.js";

export type GameConfig = {
    gridSize: number;
    totalPairs: number;
    emojis: string[];
    cards: string[];
};

export type GameState = {
    revealedCards: number[];
    matchedPairs: number[];
    attempts: number;
    currentPlayer: User;
    playerScores: Record<string, number>;
};

export enum GameMode {
    Versus = "versus",
    Cooperative = "cooperative",
    Solo = "solo",
}