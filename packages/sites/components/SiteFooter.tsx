export interface SiteFooterProps {
  readonly text: string;
  readonly links: readonly {readonly label: string; readonly sectionId: string}[];
}

export default function SiteFooter({text, links}: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <p>{text}</p>
      {links.length === 0 ? null : (
        <nav className="site-footer-links">
          {links.map((link) => (
            <a key={link.sectionId} href={`#${link.sectionId}`}>
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </footer>
  );
}
