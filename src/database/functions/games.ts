import { db } from "#database";

export enum RankingType {
    Termo = "termo",
    Pamonhas = "pamonhas",
    Color = "color",
}

export interface RankingEntry {
    position: number;
    userId: string;
    victories?: number;
    totalGuesses?: number;
    averageGuesses?: number;
    pamonhas?: number;
    maxSequence?: number;
    totalSequences?: number;
    averageSequence?: number;
}

export async function getRanking(type: RankingType): Promise<RankingEntry[]> {
    try {
        const allUsers = await db.users.all();

        let sortedUsers;

        switch (type) {
            case RankingType.Termo:
                sortedUsers = allUsers
                    .filter(user => {
                        const termoStats = user.data.games?.termo;
                        return (
                            (termoStats?.victories ?? 0) > 0 ||
                            (termoStats?.totalGuesses ?? 0) > 0 ||
                            (termoStats?.averageGuesses ?? 0) > 0
                        );
                    })
                    .sort((a, b) => (b.data.games?.termo?.victories ?? 0) - (a.data.games?.termo?.victories ?? 0));
                break;

            case RankingType.Pamonhas:
                sortedUsers = allUsers
                    .filter(user => (user.data.wallet?.pamonhas ?? 0) > 0)
                    .sort((a, b) => (b.data.wallet?.pamonhas ?? 0) - (a.data.wallet?.pamonhas ?? 0));
                break;

            case RankingType.Color:
                sortedUsers = allUsers
                    .filter(user => (user.data.games?.color?.maxSequence ?? 0) > 0)
                    .sort((a, b) => (b.data.games?.color?.maxSequence ?? 0) - (a.data.games?.color?.maxSequence ?? 0));
                break;

            default:
                throw new Error("Tipo de ranking inválido.");
        }

        return sortedUsers.map((user, index) => {
            const entry: RankingEntry = {
                position: index + 1,
                userId: user.ref.id,
            };

            switch (type) {
                case RankingType.Termo:
                    const termoStats = user.data.games?.termo;
                    entry.victories = termoStats?.victories ?? 0;
                    entry.totalGuesses = termoStats?.totalGuesses ?? 0;
                    entry.averageGuesses = termoStats?.averageGuesses ?? 0;
                    break;

                case RankingType.Pamonhas:
                    entry.pamonhas = user.data.wallet?.pamonhas ?? 0;
                    break;

                case RankingType.Color:
                    const colorStats = user.data.games?.color;
                    entry.maxSequence = colorStats?.maxSequence ?? 0;
                    entry.totalSequences = colorStats?.totalSequences ?? 0;
                    entry.averageSequence = colorStats?.averageSequence ?? 0;
                    break;
            }

            return entry;
        });
    } catch (error) {
        console.error(`Falha ao obter ranking de ${type}:`, error);
        return [];
    }
}