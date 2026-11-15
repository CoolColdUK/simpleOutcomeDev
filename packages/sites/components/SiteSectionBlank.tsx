import type {SiteSection} from '@so/model';
import SiteBlockView from '@/components/SiteBlockView';

export default function SiteSectionBlank({section}: {section: Extract<SiteSection, {type: 'blank'}>}) {
  return (
    <section className="site-blank" style={{minHeight: `${section.props.heightPx}px`, background: section.props.background}}>
      {section.props.items.map((block) => (
        <SiteBlockView key={block.id} block={block} />
      ))}
    </section>
  );
}
