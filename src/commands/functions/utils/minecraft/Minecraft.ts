import { colors } from "#settings";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { fetchSkinRender, RenderTypes, RenderCrops } from "starlightskinapi";
import { createPagination } from "../../../utils/pagination.js";
import { translate } from "#translate";
import { getUserLocale } from "#database";
import { RenderOptions, RenderConfig } from "./models.js";

export class MinecraftSkin {
    private static readonly defaultRenderOptions: RenderOptions = {
        model: { resolution: 256 },
        camera: { angle: "front" },
    };

    private static readonly renderConfigOptions: Partial<Record<RenderTypes, RenderConfig>> = {
        [RenderTypes.Default]: {
            supportedCrops: [RenderCrops.Full],
            options: { model: { capeEnabled: true } },
        },
        [RenderTypes.Mojavatar]: { supportedCrops: [RenderCrops.Full] },
        [RenderTypes.CrissCross]: { supportedCrops: [RenderCrops.Full] },
        [RenderTypes.Sleeping]: { supportedCrops: [RenderCrops.Full] },
        [RenderTypes.Relaxing]: { supportedCrops: [RenderCrops.Full] },
        [RenderTypes.Facepalm]: { supportedCrops: [RenderCrops.Full] },
    };

    private interaction: ChatInputCommandInteraction<"cached">;
    private nickname: string;

    constructor(interaction: ChatInputCommandInteraction<"cached">, nickname: string) {
        this.interaction = interaction;
        this.nickname = nickname;
    }

    private isValidNickname(nickname: string): boolean {
        const nicknameRegex = /^[a-zA-Z0-9_]{3,16}$/;
        return nicknameRegex.test(nickname);
    }

    private createEmbed(renderUrl: string, nickname: string, type: RenderTypes, crop: RenderCrops, locale: string): EmbedBuilder {
        return new EmbedBuilder()
            .setImage(renderUrl)
            .setColor(colors.default)
            .setFooter({
                text: translate(locale, "minecraft.footer", { nickname, type, crop }),
            });
    }

    private async generateRenderPages(nickname: string, locale: string): Promise<EmbedBuilder[]> {
        const pages: EmbedBuilder[] = [];

        for (const [renderType, config] of Object.entries(MinecraftSkin.renderConfigOptions)) {
            const type = renderType as RenderTypes;
            const options = { ...MinecraftSkin.defaultRenderOptions, ...config.options };

            for (const crop of config.supportedCrops) {
                try {
                    const renderResult = await fetchSkinRender(nickname, {
                        type: type as never,
                        crop,
                        ...options,
                    });

                    if (renderResult.success) {
                        const embed = this.createEmbed(renderResult.url, nickname, type, crop, locale);
                        pages.push(embed);
                    }
                } catch (error) {
                    console.error(`Erro ao gerar render (${type} - ${crop}):`, error);
                }
            }
        }

        return pages;
    }

    public async execute(): Promise<void> {
        try {
            const initialResponse = await this.interaction.deferReply({ withResponse });

            const { locale, user } = this.interaction;
            const currentLocale = (await getUserLocale(user)) ?? locale;

            if (!this.isValidNickname(this.nickname)) {
                await this.interaction.followUp({
                    flags,
                    content: translate(currentLocale, "minecraft.not_found", { nickname: this.nickname }),
                });
                return;
            }

            const pages = await this.generateRenderPages(this.nickname, currentLocale);

            if (pages.length === 0) {
                await this.interaction.followUp({
                    flags,
                    content: translate(currentLocale, "minecraft.not_found", { nickname: this.nickname }),
                });
                return;
            }

            await this.interaction.followUp({ embeds: [pages[0]] });

            createPagination(initialResponse, { user, pages });
        } catch (error) {
            console.error("error:", error);
        }
    }
}