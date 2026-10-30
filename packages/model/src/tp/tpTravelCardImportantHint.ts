export interface TpTravelImportantLibRef {
  readonly id: string;
  readonly important?: boolean;
  readonly importantReason?: string;
}

export interface TpTravelCardImportantHintInput {
  readonly kind: string;
  readonly selectedRouteId?: string;
  readonly routes: readonly {
    readonly id: string;
    readonly isSelected?: boolean;
    readonly transportLibId?: string;
  }[];
  readonly steps: readonly {
    readonly routeId: string;
    readonly sortOrder: number;
    readonly transportLibId?: string;
  }[];
  readonly actionTransportLibIds: readonly string[];
  readonly transportLib: readonly TpTravelImportantLibRef[];
}

export interface TpTravelCardImportantHint {
  readonly show: boolean;
  readonly reason?: string;
}

function trimmed(value: string | undefined): string {
  return value?.trim() ?? '';
}

function selectedRoute(input: TpTravelCardImportantHintInput) {
  const byId = input.routes.find((route) => route.id === input.selectedRouteId);
  if (byId !== undefined) {
    return byId;
  }
  return input.routes.find((route) => route.isSelected === true);
}

function orderedLibIds(input: TpTravelCardImportantHintInput, routeId: string | undefined): readonly string[] {
  const routeLib = routeId === undefined ? [] : input.routes.filter((route) => route.id === routeId).map((route) => route.transportLibId);
  const stepLibs = [...input.steps]
    .filter((step) => step.routeId === routeId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((step) => step.transportLibId);
  const ids = [...routeLib, ...stepLibs, ...input.actionTransportLibIds];
  return ids.filter((id, index): id is string => id !== undefined && id !== '' && ids.indexOf(id) === index);
}

export default function tpTravelCardImportantHint(input: TpTravelCardImportantHintInput): TpTravelCardImportantHint {
  if (input.kind !== 'travel') {
    return {show: false};
  }
  const route = selectedRoute(input);
  const libs = orderedLibIds(input, route?.id);
  const important = libs
    .map((id) => input.transportLib.find((row) => row.id === id))
    .filter((row): row is TpTravelImportantLibRef => row !== undefined && row.important === true);
  if (important.length === 0) {
    return {show: false};
  }
  const reasons = important
    .map((row) => trimmed(row.importantReason))
    .filter((reason, index, all) => reason !== '' && all.indexOf(reason) === index);
  if (reasons.length === 0) {
    return {show: true};
  }
  return {show: true, reason: reasons.join('\n')};
}
