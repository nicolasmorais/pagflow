export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { getDateFilters } from '@/lib/date-utils'
import AntiFugaClient from './AntiFugaClient'

export default async function AntiFugaPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string; filter?: string }>
}) {
    const params = await searchParams
    const { fromDate, toDate, fromDateUTC, toDateUTC } = getDateFilters(
        params.filter, params.from, params.to
    )

    // Load config
    const configModel = (prisma as any).exitPopupConfig || (await prisma).exitPopupConfig;

    if (!configModel) {
        throw new Error("O Prisma Client ainda não foi atualizado com os novos modelos Anti-Fuga. Por favor, reinicie o servidor de desenvolvimento (npm run dev).");
    }

    // Fetch all needed data with safety
    let config: any;
    let shown, accepted, declined, expired;
    let chartData;

    try {
        config = await configModel.findFirst();
        if (!config) {
            config = await configModel.create({
                data: { isEnabled: true, discountPct: 50, timerSeconds: 480 }
            });
        }

        const p: any = prisma;

        // Analytics: aggregate events filtered by date
        const counts = await Promise.all([
            p.exitPopupEvent.count({ where: { event: 'shown', createdAt: { gte: fromDateUTC, lte: toDateUTC } } }),
            p.exitPopupEvent.count({ where: { event: 'accepted', createdAt: { gte: fromDateUTC, lte: toDateUTC } } }),
            p.exitPopupEvent.count({ where: { event: 'declined', createdAt: { gte: fromDateUTC, lte: toDateUTC } } }),
            p.exitPopupEvent.count({ where: { event: 'expired', createdAt: { gte: fromDateUTC, lte: toDateUTC } } }),
        ]);

        shown = counts[0];
        accepted = counts[1];
        declined = counts[2];
        expired = counts[3];

        // Last 7 days breakdown for the chart (historical context)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentEvents = await p.exitPopupEvent.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
            orderBy: { createdAt: 'asc' },
        });

        // Build daily map
        const dailyMap: Record<string, { shown: number; accepted: number }> = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });
            dailyMap[key] = { shown: 0, accepted: 0 };
        }

        for (const ev of recentEvents) {
            const key = ev.createdAt.toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo'
            });
            if (!dailyMap[key]) dailyMap[key] = { shown: 0, accepted: 0 };
            if (ev.event === 'shown') dailyMap[key].shown++;
            if (ev.event === 'accepted') dailyMap[key].accepted++;
        }

        chartData = Object.entries(dailyMap).map(([date, d]) => ({ date, ...d }));

    } catch (dbError: any) {
        console.error("Erro de conexão com o banco na página Anti-Fuga:", dbError);
        throw new Error(`Não foi possível conectar ao banco de dados. ${dbError.message.includes('EHOSTUNREACH') ? 'O servidor de banco de dados está inacessível. Verifique sua conexão ou reinicie o servidor (npm run dev).' : 'Erro técnico: ' + dbError.message}`);
    }

    return (
        <AntiFugaClient
            config={config}
            stats={{ shown, accepted, declined, expired }}
            chartData={chartData}
            filterState={{
                currentFilter: params.filter || 'today',
                fromDate,
                toDate
            }}
        />
    )
}
