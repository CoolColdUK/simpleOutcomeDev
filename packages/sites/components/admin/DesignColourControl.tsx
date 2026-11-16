const THEME_COLOURS = [
  ['siteBackground', 'Background'],
  ['siteForeground', 'Foreground'],
  ['siteAccent', 'Accent'],
  ['siteButtonForeground', 'Button text'],
  ['siteCard', 'Card'],
  ['hero', 'Hero'],
] as const;

function pickerHex(value: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value;
  }
  const short = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(value);
  if (short !== null) {
    return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  }
  return '#000000';
}

export default function DesignColourControl({
  value,
  onChange,
  allowTheme = true,
}: {
  value: string;
  onChange: (value: string) => void;
  allowTheme?: boolean;
}) {
  const theme = allowTheme && THEME_COLOURS.some(([token]) => token === value);
  return (
    <span className="admin-colour">
      {allowTheme ? (
        <select value={theme ? value : 'custom'} aria-label="Colour source" onChange={(event) => onChange(event.target.value === 'custom' ? pickerHex(value) : event.target.value)}>
          {THEME_COLOURS.map(([token, label]) => (
            <option key={token} value={token}>
              {label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      ) : null}
      <input type="color" value={pickerHex(value)} aria-label="Colour picker" onChange={(event) => onChange(event.target.value)} />
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </span>
  );
}

const HERO_STOP = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})/g;

export function HeroBackgroundControl({value, onChange}: {value: string; onChange: (value: string) => void}) {
  const stops = value === 'none' ? [] : [...value.matchAll(HERO_STOP)].map((match) => match[0]);
  return (
    <span className="admin-colour">
      <select
        value={value === 'none' ? 'none' : 'gradient'}
        aria-label="Hero background"
        onChange={(event) => onChange(event.target.value === 'none' ? 'none' : 'linear-gradient(135deg,#f3f3f3,#dcdcdc)')}
      >
        <option value="none">None</option>
        <option value="gradient">Gradient</option>
      </select>
      {stops.map((stop, index) => (
        <input
          key={`${stop}-${index}`}
          type="color"
          value={pickerHex(stop)}
          aria-label={`Hero colour ${index + 1}`}
          onChange={(event) => onChange(replaceHeroStop(value, index, event.target.value))}
        />
      ))}
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </span>
  );
}

function replaceHeroStop(value: string, index: number, hex: string): string {
  let seen = 0;
  return value.replace(HERO_STOP, (match) => {
    const current = seen;
    seen += 1;
    return current === index ? hex : match;
  });
}
