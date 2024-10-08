/** @jsx JSX.createElement */
/** @jsxFrag JSX.Fragment */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Builder, Font, FontFactory, JSX, StyleSheet, type Stylable } from 'canvacord';

type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline' | 'streaming' | 'invisible' | 'none';

interface PropsType {
  handle: string | null;
  username: string | null;
  avatar: string;
  status: PresenceStatus | null;
  currentXP: number | null;
  requiredXP: number | null;
  rank: number | null;
  level: number | null;
  backgroundColor?: string;
  abbreviate: boolean;
  texts?: Partial<{
    level: string;
    xp: string;
    rank: string;
  }>;
  styles?: Partial<{
    container: Stylable;
    background: Stylable;
    overlay: Stylable;
    avatar: Partial<{
      container: Stylable;
      image: Stylable;
      status: Stylable;
    }>;
    username: Partial<{
      container: Stylable;
      name: Stylable;
      handle: Stylable;
    }>;
    progressbar: Partial<{
      container: Stylable;
      thumb: Stylable;
      track: Stylable;
    }>;
    statistics: Partial<{
      container: Stylable;
      level: Partial<{
        container: Stylable;
        text: Stylable;
        value: Stylable;
      }>;
      xp: Partial<{
        container: Stylable;
        text: Stylable;
        value: Stylable;
      }>;
      rank: Partial<{
        container: Stylable;
        text: Stylable;
        value: Stylable;
      }>;
    }>;
  }>;
}

export type RankCardProps = PropsType & {
  texts: Partial<{
    level: string;
    xp: string;
    rank: string;
  }>;
  styles: Partial<{
    container: Stylable;
    background: Stylable;
    overlay: Stylable;
    avatar: Partial<{
      container: Stylable;
      image: Stylable;
      status: Stylable;
    }>;
    username: Partial<{
      container: Stylable;
      name: Stylable;
      handle: Stylable;
    }>;
    progressbar: Partial<{
      container: Stylable;
      thumb: Stylable;
      track: Stylable;
    }>;
    statistics: Partial<{
      container: Stylable;
      level: Partial<{
        container: Stylable;
        text: Stylable;
        value: Stylable;
      }>;
      xp: Partial<{
        container: Stylable;
        text: Stylable;
        value: Stylable;
      }>;
      rank: Partial<{
        container: Stylable;
        text: Stylable;
        value: Stylable;
      }>;
    }>;
  }>;
};

