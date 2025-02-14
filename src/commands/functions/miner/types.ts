export enum GridCell {
    Diamond = "💎",
    Bomb = "💣"
}

export enum GameStatus {
    Ongoing,
    Collected,
    GameOver
}

export interface GameState {
    grid: GridCell[][];
    revealed: boolean[][];
    multiplier: number;
    status: GameStatus;
}