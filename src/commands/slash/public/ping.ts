import { getLocalizations, translate } from "#translete";
import { ChatInputCommandInteraction, InteractionContextType } from "discord.js";
import { Discord, Slash } from "discordx";

@Discord()
export class Ping {
    @Slash({
        name: "ping",
        nameLocalizations: getLocalizations("ping.name"),
        description: "Reply with pong!",
        descriptionLocalizations: getLocalizations("ping.description"),
        contexts: [InteractionContextType.Guild],
        defaultMemberPermissions: ["SendMessages"]
    })
    async run(interaction: ChatInputCommandInteraction<"cached">) {
        const { locale, client } = interaction;

        await interaction.reply(translate(locale, "client.messages.ping", { ping: client.ws.ping }));
    }
}
