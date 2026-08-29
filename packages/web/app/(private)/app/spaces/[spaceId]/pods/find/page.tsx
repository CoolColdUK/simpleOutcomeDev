import {redirect} from 'next/navigation';

export default async function SpaceFindPodsRoute({params}: {params: Promise<{spaceId: string}>}) {
  const {spaceId} = await params;
  redirect(`/app/spaces/${spaceId}`);
}
