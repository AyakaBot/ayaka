import firebase from "firebase-admin";
import { schema, Typesaurus } from "typesaurus";
import path from "node:path";
import chalk from "chalk";
import fs from "node:fs";
import { UserDocument } from "./documents/UserDocument.js";
import { PayDocument } from "./documents/PayDocument.js";

const firebaseAccountPath = "./firebase.json";

if (!fs.existsSync(firebaseAccountPath)){
    const filename = chalk.yellow(`"${path.basename(firebaseAccountPath)}"`);
    const text = chalk.red(`The ${filename} file was not found in ${firebaseAccountPath}`);
    console.error(text);
    process.exit(0);
}

const firebaseAccount: firebase.ServiceAccount = JSON.parse(
    fs.readFileSync(firebaseAccountPath, { encoding: "utf-8" })
);

firebase.initializeApp({ credential: firebase.credential.cert(firebaseAccount) });

export const db = schema(({ collection }) => ({
    users: collection<UserDocument>(),
    pays: collection<PayDocument>(),
}));

export type DatabaseSchema = Typesaurus.Schema<typeof db>;

// User types
export type UserSchema =  DatabaseSchema["users"]["Data"];
export type PaySchema = DatabaseSchema["pays"]["Data"];

// documents
export * from "./documents/UserDocument.js";
export * from "./documents/PayDocument.js";

// functions
export * from "./functions/users.js";
export * from "./functions/pay.js"