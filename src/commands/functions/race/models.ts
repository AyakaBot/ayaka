export interface Player {
    userId: string;
    animal: string;
    position: number;
}

export enum RaceStatus {
    NotStarted,
    InProgress,
    Finished,
}

export interface ServerState {
    players: Player[];
    raceStatus: RaceStatus;
}

export const serverStates: Record<string, ServerState> = {};