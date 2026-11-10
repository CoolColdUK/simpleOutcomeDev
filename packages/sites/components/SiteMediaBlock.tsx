import type {SiteMedia} from '@so/model';

export default function SiteMediaBlock({media, tall}: {media: SiteMedia; tall?: boolean}) {
  return (
    <div className={tall ? 'media media-tall' : 'media'} style={{background: media.background}}>
      <span>{media.label}</span>
    </div>
  );
}
