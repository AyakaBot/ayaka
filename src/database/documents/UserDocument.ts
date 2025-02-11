export interface UserDocument {
    wallet: {
        pamonhas: number
    },
    cooldowns?: {
        rewards: {
            lastClaimDaily: Date
            lastClaimWeekly: Date
            lastClaimMonthly: Date
        }
    }
}