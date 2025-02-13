import { db } from "#database";
import { User } from "discord.js";

export async function getOrCreateUser(userId: string) {
    const id = db.users.id(userId);
    let user = await db.users.get(id);

    if (!user) {
        await db.users.set(id, {
            wallet: { pamonhas: 0 },
            cooldowns: {
                rewards: {
                    lastClaimDaily: new Date(0),
                    lastClaimWeekly: new Date(0),
                    lastClaimMonthly: new Date(0)
                }
            }
        });
        user = await db.users.get(id);
    }

    return user;
}

export async function getUserLocale(user: User): Promise<string | null> {
    try {
        const userDoc = await db.users.get(db.users.id(user.id));
        return userDoc?.data.options?.language || null;
    } catch (error) {
        console.error(`Failed to fetch user language for ${user.id}:`, error);
        return null;
    }
}

export async function updateUserPamonhas(userId: string, amount: number) {
    const id = db.users.id(userId);
    const user = await getOrCreateUser(userId);

    await db.users.upset(id, {
        wallet: {
            pamonhas: (user?.data.wallet?.pamonhas || 0) + amount
        }
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

    const lastClaimKey = `lastClaim${type}` as "lastClaimDaily" | "lastClaimWeekly" | "lastClaimMonthly";
    const now = new Date();

    await db.users.upset(id, {
        wallet: user?.data.wallet || { pamonhas: 0 },
        cooldowns: {
            rewards: {
                ...(user?.data.cooldowns?.rewards || {
                    lastClaimDaily: new Date(0),
                    lastClaimWeekly: new Date(0),
                    lastClaimMonthly: new Date(0)
                }),
                [lastClaimKey]: now
            }
        }
    });
}
