'use client';

import {Fragment, useEffect, useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Breadcrumb} from '@chakra-ui/react';
import getDbPod from '@/lib/api/db/getDbPod';
import getDbSpace from '@/lib/api/db/getDbSpace';
import parseAppBreadcrumbPath from '@/lib/app/parseAppBreadcrumbPath';
import featureKindLabel from '@/lib/pod/featureKindLabel';

interface Crumb {
  readonly label: string;
  readonly href: string | undefined;
}

function leafLabel(leaf: 'settings' | 'invitations' | 'join'): string {
  if (leaf === 'settings') {
    return 'Settings';
  }
  if (leaf === 'invitations') {
    return 'Invitations';
  }
  return 'Join';
}

function buildCrumbs(
  spaceId: string | undefined,
  spaceName: string | undefined,
  podId: string | undefined,
  podName: string | undefined,
  leaf: 'settings' | 'invitations' | 'join' | undefined,
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
  const [spaceName, setSpaceName] = useState<string | undefined>(undefined);
  const [podName, setPodName] = useState<string | undefined>(undefined);

  useEffect(() => {
    setSpaceName(undefined);
    setPodName(undefined);
    const spaceId = parsed.spaceId;
    const podId = parsed.podId;
    void Promise.all([
      spaceId === undefined ? Promise.resolve(undefined) : getDbSpace(spaceId),
      podId === undefined ? Promise.resolve(undefined) : getDbPod(podId),
    ])
      .then(([space, pod]) => {
        setSpaceName(space?.name);
        setPodName(pod === undefined ? undefined : (pod.name ?? featureKindLabel(pod.feature)));
      })
      .catch(() => undefined);
  }, [parsed.spaceId, parsed.podId]);

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
