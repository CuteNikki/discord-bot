import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  InteractionContextType,
  Message,
  PermissionFlagsBits,
  Role,
  RoleSelectMenuBuilder,
  SlashCommandBuilder,
  TextChannel,
  User
} from 'discord.js';
import { t } from 'i18next';

import type { DiscordClient } from 'classes/client';
import { Command, ModuleType } from 'classes/command';

import { addReactionGroup, deleteReactionGroupById, disableReactionRoles, enableReactionRoles, getReactionRoles } from 'db/reaction-roles';

import type { Reaction } from 'types/reaction-roles';

import { chunk } from 'utils/common';
import { logger } from 'utils/logger';

const TIMEOUT_DURATION = 60_000; // Constant for the timeout duration
const MAX_ROLES = 20; // Constant for the maximum number of roles
const MAX_GROUPS = 10; // Constant for the maximum number of groups

export default new Command({
  module: ModuleType.Config,
  data: new SlashCommandBuilder()
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setName('reaction-roles')
    .setDescription('Give members a role when they react to a message.')
    .addSubcommand((cmd) => cmd.setName('enable').setDescription('Enable reaction roles.'))
    .addSubcommand((cmd) => cmd.setName('disable').setDescription('Disable reaction roles.'))
    .addSubcommand((cmd) => cmd.setName('setup').setDescription('Set up reaction roles.'))
    .addSubcommand((cmd) => cmd.setName('info').setDescription('View all reaction role groups.'))
    .addSubcommand((cmd) =>
      cmd
        .setName('delete')
        .setDescription('Delete a reaction role group.')
        .addStringOption((option) => option.setName('id').setDescription('Either the group ID or the message ID').setRequired(true))
    ),
  async execute({ client, interaction, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply();

    const { guild, options, user } = interaction;

    const reactionRoles = (await getReactionRoles(guild.id)) ?? { enabled: false, channelId: null, groups: [] };

    switch (options.getSubcommand()) {
      case 'enable':
        {
          if (reactionRoles.enabled) {
            await interaction
              .editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reaction-roles.enable.already', { lng }))]
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }

          await enableReactionRoles(guild.id);

          await interaction
            .editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.reactionRoles).setDescription(t('reaction-roles.enable.success', { lng }))]
            })
            .catch((err) => logger.debug(err, 'Could not edit reply'));
        }
        break;
      case 'disable':
        {
          if (!reactionRoles.enabled) {
            await interaction
              .editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reaction-roles.disable.already', { lng }))]
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }

          await disableReactionRoles(guild.id);

          await interaction
            .editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.reactionRoles).setDescription(t('reaction-roles.disable.success', { lng }))]
            })
            .catch((err) => logger.debug(err, 'Could not edit reply'));
        }
        break;
      case 'delete':
        {
          const id = options.getString('id');

          const group = reactionRoles.groups.find((g) => g.messageId === id || g._id.toString() === id);
          if (!group) {
            await interaction
              .editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reaction-roles.delete.invalid', { lng }))]
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }

          await deleteReactionGroupById(guild.id, group._id.toString());

          await interaction
            .editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.reactionRoles).setDescription(t('reaction-roles.delete.success', { lng }))]
            })
            .catch((err) => logger.debug(err, 'Could not edit reply'));
        }
        break;
      case 'info':
        {
          const groups = reactionRoles.groups;

          const embeds = [
            new EmbedBuilder().setColor(client.colors.reactionRoles).addFields({
              name: t('reaction-roles.info.state', { lng }),
              value: reactionRoles.enabled ? t('enabled', { lng }) : t('disabled', { lng })
            })
          ];
          if (groups.length) {
            for (const group of groups) {
              const channel = (await guild.channels.fetch(group.channelId).catch((err) => logger.debug(err, 'Could not fetch channel'))) as TextChannel;
              const message = await channel?.messages.fetch(group.messageId).catch((err) => logger.debug(err, 'Could not fetch message'));
              if (!channel || !message) {
                await deleteReactionGroupById(guild.id, group._id.toString());
                continue;
              }

              embeds.push(
                new EmbedBuilder()
                  .setColor(client.colors.reactionRoles)
                  .setTitle(group._id.toString())
                  .setDescription(
                    [
                      `https://discord.com/channels/${guild.id}/${group.channelId}/${group.messageId}`,
                      group.reactions.map((r) => `${r.emoji}: <@&${r.roleId}>`).join('\n')
                    ].join('\n')
                  )
              );
            }
          }

          await interaction.editReply({ embeds }).catch((err) => logger.debug(err, 'Could not edit reply'));
        }
        break;
      case 'setup':
        {
          if (reactionRoles.groups.length >= MAX_GROUPS) {
            await interaction
              .editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reaction-roles.setup.limit', { lng, max: MAX_GROUPS }))]
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }

          await handleMethod(interaction, lng, user, client);
        }
        break;
    }
  }
});

