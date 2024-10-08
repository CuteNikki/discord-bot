/** @jsx JSX.createElement */
/** @jsxFrag JSX.Fragment */

import { Builder, Font, FontFactory, JSX, loadImage, StyleSheet, type ImageSource } from 'canvacord';
import { LB_HEIGHT_INTERVAL, LB_MIN_RENDER_HEIGHT, leaderboardColors, type LeaderboardVariants } from 'constants/canvacord';
import type { LeaderboardProps, PropsType } from 'types/rank-leaderboard';
import { chunk } from 'utils/common';

const Crown = () => {
  return (
    // biome-ignore lint: alternative text title
    <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path
        d='M16.5 17.5H3.5C3.225 17.5 3 17.7813 3 18.125V19.375C3 19.7188 3.225 20 3.5 20H16.5C16.775 20 17 19.7188 17 19.375V18.125C17 17.7813 16.775 17.5 16.5 17.5ZM18.5 5C17.6719 5 17 5.83984 17 6.875C17 7.15234 17.05 7.41016 17.1375 7.64844L14.875 9.34375C14.3937 9.70313 13.7719 9.5 13.4937 8.89063L10.9469 3.32031C11.2812 2.97656 11.5 2.46094 11.5 1.875C11.5 0.839844 10.8281 0 10 0C9.17188 0 8.5 0.839844 8.5 1.875C8.5 2.46094 8.71875 2.97656 9.05313 3.32031L6.50625 8.89063C6.22812 9.5 5.60312 9.70313 5.125 9.34375L2.86562 7.64844C2.95 7.41406 3.00312 7.15234 3.00312 6.875C3.00312 5.83984 2.33125 5 1.50312 5C0.675 5 0 5.83984 0 6.875C0 7.91016 0.671875 8.75 1.5 8.75C1.58125 8.75 1.6625 8.73438 1.74063 8.71875L4 16.25H16L18.2594 8.71875C18.3375 8.73438 18.4188 8.75 18.5 8.75C19.3281 8.75 20 7.91016 20 6.875C20 5.83984 19.3281 5 18.5 5Z'
        fill='#FFAA00'
      />
    </svg>
  );
};

const fixed = (v: number, r: boolean) => {
  if (!r) return v;
  const formatter = new Intl.NumberFormat('en-US', { notation: 'compact' });
  return formatter.format(v);
};

export class LeaderboardBuilder extends Builder<LeaderboardProps> {
  public variant?: LeaderboardVariants;

  /**
   * Create a new leaderboard ui builder
   */
  public constructor(props: PropsType) {
    super(500, LB_MIN_RENDER_HEIGHT);

    this.bootstrap({
      ...props,
      variant: props.variant ?? 'default',
      background: props.background ?? null,
      backgroundColor: props.backgroundColor ?? '#2b2f35',
      abbreviate: props.abbreviate ?? true,
      text: props.text ?? { level: 'LEVEL: ', xp: 'XP: ', rank: 'RANK: ' }
    });

    this.variant = props.variant;

    this.setStyle({
      borderRadius: '1.5rem'
    });

    if (!FontFactory.size) {
      Font.loadDefault();
    }
  }

  /**
   * Set the ui variant for this leaderboard
   * @param variant ui type
   */
  public setVariant(variant: LeaderboardVariants) {
    this.variant = variant;
    return this;
  }

  /**
   * Set background for this leaderboard ui
   * @param background background image
   */
  public setBackground(background: ImageSource) {
    this.options.set('background', background);
    return this;
  }

  /**
   * Set background color for this leaderboard ui
   * @param color background color
   */
  public setBackgroundColor(color: string) {
    this.options.set('backgroundColor', color);
    return this;
  }

  /**
   * Set header for this leaderboard ui
   * @param data header data
   */
  public setHeader(data: LeaderboardProps['header'] & {}) {
    this.options.set('header', data);
    return this;
  }

  /**
   * Set players for this leaderboard ui. The canvas size will be adjusted automatically based on the number of players.
   * @param players players data
   */
  public setPlayers(players: LeaderboardProps['players']) {
    const items = players.slice(0, 10);
    this.options.set('players', items);

    return this;
  }

  /**
   * Configures the text renderer for this leaderboard.
   * @param config The configuration for this leaderboard.
   */
  public setTextStyles(config: Partial<LeaderboardProps['text']>) {
    this.options.merge('text', config);
    return this;
  }

