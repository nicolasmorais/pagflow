let reported = new Set<string>();

function getMetadata() {
    return {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        timestamp: new Date().toISOString(),
    };
}

function isNextNavigationSignal(error: unknown) {
    const digest = (error as any)?.digest;
    if (typeof digest === 'string' && (digest.startsWith('NEXT_REDIRECT') || digest === 'NEXT_NOT_FOUND')) return true;
    const message = error instanceof Error ? error.message : String(error);
    return message === 'NEXT_REDIRECT' || message.startsWith('NEXT_REDIRECT') || message === 'NEXT_NOT_FOUND';
}

export function reportError(error: unknown, source = 'client', extra?: Record<string, any>) {
    if (isNextNavigationSignal(error)) return; // sinal interno de navegação do Next.js, não é um erro real

    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const dedupeKey = `${source}:${message}`;
    if (reported.has(dedupeKey)) return;
    reported.add(dedupeKey);
    setTimeout(() => reported.delete(dedupeKey), 30000);

    const body = {
        level: 'error',
        source,
        message,
        stack,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        metadata: { ...getMetadata(), ...extra },
    };

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/errors', new Blob([JSON.stringify(body)], { type: 'application/json' }));
    } else {
        fetch('/api/errors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            keepalive: true,
        }).catch(() => {});
    }
}

export function initGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
        reportError(event.error || new Error(event.message), 'client', {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        reportError(event.reason, 'client', { type: 'unhandledrejection' });
    });
}
