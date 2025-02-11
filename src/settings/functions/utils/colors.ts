import rawColors from "../../JSON/colors.json" with { type: "json" };
import { ColorResolvable } from "discord.js";

type RawColors = typeof rawColors;

const colors: Record<keyof RawColors, ColorResolvable> = Object.fromEntries(
  Object.entries(rawColors).map(([key, value]) => {
    if (typeof value === "string" || typeof value === "number") {
      return [key, value as ColorResolvable];
    }
    throw new Error(`Invalid color format for key ${key}`);
  })
) as Record<keyof RawColors, ColorResolvable>;

export { colors };
