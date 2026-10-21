import * as v from 'valibot';
import {FpAccountKind} from '../fp/fpAccountKind';
import {FpAmountSign} from '../fp/fpAmountSign';
import {FpBudgetPeriod} from '../fp/fpBudgetPeriod';
import {FpCategoryDirection} from '../fp/fpCategoryDirection';
import {FpColumnTarget} from '../fp/fpColumnTarget';
import {fpNameSchema} from '../fp/parseFpName';
import {displayNameSchema} from '../profile/displayNameSchema';
import {usernameSchema} from '../profile/usernameSchema';
import {FeatureKind} from '../space/featureKind';
import {PodRole} from '../space/podRole';
import {PodStatus} from '../space/podStatus';
import {PodVisibility} from '../space/podVisibility';

const uuid = () => v.pipe(v.string(), v.uuid());
const money = v.pipe(v.number(), v.finite(), v.minValue(-1_000_000_000_000), v.maxValue(1_000_000_000_000));
const isoDate = v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/));
const pageLimit = v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)));
const pageOffset = v.optional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(100_000)));

export const agentSpaceCreateSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(80)),
  description: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(500)))),
});

export const agentSpaceJoinSchema = v.object({
  token: v.pipe(v.string(), v.trim(), v.minLength(8), v.maxLength(200)),
});

export const agentPodCreateSchema = v.object({
  spaceId: uuid(),
  feature: v.enum(FeatureKind),
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(80)),
  visibility: v.enum(PodVisibility),
  description: v.optional(v.pipe(v.string(), v.maxLength(500))),
});

export const agentPodUpdateSchema = v.object({
  podId: uuid(),
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(80)),
  visibility: v.enum(PodVisibility),
  description: v.optional(v.pipe(v.string(), v.maxLength(500))),
});

export const agentPodStatusSchema = v.object({
  podId: uuid(),
  status: v.enum(PodStatus),
});

export const agentPodSearchSchema = v.object({
  spaceId: uuid(),
  query: v.optional(v.pipe(v.string(), v.maxLength(80))),
});

export const agentPodIdSchema = v.object({
  podId: uuid(),
  spaceId: v.optional(uuid()),
});

export const agentSpaceInviteDisableSchema = v.object({
  spaceId: uuid(),
  inviteId: uuid(),
});

export const agentPodMemberAddSchema = v.object({
  podId: uuid(),
  username: usernameSchema,
  role: v.picklist([PodRole.ADMIN, PodRole.USER]),
});

export const agentPodMemberRoleSchema = v.object({
  podId: uuid(),
  userId: uuid(),
  role: v.picklist([PodRole.ADMIN, PodRole.USER]),
});

export const agentPodJoinRequestSchema = v.object({
  podId: uuid(),
  requestId: uuid(),
});

export const agentProfileDisplayNameSchema = v.object({
  displayName: displayNameSchema,
});

export const agentProfileUsernameSchema = v.object({
  username: usernameSchema,
});

export const agentTodoReorderColumnsSchema = v.object({
  podId: uuid(),
  orderedIds: v.pipe(v.array(uuid()), v.minLength(1), v.maxLength(100)),
});

export const agentTodoReorderCardsSchema = v.object({
  podId: uuid(),
  items: v.pipe(
    v.array(
      v.object({
        id: uuid(),
        columnId: v.nullable(uuid()),
        sortOrder: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(1_000_000)),
      }),
    ),
    v.minLength(1),
    v.maxLength(200),
  ),
});

export const agentTodoColumnArchiveSchema = v.object({
  podId: uuid(),
  columnId: uuid(),
});

export const agentTodoCardIconSchema = v.object({
  podId: uuid(),
  cardId: uuid(),
  contentType: v.picklist(['image/jpeg', 'image/png', 'image/jpg']),
  contentBase64: v.pipe(v.string(), v.minLength(1), v.maxLength(7_000_000)),
});

const columnMapping = v.object({
  column: v.pipe(v.string(), v.minLength(1), v.maxLength(80)),
  dateFormat: v.optional(v.pipe(v.string(), v.maxLength(40))),
  sign: v.optional(v.enum(FpAmountSign)),
});

export const agentFpColumnMapSchema = v.partial(
  v.object({
    [FpColumnTarget.DATE]: columnMapping,
    [FpColumnTarget.TIME]: columnMapping,
    [FpColumnTarget.AMOUNT]: columnMapping,
    [FpColumnTarget.DESCRIPTION]: columnMapping,
    [FpColumnTarget.RECIPIENT]: columnMapping,
    [FpColumnTarget.EXTERNAL_ID]: columnMapping,
    [FpColumnTarget.NOTES]: columnMapping,
  }),
);

export const agentFpAccountCreateSchema = v.object({
  podId: uuid(),
  name: fpNameSchema,
  kind: v.enum(FpAccountKind),
  openingFund: v.optional(money),
  notes: v.optional(v.pipe(v.string(), v.maxLength(4000))),
});

