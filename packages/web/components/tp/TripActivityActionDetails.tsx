'use client';

import {useState} from 'react';
import {Box, Button, Link, Stack, Text} from '@chakra-ui/react';
import {tpLocationNotesWithoutTagLines, tpTagsFromLocationNotes} from '@so/model';
import type {DbTpAction, DbTpActionLocation, DbTpLocation} from '@/lib/api/db/tp/loadDbTpWorkspace';
import TripDayCardTags from '@/components/tp/TripDayCardTags';
import tpFormatLocationTime from '@/components/tp/tpFormatLocationTime';

export interface TripActivityActionDetailsProps {
  readonly action: DbTpAction;
  readonly locations: readonly DbTpLocation[];
  readonly actionLocations: readonly DbTpActionLocation[];
}

function trimTime(t: string | undefined): string {
  if (t === undefined) {
    return '';
  }
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export default function TripActivityActionDetails({action, locations, actionLocations}: TripActivityActionDetailsProps) {
  const [open, setOpen] = useState(false);
  const links = actionLocations
    .filter((l) => l.actionId === action.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const linked = links
    .map((link) => locations.find((l) => l.id === link.locationId))
    .filter((l): l is DbTpLocation => l !== undefined);
  const tagNotes = linked.map((l) => l.notes);
  const tags = tpTagsFromLocationNotes(tagNotes);
  const start = trimTime(action.startTime);
  const end = trimTime(action.endTime);
  const hasTime = start !== '' || end !== '';
  const hasCost = action.costAmount !== undefined || (action.costCurrency !== undefined && action.costCurrency !== '');
  const hasNotes = action.notes !== undefined && action.notes !== '';
  const hasLegacyPlace = links.length === 0 && (action.placeText !== undefined && action.placeText !== '');
  const hasAny =
    tags.length > 0 ||
    hasTime ||
    linked.length > 0 ||
    hasLegacyPlace ||
    hasCost ||
    hasNotes;

  const bodyId = `activity-details-${action.id}`;

  return (
    <Box pt={2}>
      <Button
        variant="ghost"
        size="sm"
        width="full"
        justifyContent="space-between"
        fontWeight="medium"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
      >
        Details
        <Text as="span" color="fg.muted" fontSize="sm">{open ? '−' : '+'}</Text>
      </Button>
      {open ? (
        <Stack id={bodyId} gap={2} pt={2} fontSize="sm">
          {!hasAny ? <Text color="fg.muted">No extra details.</Text> : null}
          {tags.length > 0 ? (
            <Stack gap={1}>
              <Text fontWeight="medium">Tags</Text>
              <TripDayCardTags tags={tags} />
            </Stack>
          ) : null}
          {hasTime ? (
            <Text>
              {start !== '' && end !== '' ? `${start}–${end}` : start !== '' ? start : end}
            </Text>
          ) : null}
          {linked.map((loc) => {
            const bodyNotes = tpLocationNotesWithoutTagLines(loc.notes);
            const openT = tpFormatLocationTime(loc.openTime);
            const closeT = tpFormatLocationTime(loc.closeTime);
            const hours =
              openT !== undefined && closeT !== undefined
                ? `${openT}–${closeT}`
                : openT !== undefined
                  ? `Opens ${openT}`
                  : closeT !== undefined
                    ? `Closes ${closeT}`
                    : undefined;
            return (
              <Stack key={loc.id} gap={0}>
                <Text fontWeight="medium">{loc.name}</Text>
                {loc.address !== undefined && loc.address !== '' ? <Text>{loc.address}</Text> : null}
                {hours !== undefined ? <Text>{hours}</Text> : null}
                {loc.website !== undefined && loc.website !== '' ? (
                  <Link href={loc.website} target="_blank" rel="noopener noreferrer">{loc.website}</Link>
                ) : null}
                {loc.email !== undefined && loc.email !== '' ? <Text>{loc.email}</Text> : null}
                {loc.phone !== undefined && loc.phone !== '' ? <Text>{loc.phone}</Text> : null}
                {bodyNotes !== undefined ? <Text whiteSpace="pre-wrap">{bodyNotes}</Text> : null}
                {loc.mapsUrl !== undefined && loc.mapsUrl !== '' ? (
                  <Link href={loc.mapsUrl} target="_blank" rel="noopener noreferrer">Map</Link>
                ) : null}
              </Stack>
            );
          })}
          {hasLegacyPlace ? (
            <Stack gap={0}>
              {action.placeText !== undefined ? <Text>{action.placeText}</Text> : null}
              {action.mapsUrl !== undefined && action.mapsUrl !== '' ? (
                <Link href={action.mapsUrl} target="_blank" rel="noopener noreferrer">Map</Link>
              ) : null}
            </Stack>
          ) : null}
          {hasCost ? (
            <Text>
              {action.costCurrency !== undefined ? `${action.costCurrency} ` : ''}
              {action.costAmount ?? ''}
            </Text>
          ) : null}
          {hasNotes ? <Text whiteSpace="pre-wrap">{action.notes}</Text> : null}
        </Stack>
      ) : null}
    </Box>
  );
}
