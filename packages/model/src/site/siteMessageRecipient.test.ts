import {siteMessageFormOffered, siteMessageRecipient, siteMessageSubject} from './siteMessageRecipient';

describe('siteMessageRecipient', () => {
  it('sends a demo to Simple Outcome even when a delivery email is passed in', () => {
    expect(siteMessageRecipient({status: 'demo', deliveryEmail: 'salon@example.com'})).toBe('info@simpleoutcome.dev');
    expect(siteMessageRecipient({status: 'demo', deliveryEmail: undefined})).toBe('info@simpleoutcome.dev');
  });

  it('uses the live delivery email and is absent when that row is missing', () => {
    expect(siteMessageRecipient({status: 'live', deliveryEmail: 'salon@example.com'})).toBe('salon@example.com');
    expect(siteMessageRecipient({status: 'live', deliveryEmail: undefined})).toBeUndefined();
    expect(siteMessageRecipient({status: 'live', deliveryEmail: '   '})).toBeUndefined();
  });
});

describe('siteMessageSubject', () => {
  it('uses a lead subject for a demo and a message subject for a live site', () => {
    expect(siteMessageSubject('demo', 'Ada', 'New Beauty')).toBe('New lead from Ada via New Beauty');
    expect(siteMessageSubject('live', 'Ada', 'New Beauty')).toBe('Message from Ada via New Beauty');
  });
});

describe('siteMessageFormOffered', () => {
  it('hides the form when messages are turned off', () => {
    expect(siteMessageFormOffered(false)).toBe(false);
    expect(siteMessageFormOffered(true)).toBe(true);
  });
});
