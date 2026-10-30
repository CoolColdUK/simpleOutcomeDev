import type {TpAgentWarning} from './tpAgentWarning';

export interface TpTravelWarningStep {
  readonly id?: string;
  readonly sortOrder: number;
  readonly transportLibId?: string;
  readonly mode?: string;
  readonly fromPlace?: string;
  readonly toPlace?: string;
}

export interface TpTravelWarningInput {
  readonly kind: string;
  readonly selectedRouteId?: string;
  readonly fromPlace?: string;
  readonly toPlace?: string;
  readonly steps: readonly TpTravelWarningStep[];
  readonly legacyActionTransportCount: number;
}

function trimmed(value: string | undefined): string {
  return value?.trim() ?? '';
}

function isGenericMode(mode: string | undefined): boolean {
  const value = trimmed(mode).toLowerCase();
  return value === '' || value === 'other';
}

function endpointWarnings(
  input: TpTravelWarningInput,
  first: TpTravelWarningStep | undefined,
  last: TpTravelWarningStep | undefined,
): readonly TpAgentWarning[] {
  if (first === undefined || last === undefined) {
    return [];
  }
  const fromAction = trimmed(input.fromPlace);
  const fromStep = trimmed(first.fromPlace);
  const toAction = trimmed(input.toPlace);
  const toStep = trimmed(last.toPlace);
  const fromMismatch =
    fromAction !== '' && fromStep !== '' && fromAction !== fromStep
      ? [{code: 'endpoint_mismatch', message: 'Action endpoints do not match first/last step places.', path: 'fromPlace'}]
      : [];
  const toMismatch =
    toAction !== '' && toStep !== '' && toAction !== toStep
      ? [{code: 'endpoint_mismatch', message: 'Action endpoints do not match first/last step places.', path: 'toPlace'}]
      : [];
  return [...fromMismatch, ...toMismatch];
}

export default function collectTpTravelWarnings(input: TpTravelWarningInput): readonly TpAgentWarning[] {
  if (input.kind !== 'travel') {
    return [];
  }
  const selectedRouteId = trimmed(input.selectedRouteId);
  const noRoute =
    selectedRouteId === ''
      ? [
          {
            code: 'travel_no_selected_route',
            message: 'Travel action has no selected route; day card glance may be incomplete.',
            path: 'selectedRouteId',
          },
        ]
      : [];
  const steps =
    selectedRouteId === '' ? [] : [...input.steps].sort((a, b) => a.sortOrder - b.sortOrder || 0);
  const noSteps =
    selectedRouteId !== '' && steps.length === 0
      ? [{code: 'route_no_steps', message: 'Selected route has no journey steps.', path: 'route'}]
      : [];
  const missingLib = steps.flatMap((step, index) => {
    if (trimmed(step.transportLibId) !== '' || !isGenericMode(step.mode)) {
      return [];
    }
    const stepId = trimmed(step.id);
    const path = stepId === '' ? `steps/${index}.transportLibId` : `steps/${stepId}.transportLibId`;
    return [
      {
        code: 'step_missing_transport_lib',
        message: 'Step has no transport library link; prefer transportLibId.',
        path,
      },
    ];
  });
  const first = steps[0];
  const last = steps[steps.length - 1];
  const legacy =
    input.legacyActionTransportCount > 0
      ? [
          {
            code: 'legacy_action_transport_present',
            message: 'Legacy action-level transport links exist; use route steps instead.',
            path: 'actionTransports',
          },
        ]
      : [];
  return [...noRoute, ...noSteps, ...missingLib, ...endpointWarnings(input, first, last), ...legacy];
}
