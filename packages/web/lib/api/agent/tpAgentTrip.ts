/**
 * Trip planning agent: trip lifecycle helpers
 */

import {agentErr, type AgentErr} from '@/lib/api/agent/agentResult';

export const TP_TRIP_NOT_SETUP_MESSAGE = 'Trip not set up; call create_trip first';

export const TP_TRIP_SETUP_HINT =
  'Trip is not set up yet. Call create_trip with title, startDate, endDate, and timezone (and optional destinations).';

export function agentTripNotSetup(): AgentErr {
  return agentErr(409, 'trip_not_setup', TP_TRIP_NOT_SETUP_MESSAGE);
}

export function agentTripAlreadyExists(): AgentErr {
  return agentErr(409, 'trip_already_exists', 'Trip already exists for this pod');
}