async function handleRoleReactions(
  roles: Role[],
  interaction: ChatInputCommandInteraction,
  lng: string,
  user: User,
  client: DiscordClient,
  reactions: Reaction[],
  method: 'button' | 'reaction',
  channel: TextChannel
) {
  for (const role of roles) {
    try {
      const reactionMessage = await sendReactionMessage(interaction, role, client, lng);
      if (!reactionMessage) return; // Stop if no reaction message was sent

      const reaction = await awaitUserReaction(reactionMessage, user, interaction, client, lng);
      if (!reaction) return; // Stop if no reaction was provided

      await clearReactions(reactionMessage);

      // Save reaction if it is not already in the list
      if (!reactions.map((r) => r.emoji).includes(reaction.emoji.toString())) {
        reactions.push({
          emoji: reaction.emoji.toString(),
          roleId: role.id
        });
      }
    } catch (error) {
      logger.debug(error, `Error handling reaction for role ${role.id}`);
      return; // Exit loop on error
    }
  }

  const msg = await channel
    .send({
      embeds: [new EmbedBuilder().setColor(client.colors.general).setDescription(reactions.map((r) => `${r.emoji}: <@&${r.roleId}>`).join('\n'))],
      components:
        method === 'button'
          ? chunk(
              reactions.map((r) => r.emoji),
              5
            ).map((chunk, chunkIndex) =>
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                chunk.map((emoji, emojiIndex) =>
                  new ButtonBuilder()
                    .setCustomId(`button-reaction-select_${chunkIndex * 5 + emojiIndex}`)
                    .setEmoji(emoji)
                    .setStyle(ButtonStyle.Secondary)
                )
              )
            )
          : []
    })
    .catch((err) => logger.debug(err, 'Could not send message'));
  if (!msg) return;
  if (method === 'reaction') {
    for (const reaction of reactions) {
      await msg.react(reaction.emoji).catch((err) => logger.debug(err, 'Could not react to message'));
    }
  }

  await addReactionGroup(interaction.guildId!, msg.id, channel.id, reactions);

  await interaction
    .editReply({
      embeds: [
        new EmbedBuilder().setColor(client.colors.reactionRoles).setDescription(
          t('reaction-roles.setup.success', {
            lng,
            count: reactions.length,
            channel: channel.toString()
          })
        )
      ]
    })
    .catch((err) => logger.debug(err, 'Could not edit reply'));
}

// Helper function to send the initial message
async function sendReactionMessage(interaction: ChatInputCommandInteraction, role: Role, client: DiscordClient, lng: string) {
  return await interaction
    .editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.reactionRoles)
          .setDescription(
            [
              t('reaction-roles.emojis.description', { lng, role: role.toString() }),
              t('reaction-roles.emojis.warning', { lng }),
              t('reaction-roles.emojis.info', { lng })
            ].join('\n')
          )
      ],
      components: []
    })
    .catch((err) => logger.debug(err, 'Could not edit reply'));
}

