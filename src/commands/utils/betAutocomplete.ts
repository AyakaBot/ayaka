import { getOrCreateUser } from "#database";
import { AutocompleteInteraction } from "discord.js";

interface Choice {
    name: string;
    value: number;
}

const PERCENTAGES = [10, 25, 50, 70, 100] as const;

export async function betAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
    try {
        const focusedValue = interaction.options.getFocused();
        const choices = await generateBetOptions(interaction.user.id);

        const filtered = filterChoices(choices, focusedValue);

        await interaction.respond(filtered);
    } catch (error) {
        console.error("Erro no autocomplete:", error);
        await interaction.respond([]);
    }
}

async function generateBetOptions(userId: string): Promise<Choice[]> {
    const user = await getOrCreateUser(userId);
    const userPamonhas = user?.data.wallet?.pamonhas ?? 0;

    if (userPamonhas <= 0) {
        return [{ name: "Insufficient balance", value: 0 }];
    }

    return PERCENTAGES.map(percentage => ({
        name: `${percentage}% pamonhas (${calculatePercentage(userPamonhas, percentage)})`,
        value: calculatePercentage(userPamonhas, percentage),
    }));
}

function filterChoices(choices: Choice[], focusedValue: string): Choice[] {
    return choices.filter(choice =>
        choice.name.startsWith(focusedValue) ||
        choice.value.toString().startsWith(focusedValue)
    );
}

function calculatePercentage(total: number, percentage: number): number {
    return Math.floor((total * percentage) / 100);
}
