import { colors } from "#settings";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { fetchSkinRender, RenderTypes, RenderCrops } from "starlightskinapi";
import { createPagination } from "../pagination.js";
import { translate } from "#translate";
import { getUserLocale } from "#database";

interface RenderOptions {
    model?: Record<string, unknown>;
    camera?: Record<string, unknown>;
    lighting?: Record<string, unknown>;
}

interface RenderConfig {
    supportedCrops: RenderCrops[];
    options?: RenderOptions;
}

const DEFAULT_RENDER_OPTIONS: RenderOptions = {
    model: { resolution: 256 },
    camera: { angle: "front" }
};

const RENDER_CONFIGS: Partial<Record<RenderTypes, RenderConfig>> = {
    [RenderTypes.Default]: {
        supportedCrops: [RenderCrops.Full],
        options: { model: { capeEnabled: true } }
    },
    [RenderTypes.Mojavatar]: { supportedCrops: [RenderCrops.Full] },
    [RenderTypes.CrissCross]: { supportedCrops: [RenderCrops.Full] },
    [RenderTypes.Sleeping]: { supportedCrops: [RenderCrops.Full] },
    [RenderTypes.Relaxing]: { supportedCrops: [RenderCrops.Full] },
    [RenderTypes.Facepalm]: { supportedCrops: [RenderCrops.Full] },
};

function createEmbed(
    renderUrl: string,
    nickname: string,
    type: RenderTypes,
    crop: RenderCrops,
    locale: string
): EmbedBuilder {
    return new EmbedBuilder()
        .setImage(renderUrl)
        .setColor(colors.default)
        .setFooter({
            text: translate(locale, "minecraft.footer", { nickname, type, crop })
        });
}

async function generateRenderPages(nickname: string, locale: string): Promise<EmbedBuilder[]> {
    const pages: EmbedBuilder[] = [];

    for (const [renderType, config] of Object.entries(RENDER_CONFIGS)) {
        const type = renderType as RenderTypes;
        const options = { ...DEFAULT_RENDER_OPTIONS, ...config.options };

        for (const crop of config.supportedCrops) {
            try {
                const renderResult = await fetchSkinRender(nickname, {
                    type: type as never,
                    crop,
                    ...options
                });

                if (renderResult.success) {
                    const embed = createEmbed(renderResult.url, nickname, type, crop, locale);
                    pages.push(embed);
                }
            } catch (error) {
                console.error(`Error ${type} (${crop}):`, error);
            }
        }
    }

    return pages;
}

export async function execute(
    interaction: ChatInputCommandInteraction<"cached">,
    nickname: string
): Promise<void> {
    const initialResponse = await interaction.deferReply({ withResponse });

    const { locale, user } = interaction;

    const userLocale = await getUserLocale(user);

    const currentLocale = userLocale ?? locale;

    const pages = await generateRenderPages(nickname, currentLocale);

    if (pages.length === 0) {
        await interaction.followUp({ content: translate(currentLocale, "minecraft.not_found", { nickname }) });
        return;
    }

    await interaction.followUp({ embeds: [pages[0]] });

    createPagination(initialResponse, {
        user,
        pages,
        initialPage: 1,
        timeout: 60_000
    });
}