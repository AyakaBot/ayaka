import { translate } from "#translate";

export type Command = {
    name: string;
    description: string;
};

export type CommandCategory = {
    name: string;
    commands: Command[];
};

export const getCommandCategories = (locale: string): CommandCategory[] => [
    {
        name: translate(locale, "help.commands.general"),
        commands: [
            { name: translate(locale, "commands.help.name"), description: translate(locale, "commands.help.description") },
            { name: translate(locale, "commands.ping.name"), description: translate(locale, "commands.ping.description") },
            { name: "minecraft skin", description: translate(locale, "commands.minecraft.description") },
            { name: translate(locale, "commands.language.name"), description: translate(locale, "commands.language.description") },
        ],
    },
    {
        name: translate(locale, "help.commands.economy"),
        commands: [
            { name: translate(locale, "commands.wallet.name"), description: translate(locale, "commands.wallet.description") },
            { name: translate(locale, "commands.pay.name"), description: translate(locale, "commands.pay.description") },
            { name: translate(locale, "commands.rewards.name"), description: translate(locale, "commands.rewards.description") },
        ],
    },
    {
        name: translate(locale, "help.commands.games"),
        commands: [
            { name: translate(locale, "commands.memory.principal_name") + " " + translate(locale, "commands.memory.alone.name"), description: translate(locale, "commands.memory.alone.description") },
            { name: translate(locale, "commands.memory.principal_name") + " " + translate(locale, "commands.memory.cooperative.name"), description: translate(locale, "commands.memory.cooperative.description") },
            { name: translate(locale, "commands.memory.principal_name") + " " + translate(locale, "commands.memory.versus.name"), description: translate(locale, "commands.memory.versus.description") },
            { name: "termo rank", description: translate(locale, "commands.termo.rank.description") },
            { name: "termo play", description: translate(locale, "commands.termo.play.description") },
            { name: translate(locale, "commands.miner.name"), description: translate(locale, "commands.miner.description") },
        ],
    },
];
