const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, CommandInteraction, MessageEmbed } = require("discord.js");
const mongoose = require('mongoose');
const { QuickEmbed } = require("../../Functions/createEmbed");
const { client } = require('../../../start');
const { Mute } = require('../../Models/mutes');
const ms = require('ms');
const { DebugString } = require('../../Functions/Debug');
const { config } = require('../../Config/config');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute Member')
        .addUserOption(option =>
            option.setName('member')
           .setDescription('Member to Mute')
           .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
           .setDescription('Reason for Muting')
           .setRequired(true)
        )
        .addStringOption(option =>
             option.setName('duration')
            .setDescription('Duration for Muting')
            .setRequired(false)
        ),
   	/**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    async execute(interaction) {
        const member = interaction.options.getUser('member');
        const reason = interaction.options.getString('reason');
        const duration = interaction.options.getString('duration');
        const user = await interaction.guild.members.fetch(member.id);

        if (user.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                content: 'You cannot mute this user',
                ephemeral: true,
            });
        }

        if (user.roles.cache.has(config.MuteRole)) {
            return interaction.reply({
                content: 'This user is already muted',
                ephemeral: true,
            });
        }

        new Mute({
            userID: user.id,
            guildID: interaction.guild.id,
            moderator: interaction.user.id,
            reason: reason,
            duration: ms(duration),
            date: Date.now() + ms(duration),
        }).save();

        const muteEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL({ dynamic: true }) })
        .setTitle(`You have been muted in ${interaction.guild.name}`)
        .setDescription(`Reason: ${reason}`)
        .addField('Moderator', `${interaction.user.username}#${interaction.user.discriminator}`, true)
        .addField('Reason', `${reason}`, true)
        .addField('Duration', `${duration}`, true)
        .addField('Date', `${new Date(Date.now() + ms(duration))}`, true)
        .setTimestamp()
        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) });

        interaction.reply({
            embeds: [muteEmbed],
            ephemeral: true,
        });

       // user.roles.add(config.MuteRole);
        user.timeout(ms(duration), reason);
    },
};