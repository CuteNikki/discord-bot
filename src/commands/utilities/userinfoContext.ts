import { ApplicationCommandType, ApplicationIntegrationType, Colors, ContextMenuCommandBuilder, EmbedBuilder, InteractionContextType, Role } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { logger } from 'utils/logger';

const commandType = ApplicationCommandType.User;

export default new Command<typeof commandType>({
  module: ModuleType.Utilities,
  botPermissions: ['SendMessages'],
  data: new ContextMenuCommandBuilder()
    .setName('userinfo-context')
    .setType(commandType)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
  async execute({ interaction, client }) {
    const lng = await client.getUserLanguage(interaction.user.id);
    await interaction.deferReply({ ephemeral: true });

    const user = await client.users.fetch(interaction.targetId, { force: true }).catch((error) => logger.debug({ error }, 'Could not fetch user'));
    if (!user) return interaction.editReply({ content: t('userinfo.user', { lng }) });

    const flags = user.flags?.toArray() ?? [];

    const embeds: EmbedBuilder[] = [];

    const userEmbed = new EmbedBuilder()
      .setColor(Colors.Aqua)
      .setThumbnail(user.displayAvatarURL({ size: 4096 }))
      .setTitle(t('userinfo.user_embed_title', { lng }))
      .addFields(
        {
          name: t('userinfo.user_title', { lng }),
          value: [`${user} (\`${user.username}\` | ${user.id})`].join('\n'),
        },
        {
          name: t('userinfo.created_at', { lng }),
          value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
        },
      )
      .setImage(user.bannerURL({ size: 4096 }) ?? null);
    if (flags.length)
      userEmbed.addFields({
        name: t('userinfo.badges', { lng }),
        value: flags.map((v) => `\`${v}\``).join(' '),
      });
    if (user.banner)
      userEmbed.addFields({
        name: t('userinfo.banner', { lng }),
        value: '** **',
      });

    embeds.push(userEmbed);

    const member = await interaction.guild?.members.fetch(user.id).catch((error) => logger.debug({ error, userId: user.id }, 'Could not fetch member'));

    if (member) {
      //   const activities = [
      //     t('userinfo.activity.playing', { lng }),
      //     t('userinfo.activity.streaming', { lng }),
      //     t('userinfo.activity.listening', { lng }),
      //     t('userinfo.activity.watching', { lng }),
      //     t('userinfo.activity.custom', { lng }),
      //     t('userinfo.activity.competing', { lng }),
      //   ];
      //   const devices = Object.entries(member.presence?.clientStatus ?? {}).map(([key]) => `${key}`);

      //   const statusImage = {
      //     idle: 'https://i.ibb.co/tB36GNW/undefined-Imgur.png',
      //     dnd: 'https://i.ibb.co/SPqGC4P/undefined-Imgur-1.png',
      //     online: 'https://i.ibb.co/pnnTZhK/undefined-Imgur-2.png',
      //     offline: 'https://i.ibb.co/bQDDfBw/undefined-Imgur-3.png',
      //     invisible: 'https://i.ibb.co/bQDDfBw/undefined-Imgur-3.png',
      //   };

      const roles = member.roles.cache
        .map((r) => r)
        .sort((a, b) => b.position - a.position)
        .slice(0, member.roles.cache.size - 1);

      function maxDisplayRoles(roles: Role[]) {
        const results: string[] = [];
        let totalLength = 0;
        for (const role of roles) {
          const roleString = `<@&${role.id}> `;
          if (roleString.length + totalLength > 1000) break;
          results.push(roleString);
        }
        return results;
      }

      const memberEmbed = new EmbedBuilder()
        .setColor(Colors.Aqua)
        .setThumbnail(member.avatarURL({ size: 4096 }))
        .setAuthor({
          name: t('userinfo.member_embed_title', { lng }),
          // iconURL: statusImage[member.presence?.status ?? 'offline'],
        })
        .addFields(
          {
            name: t('userinfo.joined_at', { lng }),
            value: `<t:${Math.floor((member.joinedTimestamp ?? 0) / 1000)}:R>`,
          },
          //       {
          //         name: t('userinfo.activities', { lng }),
          //         value:
          //           member.presence?.activities
          //             ?.map((activity) => {
          //               if (activity.type === ActivityType.Custom) return;
          //               else return `${activities[activity.type]} ${activity.name}`;
          //             })
          //             .join('\n') || '/',
          //         inline: true,
          //       },
          //       {
          //         name: '\u200b',
          //         value: '\u200b',
          //         inline: true,
          //       },
          //       {
          //         name: t('userinfo.devices', { lng }),
          //         value: devices?.join(', ') || '/',
          //         inline: true,
          //       },
          {
            name: t('userinfo.boosting', { lng }),
            value: member.premiumSinceTimestamp ? `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>` : '/',
            inline: true,
          },
          //       {
          //         name: '\u200b',
          //         value: '\u200b',
          //         inline: true,
          //       }
        );

      const displayRoles = maxDisplayRoles(roles);
      if (roles.length)
        memberEmbed.addFields({
          name: t('userinfo.roles', {
            lng,
            showing: roles.length,
            total: displayRoles.length,
          }),
          value: displayRoles.join(''),
        });

      embeds.push(memberEmbed);
    }

    await interaction.editReply({ embeds });
  },
});
