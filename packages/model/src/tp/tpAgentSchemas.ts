/**
 * Valibot schemas for trip planning agent operations
 */

import * as v from 'valibot';
import {isTpIsoCountryCode} from './tpIsoCountries';
import {isTpIsoCurrencyCode} from './tpIsoCurrencies';
import {isTpLocationType} from './tpLocationType';

// Common
const podId = v.pipe(v.string(), v.minLength(1));
const optionalString = v.optional(v.string());
const optionalNumber = v.optional(v.number());
const optionalNullString = v.optional(v.union([v.string(), v.null()]));
const optionalNullNumber = v.optional(v.union([v.number(), v.null()]));
const optionalBoolean = v.optional(v.boolean());

const currencyCode = v.pipe(
  v.string(),
  v.transform((s) => s.trim().toUpperCase()),
  v.regex(/^[A-Z]{3}$/),
  v.custom((c) => isTpIsoCurrencyCode(c as string)),
);

const optionalCurrencyCode = v.optional(currencyCode);

const optionalNullCurrencyCode = v.optional(v.union([v.null(), currencyCode]));

const optionalTransportLibId = v.optional(v.pipe(v.string(), v.minLength(1)));

const optionalNullTransportLibId = v.optional(v.union([v.null(), v.pipe(v.string(), v.minLength(1))]));

const importantReasonText = v.pipe(v.string(), v.maxLength(500));

const optionalImportantReason = v.optional(importantReasonText);

const optionalNullImportantReason = v.optional(v.union([v.null(), importantReasonText]));

// Trip
export const CreateTripSchema = v.object({
  podId,
  title: v.pipe(v.string(), v.minLength(1)),
  timezone: v.pipe(v.string(), v.minLength(1)),
  startDate: v.pipe(v.string(), v.minLength(1)),
  endDate: v.pipe(v.string(), v.minLength(1)),
  destinationNames: v.optional(v.array(v.pipe(v.string(), v.minLength(1)))),
  destinations: optionalString,
  budgetAmount: optionalNumber,
  budgetCurrency: optionalCurrencyCode,
});

export const UpdateTripSchema = v.object({
  podId,
  title: optionalString,
  timezone: optionalString,
  startDate: optionalString,
  endDate: optionalString,
  status: optionalString,
  budgetAmount: optionalNumber,
  budgetCurrency: optionalCurrencyCode,
  defaultCurrency: optionalCurrencyCode,
  mapsUrl: optionalString,
  notes: optionalString,
});

export const GetBudgetRollupSchema = v.object({
  podId,
});

// Destinations
export const CreateDestinationSchema = v.object({
  podId,
  name: v.pipe(v.string(), v.minLength(1)),
  sortOrder: optionalNumber,
  mapsUrl: optionalString,
  timezoneHint: optionalString,
  importantInfo: optionalString,
  activeStartDate: optionalString,
  activeEndDate: optionalString,
  notes: optionalString,
});

export const UpdateDestinationSchema = v.object({
  podId,
  destinationId: v.pipe(v.string(), v.minLength(1)),
  name: optionalString,
  sortOrder: optionalNumber,
  mapsUrl: optionalString,
  timezoneHint: optionalString,
  importantInfo: optionalString,
  activeStartDate: optionalString,
  activeEndDate: optionalString,
  notes: optionalString,
});

export const DeleteDestinationSchema = v.object({
  podId,
  destinationId: v.pipe(v.string(), v.minLength(1)),
});

// Days
export const UpdateDaySchema = v.object({
  podId,
  dayId: v.pipe(v.string(), v.minLength(1)),
  dayTitle: optionalString,
  dayNotes: optionalString,
  primaryDestinationId: optionalString,
});

// Actions
export const CreateActionSchema = v.object({
  podId,
  kind: v.pipe(v.string(), v.minLength(1)),
  title: v.pipe(v.string(), v.minLength(1)),
  anchorDayId: optionalString,
  destinationId: optionalString,
  placeText: optionalString,
  mapsUrl: optionalString,
  fromPlace: optionalString,
  toPlace: optionalString,
  fromDestinationId: optionalString,
  toDestinationId: optionalString,
  fromMapsUrl: optionalString,
  toMapsUrl: optionalString,
  checkInLocalTime: optionalString,
  checkInTimezone: optionalString,
  checkOutLocalTime: optionalString,
  checkOutTimezone: optionalString,
  startTime: optionalString,
  endTime: optionalString,
  costAmount: optionalNumber,
  costCurrency: optionalCurrencyCode,
  bookingRef: optionalString,
  url: optionalString,
  notes: optionalString,
  sortOrder: optionalNumber,
  done: optionalBoolean,
});

