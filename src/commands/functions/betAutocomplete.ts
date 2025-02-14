import { getOrCreateUser } from "#database";
import { AutocompleteInteraction } from "discord.js";

export async function betAutocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused();

    const choices = await generateBetOptions(interaction.user.id);
    
    const filtered = choices.filter(choice => 
        choice.name.startsWith(focusedValue) ||
        choice.value.toString().startsWith(focusedValue)
    );

    await interaction.respond(filtered);
}

async function generateBetOptions(userId: string) {
    const user = await getOrCreateUser(userId);

    const userPamonhas = user?.data.wallet?.pamonhas ?? 0;

    return [
        { 
            name: `10% pamonhas (${userPamonhas * 0.1})`, 
            value: userPamonhas * 0.1 
        },
        { 
            name: `25% pamonhas (${userPamonhas * 0.25})`, 
            value: userPamonhas * 0.25 
        },
        { 
            name: `50% pamonhas (${userPamonhas * 0.5})`, 
            value: userPamonhas * 0.5 
        },
        { 
            name: `70% pamonhas (${userPamonhas * 0.7})`, 
            value: userPamonhas * 0.7 
        },
        { 
            name: `100% pamonhas (${userPamonhas})`, 
            value: userPamonhas 
        }
    ];
}