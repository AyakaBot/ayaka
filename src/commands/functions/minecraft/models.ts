import { RenderCrops } from "starlightskinapi";

export interface RenderOptions {
    model?: Record<string, unknown>;
    camera?: Record<string, unknown>;
    lighting?: Record<string, unknown>;
}

export interface RenderConfig {
    supportedCrops: RenderCrops[];
    options?: RenderOptions;
}