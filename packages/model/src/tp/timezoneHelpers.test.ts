import {localTimeToUtc, utcToLocalTime, formatTpInstant} from './timezoneHelpers';

describe('timezoneHelpers', () => {
  describe('localTimeToUtc', () => {
    it('converts HKT to UTC', () => {
      const result = localTimeToUtc('2026-11-15T14:00:00', 'Asia/Hong_Kong');
      expect(result).toBe('2026-11-15T06:00:00.000Z');
    });
    
    it('converts GMT to UTC', () => {
      const result = localTimeToUtc('2026-11-15T18:30:00', 'Europe/London');
      expect(result).toBe('2026-11-15T18:30:00.000Z');
    });
    
    it('handles local time without seconds', () => {
      const result = localTimeToUtc('2026-11-15T14:00', 'Asia/Hong_Kong');
      expect(result).toMatch(/^2026-11-15T06:00:00/);
    });
    
    it('handles DST transition (spring forward)', () => {
      // US DST starts March 9, 2026 at 2am
      const result = localTimeToUtc('2026-03-09T03:00:00', 'America/New_York');
      // 3am EDT is 7am UTC
      expect(result).toMatch(/^2026-03-09T0[78]:00:00/);
    });
    
    it('throws on invalid timezone', () => {
      expect(() => localTimeToUtc('2026-11-15T14:00:00', 'Invalid/Zone')).toThrow('Invalid IANA timezone');
    });
    
    it('throws on invalid time format', () => {
      expect(() => localTimeToUtc('not-a-time', 'Asia/Hong_Kong')).toThrow('Invalid local time format');
    });
  });
  
  describe('utcToLocalTime', () => {
    it('converts UTC to HKT', () => {
      const result = utcToLocalTime('2026-11-15T06:00:00Z', 'Asia/Hong_Kong');
      expect(result).toBe('2026-11-15T14:00:00');
    });
    
    it('converts UTC to GMT', () => {
      const result = utcToLocalTime('2026-11-15T18:30:00Z', 'Europe/London');
      expect(result).toBe('2026-11-15T18:30:00');
    });
    
    it('handles >24h travel span', () => {
      // Depart Mon 10am HKT (2am UTC), arrive Wed 6am GMT (6am UTC)
      const departUtc = localTimeToUtc('2026-11-16T10:00:00', 'Asia/Hong_Kong');
      const arriveLocal = utcToLocalTime('2026-11-18T06:00:00Z', 'Europe/London');
      
      expect(departUtc).toMatch(/^2026-11-16T02:00:00/);
      expect(arriveLocal).toBe('2026-11-18T06:00:00');
    });
    
    it('throws on invalid UTC instant', () => {
      expect(() => utcToLocalTime('not-utc', 'Asia/Hong_Kong')).toThrow('Invalid UTC instant');
    });
    
    it('throws on invalid timezone', () => {
      expect(() => utcToLocalTime('2026-11-15T06:00:00Z', 'Bad/Zone')).toThrow('Invalid IANA timezone');
    });
  });
  
  describe('formatTpInstant', () => {
    it('formats with timezone abbreviation', () => {
      const result = formatTpInstant('2026-11-15T06:00:00Z', 'Asia/Hong_Kong');
      expect(result).toMatch(/14:00\s+HKT/);
    });
    
    it('formats GMT', () => {
      const result = formatTpInstant('2026-11-15T18:30:00Z', 'Europe/London');
      expect(result).toMatch(/18:30\s+GMT/);
    });
  });
  
  describe('round-trip conversion', () => {
    it('local -> UTC -> local preserves time', () => {
      const original = '2026-11-15T14:00:00';
      const zone = 'Asia/Hong_Kong';
      
      const utc = localTimeToUtc(original, zone);
      const back = utcToLocalTime(utc, zone);
      
      expect(back).toBe(original);
    });
    
    it('handles multiple timezones', () => {
      const zones = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];
      
      zones.forEach((zone) => {
        const local = '2026-06-15T15:30:00';
        const utc = localTimeToUtc(local, zone);
        const back = utcToLocalTime(utc, zone);
        
        expect(back).toBe(local);
      });
    });
  });
});
