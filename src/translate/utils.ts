import { translate } from "#translate";
import { Locale } from "discord.js";

export function getLocalizations(
    key: string,
    options?: Record<string, string | number>,
): Partial<Record<Locale, string | null>> {
    return Object.values(Locale).reduce((acc, locale) => {
        const translation = translate(locale, key, options);

        if (!translation || translation.startsWith("Missing")) {
            return acc;
        }

        acc[locale] = translation.slice(0, 100);
        return acc;
    }, {} as Partial<Record<Locale, string | null>>);
}