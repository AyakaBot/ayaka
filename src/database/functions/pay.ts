import { db } from "#database";
import { getOrCreateUser, updateUserPamonhas } from "./users.js";

interface TransferDocument {
    payer: string;
    receiver: string;
    value: number;
    messageId: string;
}

export async function transferPamonhas(
    payerId: string,
    receiverId: string,
    amount: number,
    messageId: string
): Promise<{ success: true; payId: string } | { success: false; error: string }> {
    const payer = await getOrCreateUser(payerId);

    const payerBalance = payer?.data.wallet?.pamonhas ?? 0;

    if (payerBalance < amount) {
        return { success: false, error: "You don't have enough pamonhas to complete the transfer." };
    }

    await updateUserPamonhas(payerId, -amount);
    await updateUserPamonhas(receiverId, amount);

    const payId = await db.pays.id(); 
    const payDocument: TransferDocument = {
        payer: payerId,
        receiver: receiverId,
        value: amount,
        messageId,
    };

    await db.pays.set(payId, payDocument);

    return { success: true, payId: payId as string };
}
