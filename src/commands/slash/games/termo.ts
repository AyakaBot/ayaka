import { ApplicationCommandOptionType, ButtonInteraction, ChatInputCommandInteraction, ModalSubmitInteraction } from "discord.js";
import { ButtonComponent, Discord, ModalComponent, Slash, SlashChoice, SlashGroup, SlashOption } from "discordx";
import { TermoGame } from "../../functions/termo/game/TermoGame.js";
import { getUserLocale } from "#database";
import { executeRank } from "../../functions/termo/rank/rank.js";
import { getLocalizations, translate } from "#translate";

@Discord()
@SlashGroup({ name: "termo", description: "Play the game 'Termo' and try to guess the word!" })
@SlashGroup("termo")
export class Termo {
    @Slash({
        description: "See the players' rankings",
        descriptionLocalizations: getLocalizations("commands.termo.rank.description"),
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
        descriptionLocalizations: getLocalizations("commands.termo.play.description"),
    })
    async play(
        @SlashChoice({
            name: "General",
            nameLocalizations: getLocalizations("commands.termo.play.options.theme.choices.general"),
            value: "general",
        })
        @SlashChoice({
            name: "Country",
            nameLocalizations: getLocalizations("commands.termo.play.options.theme.choices.country"),
            value: "country",
        })
        @SlashChoice({
            name: "Foods",
            nameLocalizations: getLocalizations("commands.termo.play.options.theme.choices.food"),
            value: "food",
        })
        @SlashChoice({
            name: "Soccer",
            nameLocalizations: getLocalizations("commands.termo.play.options.theme.choices.soccer"),
            value: "soccer",
        })
        @SlashOption({
            name: "theme",
            nameLocalizations: getLocalizations("commands.termo.play.options.theme.name"),
            description: "Choose the theme of the words for the game",
            descriptionLocalizations: getLocalizations("commands.termo.play.options.theme.description"),
            type: ApplicationCommandOptionType.String,
            required: true,
        })
        theme: "country" | "food" | "soccer" | "general",
        interaction: ChatInputCommandInteraction<"cached">,
    ) {
        const { locale, user } = interaction;

        const currentLocale = (await getUserLocale(user)) ?? locale;

        if (currentLocale.toLowerCase() !== "pt-br") {
            return await interaction.reply({
                flags,
                content: translate(currentLocale, "termo.errors.not_available"),
            });
        }

        const game = TermoGame.startNewGame(interaction, theme);
        await game.start();
    }

    @ButtonComponent({ id: /guess-\d+/ })
    async handleGuess(interaction: ButtonInteraction<"cached">) {
        const userId = interaction.customId.split('-').pop();

        if (interaction.user.id !== userId) return;

        const game = TermoGame.getGame(userId);
        if (!game) return;

        const modal = game.createGuessModal();
        await interaction.showModal(modal);
    }

    @ModalComponent({ id: /guess-modal-\d+/ })
    async handleGuessModal(interaction: ModalSubmitInteraction<"cached">) {
        const userId = interaction.customId.split('-').pop();

        if (interaction.user.id !== userId) return;

        const game = TermoGame.getGame(userId);
        if (!game) return;

        await game.processGuess(interaction);

        if (game["chancesLeft"] === 0 || game["guessedWords"].includes(game["wordToGuess"])) {
            TermoGame.deleteGame(userId);
        }
    }

    @ButtonComponent({ id: /hint-\d+/ })
    async handleHint(interaction: ButtonInteraction<"cached">) {
        const userId = interaction.customId.split('-').pop();

        if (interaction.user.id !== userId) return;

        const game = TermoGame.getGame(userId);
        if (!game) return;

        await game.processHint(interaction);
    }
}