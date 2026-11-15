import {SITE_BLOCK_ICONS, type SiteBlock, type SiteBlockIcon} from '@so/model';

export default function SiteBlockView({block}: {block: SiteBlock}) {
  return (
    <a
      className={block.type === 'iconButton' ? 'site-block site-block-icon' : 'site-block site-block-button'}
      href={block.props.href}
      style={{background: block.props.background, color: block.props.color}}
      aria-label={block.type === 'iconButton' ? block.props.label : undefined}
    >
      {block.type === 'iconButton' ? <BlockIcon name={block.props.icon} /> : block.props.label}
    </a>
  );
}

function BlockIcon({name}: {name: SiteBlockIcon}) {
  if (name === 'close') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  if (name === 'phone') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M8 4h3l1 4-2 1a12 12 0 0 0 5 5l1-2 4 1v3c0 1-1 2-2 2A15 15 0 0 1 6 6c0-1 1-2 2-2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    );
  }
  if (name === 'arrow') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function isSiteBlockIcon(value: string): value is SiteBlockIcon {
  return SITE_BLOCK_ICONS.some((icon) => icon === value);
}
