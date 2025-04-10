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
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          borderRadius: '12px',
          background: bannerURL ? `url(${bannerURL})` : 'linear-gradient(135deg,rgb(157, 192, 192),rgb(243, 123, 254))',
          // @todo: Fix the background size, currently it's being stretched and no-repeat + cover doesn't work
          backgroundSize: '100% 100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '12px',
          }}
        >
          <img src={avatarURL} alt='Avatar' style={{ borderRadius: '50%', width: '100px', height: '100px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '24px' }}>{displayName}</span>
            <span style={{ fontSize: '14px' }}>@{username}</span>
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