export const agentFpAccountUpdateSchema = v.object({
  podId: uuid(),
  accountId: uuid(),
  name: v.optional(fpNameSchema),
  kind: v.optional(v.enum(FpAccountKind)),
  openingFund: v.optional(money),
  archived: v.optional(v.boolean()),
  notes: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(4000)))),
});

export const agentFpCategoryWriteSchema = v.object({
  podId: uuid(),
  categoryId: v.optional(uuid()),
  name: v.optional(fpNameSchema),
  direction: v.optional(v.enum(FpCategoryDirection)),
  budgetAmount: v.optional(v.nullable(money)),
  budgetPeriod: v.optional(v.nullable(v.enum(FpBudgetPeriod))),
  clearBudget: v.optional(v.boolean()),
  favourite: v.optional(v.boolean()),
  sortOrder: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(1_000_000))),
  filters: v.optional(v.pipe(v.array(v.pipe(v.string(), v.maxLength(200))), v.maxLength(50))),
  isGroup: v.optional(v.boolean()),
  parentId: v.optional(v.nullable(uuid())),
  clearParent: v.optional(v.boolean()),
});

export const agentFpTransactionWriteSchema = v.object({
  podId: uuid(),
  transactionId: v.optional(uuid()),
  accountId: v.optional(uuid()),
  postedDate: v.optional(isoDate),
  postedTime: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(20)))),
  amount: v.optional(money),
  description: v.optional(v.pipe(v.string(), v.maxLength(4000))),
  recipient: v.optional(v.pipe(v.string(), v.maxLength(200))),
  notes: v.optional(v.pipe(v.string(), v.maxLength(4000))),
  categoryId: v.optional(v.nullable(uuid())),
  confirmed: v.optional(v.boolean()),
  archived: v.optional(v.boolean()),
  limit: pageLimit,
  offset: pageOffset,
  startDate: v.optional(isoDate),
  endDate: v.optional(isoDate),
});

export const agentFpAssignSchema = v.object({
  podId: uuid(),
  transactionId: uuid(),
  categoryId: v.nullable(uuid()),
});

export const agentFpBulkAssignSchema = v.object({
  podId: uuid(),
  transactionIds: v.pipe(v.array(uuid()), v.minLength(1), v.maxLength(200)),
  categoryId: uuid(),
});

export const agentFpConfirmSchema = v.object({
  podId: uuid(),
  transactionIds: v.pipe(v.array(uuid()), v.minLength(1), v.maxLength(200)),
});

export const agentFpParserWriteSchema = v.object({
  podId: uuid(),
  parserId: v.optional(uuid()),
  name: v.optional(fpNameSchema),
  identifier: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(80)))),
  hasHeader: v.optional(v.boolean()),
  skipRows: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(100))),
  delimiter: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(4))),
  columnMap: v.optional(agentFpColumnMapSchema),
});

const importLog = v.object({
  kind: v.picklist(['parse', 'duplicate', 'error']),
  rowIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
  message: v.pipe(v.string(), v.maxLength(500)),
  fileLine: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  raw: v.optional(v.pipe(v.string(), v.maxLength(2000))),
});

const importRow = v.object({
  postedDate: isoDate,
  postedTime: v.optional(v.pipe(v.string(), v.maxLength(20))),
  amount: money,
  description: v.optional(v.pipe(v.string(), v.maxLength(4000))),
  recipient: v.optional(v.pipe(v.string(), v.maxLength(200))),
  externalId: v.optional(v.pipe(v.string(), v.maxLength(120))),
  notes: v.optional(v.pipe(v.string(), v.maxLength(4000))),
  rowIndex: v.pipe(v.number(), v.integer(), v.minValue(0)),
  fileLine: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
});

export const agentFpImportCreateSchema = v.object({
  podId: uuid(),
  parserId: v.optional(v.nullable(uuid())),
  accountId: uuid(),
  files: v.pipe(
    v.array(
      v.object({
        fileName: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
        contentSha256: v.pipe(v.string(), v.minLength(8), v.maxLength(128)),
        parsed: v.pipe(v.number(), v.integer(), v.minValue(0)),
        logs: v.optional(v.array(importLog)),
        rows: v.array(importRow),
      }),
    ),
    v.minLength(1),
    v.maxLength(20),
  ),
});

export const agentFpImportIdSchema = v.object({
  podId: uuid(),
  importId: v.optional(uuid()),
  sha256: v.optional(v.pipe(v.string(), v.minLength(8), v.maxLength(128))),
});

export const agentFpBillSplitSchema = v.object({
  podId: uuid(),
  parentId: uuid(),
  portionCount: v.optional(v.pipe(v.number(), v.integer(), v.minValue(2), v.maxValue(60))),
  startDate: v.optional(isoDate),
});

export const agentFpSettingSchema = v.object({
  podId: uuid(),
  currency: v.optional(v.pipe(v.string(), v.trim(), v.minLength(3), v.maxLength(8))),
  permission: v.optional(v.record(v.string(), v.unknown())),
});
