import { ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ButtonInteraction, InteractionCallbackResponse } from "discord.js";
import { db, getOrCreateUser, getUserLocale } from "#database";
import { getIcon } from "#settings";
import { translate } from "#translate";

export class ColorGame {
    private static readonly games: Map<string, ColorGame> = new Map();
    private readonly interaction: ChatInputCommandInteraction<"cached">;
    private readonly gridSize: number = 4;
    private sequence: number[] = [];
    private currentStep: number = 0;
    private isShowingSequence: boolean = false;

    constructor(interaction: ChatInputCommandInteraction<"cached">) {
        this.interaction = interaction;
    }

    public static startNewGame(interaction: ChatInputCommandInteraction<"cached">): ColorGame {
        const game = new ColorGame(interaction);
        this.games.set(interaction.id, game);
        return game;
    }

    public static getGame(commandId: string): ColorGame | null {
        return this.games.get(commandId) || null;
    }

    public static deleteGame(commandId: string): void {
        this.games.delete(commandId);
    }

    private generateGrid(disableButtons: boolean = false): ActionRowBuilder<ButtonBuilder>[] {
        const rows: ActionRowBuilder<ButtonBuilder>[] = [];

        for (let i = 0; i < this.gridSize; i++) {
            const buttons: ButtonBuilder[] = [];

            for (let j = 0; j < this.gridSize; j++) {
                const button = new ButtonBuilder()
                    .setCustomId(`${i}-${j}`)
                    .setLabel(charInvisible)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(disableButtons);

                buttons.push(button);
            }

            rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons));
        }

        return rows;
    }

    private async showSequence(): Promise<void> {
        this.isShowingSequence = true;

        const baseDelay = 1000;
        const delay = Math.max(200, baseDelay - this.sequence.length * 50);

        for (const step of this.sequence) {
            const row = Math.floor(step / this.gridSize);
            const col = step % this.gridSize;

            const grid = this.generateGrid(true);
            grid[row].components[col].setStyle(ButtonStyle.Success);

            await this.interaction.editReply({ components: grid });
            await this.delay(delay);

            grid[row].components[col].setStyle(ButtonStyle.Secondary);
            await this.interaction.editReply({ components: grid });
            await this.delay(delay / 2);
        }

        this.isShowingSequence = false;

        const grid = this.generateGrid(false);
        await this.interaction.editReply({ components: grid });
    }

    private async handleInteraction(response: InteractionCallbackResponse): Promise<void> {
        const collector = response.resource?.message?.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60_000 * 5,
        });

        if (!collector) {
            ColorGame.deleteGame(this.interaction.id);
            return;
        }

        const { locale, user } = this.interaction;

        const currentLocale = (await getUserLocale(user)) ?? locale;

        collector.on("collect", async (interaction) => {
            if (interaction.user.id !== this.interaction.user.id) return;

            if (this.isShowingSequence) {
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferUpdate();
                }
                return;
            }

            const [row, col] = interaction.customId.split("-").map(Number);
            const clickedIndex = row * this.gridSize + col;

            try {
                if (clickedIndex === this.sequence[this.currentStep]) {
                    this.currentStep++;
                    await this.updateGrid(interaction, row, col, ButtonStyle.Primary);

                    if (this.currentStep === this.sequence.length) {
                        this.currentStep = 0;
                        this.sequence.push(Math.floor(Math.random() * this.gridSize * this.gridSize));

                        await this.updateStats(this.interaction.user.id, this.sequence.length);

                        await this.showSequence();
                    } else {
                        if (!interaction.deferred && !interaction.replied) {
                            await interaction.deferUpdate();
                        }
                    }
                } else {
                    collector.stop();

                    await this.updateStats(this.interaction.user.id, this.sequence.length);

                    await interaction.update({
                        content: translate(currentLocale, "color_game.finished", {
                            recuse: getIcon("recuse"),
                            sequence: this.sequence.length,
                        }),
                        components: [],
                    });

                    ColorGame.deleteGame(this.interaction.id);
                }
            } catch (error) { console.error(error); }

            collector.resetTimer();
        });

        collector.on("end", async (_collect, reason) => {
            if (reason !== "time") return;
            if (this.sequence.length > 0) {
                await this.interaction.editReply({
                    content: translate(currentLocale, "color_game.timeout", {
                        clock: getIcon("clock"),
                    }),
                    components: []
                });
            }
            ColorGame.deleteGame(this.interaction.id);
        });
    }

    private async updateStats(userId: string, sequenceLength: number): Promise<void> {
        try {
            const user = await getOrCreateUser(userId);
            const colorStats = user?.data.games?.color ?? {
                maxSequence: 0,
                totalSequences: 0,
                averageSequence: 0,
            };

            colorStats.totalSequences++;
            colorStats.maxSequence = Math.max(colorStats.maxSequence, sequenceLength);
            colorStats.averageSequence =
                parseFloat(
                    (
                        (colorStats.averageSequence * (colorStats.totalSequences - 1) + sequenceLength) /
                        colorStats.totalSequences
                    ).toFixed(2)
                );

            await db.users.upset(db.users.id(userId), {
                games: {
                    color: colorStats
                }
            });
        } catch (error) { console.error(error); }
    }

    private async updateGrid(interaction: ButtonInteraction, row: number, col: number, style: ButtonStyle): Promise<void> {
        const grid = this.generateGrid();
        grid[row].components[col].setStyle(style);
        await interaction.update({ components: grid });
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    public async start(): Promise<void> {
        try {
            this.sequence.push(Math.floor(Math.random() * this.gridSize * this.gridSize));

            const grid = this.generateGrid();
            const message = await this.interaction.reply({ withResponse, components: grid });

            await this.showSequence();
            await this.handleInteraction(message);
        } catch (error) { console.error(error); }
    }
}