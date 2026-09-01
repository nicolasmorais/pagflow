import { onLCP, onINP, onCLS, onFCP, onTTFB, type Metric } from 'web-vitals';

function send(metric: Metric, visitorId: string) {
    const body = {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        visitorId,
    };

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/vitals', new Blob([JSON.stringify(body)], { type: 'application/json' }));
    } else {
        fetch('/api/vitals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            keepalive: true,
        }).catch(() => {});
    }
}

export function reportWebVitals(visitorId: string) {
    if (typeof window === 'undefined' || !visitorId) return;
    onLCP(m => send(m, visitorId));
    onINP(m => send(m, visitorId));
    onCLS(m => send(m, visitorId));
    onFCP(m => send(m, visitorId));
    onTTFB(m => send(m, visitorId));
}
