import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

interface Translations {
    [key: string]: string | Translations;
}

const translations: Record<string, Translations> = {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function loadTranslations(directory: string) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        if (file.endsWith(".json")) {
            const locale = path.basename(file, ".json");
            const filePath = path.resolve(directory, file);
            const fileData = fs.readFileSync(filePath, "utf8");
            translations[locale] = JSON.parse(fileData);
        }
    }
}

const translationsDir = path.resolve(__dirname, "./translations");
loadTranslations(translationsDir);

export function translate(locale: string, key: string, placeholders?: Record<string, string | number>): string {
    const localeTranslations = translations[locale.toLowerCase()] || translations["en-us"];
    if (!localeTranslations) {
        return `Missing locale: ${locale} and fallback locale: en-us`;
    }

    const keys = key.split(".");
    let translation: any = localeTranslations;

    for (const k of keys) {
        if (translation[k]) {
            translation = translation[k];
        } else {
            return `Missing translation for key: ${key}`;
        }
    }

    if (typeof translation === "string" && placeholders) {
        for (const [placeholder, value] of Object.entries(placeholders)) {
            translation = translation.replace(`{${placeholder}}`, String(value));
        }
    }

    return typeof translation === "string" ? translation : `Invalid key: ${key}`;
}