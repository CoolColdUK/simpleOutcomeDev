const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  readonly render: (element: HTMLElement, options: TurnstileRenderOptions) => string;
  readonly execute: (widgetId: string) => void;
  readonly remove: (widgetId: string) => void;
}

type TurnstileRenderOptions = {
  readonly sitekey: string;
  readonly execution: 'execute';
  readonly appearance: 'interaction-only';
  readonly size: 'compact';
  readonly retry: 'never';
  readonly callback: (token: string) => void;
  readonly 'error-callback': () => boolean;
  readonly 'expired-callback': () => void;
  readonly 'timeout-callback': () => void;
};

export interface TurnstileTokenSuccess {
  readonly ok: true;
  readonly token: string;
  readonly widgetId: string;
}

export interface TurnstileTokenFailure {
  readonly ok: false;
  readonly widgetId?: string;
}

export type TurnstileTokenResult = TurnstileTokenSuccess | TurnstileTokenFailure;

declare global {
  interface Window {
    __soTurnstileOnLoad?: () => void;
    turnstile?: TurnstileApi;
  }
}

const scriptLoad: {promise?: Promise<TurnstileApi | undefined>} = {};

function once(run: (api: TurnstileApi | undefined) => void): (api: TurnstileApi | undefined) => void {
  const gate = {open: true};
  return (api) => {
    if (!gate.open) {
      return;
    }
    gate.open = false;
    run(api);
  };
}

function loadTurnstile(): Promise<TurnstileApi | undefined> {
  if (window.turnstile !== undefined) {
    return Promise.resolve(window.turnstile);
  }
  if (scriptLoad.promise !== undefined) {
    return scriptLoad.promise;
  }
  scriptLoad.promise = new Promise((resolve) => {
    const finish = once((api) => {
      if (api === undefined) {
        scriptLoad.promise = undefined;
      }
      resolve(api);
    });
    window.__soTurnstileOnLoad = () => finish(window.turnstile);
    const script = document.createElement('script');
    script.src = `${TURNSTILE_SCRIPT}&onload=__soTurnstileOnLoad`;
    script.async = true;
    script.addEventListener('error', () => finish(undefined));
    document.head.appendChild(script);
  });
  return scriptLoad.promise;
}

export function removeTurnstileWidget(widgetId: string | undefined): void {
  if (widgetId === undefined || window.turnstile === undefined) {
    return;
  }
  window.turnstile.remove(widgetId);
}

export async function requestTurnstileToken(container: HTMLElement, siteKey: string, previousWidgetId: string | undefined): Promise<TurnstileTokenResult> {
  const api = await loadTurnstile();
  if (api === undefined) {
    return {ok: false};
  }
  if (previousWidgetId !== undefined) {
    try {
      api.remove(previousWidgetId);
    } catch {
      return {ok: false};
    }
  }
  return new Promise((resolve) => {
    const gate = {open: true};
    const created: {widgetId?: string} = {};
    const failed = {value: false};
    const finish = (result: TurnstileTokenResult): void => {
      if (!gate.open) {
        return;
      }
      gate.open = false;
      resolve(result);
    };
    const fail = (): void => finish({ok: false, widgetId: created.widgetId});
    try {
      created.widgetId = api.render(container, {
        sitekey: siteKey,
        execution: 'execute',
        appearance: 'interaction-only',
        size: 'compact',
        retry: 'never',
        callback: (token) => {
          const id = created.widgetId;
          if (id === undefined || token.trim().length === 0) {
            finish({ok: false, widgetId: id});
            return;
          }
          finish({ok: true, token, widgetId: id});
        },
        'error-callback': () => {
          failed.value = true;
          queueMicrotask(fail);
          return false;
        },
        'expired-callback': () => queueMicrotask(fail),
        'timeout-callback': () => queueMicrotask(fail),
      });
      if (gate.open && !failed.value && created.widgetId !== undefined) {
        api.execute(created.widgetId);
      }
    } catch {
      fail();
    }
  });
}
