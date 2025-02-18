import { ButtonStyle, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChatInputCommandInteraction, ModalSubmitInteraction, EmbedBuilder, ButtonInteraction } from "discord.js";
import { wordLists } from "./wordList.js";
import { db, getOrCreateUser } from "#database";
import { colors } from "#settings";

type GameCache = {
    timeout: NodeJS.Timeout;
    game: TermoGame;
};

enum HintLevel {
    None,
    FirstLetter,
    MiddleLetter,
    LastLetter,
}

export class TermoGame {
    private static readonly games: Map<string, GameCache> = new Map();

    private readonly maxChances = 4;
    private chancesLeft: number;
    private wordToGuess: string;
    private guessedWords: string[];
    private currentGuessIndex: number;
    private wordLength: number;
    private hintLevel: HintLevel;

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
        this.hintLevel = HintLevel.None;
    }

    public async start(): Promise<void> {
        try {
            const embed = this.createEmbed();

            await this.interaction.reply({
                embeds: [embed],
                components: [...this.createGrid(), this.createGuessButton()],
            });
        } catch (error) {
            console.error("Erro:", error);
            await this.interaction.reply({
                content: "Ocorreu um erro ao iniciar o jogo.",
                flags,
            });
        }
    }

    public static startNewGame(interaction: ChatInputCommandInteraction<"cached">, theme: keyof typeof wordLists | "general"): TermoGame {
        const userId = interaction.user.id;

        this.deleteGame(userId);

        const game = new TermoGame(interaction, theme);
        const timeout = setTimeout(() => {
            this.deleteGame(userId);
        }, 5 * 60 * 1000);

        this.games.set(userId, { game, timeout });
        return game;
    }

    public static getGame(userId: string): TermoGame | null {
        const cache = this.games.get(userId);
        if (!cache) return null;

        clearTimeout(cache.timeout);
        cache.timeout = setTimeout(() => {
            this.deleteGame(userId);
        }, 5 * 60 * 1000);

        return cache.game;
    }

    public static deleteGame(userId: string): void {
        const cache = this.games.get(userId);
        if (cache) {
            clearTimeout(cache.timeout);
            this.games.delete(userId);
        }
    }

    private getRandomWord(): string {
        try {
            const words = this.theme === "general"
                ? Object.values(wordLists).flat()
                : wordLists[this.theme];
            return words[Math.floor(Math.random() * words.length)];
        } catch (error) {
            throw new Error("Erro ao selecionar uma palavra aleatória. Verifique as listas de palavras.");
        }
    }

    private async updateStats(userId: string, won: boolean) {
        try {
            const user = await getOrCreateUser(userId);
            const termoStats = user?.data.games?.termo ?? {
                victories: 0,
                totalGuesses: 0,
                averageGuesses: 0,
            };

            termoStats.totalGuesses += this.currentGuessIndex + 1;
            if (won) {
                termoStats.victories++;
            }
            termoStats.averageGuesses = termoStats.victories > 0
                ? termoStats.totalGuesses / termoStats.victories
                : 0;

            await db.users.upset(db.users.id(userId), {
                games: { termo: termoStats },
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
                    } else if (this.wordToGuess.includes(char) && !this.isCharInCorrectPosition(char, row, col)) {
                        style = ButtonStyle.Primary;
                    } else {
                        style = ButtonStyle.Danger;
                    }
                }

                buttons.push(
                    new ButtonBuilder()
                        .setCustomId(`cell-${row}-${col}-${this.interaction.user.id}`)
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

    private isCharInCorrectPosition(char: string, row: number, col: number): boolean {
        return this.wordToGuess.split('').some((c, index) => this.guessedWords[row][index] === char && c === char && index !== col);
    }

    private createGuessButton(): ActionRowBuilder<ButtonBuilder> {
        const components = [
            new ButtonBuilder()
                .setCustomId(`guess-${this.interaction.user.id}`)
                .setLabel("Chutar Palavra")
                .setStyle(ButtonStyle.Primary)
        ];

        if (this.chancesLeft <= 2 && this.hintLevel < HintLevel.LastLetter) {
            components.push(
                new ButtonBuilder()
                    .setCustomId(`hint-${this.interaction.user.id}`)
                    .setLabel("Mostrar Dica")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(this.hintLevel > HintLevel.None)
            );
        }

        return new ActionRowBuilder<ButtonBuilder>().addComponents(components);
    }

    private createWordRevealRow(): ActionRowBuilder<ButtonBuilder> {
        const buttons = this.wordToGuess.split('').map((char, col) =>
            new ButtonBuilder()
                .setCustomId(`reveal-${col}-${this.interaction.user.id}`)
                .setLabel(char)
                .setStyle(ButtonStyle.Success)
                .setDisabled(true)
        );

        return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
    }

    public createGuessModal(): ModalBuilder {
        return new ModalBuilder()
            .setCustomId(`guess-modal-${this.interaction.user.id}`)
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

        const hint = this.hintLevel > HintLevel.None ? this.getHint() : "";

        return new EmbedBuilder()
            .setTitle("🎯 Jogo do Termo")
            .setDescription(
                `Tema: ${themeMap[this.theme.toLowerCase()]}\nVocê tem ${this.chancesLeft} chances restantes para adivinhar a palavra.\n${hint}`
            )
            .setColor(colors.default);
    }

    private getHint(): string {
        switch (this.hintLevel) {
            case HintLevel.FirstLetter:
                return `Dica: A palavra começa com **${this.wordToGuess[0]}**.`;
            case HintLevel.MiddleLetter:
                return `Dica: A palavra começa com **${this.wordToGuess[0]}** e contém **${this.wordToGuess[Math.floor(this.wordLength / 2)]}** no meio.`;
            case HintLevel.LastLetter:
                return `Dica: A palavra começa com **${this.wordToGuess[0]}** e termina com **${this.wordToGuess[this.wordLength - 1]}**.`;
            default:
                return "";
        }
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
                content: "Ocorreu um erro ao processar seu chute.",
            });
        }
    }

    public async processHint(interaction: ButtonInteraction<"cached">) {
        try {
            await interaction.deferUpdate();

            this.hintLevel++;
            await interaction.editReply({
                embeds: [this.createEmbed()],
                components: [...this.createGrid(), this.createGuessButton()],
            });
        } catch (error) {
            console.error("Erro:", error);
            await interaction.editReply({
                content: "Ocorreu um erro ao processar a dica.",
            });
        }
    }
}