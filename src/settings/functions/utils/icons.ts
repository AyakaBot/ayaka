import fs from "node:fs/promises";

type EmojiList = typeof import("../../JSON/emojis.json");

const filepath = "./src/settings/JSON/emojis.json";
const file = await fs.readFile(filepath, "utf-8");
const emojis: EmojiList = JSON.parse(file);

type IconKey = keyof EmojiList["animated"] | keyof EmojiList["static"];
type IconInfo = { id: string; animated?: boolean; name?: string };
type Icon = Record<IconKey, IconInfo>;

const icon: Icon = {} as Icon;

const transform = (emojis: Record<string, string>, animated?: boolean) => {
    for (const [name, id] of Object.entries(emojis)) {
        icon[name as IconKey] = {
            id,
            animated,
            name: name
        };
    }
};

transform(emojis.static, false); 
transform(emojis.animated, true); 

const getIcon = (name: IconKey): string => {
    const emoji = icon[name];
    if (!emoji) {
        throw new Error(`Icon with name ${name} not found`);
    }
    return emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`;
};

export { icon, getIcon };
