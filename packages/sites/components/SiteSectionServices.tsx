import type {SiteSection} from '@so/model';

function ServiceRows({items}: {items: {name: string; detail: string; price: string}[]}) {
  return (
    <div className="service-list">
      {items.map((item) => (
        <div key={`${item.name}-${item.detail}`} className="service-row">
          <div>
            <strong>{item.name}</strong>
            {item.detail.length > 0 ? <small>{item.detail}</small> : null}
          </div>
          <span>{item.price}</span>
        </div>
      ))}
    </div>
  );
}

export default function SiteSectionServices({section}: {section: Extract<SiteSection, {type: 'services'}>}) {
  const {props} = section;
  return (
    <section id={section.id} className="section">
      <h2>{props.title}</h2>
      {props.presentation === 'grouped' ? (
        props.groups.map((group) => (
          <div key={group.label} className="service-group">
            <h3>{group.label}</h3>
            <ServiceRows items={group.items} />
          </div>
        ))
      ) : (
        <div className={props.presentation === 'cards' ? 'card-grid service-cards' : undefined}>
          {props.presentation === 'cards' ? (
            props.items.map((item) => (
              <article key={item.name} className="card service-card">
                <h3>{item.name}</h3>
                <p className="price">{item.price}</p>
              </article>
            ))
          ) : (
            <ServiceRows items={props.items} />
          )}
        </div>
      )}
    </section>
  );
}