export const UpdateActionSchema = v.object({
  podId,
  actionId: v.pipe(v.string(), v.minLength(1)),
  title: optionalString,
  anchorDayId: optionalString,
  destinationId: optionalString,
  placeText: optionalString,
  mapsUrl: optionalString,
  fromPlace: optionalString,
  toPlace: optionalString,
  fromDestinationId: optionalString,
  toDestinationId: optionalString,
  fromMapsUrl: optionalString,
  toMapsUrl: optionalString,
  checkInLocalTime: optionalString,
  checkInTimezone: optionalString,
  checkOutLocalTime: optionalString,
  checkOutTimezone: optionalString,
  startTime: optionalString,
  endTime: optionalString,
  costAmount: optionalNumber,
  costCurrency: optionalCurrencyCode,
  bookingRef: optionalString,
  url: optionalString,
  notes: optionalString,
  selectedRouteId: optionalString,
  fromLocationId: optionalString,
  toLocationId: optionalString,
  durationMinutes: optionalNumber,
  sortOrder: optionalNumber,
  done: optionalBoolean,
});

export const DeleteActionSchema = v.object({
  podId,
  actionId: v.pipe(v.string(), v.minLength(1)),
});

// Routes
export const CreateRouteSchema = v.object({
  podId,
  actionId: v.pipe(v.string(), v.minLength(1)),
  name: v.pipe(v.string(), v.minLength(1)),
  notes: optionalString,
  sortOrder: optionalNumber,
});

export const UpdateRouteSchema = v.object({
  podId,
  routeId: v.pipe(v.string(), v.minLength(1)),
  name: optionalString,
  notes: optionalString,
  sortOrder: optionalNumber,
  costAmount: optionalNullNumber,
  costCurrency: optionalNullCurrencyCode,
  durationMinutes: optionalNullNumber,
  transportLibId: optionalNullTransportLibId,
});

export const DeleteRouteSchema = v.object({
  podId,
  routeId: v.pipe(v.string(), v.minLength(1)),
});

export const SelectRouteSchema = v.object({
  podId,
  actionId: v.pipe(v.string(), v.minLength(1)),
  routeId: v.pipe(v.string(), v.minLength(1)),
});

// Transports
export const CreateTransportSchema = v.object({
  podId,
  routeId: v.pipe(v.string(), v.minLength(1)),
  mode: optionalString,
  fromPlace: optionalString,
  toPlace: optionalString,
  departLocalTime: optionalString,
  departTimezone: optionalString,
  arriveLocalTime: optionalString,
  arriveTimezone: optionalString,
  costAmount: optionalNumber,
  costCurrency: optionalCurrencyCode,
  bookingRef: optionalString,
  url: optionalString,
  notes: optionalString,
  sortOrder: optionalNumber,
  durationMinutes: optionalNumber,
  fromLocationId: optionalString,
  toLocationId: optionalString,
  transportLibId: optionalTransportLibId,
  done: optionalBoolean,
});

export const UpdateTransportSchema = v.object({
  podId,
  transportId: v.pipe(v.string(), v.minLength(1)),
  mode: optionalString,
  fromPlace: optionalString,
  toPlace: optionalString,
  departLocalTime: optionalString,
  departTimezone: optionalString,
  arriveLocalTime: optionalString,
  arriveTimezone: optionalString,
  costAmount: optionalNullNumber,
  costCurrency: optionalNullCurrencyCode,
  bookingRef: optionalString,
  url: optionalString,
  notes: optionalString,
  sortOrder: optionalNumber,
  durationMinutes: optionalNullNumber,
  fromLocationId: optionalNullString,
  toLocationId: optionalNullString,
  transportLibId: optionalNullTransportLibId,
  done: optionalBoolean,
});

export const DeleteTransportSchema = v.object({
  podId,
  transportId: v.pipe(v.string(), v.minLength(1)),
});

// Attachments
export const ListAttachmentsSchema = v.object({
  podId,
  transportId: optionalString,
  destinationId: optionalString,
});

export const UploadAttachmentSchema = v.object({
  podId,
  transportId: optionalString,
  destinationId: optionalString,
  fileName: v.pipe(v.string(), v.minLength(1)),
  mimeType: v.pipe(v.string(), v.minLength(1)),
  contentBase64: v.pipe(v.string(), v.minLength(1)),
});

export const DeleteAttachmentSchema = v.object({
  podId,
  attachmentId: v.pipe(v.string(), v.minLength(1)),
});

const optionalCountryCode = v.optional(
  v.pipe(
    v.string(),
    v.regex(/^[A-Z]{2}$/),
    v.custom((c) => isTpIsoCountryCode(c as string)),
  ),
);

const optionalNullCountryCode = v.optional(
  v.union([
    v.null(),
    v.pipe(
      v.string(),
      v.regex(/^[A-Z]{2}$/),
      v.custom((c) => isTpIsoCountryCode(c as string)),
    ),
  ]),
);

const optionalLocationType = v.optional(
  v.pipe(v.string(), v.custom((t) => isTpLocationType(t as string))),
);

export const CreateLocationSchema = v.object({
  podId,
  name: v.pipe(v.string(), v.minLength(1)),
  address: optionalString,
  mapsUrl: optionalString,
  notes: optionalString,
  openTime: optionalString,
  closeTime: optionalString,
  website: optionalString,
  email: optionalString,
  phone: optionalString,
  country: optionalCountryCode,
  locationType: optionalLocationType,
  sortOrder: optionalNumber,
});

