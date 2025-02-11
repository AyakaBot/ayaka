export interface PayDocument {
    payer: string;
    receiver: string;
    value: number;
    messageId: string;
}