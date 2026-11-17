import {Link} from '@chakra-ui/react';
import {SITE_BLOCK_ICONS, type SiteBlock, type SiteBlockIcon} from '@so/model';

export default function SiteBlockView({block}: {block: SiteBlock}) {
  const icon = block.type === 'iconButton';
  return (
    <Link
      href={block.props.href}
      aria-label={icon ? block.props.label : undefined}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      borderRadius="full"
      textDecoration="none"
      fontWeight="700"
      bg={block.props.background}
      color={block.props.color}
      w={icon ? '10' : undefined}
      h={icon ? '10' : undefined}
      px={icon ? undefined : '4'}
      py={icon ? undefined : '2'}
    >
      {icon ? <BlockIcon name={block.props.icon} /> : block.props.label}
    </Link>
  );
}

const BLOCK_ICON_PATH: Record<SiteBlockIcon, string> = {
  close: 'M6 6l12 12M18 6L6 18',
  phone: 'M8 4h3l1 4-2 1a12 12 0 0 0 5 5l1-2 4 1v3c0 1-1 2-2 2A15 15 0 0 1 6 6c0-1 1-2 2-2z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
};

function BlockIcon({name}: {name: SiteBlockIcon}) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="1.15rem" height="1.15rem">
      <path d={BLOCK_ICON_PATH[name]} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function isSiteBlockIcon(value: string): value is SiteBlockIcon {
  return SITE_BLOCK_ICONS.some((icon) => icon === value);
}