export const UpdateLocationSchema = v.object({
  podId,
  locationId: v.pipe(v.string(), v.minLength(1)),
  name: optionalString,
  address: optionalNullString,
  mapsUrl: optionalNullString,
  notes: optionalNullString,
  openTime: optionalNullString,
  closeTime: optionalNullString,
  website: optionalNullString,
  email: optionalNullString,
  phone: optionalNullString,
  country: optionalNullCountryCode,
  locationType: optionalLocationType,
  sortOrder: optionalNumber,
});

export const DeleteLocationSchema = v.object({
  podId,
  locationId: v.pipe(v.string(), v.minLength(1)),
});

export const LinkActionLocationSchema = v.object({
  podId,
  actionId: v.pipe(v.string(), v.minLength(1)),
  locationId: v.pipe(v.string(), v.minLength(1)),
  sortOrder: optionalNumber,
  done: optionalBoolean,
});

export const UpdateActionLocationSchema = v.object({
  podId,
  linkId: v.pipe(v.string(), v.minLength(1)),
  sortOrder: optionalNumber,
  done: optionalBoolean,
});

export const UnlinkActionLocationSchema = v.object({
  podId,
  linkId: v.pipe(v.string(), v.minLength(1)),
});

export const CreateTransportLibSchema = v.object({
  podId,
  label: v.pipe(v.string(), v.minLength(1)),
  mode: optionalString,
  durationMinutes: optionalNumber,
  costAmount: optionalNumber,
  costCurrency: optionalCurrencyCode,
  fromLocationId: optionalString,
  toLocationId: optionalString,
  notes: optionalString,
  sortOrder: optionalNumber,
  important: optionalBoolean,
  importantReason: optionalImportantReason,
});

export const UpdateTransportLibSchema = v.object({
  podId,
  transportLibId: v.pipe(v.string(), v.minLength(1)),
  label: optionalString,
  mode: optionalNullString,
  durationMinutes: optionalNullNumber,
  costAmount: optionalNullNumber,
  costCurrency: optionalNullCurrencyCode,
  fromLocationId: optionalNullString,
  toLocationId: optionalNullString,
  notes: optionalNullString,
  sortOrder: optionalNumber,
  important: optionalBoolean,
  importantReason: optionalNullImportantReason,
});

export const DeleteTransportLibSchema = v.object({
  podId,
  transportLibId: v.pipe(v.string(), v.minLength(1)),
});

export const LinkActionTransportSchema = v.object({
  podId,
  actionId: v.pipe(v.string(), v.minLength(1)),
  transportLibId: v.pipe(v.string(), v.minLength(1)),
  sortOrder: optionalNumber,
  durationMinutes: optionalNumber,
  costAmount: optionalNumber,
  costCurrency: optionalCurrencyCode,
  fromLocationId: optionalString,
  toLocationId: optionalString,
  done: optionalBoolean,
});

export const UpdateActionTransportSchema = v.object({
  podId,
  linkId: v.pipe(v.string(), v.minLength(1)),
  sortOrder: optionalNumber,
  durationMinutes: optionalNullNumber,
  costAmount: optionalNullNumber,
  costCurrency: optionalNullCurrencyCode,
  fromLocationId: optionalNullString,
  toLocationId: optionalNullString,
  done: optionalBoolean,
});

export const UnlinkActionTransportSchema = v.object({
  podId,
  linkId: v.pipe(v.string(), v.minLength(1)),
});

const travelWithRouteFields = {
  podId,
  title: v.pipe(v.string(), v.minLength(1)),
  anchorDayId: optionalString,
  fromPlace: optionalString,
  toPlace: optionalString,
  fromDestinationId: optionalString,
  toDestinationId: optionalString,
  fromMapsUrl: optionalString,
  toMapsUrl: optionalString,
  fromLocationId: optionalString,
  toLocationId: optionalString,
  costAmount: optionalNumber,
  costCurrency: optionalCurrencyCode,
  bookingRef: optionalString,
  url: optionalString,
  notes: optionalString,
  sortOrder: optionalNumber,
  done: optionalBoolean,
  route: v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    notes: optionalString,
    sortOrder: optionalNumber,
    transportLibId: optionalTransportLibId,
    costAmount: optionalNumber,
    costCurrency: optionalCurrencyCode,
    durationMinutes: optionalNumber,
  }),
  initialStep: v.optional(
    v.object({
      transportLibId: optionalTransportLibId,
      mode: optionalString,
      fromPlace: optionalString,
      toPlace: optionalString,
      fromLocationId: optionalString,
      toLocationId: optionalString,
      departLocalTime: optionalString,
      departTimezone: optionalString,
      arriveLocalTime: optionalString,
      arriveTimezone: optionalString,
      costAmount: optionalNumber,
      costCurrency: optionalCurrencyCode,
      bookingRef: optionalString,
      url: optionalString,
      notes: optionalString,
      sortOrder: optionalNumber,
    }),
  ),
  selectRoute: optionalBoolean,
  kind: v.optional(v.never('kind must not be set; this tool always creates travel')),
};

export const CreateTpTravelWithRouteSchema = v.object(travelWithRouteFields);
