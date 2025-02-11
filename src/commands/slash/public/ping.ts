import { translate } from "#translete";
import { ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import { Discord, Slash } from "discordx";

@Discord()
export class Ping {
    @Slash({
        name: "ping",
        description: "Reply with pong!",
        descriptionLocalizations: { "pt-BR": "Responde com pong!", },
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages"]
    })
    async run(interaction: ChatInputCommandInteraction<"cached">) {
        const { locale, client } = interaction;

        await interaction.reply(translate(locale, "client.messages.ping", { ping: client.ws.ping }));
    }
}
