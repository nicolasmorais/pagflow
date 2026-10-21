import { prisma } from '@/lib/prisma';

// Depoimentos universais: os mesmos em todos os checkouts, cadastrados no admin.
export const TESTIMONIALS_KEY = 'checkout_testimonials';

export interface Testimonial {
    id: string;
    name: string;
    location: string;
    text: string;
    rating: number;
    photoUrl: string;
    active: boolean;
}

export interface TestimonialsConfig {
    enabled: boolean;
    title: string;
    maxShown: number;
    items: Testimonial[];
}

export const TESTIMONIALS_LIMITS = {
    maxShown: [1, 10],
    name: 60,
    location: 60,
    text: 400,
    title: 60,
    items: 50,
} as const;

export const TESTIMONIALS_DEFAULTS: TestimonialsConfig = {
    enabled: true,
    title: 'O que dizem nossos clientes',
    maxShown: 3,
    items: [],
};

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function safeUrl(v: unknown): string {
    const s = str(v, 500);
    return /^https:\/\/[^\s"'<>]+$/i.test(s) ? s : '';
}

export function normalizeTestimonials(raw: unknown): TestimonialsConfig {
    const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const d = TESTIMONIALS_DEFAULTS;
    const maxShown = Math.round(Number(r.maxShown));
    const items = (Array.isArray(r.items) ? r.items : [])
        .slice(0, TESTIMONIALS_LIMITS.items)
        .map((it: any): Testimonial => ({
            id: str(it?.id, 40) || Math.random().toString(36).slice(2, 10),
            name: str(it?.name, TESTIMONIALS_LIMITS.name),
            location: str(it?.location, TESTIMONIALS_LIMITS.location),
            text: str(it?.text, TESTIMONIALS_LIMITS.text),
            rating: Math.min(5, Math.max(1, Math.round(Number(it?.rating)) || 5)),
            photoUrl: safeUrl(it?.photoUrl),
            active: it?.active !== false,
        }))
        .filter(it => it.name && it.text);
    return {
        enabled: typeof r.enabled === 'boolean' ? r.enabled : d.enabled,
        title: str(r.title, TESTIMONIALS_LIMITS.title) || d.title,
        maxShown: Number.isFinite(maxShown)
            ? Math.min(TESTIMONIALS_LIMITS.maxShown[1], Math.max(TESTIMONIALS_LIMITS.maxShown[0], maxShown))
            : d.maxShown,
        items,
    };
}

export function parseTestimonials(value: string | null | undefined): TestimonialsConfig {
    try {
        return normalizeTestimonials(value ? JSON.parse(value) : null);
    } catch {
        return TESTIMONIALS_DEFAULTS;
    }
}

export async function getTestimonials(): Promise<TestimonialsConfig> {
    const setting = await prisma.customization_settings.findUnique({ where: { key: TESTIMONIALS_KEY } });
    return parseTestimonials(setting?.value);
}

/** O que o checkout recebe: só o necessário para exibir */
export function publicTestimonials(config: TestimonialsConfig) {
    if (!config.enabled) return null;
    const items = config.items.filter(i => i.active).slice(0, config.maxShown)
        .map(({ id, name, location, text, rating, photoUrl }) => ({ id, name, location, text, rating, photoUrl }));
    return items.length ? { title: config.title, items } : null;
}
