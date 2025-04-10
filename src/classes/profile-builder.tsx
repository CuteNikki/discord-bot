/** @jsx JSX.createElement */
/** @jsxFrag JSX.Fragment */

// The JSX pragma tells transpiler how to transform JSX into the equivalent JavaScript code

// import Canvacord
// Builder = The base class for creating custom builders
// JSX = The JSX pragma for creating elements
// Font = The Font class for loading custom fonts
// FontFactory = The FontFactory for managing fonts

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Builder, Font, FontFactory, JSX } from 'canvacord';

export interface ProfileProps {
  displayName: string;
  username: string;
  avatarURL: string;
  bannerURL?: string;
}

export class ProfileBuilder extends Builder<ProfileProps> {
  constructor() {
    // @ts-expect-error Expects a width and height - works fine without specified and automatically adjusts
    super();

    if (!FontFactory.size) Font.loadDefault();
  }

  public setDisplayName(displayName: string) {
    this.options.set('displayName', displayName);
    return this;
  }

  public setUsername(username: string) {
    this.options.set('username', username);
    return this;
  }

  public setAvatarURL(avatarURL: string) {
    this.options.set('avatarURL', avatarURL);
    return this;
  }

  public setBannerURL(bannerURL?: string) {
    this.options.set('bannerURL', bannerURL);
    return this;
  }

  public async render() {
    const displayName = this.options.get('displayName');
    const username = this.options.get('username');
    const avatarURL = this.options.get('avatarURL');
    const bannerURL = this.options.get('bannerURL');

    return (
      <div
        className='flex items-center justify-center p-5 rounded-lg'
        style={{
          backgroundRepeat: 'no-repeat',
          backgroundSize: '100% 100%',
          background: bannerURL ? `url(${bannerURL})` : 'linear-gradient(135deg,rgb(157, 192, 192),rgb(243, 123, 254))',
        }}
      >
        <div className='flex items-center p-5 bg-white bg-opacity-80 rounded-lg'>
          <img src={avatarURL} alt='Avatar' className='rounded-full w-24 h-24' />
          <div className='flex flex-col pl-5'>
            <span className='text-xl'>{displayName}</span>
            <span className='text-sm'>@{username}</span>
          </div>
          {/* <div style={{ display: 'flex', flexDirection: 'row', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '14px' }}>XP:</span>
              <span style={{ fontSize: '18px' }}> 1000</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '14px' }}>Level:</span>
              <span style={{ fontSize: '18px' }}> 5</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '14px' }}>Rank:</span>
              <span style={{ fontSize: '18px' }}>#1</span>
            </div>
          </div> */}
        </div>
      </div>
    );
  }
}
