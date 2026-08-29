'use client';

import {Fragment, useEffect, useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Breadcrumb} from '@chakra-ui/react';
import getDbPod from '@/lib/api/db/getDbPod';
import getDbSpace from '@/lib/api/db/getDbSpace';
import parseAppBreadcrumbPath, {type AppBreadcrumbLeaf} from '@/lib/app/parseAppBreadcrumbPath';
import featureKindLabel from '@/lib/pod/featureKindLabel';

interface Crumb {
  readonly label: string;
  readonly href: string | undefined;
}

interface NamedEntity {
  readonly id: string;
  readonly name: string;
}

function leafLabel(leaf: AppBreadcrumbLeaf): string {
  if (leaf === 'settings') {
    return 'Settings';
  }
  if (leaf === 'invitations') {
    return 'Invitations';
  }
  if (leaf === 'account') {
    return 'Account';
  }
  return 'Join';
}

function buildCrumbs(
  spaceId: string | undefined,
  spaceName: string | undefined,
  podId: string | undefined,
  podName: string | undefined,
  leaf: AppBreadcrumbLeaf | undefined,
): readonly Crumb[] {
  const spaces: readonly Crumb[] = [{label: 'Spaces', href: '/app'}];
  const spaceCrumbs: readonly Crumb[] =
    spaceId === undefined ? [] : [{label: spaceName ?? 'Space', href: `/app/spaces/${spaceId}`}];
  const podCrumbs: readonly Crumb[] = podId === undefined ? [] : [{label: podName ?? 'Pod', href: undefined}];
  const leafCrumbs: readonly Crumb[] = leaf === undefined ? [] : [{label: leafLabel(leaf), href: undefined}];
  return [...spaces, ...spaceCrumbs, ...podCrumbs, ...leafCrumbs];
}

export default function AppBreadcrumbs() {
  const pathname = usePathname();
  const parsed = parseAppBreadcrumbPath(pathname);
  const [space, setSpace] = useState<NamedEntity | undefined>(undefined);
  const [pod, setPod] = useState<NamedEntity | undefined>(undefined);

  useEffect(() => {
    const spaceId = parsed.spaceId;
    const podId = parsed.podId;
    let cancelled = false;
    void Promise.all([
      spaceId === undefined ? Promise.resolve(undefined) : getDbSpace(spaceId),
      podId === undefined ? Promise.resolve(undefined) : getDbPod(podId),
    ])
      .then(([spaceRow, podRow]) => {
        if (cancelled) {
          return;
        }
        setSpace(spaceRow === undefined ? undefined : {id: spaceRow.id, name: spaceRow.name});
        if (podRow === undefined) {
          setPod(undefined);
          return;
        }
        setPod({id: podRow.id, name: podRow.name ?? featureKindLabel(podRow.feature)});
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [parsed.spaceId, parsed.podId]);

  const spaceName = space !== undefined && space.id === parsed.spaceId ? space.name : undefined;
  const podName = pod !== undefined && pod.id === parsed.podId ? pod.name : undefined;
  const crumbs = buildCrumbs(parsed.spaceId, spaceName, parsed.podId, podName, parsed.leaf);

  return (
    <Breadcrumb.Root>
      <Breadcrumb.List>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 ? <Breadcrumb.Separator /> : null}
              <Breadcrumb.Item>
                {isLast || crumb.href === undefined ? (
                  <Breadcrumb.CurrentLink>{crumb.label}</Breadcrumb.CurrentLink>
                ) : (
                  <Breadcrumb.Link asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </Breadcrumb.Link>
                )}
              </Breadcrumb.Item>
            </Fragment>
          );
        })}
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
}
