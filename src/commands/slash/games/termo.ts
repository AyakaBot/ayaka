import { ApplicationCommandOptionType, ButtonInteraction, ChatInputCommandInteraction, ModalSubmitInteraction, } from "discord.js";
import { ButtonComponent, Discord, ModalComponent, Slash, SlashChoice, SlashGroup, SlashOption } from "discordx";
import { TermoGame } from "../../functions/termo/game/TermoGame.js";
import { getUserLocale } from "#database";
import { executeRank } from "../../functions/termo/rank/rank.js";
import { getLocalizations, translate } from "#translate";

interface GameCache {
    game: TermoGame;
    timeout: NodeJS.Timeout;
}

const games: Map<string, GameCache> = new Map();

@Discord()
@SlashGroup({ name: "termo", description: "Jogue o jogo de adivinhação 'Termo'!" })
@SlashGroup("termo")
export class Termo {
    @Slash({
        description: "See the players' rankings",
        descriptionLocalizations: getLocalizations("commands.termo.rank.description")
    })
    async rank(interaction: ChatInputCommandInteraction<"cached">) {
        const { locale, user } = interaction;

        const currentLocale = (await getUserLocale(user)) ?? locale;

        if (currentLocale.toLowerCase() !== "pt-br") {
            return await interaction.reply({
                flags,
                content: translate(currentLocale, "termo.errors.not_available"),
            });
        }

        await executeRank(interaction);
    }

    @Slash({
        description: "Play the game 'Term' and try to guess the word!",
        descriptionLocalizations: getLocalizations("commands.termo.play.description")
    })
    async play(
        @SlashChoice({
            name: "Geral",
            nameLocalizations: getLocalizations("commands.termo.play.options.theme.choices.general"),
            value: "general"
        })
        @SlashChoice({
            name: "País",
            nameLocalizations: getLocalizations("commands.termo.play.options.theme.choices.country"),
            value: "country"
        })
        @SlashChoice({
            name: "Comidas",
            nameLocalizations: getLocalizations("commands.termo.play.options.theme.choices.food"),
            value: "food"
        })
        @SlashChoice({
            name: "Futebol",
            nameLocalizations: getLocalizations("commands.termo.play.options.theme.choices.soccer"),
            value: "soccer"
        })
        @SlashOption({
            name: "theme",
            description: "Choose the theme of the words for the game",
            descriptionLocalizations: getLocalizations("commands.termo.play.options.tema.description"),
            type: ApplicationCommandOptionType.String,
            required: true,
        })
        theme: "country" | "food" | "soccer" | "general",
        interaction: ChatInputCommandInteraction<"cached">
    ) {
        const { locale, user } = interaction;

        const currentLocale = (await getUserLocale(user)) ?? locale;

        if (currentLocale.toLowerCase() !== "pt-br") {
            return await interaction.reply({
                flags,
                content: translate(currentLocale, "termo.errors.not_available"),
            });
        }

        const game = new TermoGame(interaction, theme);

        const timeout = setTimeout(() => {
            games.delete(user.id);
        }, 3 * 60 * 1000); 

        games.set(user.id, { game, timeout });

        await game.start();
    }

    @ButtonComponent({ id: "guess" })
    async handleGuess(interaction: ButtonInteraction<"cached">) {
        const cachedGame = games.get(interaction.user.id);
        if (!cachedGame) return;

        const { game, timeout } = cachedGame;

        clearTimeout(timeout);
        cachedGame.timeout = setTimeout(() => { games.delete(interaction.user.id); }, 3 * 60 * 1000);

        const modal = game.createGuessModal();
        await interaction.showModal(modal);
    }

    @ModalComponent({ id: "guess-modal" })
    async handleGuessModal(interaction: ModalSubmitInteraction<"cached">) {
        const cachedGame = games.get(interaction.user.id);
        if (!cachedGame) return;

        const { game, timeout } = cachedGame;

        clearTimeout(timeout);
        cachedGame.timeout = setTimeout(() => { games.delete(interaction.user.id); }, 3 * 60 * 1000);

        await game.processGuess(interaction);

        if (game["chancesLeft"] === 0 || game["guessedWords"].includes(game["wordToGuess"])) {
            games.delete(interaction.user.id);
        }
    }
}