const Colors = {
  online: '#43b581',
  idle: '#faa61a',
  dnd: '#f04747',
  offline: '#747f8d',
  streaming: '#593695',
  invisible: '#747f8d'
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export class RankCard extends Builder {
  props: RankCardProps;

  constructor(props: PropsType) {
    super(930, 280); // width, height

    this.props = {
      ...props,
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

    const shouldSkipStats = currentXP == null && requiredXP == null;
    const progress = Math.round(((currentXP ?? 0) / (requiredXP ?? 0)) * 100);
    const progressWidth = typeof progress !== 'number' || Number.isNaN(progress) ? 0 : clamp(progress);
    const fixed = (v: number, r: boolean) => {
      if (!r) return v;
      const formatter = new Intl.NumberFormat('en-US', { notation: 'compact' });
      return formatter.format(v);
    };

    return (
      <div className={StyleSheet.cn('flex h-full w-full p-6')}>
        <div
          className={StyleSheet.cn(
            backgroundColor && !backgroundColor.startsWith('url(') ? `bg-[${backgroundColor}]` : 'bg-[#2b2f35]',
            'flex items-center rounded-2xl h-full w-full px-4',
            StyleSheet.tw(styles.overlay)
          )}
          style={StyleSheet.compose(
            {
              backgroundImage: backgroundColor?.startsWith('url(') ? backgroundColor : undefined,
              backgroundSize: backgroundColor?.startsWith('url(') ? '100% 100%' : undefined
            },
            StyleSheet.css(styles.background)
          )}
        >
          <div className={StyleSheet.cn('flex relative', StyleSheet.tw(styles.avatar?.container))} style={StyleSheet.css(styles.avatar?.container)}>
            <img
              alt='avatar'
              src={avatar}
              className={StyleSheet.cn('h-38 w-38 rounded-full ml-4', StyleSheet.tw(styles.avatar?.image))}
              style={StyleSheet.css(styles.avatar?.image)}
            />
            {status && status !== 'none' ? (
              <div
                className={StyleSheet.cn('absolute h-8 w-8 rounded-full bottom-5 right-0 flex', `bg-[${Colors[status]}]`, StyleSheet.tw(styles.avatar?.status))}
                style={StyleSheet.css(styles.avatar?.status)}
              />
            ) : null}
          </div>
          <div className={StyleSheet.cn('flex flex-col ml-8', StyleSheet.tw(styles.container))} style={StyleSheet.css(styles.container)}>
            <div className={StyleSheet.cn('flex flex-col', StyleSheet.tw(styles.username?.container))} style={StyleSheet.css(styles.username?.container)}>
              {username && (
                <h1
                  className={StyleSheet.cn('text-white font-semibold text-3xl mb-0', StyleSheet.tw(styles.username?.name), !handle ? 'mb-2' : '')}
                  style={StyleSheet.css(styles.username?.name)}
                >
                  {username}
                </h1>
              )}
              {handle && (
                <p
                  className={StyleSheet.cn('text-[#808386] font-semibold text-lg mt-0', StyleSheet.tw(styles.username?.handle))}
                  style={StyleSheet.css(styles.username?.handle)}
                >
                  {handle}
                </p>
              )}
            </div>
            <div className={StyleSheet.cn('flex relative', StyleSheet.tw(styles.progressbar?.container))} style={StyleSheet.css(styles.progressbar?.container)}>
              <div
                className={StyleSheet.cn('bg-[#484b4e] w-160 h-6 rounded-xl flex', StyleSheet.tw(styles.progressbar?.track))}
                style={StyleSheet.css(styles.progressbar?.track)}
              />
              <div
                className={StyleSheet.cn('bg-[#fff] max-w-160 h-6 rounded-xl absolute flex', `w-[${progressWidth}%]`, StyleSheet.tw(styles.progressbar?.thumb))}
                style={StyleSheet.css(styles.progressbar?.thumb)}
              />
            </div>
            <div className={StyleSheet.cn('flex', StyleSheet.tw(styles.statistics?.container))} style={StyleSheet.css(styles.statistics?.container)}>
              {level != null && (
                <div
                  className={StyleSheet.cn('flex items-center text-[#808386] font-medium', StyleSheet.tw(styles.statistics?.level?.container))}
                  style={StyleSheet.css(styles.statistics?.level?.container)}
                >
                  <h3 className={StyleSheet.tw(styles.statistics?.level?.text)} style={StyleSheet.css(styles.statistics?.level?.text)}>
                    {texts.level || 'LEVEL:'}
                    <span
                      className={StyleSheet.cn('text-white ml-1', StyleSheet.tw(styles.statistics?.level?.value))}
                      style={StyleSheet.css(styles.statistics?.level?.value)}
                    >
                      {fixed(level, abbreviate)}
                    </span>
                  </h3>
                </div>
              )}
              {!shouldSkipStats && (
                <div
                  className={StyleSheet.cn('flex items-center text-[#808386] font-medium ml-8', StyleSheet.tw(styles.statistics?.xp?.container))}
                  style={StyleSheet.css(styles.statistics?.xp?.container)}
                >
                  <h3 className={StyleSheet.tw(styles.statistics?.xp?.text)} style={StyleSheet.css(styles.statistics?.xp?.text)}>
                    {texts.xp || 'XP:'}
                    <span
                      className={StyleSheet.cn('text-white ml-1', StyleSheet.tw(styles.statistics?.xp?.value))}
                      style={StyleSheet.css(styles.statistics?.xp?.value)}
                    >
                      {fixed(currentXP ?? 0, abbreviate)}/{fixed(requiredXP ?? 0, abbreviate)}
                    </span>
                  </h3>
                </div>
              )}
              {rank != null && (
                <div
                  className={StyleSheet.cn('flex items-center text-[#808386] font-medium ml-8', StyleSheet.tw(styles.statistics?.rank?.container))}
                  style={StyleSheet.css(styles.statistics?.rank?.container)}
                >
                  <h3 className={StyleSheet.tw(styles.statistics?.rank?.text)} style={StyleSheet.css(styles.statistics?.rank?.text)}>
                    {texts.rank || 'RANK:'}
                    <span
                      className={StyleSheet.cn('text-white ml-1', StyleSheet.tw(styles.statistics?.rank?.value))}
                      style={StyleSheet.css(styles.statistics?.rank?.value)}
                    >
                      #{fixed(rank, abbreviate)}
                    </span>
                  </h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
