import {notFound, redirect} from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import AdminTemplateEditor from '@/components/admin/AdminTemplateEditor';
import {requireAdminHostPage} from '@/lib/admin/requireAdminHost';
import {actingIsAdmin, requireSiteSession} from '@/lib/admin/requireSiteSession';
import type {DesignColourScheme} from '@so/model';
import {listDesignColourSchemes} from '@/lib/admin/designLibraryAccess';
import {getSiteTemplate} from '@/lib/admin/siteTemplateAccess';

export const dynamic = 'force-dynamic';

export const metadata = {title: 'Edit template', robots: {index: false, follow: false}};

async function loadColourSchemes(): Promise<readonly DesignColourScheme[]> {
  try {
    return await listDesignColourSchemes();
  } catch {
    return [];
  }
}

export default async function TemplateEditPage({params}: {params: Promise<{id: string}>}) {
  await requireAdminHostPage();
  const session = await requireSiteSession();
  if (!actingIsAdmin(session)) {
    redirect('/');
  }
  const {id} = await params;
  const template = await getSiteTemplate(id);
  if (template === undefined) {
    notFound();
  }
  const colourSchemes = await loadColourSchemes();
  return (
    <AdminShell session={session}>
      <AdminTemplateEditor
        id={template.id}
        name={template.name}
        document={template.document}
        colourSchemeId={template.colourSchemeId}
        colourSchemes={colourSchemes}
      />
    </AdminShell>
  );
}
