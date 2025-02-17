import {
    ChatInputCommandInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder
} from "discord.js";
import { getOrCreateUser, getUserLocale, updateUserPamonhas } from "#database";
import { colors, getIcon, icon } from "#settings";
import { translate } from "#translate";
import { GameState, GridCell, GameStatus } from "./models.js";

export class MinesweeperGame {
    private readonly gridSize: number = 4;
    private readonly bombProbability: number = 0.20; // 20%
    private readonly initialMultiplier: number = 1;
    private readonly multiplierIncrement: number = 0.3;

    private state: GameState;

    constructor(private bet: number, private interaction: ChatInputCommandInteraction<"cached">) {
        this.state = this.initializeGame();
    }

    private initializeGame(): GameState {
        const grid: GridCell[][] = Array.from({ length: this.gridSize }, () =>
            Array.from({ length: this.gridSize }, () =>
                Math.random() < this.bombProbability ? GridCell.Bomb : GridCell.Diamond
            )
        );

        const revealed: boolean[][] = Array.from({ length: this.gridSize }, () =>
            Array.from({ length: this.gridSize }, () => false)
        );

        return {
            grid,
            revealed,
            multiplier: this.initialMultiplier,
            status: GameStatus.Ongoing,
            clickCount: 0,
            currentBombProbability: this.bombProbability,
        };
    }


    private formatNumber(value: number): string {
        return Math.round(value).toString();
    }

    private createGrid(): ActionRowBuilder<ButtonBuilder>[] {
        return this.state.revealed.map((row, i) =>
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                row.map((isRevealed, j) =>
                    new ButtonBuilder()
                        .setCustomId(`${i}-${j}`)
                        .setLabel(isRevealed ? this.state.grid[i][j] : charInvisible)
                        .setStyle(isRevealed ? (this.state.grid[i][j] === GridCell.Diamond ? ButtonStyle.Success : ButtonStyle.Danger) : ButtonStyle.Secondary)
                        .setDisabled(isRevealed || this.state.status !== GameStatus.Ongoing)
                )
            )
        );
    }

    private createCollectButton(locale: string): ActionRowBuilder<ButtonBuilder> {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("collect")
                .setLabel(translate(locale, "miner.collect_button"))
                .setEmoji(icon.dolar)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(this.state.clickCount < 3 || this.state.status !== GameStatus.Ongoing)
        );
    }

    private createEmbed(locale: string): EmbedBuilder {
        return new EmbedBuilder()
            .addFields(
                { name: translate(locale, "miner.embed.multiplier"), value: `${this.state.multiplier.toFixed(2)}x`, inline },
                { name: translate(locale, "miner.embed.bet"), value: `${this.bet}`, inline },
                { name: translate(locale, "miner.embed.potencial"), value: `${this.formatNumber(this.bet * this.state.multiplier)}`, inline }
            )
            .setFooter({ text: translate(locale, "miner.embed.footer") })
            .setColor(colors.primary);
    }

    private recalculateGrid(): void {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (!this.state.revealed[i][j]) {
                    this.state.grid[i][j] =
                        Math.random() < this.state.currentBombProbability
                            ? GridCell.Bomb
                            : GridCell.Diamond;
                }
            }
        }
    }

    public async start() {
        const user = await getOrCreateUser(this.interaction.user.id);
        const userBalance = user?.data.wallet?.pamonhas ?? 0;

        const userLocale = await getUserLocale(this.interaction.user);

        const currentLocale = userLocale ?? this.interaction.locale;

        if (this.bet < 100) {
            await this.interaction.reply({
                flags,
                content: translate(currentLocale, "miner.errors.invalid_bet"),
            });
            return;
        }

        if (userBalance < this.bet) {
            await this.interaction.reply({
                flags,
                content: translate(currentLocale, "miner.errors.insufficient"),
            });
            return;
        }

        const embed = this.createEmbed(currentLocale);
        const message = await this.interaction.reply({
            withResponse,
            embeds: [embed],
            components: [...this.createGrid(), this.createCollectButton(currentLocale)],
        });

        const collector = message.resource?.message?.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300_000, // 5 minutes
        });

        collector?.on("collect", async (i) => {
            if (i.user.id !== this.interaction.user.id) return;

            if (i.customId === "collect") {
                this.state.status = GameStatus.Collected;
                collector.stop();

                const winnings = Math.round(this.bet * this.state.multiplier);
                await updateUserPamonhas(this.interaction.user.id, winnings);

                await i.update({
                    embeds: [
                        embed.setDescription(
                            translate(currentLocale, "miner.collect_pamonhas", { pamonhas: winnings })
                        ),
                    ],
                    components: [...this.createGrid(), this.createCollectButton(currentLocale)],
                });
                return;
            }

            const [row, col] = i.customId.split("-").map(Number);

            this.state.revealed[row][col] = true;

            if (this.state.grid[row][col] === GridCell.Bomb) {
                this.state.status = GameStatus.GameOver;
                collector.stop();

                await updateUserPamonhas(this.interaction.user.id, -this.bet);

                await i.update({
                    embeds: [
                        embed.setDescription(translate(currentLocale, "miner.bomb_collision")),
                    ],
                    components: [...this.createGrid(), this.createCollectButton(currentLocale)],
                });
            } else {
                this.state.multiplier += this.multiplierIncrement;
                this.state.clickCount++;

                this.state.currentBombProbability = parseFloat((this.state.currentBombProbability + 0.05).toFixed(2));

                this.recalculateGrid();

                await i.update({
                    embeds: [
                        embed.setFields(
                            { name: translate(currentLocale, "miner.embed.multiplier"), value: `${this.state.multiplier.toFixed(2)}x`, inline },
                            { name: translate(currentLocale, "miner.embed.bet"), value: `${this.bet}`, inline },
                            { name: translate(currentLocale, "miner.embed.potencial"), value: `${this.formatNumber(this.bet * this.state.multiplier)}`, inline }
                        ),
                    ],
                    components: [...this.createGrid(), this.createCollectButton(currentLocale)],
                });
            }
        });

        collector?.on("end", async () => {
            if (this.state.status === GameStatus.Ongoing) {
                await message.resource?.message?.edit({
                    embeds: [embed.setDescription(translate(currentLocale, "miner.errors.timeout", { clock: getIcon("clock") }))],
                    components: [],
                });
            }
        });
    }
}