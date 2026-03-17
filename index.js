require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    SlashCommandBuilder,
    Routes,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionsBitField
} = require('discord.js');

const { REST } = require('@discordjs/rest');

const STAFF_ROLE_ID = "1482921225750839398"; // 🔥 CHANGE THIS
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ✅ READY
client.once('clientReady', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// 📜 COMMANDS
const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Ping the bot'),

    new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot send a message')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Send ticket panel')
].map(cmd => cmd.toJSON());

// 🚀 REGISTER COMMANDS (INSTANT)
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log("🧹 Resetting commands...");
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: [] }
        );

        console.log("📥 Loading commands...");
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );

        console.log("✅ Commands loaded");
    } catch (err) {
        console.error(err);
    }
})();

const activeTickets = new Set();

// 🎯 INTERACTIONS
client.on('interactionCreate', async interaction => {
    try {

        // SLASH COMMANDS
        if (interaction.isChatInputCommand()) {

            // 🏓 PING
            if (interaction.commandName === 'ping') {
                return interaction.reply({ content: "🏓 Pong!" });
            }

            // 💬 SAY
            if (interaction.commandName === 'say') {
                const msg = interaction.options.getString('message');

                await interaction.reply({ content: "✅ Sent!", ephemeral: true });

                return interaction.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(msg)
                            .setColor(0x0099ff)
                    ]
                });
            }

            // 🎫 TICKET PANEL
            if (interaction.commandName === 'ticket') {

                const embed = new EmbedBuilder()
                    .setTitle('🎫 Support Tickets')
                    .setDescription('Click below to open a ticket')
                    .setColor(0x0099ff);

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_ticket')
                        .setLabel('🎫 Create Ticket')
                        .setStyle(ButtonStyle.Primary)
                );

                return interaction.reply({
                    embeds: [embed],
                    components: [row]
                });
            }
        }

        // 🔘 BUTTONS
        if (interaction.isButton()) {

            // CREATE TICKET
            if (interaction.customId === 'create_ticket') {

                if (activeTickets.has(interaction.user.id)) {
                    return interaction.reply({
                        content: "❌ You already have a ticket open!",
                        ephemeral: true
                    });
                }

                await interaction.reply({
                    content: "✅ Creating ticket...",
                    ephemeral: true
                });

                const channel = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.username}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel]
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionsBitField.Flags.ViewChannel]
                        },
                        {
                            id: STAFF_ROLE_ID,
                            allow: [PermissionsBitField.Flags.ViewChannel]
                        }
                    ]
                });

                activeTickets.add(interaction.user.id);

                const closeRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('❌ Close Ticket')
                        .setStyle(ButtonStyle.Danger)
                );

                await channel.send({
                    content: `<@${interaction.user.id}> <@&${STAFF_ROLE_ID}>`,
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('🎫 Ticket Opened')
                            .setDescription('Support will be with you shortly.')
                            .setColor(0x00ff99)
                    ],
                    components: [closeRow]
                });
            }

            // CLOSE TICKET
            if (interaction.customId === 'close_ticket') {

                await interaction.reply({
                    content: "🔒 Closing ticket...",
                    ephemeral: true
                });

                setTimeout(() => {
                    interaction.channel.delete().catch(() => {});
                }, 2000);
            }
        }

    } catch (err) {
        console.error(err);

        if (!interaction.replied) {
            interaction.reply({
                content: "❌ Something went wrong",
                ephemeral: true
            }).catch(() => {});
        }
    }
});

// 🔑 LOGIN
client.login(TOKEN);
