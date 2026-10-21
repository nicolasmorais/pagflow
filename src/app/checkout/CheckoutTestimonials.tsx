import './testimonials.css'

export interface PublicTestimonial {
    id: string;
    name: string;
    location: string;
    text: string;
    rating: number;
    photoUrl: string;
}

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function Stars({ rating }: { rating: number }) {
    return (
        <div className="tst-stars" role="img" aria-label={`${rating} de 5 estrelas`}>
            {[1, 2, 3, 4, 5].map(n => (
                <svg key={n} viewBox="0 0 20 20" aria-hidden="true" className={n <= rating ? 'is-on' : ''}>
                    <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z" />
                </svg>
            ))}
        </div>
    )
}

export function TestimonialItem({ t }: { t: PublicTestimonial }) {
    return (
        <figure className="tst-item">
            <Stars rating={t.rating} />
            <blockquote className="tst-text">{t.text}</blockquote>
            <figcaption className="tst-author">
                {t.photoUrl
                    ? <img className="tst-avatar" src={t.photoUrl} alt="" loading="lazy" width={36} height={36} />
                    : <span className="tst-avatar tst-initials" aria-hidden="true">{initials(t.name)}</span>}
                <span>
                    <span className="tst-name">{t.name}</span>
                    {t.location && <span className="tst-location">{t.location}</span>}
                </span>
            </figcaption>
        </figure>
    )
}

export default function CheckoutTestimonials({ title, items }: { title: string; items: PublicTestimonial[] }) {
    if (!items.length) return null
    return (
        <section className="tst-section" aria-labelledby="tst-title">
            <h2 id="tst-title" className="tst-title">{title}</h2>
            <div className="tst-list">
                {items.map(t => <TestimonialItem key={t.id} t={t} />)}
            </div>
        </section>
    )
}