  /**
   * Render this leaderboard ui on the canvas
   */
  public async render() {
    if (!this.variant || this.variant === 'default') {
      return this.renderDefaultVariant();
    }

    return this.renderHorizontalVariant();
  }

  /**
   * Render players ui on the canvas
   */
  public renderDefaultPlayers(players: JSX.Element[]) {
    return <div className='mt-4 flex flex-col items-center justify-center w-[95%]'>{players}</div>;
  }

  /**
   * Render top players ui on the canvas
   */
  public async renderDefaultTop({ avatar, displayName, level, rank, username, xp }: LeaderboardProps['players'][number]) {
    const image = await loadImage(avatar);
    const currentColor = leaderboardColors[rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze'];
    const crown = rank === 1;

    return (
      <div
        className={StyleSheet.cn(
          `relative flex flex-col items-center justify-center p-4 bg-[${this.options.get('backgroundColor')}B3] w-[35%] rounded-md`,
          crown ? `-mt-4 bg-[${this.options.get('backgroundColor')}] rounded-b-none h-[113%]` : '',
          rank === 2 ? 'rounded-br-none' : rank === 3 ? 'rounded-bl-none' : ''
        )}
      >
        {crown && (
          <div className='absolute flex -top-16'>
            <Crown />
          </div>
        )}
        <div className='flex items-center justify-center flex-col absolute -top-10'>
          <img src={image.toDataURL()} className={StyleSheet.cn(`border-[3px] border-[${currentColor}] rounded-full h-18 w-18`)} alt='avatar' />
          <div
            className={`flex items-center justify-center text-xs p-2 text-center font-bold h-3 w-3 rounded-full text-white absolute bg-[${currentColor}] -bottom-[0.4rem]`}
          >
            {rank}
          </div>
        </div>
        <div className='flex flex-col items-center justify-center mt-5'>
          <h1 className='text-white text-base font-extrabold m-0'>{displayName}</h1>
          <h2 className='text-[#9ca0a5] text-xs font-thin m-0 mb-2'>@{username}</h2>
          <h4 className={`text-sm text-[${currentColor}] m-0`}>
            {this.options.get('text').level} {level}
          </h4>
          <h4 className={`text-sm text-[${currentColor}] m-0`}>
            {this.options.get('text').xp} {fixed(xp, this.options.get('abbreviate'))}
          </h4>
        </div>
      </div>
    );
  }

  /**
   * Render player ui on the canvas
   */
  public async renderDefaultPlayer({ avatar, displayName, level, rank, username, xp }: LeaderboardProps['players'][number]) {
    const image = await loadImage(avatar);

    return (
      <div className={`bg-[${this.options.get('backgroundColor')}B3] p-4 rounded-md flex flex-row justify-between items-center w-full mb-2`}>
        <div className='flex flex-row'>
          {/* <div className='flex flex-col items-center justify-center mr-2'>
            <h1 className='text-white font-extrabold text-xl m-0'>{rank}</h1>
            <h4 className='text-white font-medium text-sm m-0'>{this.options.get('text').rank}</h4>
          </div> */}
          <img src={image.toDataURL()} className='rounded-full h-14 w-14 mr-2' alt='avatar' />
          <div className='flex flex-col items-start justify-center'>
            <h1 className='text-white font-extrabold text-xl m-0'>{displayName}</h1>
            <h4 className='text-[#9ca0a5] font-medium text-sm m-0'>@{username}</h4>
          </div>
        </div>
        <div className='flex flex-col items-center justify-center'>
          <h4 className='text-[#9ca0a5] text-sm m-0'>
            {this.options.get('text').rank}
            <span className='text-white ml-1'>#{rank}</span>
          </h4>
          <h4 className='text-[#9ca0a5] text-sm m-0'>
            {this.options.get('text').level}
            <span className='text-white ml-1'>{level}</span>
          </h4>
          <h4 className='text-[#9ca0a5] text-sm m-0'>
            {this.options.get('text').xp}
            <span className='text-white  ml-1'>{fixed(xp, this.options.get('abbreviate'))}</span>
          </h4>
        </div>
      </div>
    );
  }

  public async renderDefaultVariant() {
    const options = this.options.getOptions();
    const total = options.players.length;

    if (!total) {
      throw new RangeError('Number of players must be greater than 0');
    }

    const adjustedHeight = LB_HEIGHT_INTERVAL[total - 3] ?? LB_MIN_RENDER_HEIGHT;

    this.height = adjustedHeight;

    this.adjustCanvas();

    // biome-ignore lint: declare variables separately
    let background, headerImg;

    if (options.background) {
      background = await loadImage(options.background);
    }

    if (options.header) {
      headerImg = await loadImage(options.header.image);
    }

    const winners = [options.players[1], options.players[0], options.players[2]].filter(Boolean);

    return (
      <div className='h-full w-full flex relative'>
        {background && <img src={background.toDataURL()} className='absolute top-0 left-0 h-full w-full' alt='background' />}
        <div className='py-[30px] flex flex-col items-center w-full'>
          {options.header && headerImg ? (
            <div className='flex items-center justify-center flex-col w-full'>
              <img src={headerImg.toDataURL()} className='rounded-full w-16 h-w-16' alt='header' />
              <h1 className='text-white text-xl font-extrabold m-0 mt-2'>{options.header.title}</h1>
              <h2 className='text-white text-sm font-thin m-0'>{options.header.subtitle}</h2>
            </div>
          ) : null}
          <div className={StyleSheet.cn('flex flex-row w-[90%] justify-center items-center mt-16', winners.length ? 'mt-24' : '')}>
            {await Promise.all(winners.map((winner) => this.renderDefaultTop(winner)))}
          </div>
          {this.renderDefaultPlayers(await Promise.all(options.players.filter((f) => !winners.includes(f)).map((m) => this.renderDefaultPlayer(m))))}
        </div>
      </div>
    );
  }

  public async renderHorizontalPlayer({ avatar, displayName, level, rank, username, xp }: LeaderboardProps['players'][number]) {
    const image = await loadImage(avatar);

    return (
      <div className={`flex items-center bg-[${this.options.get('backgroundColor')}] rounded-xl p-2 px-3 justify-between`}>
        <div className='flex justify-between items-center'>
          <div className='flex ml-2 mr-4 text-2xl w-[25px]'>#{rank}</div>

          <img src={image.toDataURL()} width={49.25} height={49.58} className='rounded-full flex' alt='avatar' />

          <div className='flex flex-col justify-center ml-3'>
            {displayName && <div className='text-xl font-semibold -mb-1 flex'>{displayName}</div>}
            {username && <div className='text-lg font-medium text-[#9ca0a5] flex'>@{username}</div>}
          </div>
        </div>

        <div className='flex flex-col items-end'>
          <h4 className='text-[#9ca0a5] text-sm m-0'>
            {this.options.get('text').level}
            <span className='text-white ml-1'>{level}</span>
          </h4>
          <h4 className='text-[#9ca0a5] text-sm m-0'>
            {this.options.get('text').xp}
            <span className='text-white  ml-1'>{fixed(xp, this.options.get('abbreviate'))}</span>
          </h4>
        </div>
      </div>
    );
  }

  public async renderHorizontalVariant() {
    const options = this.options.getOptions();
    const total = options.players.length;

    if (!total) {
      throw new RangeError('Number of players must be greater than 0');
    }

    this.width = 1002;
    this.height = 512;

    this.adjustCanvas();

    // biome-ignore lint: declare variables separately
    let background, headerImg;

    if (options.background) {
      background = await loadImage(options.background);
    }

    if (options.header) {
      headerImg = await loadImage(options.header.image);
    }

    const playerGroupChunks = chunk(options.players, 5) as Array<typeof options.players>;

    const processedPlayerGroups = await Promise.all(
      playerGroupChunks.map(async (playerGroup) => {
        const renderedPlayers = await Promise.all(playerGroup.map((player) => this.renderHorizontalPlayer(player)));
        return renderedPlayers;
      })
    );

    return (
      <div className='flex relative w-full flex-col'>
        {background && <img src={background.toDataURL()} className='flex absolute top-0 left-0' alt='background' />}

        <div className='flex justify-center w-full m-0 my-5'>
          {options.header && headerImg && <img src={headerImg.toDataURL()} width={49.53} height={50.44} className='flex rounded-full mr-3' alt='header' />}
          <div className='flex flex-col items-center justify-center'>
            {options.header?.title && <div className='text-white font-semibold text-2xl flex'>{options.header.title}</div>}
            {options.header?.subtitle && <div className='text-gray-300 font-medium flex'>{options.header.subtitle}</div>}
          </div>
        </div>

        <div className='flex text-white p-2 px-3' style={{ gap: '6' }}>
          {processedPlayerGroups.map((renderedPlayers) => (
            <div className='flex flex-col flex-1' style={{ gap: '6' }}>
              {renderedPlayers}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
