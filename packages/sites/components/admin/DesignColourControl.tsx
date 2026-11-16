const THEME_COLOURS = [
  ['siteBackground', 'Background'],
  ['siteForeground', 'Foreground'],
  ['siteAccent', 'Accent'],
  ['siteButtonForeground', 'Button text'],
  ['siteCard', 'Card'],
  ['hero', 'Hero'],
] as const;

export default function DesignColourControl({value, onChange}: {value: string; onChange: (value: string) => void}) {
  const theme = THEME_COLOURS.some(([token]) => token === value);
  return (
    <>
      <select value={theme ? value : 'custom'} onChange={(event) => onChange(event.target.value === 'custom' ? '#111111' : event.target.value)}>
        {THEME_COLOURS.map(([token, label]) => (
          <option key={token} value={token}>
            {label}
          </option>
        ))}
        <option value="custom">Custom</option>
      </select>
      {theme ? null : <input value={value} onChange={(event) => onChange(event.target.value)} />}
    </>
  );
}
