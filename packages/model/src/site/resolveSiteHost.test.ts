import {resolveSiteHost} from './resolveSiteHost';

const rootDomain = 'simpleoutcome.dev';

describe('resolveSiteHost', () => {
  it('reads a demo subdomain and ignores the port and a trailing dot', () => {
    expect(resolveSiteHost({host: 'NewBeauty.simpleoutcome.dev:443', rootDomain})).toEqual({
      kind: 'demo-subdomain',
      slug: 'newbeauty',
    });
    expect(resolveSiteHost({host: 'soniasnails.simpleoutcome.dev.', rootDomain})).toEqual({
      kind: 'demo-subdomain',
      slug: 'soniasnails',
    });
  });

  it('treats the apex, www, vercel.app, and admin hosts as unknown', () => {
    expect(resolveSiteHost({host: 'simpleoutcome.dev', rootDomain}).kind).toBe('unknown');
    expect(resolveSiteHost({host: 'www.simpleoutcome.dev', rootDomain}).kind).toBe('unknown');
    expect(resolveSiteHost({host: 'simple-outcome-sites.vercel.app', rootDomain}).kind).toBe('unknown');
    expect(resolveSiteHost({host: 'a.b.simpleoutcome.dev', rootDomain}).kind).toBe('unknown');
    expect(resolveSiteHost({host: 'admin.simpleoutcome.dev', rootDomain}).kind).toBe('unknown');
    expect(resolveSiteHost({host: 'admin.localhost:3001', rootDomain}).kind).toBe('unknown');
  });

  it('reads a localhost slug and a custom domain', () => {
    expect(resolveSiteHost({host: 'lkbaesthetics.localhost:3000', rootDomain})).toEqual({
      kind: 'local',
      slug: 'lkbaesthetics',
    });
    expect(resolveSiteHost({host: 'SoniaSnails.co.uk', rootDomain})).toEqual({
      kind: 'custom-domain',
      host: 'soniasnails.co.uk',
    });
    expect(resolveSiteHost({host: '', rootDomain}).kind).toBe('unknown');
    expect(resolveSiteHost({host: 'localhost', rootDomain}).kind).toBe('unknown');
  });
});
