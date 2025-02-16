import {
    ButtonStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChatInputCommandInteraction,
    ModalSubmitInteraction,
    EmbedBuilder,
} from "discord.js";
import { wordLists } from "../wordList.js";
import { db, getOrCreateUser } from "#database";

export class TermoGame {
    private readonly maxChances = 4;
    private chancesLeft: number;
    private wordToGuess: string;
    private guessedWords: string[];
    private currentGuessIndex: number;
    private wordLength: number;

    constructor(
        private interaction: ChatInputCommandInteraction<"cached">,
        private theme: keyof typeof wordLists | "general",
    ) {
        if (!["general", ...Object.keys(wordLists)].includes(theme)) {
            throw new Error("Tema inválido fornecido.");
        }

        this.wordToGuess = this.getRandomWord().toUpperCase();
        this.wordLength = this.wordToGuess.length;
        this.chancesLeft = this.maxChances;
        this.guessedWords = Array(this.maxChances).fill(charInvisible.repeat(this.wordLength));
        this.currentGuessIndex = 0;
    }

    private getRandomWord(): string {
        try {
            if (this.theme === "general") {
                const allWords = Object.values(wordLists).flat();
                return allWords[Math.floor(Math.random() * allWords.length)];
            } else {
                const words: string[] = wordLists[this.theme];
                return words[Math.floor(Math.random() * words.length)];
            }
        } catch (error) {
            throw new Error("Erro ao selecionar uma palavra aleatória. Verifique as listas de palavras.");
        }
    }

    private async updateStats(userId: string, won: boolean) {
        try {
            const id = db.users.id(userId);
            const user = await getOrCreateUser(userId);
            const termoStats = user?.data.games?.termo || {
                victories: 0,
                totalGuesses: 0,
                averageGuesses: 0,
            };

            termoStats.totalGuesses += this.currentGuessIndex + 1;
            if (won) {
                termoStats.victories++;
            }
            termoStats.averageGuesses =
                termoStats.victories > 0 ? termoStats.totalGuesses / termoStats.victories : 0;

            await db.users.upset(id, {
                games: {
                    termo: termoStats,
                },
            });
        } catch (error) {
            console.error("Error:", error);
        }
    }

    private createGrid(): ActionRowBuilder<ButtonBuilder>[] {
        const rows: ActionRowBuilder<ButtonBuilder>[] = [];
        const maxButtonsPerRow = 5;

        for (let row = 0; row < this.maxChances; row++) {
            const buttons: ButtonBuilder[] = [];

            for (let col = 0; col < this.wordLength; col++) {
                const char = this.guessedWords[row][col] || charInvisible;
                let style = ButtonStyle.Secondary;

                if (this.guessedWords[row] !== charInvisible.repeat(this.wordLength)) {
                    if (char === this.wordToGuess[col]) {
                        style = ButtonStyle.Success;
                    } else if (this.wordToGuess.includes(char)) {
                        style = ButtonStyle.Primary;
                    } else {
                        style = ButtonStyle.Danger;
                    }
                }

                buttons.push(
                    new ButtonBuilder()
                        .setCustomId(`cell-${row}-${col}`)
                        .setLabel(char)
                        .setStyle(style)
                        .setDisabled(true)
                );

                if (buttons.length === maxButtonsPerRow || col === this.wordLength - 1) {
                    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons));
                    buttons.length = 0;
                }
            }
        }

        return rows;
    }

    private createGuessButton(): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("guess")
                .setLabel("Chutar Palavra")
                .setStyle(ButtonStyle.Primary)
        );
    }

    private createWordRevealRow(): ActionRowBuilder<ButtonBuilder> {
        const buttons: ButtonBuilder[] = [];

        for (let col = 0; col < this.wordLength; col++) {
            const char = this.wordToGuess[col];
            buttons.push(
                new ButtonBuilder()
                    .setCustomId(`reveal-${col}`)
                    .setLabel(char)
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true)
            );
        }

        return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
    }

    public createGuessModal(): ModalBuilder {
        return new ModalBuilder()
            .setCustomId("guess-modal")
            .setTitle("Chute a Palavra")
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId("word-input")
                        .setLabel(`Digite uma palavra de ${this.wordLength} letras`)
                        .setPlaceholder(`Exemplo: ${"?".repeat(this.wordLength)}`)
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(this.wordLength)
                        .setMaxLength(this.wordLength)
                        .setRequired(true)
                )
            );
    }

    private createEmbed(): EmbedBuilder {
        const themeMap: Record<string, string> = {
            "general": "Geral",
            "soccer": "Futebol",
            "country": "País",
            "food": "Comidas",
        };

        return new EmbedBuilder()
            .setTitle("🎯 Jogo do Termo")
            .setDescription(
                `Tema: ${themeMap[this.theme.toLowerCase()]}\nVocê tem ${this.chancesLeft} chances restantes para adivinhar a palavra.`
            )
            .setColor("Blue")
            .addFields({
                name: "Dica",
                value: `A palavra tem ${this.wordLength} letras e começa com **${this.wordToGuess[0]}**.`,
            });
    }

    public async processGuess(interaction: ModalSubmitInteraction<"cached">) {
        try {
            await interaction.deferUpdate();

            const guess = interaction.fields.getTextInputValue("word-input").toUpperCase();

            if (guess === this.wordToGuess) {
                await this.updateStats(this.interaction.user.id, true);
                await interaction.editReply({
                    content: "🎉 Você acertou a palavra! Parabéns!",
                    components: [...this.createGrid(), this.createWordRevealRow()],
                    embeds: [],
                });
                return;
            }

            this.guessedWords[this.currentGuessIndex] = guess;
            this.chancesLeft--;
            this.currentGuessIndex++;

            if (this.chancesLeft === 0) {
                await this.updateStats(this.interaction.user.id, false);
                await interaction.editReply({
                    content: `💥 Você perdeu! A palavra correta era **${this.wordToGuess}**.`,
                    components: [...this.createGrid(), this.createWordRevealRow()],
                    embeds: [],
                });
                return;
            }

            await interaction.editReply({
                embeds: [this.createEmbed()],
                components: [...this.createGrid(), this.createGuessButton()],
            });
        } catch (error) {
            console.error("Erro:", error);
            await interaction.editReply({
                content: "Ocorreu um erro ao processar seu chute",
            });
        }
    }

    public async start() {
        try {
            const embed = this.createEmbed();

            await this.interaction.reply({
                embeds: [embed],
                components: [...this.createGrid(), this.createGuessButton()],
            });
        } catch (error) {
            console.error("Erro:", error);
            await this.interaction.reply({
                flags,
                content: "Ocorreu um erro ao iniciar o jogo.",
            });
        }
    }
}
