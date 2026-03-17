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

const STAFF_ROLE_ID = "1482884660425003171"; // CHANGE THIS

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// 📜 Commands
const commands = [
    new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Send ticket panel'),

    new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot send a message')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message to send')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Ping bot')
].map(cmd => cmd.toJSON());

// 🔥 REST (FIXED)
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    console.log("🧹 Resetting commands...");

    await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: [] }
    );

    console.log("📥 Loading commands...");

    await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
    );

    console.log("✅ Commands loaded");
})();

const activeTickets = new Set();

client.on('interactionCreate', async interaction => {

    // SLASH COMMANDS
    if (interaction.isChatInputCommand()) {

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

            await interaction.reply({ embeds: [embed], components: [row] });
        }

        // 💬 SAY (CLEAN)
        if (interaction.commandName === 'say') {
            const msg = interaction.options.getString('message');

            await interaction.reply({ content: "✅ Sent!", ephemeral: true });

            await interaction.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(msg)
                        .setColor(0x0099ff)
                ]
            });
        }

        // 🏓 PING
        if (interaction.commandName === 'ping') {
            await interaction.reply("🏓 Pong!");
        }
    }

    // BUTTONS
    if (interaction.isButton()) {

        // 🎫 CREATE TICKET
        if (interaction.customId === 'create_ticket') {

            if (activeTickets.has(interaction.user.id)) {
                return interaction.reply({
                    content: "❌ You already have a ticket open!",
                    ephemeral: true
                });
            }

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
                        .setDescription('Support will be with you shortly.\nPress below to close.')
                        .setColor(0x00ff99)
                ],
                components: [closeRow]
            });

            await interaction.reply({
                content: `✅ Ticket created: ${channel}`,
                ephemeral: true
            });
        }

        // ❌ CLOSE TICKET
        if (interaction.customId === 'close_ticket') {

            activeTickets.delete(interaction.user.id);

            await interaction.reply({
                content: "🔒 Closing ticket in 3 seconds...",
                ephemeral: true
            });

            setTimeout(() => {
                interaction.channel.delete();
            }, 3000);
        }
    }
});

client.login(process.env.TOKEN);