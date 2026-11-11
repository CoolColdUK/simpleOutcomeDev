import type {SiteSection} from '@so/model';
import SiteMediaBlock from '@/components/SiteMediaBlock';

export default function SiteSectionGallery({section}: {section: Extract<SiteSection, {type: 'gallery'}>}) {
  return (
    <section id={section.id} className="section">
      {section.props.title ? <h2>{section.props.title}</h2> : null}
      <div className="gallery-grid">
        {section.props.items.map((item) => (
          <SiteMediaBlock key={`${item.label}-${item.background}`} media={item} />
        ))}
      </div>
    </section>
  );
}
