import { getUserLocale } from "#database";
import { colors } from "#settings";
import { translate } from "#translete";
import { EmbedBuilder, Events, Locale, User } from "discord.js";
import { ArgsOf, Client, Discord, On } from "discordx";

const localeMap: Record<string, string> = {
    "en-us": "English",
    "pt-br": "Portuguese",
    "es-es": "Spanish",
    "ru": "Russian",
};

@Discord()
export class BotMention {
    @On({ event: Events.MessageCreate })
    async run([message]: ArgsOf<Events.MessageCreate>, client: Client) {
        const { mentions, author } = message;

        if (!mentions.has(client.user!.id) || author.bot) return;

        const userLocale = await getUserLocale(author);
        const embed = this.createEmbed(client, author, userLocale);

        await message.reply({ embeds: [embed] });
    }

    private createEmbed(client: Client, author: User, userLocale: Locale | null): EmbedBuilder {
        const userLanguage = localeMap[userLocale?.toString().toLowerCase() ?? "en-us"] || "English";

        return new EmbedBuilder()
            .setThumbnail(client.user!.displayAvatarURL())
            .setColor(colors.bravery)
            .setDescription(translate(userLocale ?? Locale.EnglishUS, "client.messages.botMention.description", {
                user: author.toString(),
                ayaka: client.user!.toString()
            }))
            .setFooter({
                text: translate(userLocale ?? Locale.EnglishUS, "client.messages.botMention.footerText", { owner: "piod" })
            })
            .addFields([{
                name: translate(userLocale ?? Locale.EnglishUS, "client.messages.botMention.fields.language.name"),
                value: translate(userLocale ?? Locale.EnglishUS, "client.messages.botMention.fields.language.value", {
                    userLocale: userLanguage
                }),
                inline: true
            },
            {
                name: translate(userLocale ?? Locale.EnglishUS, "client.messages.botMention.fields.library.name"),
                value: translate(userLocale ?? Locale.EnglishUS, "client.messages.botMention.fields.library.value"),
                inline: true
            }]);
    }
}
