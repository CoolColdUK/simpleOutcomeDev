import {notFound, redirect} from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import AdminTemplateEditor from '@/components/admin/AdminTemplateEditor';
import {requireAdminHostPage} from '@/lib/admin/requireAdminHost';
import {actingIsAdmin, requireSiteSession} from '@/lib/admin/requireSiteSession';
import type {DesignAtomPreset, DesignColourScheme, DesignMolecule} from '@so/model';
import {listDesignLibrary} from '@/lib/admin/designLibraryAccess';
import {getSiteTemplate} from '@/lib/admin/siteTemplateAccess';

export const dynamic = 'force-dynamic';

export const metadata = {title: 'Edit template', robots: {index: false, follow: false}};

async function loadDesign(): Promise<{atoms: readonly DesignAtomPreset[]; colourSchemes: readonly DesignColourScheme[]; molecules: readonly DesignMolecule[]}> {
  try {
    const library = await listDesignLibrary();
    return {atoms: library.atoms, colourSchemes: library.colourSchemes, molecules: library.molecules};
  } catch {
    return {atoms: [], colourSchemes: [], molecules: []};
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
  const design = await loadDesign();
  return (
    <AdminShell session={session}>
      <AdminTemplateEditor
        id={template.id}
        name={template.name}
        document={template.document}
        colourSchemeId={template.colourSchemeId}
        colourSchemes={design.colourSchemes}
        molecules={design.molecules}
        atoms={design.atoms}
        items={template.items}
      />
    </AdminShell>
  );
}
