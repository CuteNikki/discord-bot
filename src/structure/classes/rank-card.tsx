import { Builder, Font, FontFactory, JSX, StyleSheet } from 'canvacord';

import { statusColors } from 'constants/canvacord';
import type { PropsType, RankCardProps } from 'types/rank-card';

export class RankCard extends Builder {
  props: RankCardProps;

  constructor(props: PropsType) {
    super(930, 280); // width, height

    this.props = {
      ...props,
      abbreviate: props.abbreviate ?? true,
      styles: {
        ...props.styles
      },
      texts: {
        ...props.texts
      }
    };

    if (!FontFactory.size) {
      Font.loadDefault();
    }
  }

  async render() {
    const { rank, level, currentXP, requiredXP, abbreviate, username, handle, avatar, status, styles, texts, backgroundColor } = this.props;

    const clamp = (value: number) => Math.max(0, Math.min(100, value));
    const progress = Math.round(((currentXP ?? 0) / (requiredXP ?? 0)) * 100);
    const progressWidth = typeof progress !== 'number' || Number.isNaN(progress) ? 0 : clamp(progress);
    const fixed = (v: number, r: boolean) => {
      if (!r) return v;
      const formatter = new Intl.NumberFormat('en-US', { notation: 'compact' });
      return formatter.format(v);
    };

    return JSX.createElement(
      'div',
      { className: 'flex h-full w-full p-6' },
      JSX.createElement(
        'div',
        {
          className: StyleSheet.cn(
            backgroundColor && !backgroundColor.startsWith('url(') ? `bg-[${backgroundColor}]` : 'bg-[#2b2f35]',
            'flex items-center rounded-2xl h-full w-full px-4',
            StyleSheet.tw(styles.overlay)
          ),
          style: StyleSheet.compose(
            {
              backgroundImage: backgroundColor?.startsWith('url(') ? backgroundColor : undefined,
              backgroundSize: backgroundColor?.startsWith('url(') ? '100% 100%' : undefined
            },
            StyleSheet.css(styles.background)
          )
        },
        JSX.createElement(
          'div',
          {
            className: StyleSheet.cn('flex relative', StyleSheet.tw(styles.avatar?.container)),
            style: StyleSheet.css(styles.avatar?.container)
          },
          JSX.createElement('img', {
            alt: 'avatar',
            src: avatar,
            className: StyleSheet.cn('h-38 w-38 rounded-full ml-4', StyleSheet.tw(styles.avatar?.image))
          }),
          status
            ? status !== 'none'
              ? JSX.createElement('div', {
                  className: StyleSheet.cn(
                    'absolute h-8 w-8 rounded-full bottom-5 right-0 flex',
                    `bg-[${statusColors[status]}]`,
                    StyleSheet.tw(styles.avatar?.status)
                  ),
                  style: StyleSheet.css(styles.avatar?.status)
                })
              : JSX.createElement('div', { className: 'hidden ' })
            : JSX.createElement('div', { className: 'hidden' })
        ),
        JSX.createElement(
          'div',
          {
            className: StyleSheet.cn('flex flex-col ml-8', StyleSheet.tw(styles.container)),
            style: StyleSheet.css(styles.container)
          },
          JSX.createElement(
            'div',
            {
              className: StyleSheet.cn('flex flex-col', StyleSheet.tw(styles.username?.container)),
              style: StyleSheet.css(styles.username?.container)
            },
            username
              ? JSX.createElement(
                  'h1',
                  {
                    className: StyleSheet.cn('text-white font-semibold text-3xl mb-0', StyleSheet.tw(styles.username?.name), !handle ? 'mb-2' : ''),
                    style: StyleSheet.css(styles.username?.name)
                  },
                  username as unknown as JSX.Element
                )
              : JSX.createElement('div', { className: 'hidden' }),
            handle
              ? JSX.createElement(
                  'p',
                  {
                    className: StyleSheet.cn('text-[#808386] font-semibold text-lg mt-0', StyleSheet.tw(styles.username?.handle)),
                    style: StyleSheet.css(styles.username?.handle)
                  },
                  handle as unknown as JSX.Element
                )
              : JSX.createElement('div', { className: 'hidden' })
          ),
          JSX.createElement(
            'div',
            {
              className: StyleSheet.cn('flex relative', StyleSheet.tw(styles.progressbar?.container)),
              style: StyleSheet.css(styles.progressbar?.container)
            },
            JSX.createElement(
              'div',
              {
                className: StyleSheet.cn('bg-[#484b4e] w-160 h-6 rounded-xl flex', StyleSheet.tw(styles.progressbar?.track)),
                style: StyleSheet.css(styles.progressbar?.track)
              },
              JSX.createElement('div', {
                className: StyleSheet.cn('bg-[#fff] max-w-160 h-6 rounded-xl absolute flex', `w-[${progressWidth}%]`, StyleSheet.tw(styles.progressbar?.thumb)),
                style: StyleSheet.css(styles.progressbar?.thumb)
              })
            )
          ),
          JSX.createElement(
            'div',
            {
              className: StyleSheet.cn('flex', StyleSheet.tw(styles.statistics?.container)),
              style: StyleSheet.css(styles.statistics?.container)
            },
            level != null
              ? JSX.createElement(
                  'div',
                  {
                    className: StyleSheet.cn('flex items-center text-[#808386] font-medium', StyleSheet.tw(styles.statistics?.level?.container)),
                    style: StyleSheet.css(styles.statistics?.level?.container)
                  },
                  JSX.createElement(
                    'h3',
                    {
                      className: StyleSheet.tw(styles.statistics?.level?.text),
                      style: StyleSheet.css(styles.statistics?.level?.text)
                    },
                    (texts.level || 'LEVEL:') as unknown as JSX.Element
                  ),
                  JSX.createElement(
                    'span',
                    {
                      className: StyleSheet.cn('text-white ml-1', StyleSheet.tw(styles.statistics?.level?.value)),
                      style: StyleSheet.css(styles.statistics?.level?.value)
                    },
                    fixed(level, abbreviate) as unknown as JSX.Element
                  )
                )
              : JSX.createElement('div', { className: 'hidden ' }),
            currentXP != null
              ? JSX.createElement(
                  'div',
                  {
                    className: StyleSheet.cn('flex items-center text-[#808386] font-medium ml-8', StyleSheet.tw(styles.statistics?.xp?.container)),
                    style: StyleSheet.css(styles.statistics?.xp?.container)
                  },
                  JSX.createElement(
                    'h3',
                    {
                      className: StyleSheet.tw(styles.statistics?.xp?.text),
                      style: StyleSheet.css(styles.statistics?.xp?.text)
                    },
                    (texts.xp || 'XP:') as unknown as JSX.Element
                  ),
                  JSX.createElement(
                    'span',
                    {
                      className: StyleSheet.cn('text-white ml-1', StyleSheet.tw(styles.statistics?.xp?.value)),
                      style: StyleSheet.css(styles.statistics?.xp?.value)
                    },
                    fixed(currentXP, abbreviate) as unknown as JSX.Element
                  )
                )
              : JSX.createElement('div', { className: 'hidden' }),
            rank != null
              ? JSX.createElement(
                  'div',
                  {
                    className: StyleSheet.cn('flex items-center text-[#808386] font-medium ml-8', StyleSheet.tw(styles.statistics?.xp?.container)),
                    style: StyleSheet.css(styles.statistics?.xp?.container)
                  },
                  JSX.createElement(
                    'h3',
                    {
                      className: StyleSheet.tw(styles.statistics?.xp?.text),
                      style: StyleSheet.css(styles.statistics?.xp?.text)
                    },
                    (texts.rank || 'RANK:') as unknown as JSX.Element
                  ),
                  JSX.createElement(
                    'span',
                    {
                      className: StyleSheet.cn('text-white ml-1', StyleSheet.tw(styles.statistics?.xp?.value)),
                      style: StyleSheet.css(styles.statistics?.xp?.value)
                    },
                    fixed(rank, abbreviate) as unknown as JSX.Element
                  )
                )
              : JSX.createElement('div', { className: 'hidden ' })
          )
        )
      )
    ) as JSX.Element;
  }
}
