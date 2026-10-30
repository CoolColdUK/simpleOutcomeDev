'use client';

import {Badge, Box, Button, HStack, IconButton, Stack} from '@chakra-ui/react';
import {ArrowDownIcon, ArrowUpIcon, CrossIcon, DeleteIcon, EditIcon} from '@so/component';
import type {TpTimelineDisplayMode, TpTimelinePin} from '@so/model';
import AppIconTooltip from '@/components/app/AppIconTooltip';
import TripDayCardTags from '@/components/tp/TripDayCardTags';
import TripTpDoneCheckbox from '@/components/tp/TripTpDoneCheckbox';
import TripTpImportantReasonHint from '@/components/tp/TripTpImportantReasonHint';
import TripTpTruncateText from '@/components/tp/TripTpTruncateText';

export interface TripDayActionCardHeaderProps {
  readonly kind: string;
  readonly title: string;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly showActionDone: boolean;
  readonly done: boolean;
  readonly doneBusy: boolean;
  readonly canToggleDone: boolean;
  readonly displayMode: TpTimelineDisplayMode;
  readonly pin: TpTimelinePin;
  readonly canWrite: boolean;
  readonly showCardEdit: boolean;
  readonly expanded: boolean;
  readonly anchorDayId?: string;
  readonly moveUpDisabled: boolean;
  readonly moveDownDisabled: boolean;
  readonly showImportant: boolean;
  readonly importantReason?: string;
  readonly onToggleDone: (done: boolean) => void;
  readonly onAnchorDay: () => void;
  readonly onMoveUp: () => void;
  readonly onMoveDown: () => void;
  readonly onDelete: () => void;
  readonly onToggleEdit: () => void;
}

export default function TripDayActionCardHeader({
  kind,
  title,
  summary,
  tags,
  showActionDone,
  done,
  doneBusy,
  canToggleDone,
  displayMode,
  pin,
  canWrite,
  showCardEdit,
  expanded,
  anchorDayId,
  moveUpDisabled,
  moveDownDisabled,
  showImportant,
  importantReason,
  onToggleDone,
  onAnchorDay,
  onMoveUp,
  onMoveDown,
  onDelete,
  onToggleEdit,
}: TripDayActionCardHeaderProps) {
  const showMove = displayMode === 'canonical' && pin === 'flow' && canWrite;
  return (
    <HStack align="flex-start" gap={2} minW={0} maxW="100%" wrap={{base: 'wrap', md: 'nowrap'}}>
      {showActionDone ? (
        <Box flexShrink={0}>
          <TripTpDoneCheckbox
            checked={done}
            disabled={!canToggleDone}
            busy={doneBusy}
            ariaLabel={done ? `Mark ${kind} ${title} not done` : `Mark ${kind} ${title} done`}
            tooltip="Done for this day card only."
            onCheckedChange={onToggleDone}
          />
        </Box>
      ) : null}
      <Badge flexShrink={0}>{kind}</Badge>
      {displayMode === 'mirror' ? (
        <Badge flexShrink={0} variant="outline">
          mirror
        </Badge>
      ) : null}
      {showImportant ? (
        <Box flexShrink={0}>
          <TripTpImportantReasonHint reason={importantReason} />
        </Box>
      ) : null}
      <Stack order={{base: 1, md: 0}} flex={{base: '1 0 100%', md: '1'}} gap={1} minW={0} maxW="100%">
        <TripTpTruncateText fontWeight="medium" lineClamp={2}>
          {title}
        </TripTpTruncateText>
        {summary !== '' ? (
          <TripTpTruncateText fontSize="sm" color="fg.muted" lineClamp={3}>
            {summary}
          </TripTpTruncateText>
        ) : null}
        {tags.length > 0 ? <TripDayCardTags tags={tags} max={4} /> : null}
      </Stack>
      <HStack flexShrink={0} gap={2}>
        {displayMode === 'mirror' && anchorDayId !== undefined ? (
          <Button size="xs" variant="outline" onClick={onAnchorDay}>
            Anchor day
          </Button>
        ) : null}
        {showMove ? (
          <>
            <AppIconTooltip label={`Move ${kind} ${title} up`}>
              <IconButton
                aria-label={`Move ${kind} ${title} up`}
                size="xs"
                variant="outline"
                disabled={moveUpDisabled}
                onClick={onMoveUp}
              >
                <ArrowUpIcon size={14} />
              </IconButton>
            </AppIconTooltip>
            <AppIconTooltip label={`Move ${kind} ${title} down`}>
              <IconButton
                aria-label={`Move ${kind} ${title} down`}
                size="xs"
                variant="outline"
                disabled={moveDownDisabled}
                onClick={onMoveDown}
              >
                <ArrowDownIcon size={14} />
              </IconButton>
            </AppIconTooltip>
          </>
        ) : null}
        {canWrite ? (
          <AppIconTooltip label={`Delete ${kind} ${title}`}>
            <IconButton
              aria-label={`Delete ${kind} ${title}`}
              size="xs"
              variant="ghost"
              colorPalette="red"
              onClick={onDelete}
            >
              <DeleteIcon size={14} />
            </IconButton>
          </AppIconTooltip>
        ) : null}
        {showCardEdit ? (
          <AppIconTooltip label={expanded ? `Close editor ${title}` : `Edit ${kind} ${title}`}>
            <IconButton
              aria-label={expanded ? `Close editor ${title}` : `Edit ${kind} ${title}`}
              size="xs"
              variant={expanded ? 'solid' : 'outline'}
              onClick={onToggleEdit}
            >
              {expanded ? <CrossIcon size={14} /> : <EditIcon size={14} />}
            </IconButton>
          </AppIconTooltip>
        ) : null}
      </HStack>
    </HStack>
  );
}
