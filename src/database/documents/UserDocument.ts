export type Languages = "en-us" | "pt-br" | "es-es";

export interface UserDocument {
    wallet?: {
        pamonhas: number
    },
    cooldowns?: {
        rewards: {
            lastClaimDaily: Date
            lastClaimWeekly: Date
            lastClaimMonthly: Date
        }
    },
    options?: {
        language?: Languages
    }
}