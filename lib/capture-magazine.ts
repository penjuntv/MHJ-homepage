export type CaptureType = 'article' | 'page' | 'cover';

export interface CaptureResult {
  url: string;
  type: CaptureType;
  id: string | number;
  magazine_id: string;
  storagePath: string;
  durationMs: number;
  memoryUsageMb: number;
}

const CAPTURE_TIMEOUT_MS = 60_000;

export async function captureItem(args: {
  type: CaptureType;
  id: string | number;
  magazine_id: string;
  signal?: AbortSignal;
}): Promise<CaptureResult> {
  const timeoutCtl = new AbortController();
  const timer = setTimeout(() => timeoutCtl.abort(new Error('client timeout')), CAPTURE_TIMEOUT_MS);

  const onExternalAbort = () => timeoutCtl.abort(args.signal?.reason);
  if (args.signal) {
    if (args.signal.aborted) timeoutCtl.abort(args.signal.reason);
    else args.signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    const res = await fetch('/api/magazine/capture', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: args.type, id: args.id, magazine_id: args.magazine_id }),
      signal: timeoutCtl.signal,
    });

    let json: Record<string, unknown> | null = null;
    try { json = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON */ }

    if (!res.ok) {
      const msg =
        (json && typeof json.error === 'string' && json.error) ||
        `HTTP ${res.status} ${res.statusText}`;
      throw new Error(msg);
    }
    if (!json || typeof json.url !== 'string') {
      throw new Error('Invalid capture response');
    }
    return json as unknown as CaptureResult;
  } finally {
    clearTimeout(timer);
    if (args.signal) args.signal.removeEventListener('abort', onExternalAbort);
  }
}