// Helper function to await the user's reaction
async function awaitUserReaction(reactionMessage: Message, user: User, interaction: ChatInputCommandInteraction, client: DiscordClient, lng: string) {
  try {
    const userReactions = await reactionMessage
      .awaitReactions({
        max: 1,
        time: TIMEOUT_DURATION,
        filter: (_reaction, u) => u.id === user.id
      })
      .catch((err) => logger.debug(err, 'Could not await reactions'));

    if (!userReactions || !userReactions.first()) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reaction-roles.emojis.none', { lng }))],
        components: []
      });
      return null; // Exit if no reaction within time
    }

    return userReactions.first(); // Return the first reaction
  } catch (err) {
    logger.debug(err, 'Could not await reactions');

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reaction-roles.emojis.error', { lng }))],
      components: []
    });
    return null;
  }
}

// Helper function to clear all reactions
async function clearReactions(reactionMessage: Message) {
  try {
    await reactionMessage.reactions.removeAll();
  } catch (err) {
    logger.debug(err, 'Could not remove all reactions');
  }
}

async function handleMethod(interaction: ChatInputCommandInteraction, lng: string, user: User, client: DiscordClient) {
  let method: 'button' | 'reaction';

  const methodMessage = await interaction
    .editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.reactionRoles)
          .setDescription([t('reaction-roles.method.description', { lng }), t('reaction-roles.method.recommendation', { lng })].join('\n'))
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-reaction-buttons').setLabel(t('reaction-roles.method.buttons', { lng })).setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('button-reaction-reactions').setLabel(t('reaction-roles.method.reactions', { lng })).setStyle(ButtonStyle.Primary)
        )
      ]
    })
    .catch((err) => logger.debug(err, 'Could not edit reply'));
  if (!methodMessage) return;

  const methodCollector = methodMessage.createMessageComponentCollector({
    idle: TIMEOUT_DURATION,
    componentType: ComponentType.Button,
    filter: (i) => i.user.id === user.id
  });

  methodCollector.on('collect', async (methodInteraction) => {
    if (methodInteraction.customId === 'button-reaction-buttons') {
      method = 'button';
      await methodInteraction.deferUpdate().catch((err) => logger.debug(err, 'Could not defer update'));
      methodCollector.stop('continue');
      return;
    }
    if (methodInteraction.customId === 'button-reaction-reactions') {
      method = 'reaction';
      await methodInteraction.deferUpdate().catch((err) => logger.debug(err, 'Could not defer update'));
      methodCollector.stop('continue');
      return;
    }
  });

  methodCollector.on('end', async (_, reason) => {
    if (reason !== 'continue' || !method) {
      await interaction
        .editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reaction-roles.method.none', { lng }))],
          components: []
        })
        .catch((err) => logger.debug(err, 'Could not edit reply'));
      return;
    }

    await handleChannel(interaction, lng, user, client, method);
  });
}

async function handleChannel(interaction: ChatInputCommandInteraction, lng: string, user: User, client: DiscordClient, method: 'button' | 'reaction') {
  let channel: TextChannel;

  const channelMessage = await interaction
    .editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.reactionRoles)
          .setDescription([t('reaction-roles.channel.description', { lng }), t('reaction-roles.channel.info', { lng })].join('\n'))
      ],
      components: [
        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId('select-reaction-channel')
            .setPlaceholder(t('reaction-roles.channel.placeholder', { lng }))
            .setChannelTypes(ChannelType.GuildText)
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-reaction-continue').setLabel(t('reaction-roles.setup.continue', { lng })).setStyle(ButtonStyle.Primary)
        )
      ]
    })
    .catch((err) => logger.debug(err, 'Could not edit reply'));
  if (!channelMessage) return;

  const channelCollector = channelMessage.createMessageComponentCollector({
    idle: TIMEOUT_DURATION,
    filter: (i) => i.user.id === user.id
  });

  channelCollector.on('collect', async (channelInteraction) => {
    if (!channelInteraction.inCachedGuild()) return;

    if (channelInteraction.customId === 'button-reaction-continue') {
      if (!channel) {
        await channelInteraction
          .reply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reaction-roles.channel.none', { lng }))],
            ephemeral: true
          })
          .catch((err) => logger.debug(err, 'Could not reply'));
        return;
      }

      await channelInteraction.deferUpdate().catch((err) => logger.debug(err, 'Could not defer update'));
      channelCollector.stop('continue');
      return;
    }

    if (channelInteraction.isChannelSelectMenu()) {
      channel = channelInteraction.channels.first() as TextChannel;

      await channelInteraction
        .update({
          embeds: [
            new EmbedBuilder().setColor(client.colors.reactionRoles).setDescription(t('reaction-roles.channel.selected', { lng, channel: channel.toString() }))
          ]
        })
        .catch((err) => logger.debug(err, 'Could not update channel'));
    }
  });

  channelCollector.on('end', async (_, reason) => {
    if (reason !== 'continue' || !channel) {
      await interaction
        .editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reaction-roles.channel.none', { lng }))],
          components: []
        })
        .catch((err) => logger.debug(err, 'Could not edit reply'));
      return;
    }

    await handleRoles(interaction, lng, user, client, method, channel);
  });
}

