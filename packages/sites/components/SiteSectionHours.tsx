import type {SiteSection} from '@so/model';

export default function SiteSectionHours({section}: {section: Extract<SiteSection, {type: 'hoursLocation'}>}) {
  const {address} = section.props;
  return (
    <section id={section.id} className="section">
      <h2>{section.props.title}</h2>
      <div className="hours-layout">
        {section.props.showMapPlaceholder ? <div className="map-placeholder">Map</div> : null}
        <div className="card">
          {address.kind === 'street-and-area' ? (
            <p>
              {address.street}, {address.area}
            </p>
          ) : (
            address.lines.map((line) => <p key={line}>{line}</p>)
          )}
          <div className="hours-list">
            {section.props.hours.map((row) => (
              <div key={row.days} className="hours-row">
                <span>{row.days}</span>
                <strong>{row.hours}</strong>
              </div>
            ))}
          </div>
          {section.props.note ? <p>{section.props.note}</p> : null}
          {section.props.mapsUrl ? (
            <a className="text-link" href={section.props.mapsUrl} target="_blank" rel="noopener noreferrer">
              Open in maps
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
