import type {SiteDocument, SiteSection} from '@so/model';

export function omitMenuLink(section: SiteSection, sectionId: string): SiteSection {
  if (section.type === 'headerMenu') {
    return {...section, props: {links: section.props.links.filter((link) => link.sectionId !== sectionId)}};
  }
  if (section.type === 'footerMenu') {
    return {
      ...section,
      props: {text: section.props.text, links: section.props.links.filter((link) => link.sectionId !== sectionId)},
    };
  }
  return section;
}

function presentSection(section: SiteSection, hidden: ReadonlySet<string>): SiteSection | undefined {
  if (section.type === 'contactForm') {
    return undefined;
  }
  if (section.type === 'headerMenu') {
    return {id: section.id, type: 'headerMenu', props: {links: section.props.links.filter((link) => !hidden.has(link.sectionId))}};
  }
  if (section.type === 'footerMenu') {
    return {
      id: section.id,
      type: 'footerMenu',
      props: {text: section.props.text, links: section.props.links.filter((link) => !hidden.has(link.sectionId))},
    };
  }
  return section;
}

export function documentWithoutContactForm(document: SiteDocument): SiteDocument {
  const hidden = new Set(document.sections.filter((section) => section.type === 'contactForm').map((section) => section.id));
  return {
    ...document,
    sections: document.sections
      .map((section) => presentSection(section, hidden))
      .filter((section): section is SiteSection => section !== undefined),
  };
}