async function handleRoles(
  interaction: ChatInputCommandInteraction,
  lng: string,
  user: User,
  client: DiscordClient,
  method: 'button' | 'reaction',
  channel: TextChannel
) {
  let roles: Role[] = [];
  const reactions: Reaction[] = [];

  const rolesMessage = await interaction
    .editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.reactionRoles)
          .setDescription([t('reaction-roles.roles.description', { lng }), t('reaction-roles.roles.info', { lng })].join('\n'))
      ],
      components: [
        new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId('select-reaction-roles')
            .setMinValues(1)
            .setMaxValues(MAX_ROLES)
            .setPlaceholder(t('reaction-roles.roles.placeholder', { lng }))
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-reaction-continue').setLabel(t('reaction-roles.setup.continue', { lng })).setStyle(ButtonStyle.Primary)
        )
      ]
    })
    .catch((err) => logger.debug(err, 'Could not edit reply'));
  if (!rolesMessage) return;

  const rolesCollector = rolesMessage.createMessageComponentCollector({
    idle: TIMEOUT_DURATION,
    filter: (i) => i.user.id === user.id
  });

  rolesCollector.on('collect', async (roleInteraction) => {
    if (!roleInteraction.inCachedGuild()) return;

    if (roleInteraction.customId === 'button-reaction-continue') {
      if (!roles.length) {
        await roleInteraction
          .reply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reaction-roles.roles.none', { lng }))],
            ephemeral: true
          })
          .catch((err) => logger.debug(err, 'Could not reply'));
        return;
      }

      await roleInteraction.deferUpdate();
      rolesCollector.stop('continue');
      return;
    }

    if (roleInteraction.isRoleSelectMenu()) {
      roles = roleInteraction.roles
        .toJSON()
        .filter((r) => !r.managed)
        .sort((a, b) => b.position - a.position)
        .slice(0, MAX_ROLES);

      if (roles.length <= 0 || roles.length > MAX_ROLES) {
        await roleInteraction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reaction-roles.roles.limit', { lng, max: MAX_ROLES }))],
          ephemeral: true
        });
        return;
      }

      await roleInteraction
        .update({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.reactionRoles)
              .setDescription(
                [
                  t('reaction-roles.roles.info', { lng }),
                  t('reaction-roles.roles.selected', { lng, count: roles.length, roles: roles.map((r) => r.toString()).join(', ') })
                ].join('\n')
              )
          ]
        })
        .catch((err) => logger.debug(err, 'Could not update message'));
    }
  });

  rolesCollector.on('end', async (_, reason) => {
    if (reason !== 'continue' || !roles.length) {
      await interaction
        .editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reaction-roles.roles.none', { lng }))],
          components: []
        })
        .catch((err) => logger.debug(err, 'Could not edit reply'));
      return;
    }

    await handleRoleReactions(roles, interaction, lng, user, client, reactions, method, channel);
  });
}
