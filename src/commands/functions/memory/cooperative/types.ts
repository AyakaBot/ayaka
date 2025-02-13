import { User } from "discord.js";

export type GameState = {
    revealedCards: number[];
    matchedPairs: number[];
    attempts: number;
    currentPlayer: User;
    playerScores: Record<string, number>;
};

export type GameConfig = {
    gridSize: number;
    totalPairs: number;
    emojis: string[];
    cards: string[];
};