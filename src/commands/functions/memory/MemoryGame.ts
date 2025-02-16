import {
    User,
    ComponentType,
    ButtonInteraction,
    EmbedBuilder,
    InteractionCallbackResponse,
    ChatInputCommandInteraction
} from "discord.js";
import { GameConfig, GameState, GameMode } from "./models.js";
import { createGrid, isGameOver, createEmbed } from "./utils.js";
import { translate } from "#translate";
import { getRandomEmojis } from "./emojis.js";
import { updateUserPamonhas } from "#database";
import { getIcon } from "#settings";

export class MemoryGame {
    private interaction: ChatInputCommandInteraction<"cached">;
    private user: User;
    private opponent: User | null;
    private currentLocale: string;
    private gameMode: GameMode;
    private bet?: number;

    private gameConfig: GameConfig;
    private gameState: GameState;
    private message: InteractionCallbackResponse | undefined

    constructor(
        interaction: ChatInputCommandInteraction<"cached">,
        user: User,
        opponent: User | null,
        currentLocale: string,
        gameMode: GameMode,
        bet?: number
    ) {
        this.interaction = interaction;
        this.user = user;
        this.opponent = opponent;
        this.currentLocale = currentLocale;
        this.gameMode = gameMode;
        this.bet = bet;

        const gridSize = 4;
        const totalPairs = (gridSize * gridSize) / 2;
        const emojis = getRandomEmojis(totalPairs);

        this.gameConfig = {
            gridSize,
            totalPairs,
            emojis,
            cards: [...emojis, ...emojis].sort(() => Math.random() - 0.5),
        };

        this.gameState = {
            revealedCards: [],
            matchedPairs: [],
            attempts: 0,
            currentPlayer: user,
            playerScores: opponent
                ? { [user.id]: 0, [opponent.id]: 0 }
                : { [user.id]: 0 },
        };
    }

    public async start(): Promise<void> {
        const embed = this.createEmbed();
        this.message = await this.interaction.reply({
            withResponse: true,
            embeds: [embed],
            components: createGrid(this.gameConfig, this.gameState),
        });

        this.setupCollector();
    }

    private createEmbed(): EmbedBuilder {
        return createEmbed(this.currentLocale, this.user, this.gameState, {
            mode: this.gameMode,
            opponent: this.opponent!,
            bet: this.bet,
        });
    }

    private setupCollector(): void {
        const collector = this.message?.resource?.message?.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300_000,
        });

        collector?.on("collect", this.handleInteraction.bind(this));
        collector?.on("end", this.handleEnd.bind(this));
    }

    private async handleInteraction(i: ButtonInteraction): Promise<void> {
        if (this.gameMode !== GameMode.Solo && i.user.id !== this.user.id && i.user.id !== this.opponent?.id) return;
        if (this.gameMode !== GameMode.Solo && i.user.id !== this.gameState.currentPlayer.id) return;

        await i.deferUpdate();

        const index = parseInt(i.customId);

        if (this.gameState.revealedCards.includes(index)) return;

        this.gameState.revealedCards.push(index);

        if (this.gameState.revealedCards.length === 2) {
            this.gameState.attempts++;

            const [firstIndex, secondIndex] = this.gameState.revealedCards;

            if (firstIndex !== secondIndex && this.gameConfig.cards[firstIndex] === this.gameConfig.cards[secondIndex]) {
                this.handleMatch(i, firstIndex, secondIndex);
            } else {
                this.handleMismatch(i);
            }
        } else {
            await i.editReply({ components: createGrid(this.gameConfig, this.gameState) });
        }
    }

    private async handleMatch(i: ButtonInteraction, firstIndex: number, secondIndex: number): Promise<void> {
        this.gameState.matchedPairs.push(firstIndex, secondIndex);
        this.gameState.playerScores[this.gameState.currentPlayer.id]++;
        this.gameState.revealedCards = [];

        if (isGameOver(this.gameConfig, this.gameState)) {
            await this.handleGameOver(i);
            return;
        }

        await i.editReply({
            embeds: [this.createEmbed()],
            components: createGrid(this.gameConfig, this.gameState),
        });
    }

    private async handleMismatch(i: ButtonInteraction): Promise<void> {
        await i.editReply({ components: createGrid(this.gameConfig, this.gameState) });
        await new Promise((resolve) => setTimeout(resolve, 1000));

        this.gameState.revealedCards = [];
        if (this.gameMode !== GameMode.Solo) {
            this.gameState.currentPlayer = this.gameState.currentPlayer.id === this.user.id ? this.opponent! : this.user;
        }

        await this.message?.resource?.message?.edit({
            embeds: [this.createEmbed()],
            components: createGrid(this.gameConfig, this.gameState),
        });
    }

    private async handleGameOver(i: ButtonInteraction): Promise<void> {
        if (this.gameMode === GameMode.Versus && this.bet) {
            const winner =
                this.gameState.playerScores[this.user.id] > this.gameState.playerScores[this.opponent!.id]
                    ? this.user
                    : this.opponent!;
            const loser = winner.id === this.user.id ? this.opponent! : this.user;

            await Promise.all([
                updateUserPamonhas(loser.id, -this.bet),
                updateUserPamonhas(winner.id, this.bet * 2),
            ]);
        }

        const description = this.getGameOverDescription();
        await i.editReply({
            embeds: [this.createEmbed().setDescription(description)],
            components: [],
        });
    }

    private getGameOverDescription(): string {
        switch (this.gameMode) {
            case GameMode.Versus:
                return translate(this.currentLocale, "memory.versus.embed.description_finish_game", {
                    crownEmoji: getIcon("crown"),
                    winner: this.gameState.playerScores[this.user.id] > this.gameState.playerScores[this.opponent!.id]
                        ? this.user.toString()
                        : this.opponent!.toString(),
                    authorEmoji: getIcon("user"),
                    author: this.user.toString(),
                    authorScore: this.gameState.playerScores[this.user.id],
                    opponentEmoji: getIcon("user"),
                    opponent: this.opponent!.toString(),
                    opponentScore: this.gameState.playerScores[this.opponent!.id],
                    betEmoji: getIcon("dolar"),
                    bet: this.bet ? this.bet.toString() : "0",
                });
            case GameMode.Cooperative:
                return translate(this.currentLocale, "memory.cooperative.embed.description_finish_game", {
                    authorEmoji: getIcon("user"),
                    author: this.user.toString(),
                    authorScore: this.gameState.playerScores[this.user.id],
                    friendEmoji: getIcon("user"),
                    friend: this.opponent!.toString(),
                    friendScore: this.gameState.playerScores[this.opponent!.id],
                    attempts: this.gameState.attempts,
                });
            case GameMode.Solo:
                return translate(this.currentLocale, "memory.alone.embed.description_finish_game", {
                    attempts: this.gameState.attempts,
                });
        }
    }

    private async handleEnd(): Promise<void> {
        if (!isGameOver(this.gameConfig, this.gameState)) {
            const description = this.getTimeoutDescription();
            await this.message?.resource?.message?.edit({
                embeds: [this.createEmbed().setDescription(description)],
                components: [],
            });
        }
    }

    private getTimeoutDescription(): string {
        switch (this.gameMode) {
            case GameMode.Versus: return translate(this.currentLocale, "memory.errors.timeout", { clock: getIcon("clock"), });
            case GameMode.Cooperative: return translate(this.currentLocale, "memory.errors.timeout", { clock: getIcon("clock"), });
            case GameMode.Solo: return translate(this.currentLocale, "memory.errors.timeout", { clock: getIcon("clock"), });
        }
    }
}