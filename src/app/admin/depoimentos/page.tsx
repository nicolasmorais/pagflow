export const dynamic = 'force-dynamic'

import { getTestimonials, TESTIMONIALS_LIMITS } from '@/lib/testimonials'
import TestimonialsManager from './TestimonialsManager'

export default async function DepoimentosPage() {
    const config = await getTestimonials()
    return (
        <div className="od">
            <div className="od-head">
                <div>
                    <h1>Depoimentos</h1>
                    <p className="od-meta">Aparecem na lateral do checkout, iguais para todos os produtos.</p>
                </div>
            </div>
            <TestimonialsManager initial={config} limits={TESTIMONIALS_LIMITS} />
        </div>
    )
}
