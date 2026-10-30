import safeParseSchema from '../apiKey/safeParseSchema';
import {CreateTpTravelWithRouteSchema, CreateTransportLibSchema, UpdateTransportLibSchema} from './tpAgentSchemas';

const valid = {
  podId: 'pod-1',
  title: 'HK to Tokyo',
  route: {name: 'Option 1'},
};

describe('CreateTpTravelWithRouteSchema', () => {
  it('accepts a travel title, named route, and optional first step', () => {
    const parsed = safeParseSchema(CreateTpTravelWithRouteSchema, {
      ...valid,
      fromPlace: 'HK',
      toPlace: 'Tokyo',
      selectRoute: false,
      route: {name: 'JR', transportLibId: 'lib-1', costAmount: 120, costCurrency: 'jpy'},
      initialStep: {transportLibId: 'lib-1', fromPlace: 'HK', toPlace: 'Tokyo'},
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.route.costCurrency).toBe('JPY');
      expect(parsed.value.selectRoute).toBe(false);
      expect(parsed.value.initialStep?.transportLibId).toBe('lib-1');
    }
  });

  it('requires podId, title, and route.name', () => {
    expect(safeParseSchema(CreateTpTravelWithRouteSchema, {podId: 'pod-1', route: {name: 'A'}}).ok).toBe(false);
    expect(safeParseSchema(CreateTpTravelWithRouteSchema, {podId: 'pod-1', title: 'Trip'}).ok).toBe(false);
    expect(safeParseSchema(CreateTpTravelWithRouteSchema, {title: 'Trip', route: {name: 'A'}}).ok).toBe(false);
    expect(safeParseSchema(CreateTpTravelWithRouteSchema, {...valid, route: {name: ''}}).ok).toBe(false);
  });

  it('rejects kind because the tool always creates travel', () => {
    const parsed = safeParseSchema(CreateTpTravelWithRouteSchema, {...valid, kind: 'stay'});
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.message.toLowerCase()).toContain('kind');
    }
  });

  it('rejects an invalid currency', () => {
    expect(
      safeParseSchema(CreateTpTravelWithRouteSchema, {...valid, route: {name: 'A', costCurrency: 'ZZZ'}}).ok,
    ).toBe(false);
  });
});

describe('transport library important fields', () => {
  it('accepts an optional important flag and a reason up to 500 characters', () => {
    const parsed = safeParseSchema(CreateTransportLibSchema, {
      podId: 'pod-1',
      label: 'Ferry',
      important: true,
      importantReason: 'n'.repeat(500),
    });
    expect(parsed.ok).toBe(true);
  });

  it('rejects a reason longer than 500 characters', () => {
    expect(
      safeParseSchema(UpdateTransportLibSchema, {
        podId: 'pod-1',
        transportLibId: 'lib-1',
        importantReason: 'n'.repeat(501),
      }).ok,
    ).toBe(false);
  });

  it('allows clearing the reason with null', () => {
    const parsed = safeParseSchema(UpdateTransportLibSchema, {
      podId: 'pod-1',
      transportLibId: 'lib-1',
      important: false,
      importantReason: null,
    });
    expect(parsed.ok).toBe(true);
  });
});
