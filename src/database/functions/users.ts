import { db } from "#database";
import { Locale, User } from "discord.js";

const DEFAULT_WALLET = { pamonhas: 0 };
const DEFAULT_COOLDOWNS = {
    rewards: {
        lastClaimDaily: new Date(0),
        lastClaimWeekly: new Date(0),
        lastClaimMonthly: new Date(0)
    }
};

async function initializeUser(userId: string) {
    const id = db.users.id(userId);
    await db.users.set(id, {
        wallet: DEFAULT_WALLET,
        cooldowns: DEFAULT_COOLDOWNS
    });
    return db.users.get(id);
}

export async function getOrCreateUser(userId: string) {
    const id = db.users.id(userId);
    let user = await db.users.get(id);

    if (!user) {
        user = await initializeUser(userId);
    }

    return user;
}

export async function getUserLocale(user: User): Promise<Locale | null> {
    try {
        const userDoc = await getOrCreateUser(user.id);
        const userLanguage = userDoc?.data?.options?.language?.toLowerCase();

        if (userLanguage) {
            switch (userLanguage) {
                case "en-us": return Locale.EnglishUS;
                case "pt-br": return Locale.PortugueseBR;
                case "es-es": return Locale.SpanishES;
                default: return null;
            }
        }

        console.warn(`Missing language in DB for user ${user.id}`);
        return null;
    } catch (error) {
        console.error(`Failed to fetch user language for ${user.id}:`, error);
        return null;
    }
}

export async function updateUserPamonhas(userId: string, amount: number) {
    const id = db.users.id(userId);
    const user = await getOrCreateUser(userId);

    const currentPamonhas = user?.data.wallet?.pamonhas || 0;
    const updatedPamonhas = currentPamonhas + amount;

    await db.users.upset(id, {
        wallet: { pamonhas: updatedPamonhas }
    });
}

export async function getUserRankingPosition(userId: string) {
    const allUsers = await db.users.all();
    const sortedUsers = allUsers.sort((a, b) => (b.data.wallet?.pamonhas ?? 0) - (a.data.wallet?.pamonhas ?? 0));

    const userIndex = sortedUsers.findIndex(u => u.ref.id === userId);
    return userIndex + 1;
}

export function isCooldownActive(lastClaim: Date, type: "daily" | "weekly" | "monthly") {
    const now = new Date();
    const cooldownDuration = {
        daily: 24 * 60 * 60 * 1000,
        weekly: 7 * 24 * 60 * 60 * 1000,
        monthly: 30 * 24 * 60 * 60 * 1000
    }[type];

    const cooldownEnd = new Date(lastClaim.getTime() + cooldownDuration);
    return { isActive: now < cooldownEnd, cooldownEnd };
}

export async function updateUserCooldown(userId: string, type: "Daily" | "Weekly" | "Monthly") {
    const id = db.users.id(userId);
    const user = await getOrCreateUser(userId);

    const lastClaimKey = `lastClaim${type}` as keyof typeof DEFAULT_COOLDOWNS.rewards;
    const now = new Date();

    await db.users.upset(id, {
        wallet: user?.data.wallet || DEFAULT_WALLET,
        cooldowns: {
            rewards: {
                ...(user?.data.cooldowns?.rewards || DEFAULT_COOLDOWNS.rewards),
                [lastClaimKey]: now
            }
        }
    });
}