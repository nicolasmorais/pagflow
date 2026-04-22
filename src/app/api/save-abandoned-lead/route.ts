import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This endpoint accepts sendBeacon requests (text/plain Content-Type)
// Used for last-chance saves when user closes tab abruptly
export async function POST(req: NextRequest) {
    try {
        let body: any;
        const contentType = req.headers.get('content-type') || '';

        // sendBeacon sends as text/plain, normal fetch as application/json
        if (contentType.includes('application/json')) {
            body = await req.json();
        } else {
            const text = await req.text();
            body = JSON.parse(text);
        }

        const {
            id,
            fullName,
            email,
            phone,
            cpf,
            productId,
            totalPrice,
            lastStepReached,
            paymentStatus,
            cep,
            rua,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            destinatario,
            paymentMethod,
            utmSource,
            utmMedium,
            utmCampaign,
            utmTerm,
            utmContent,
            utmPlacement,
            utmId,
            utmCreativeName,
        } = body;

        // Only save if we have at bare minimum an email or an orderId
        if (!email && !id) {
            return NextResponse.json({ success: false, error: "No identifier" }, { status: 400 });
        }

        const payload = {
            fullName: fullName || null,
            email: email || null,
            phone: phone || null,
            cpf: cpf || null,
            productId: productId || null,
            totalPrice: totalPrice != null ? Number(totalPrice) : 0,
            lastStepReached: lastStepReached ? Number(lastStepReached) : 1,
            paymentStatus: 'abandonado',
            cep: cep || null,
            rua: rua || null,
            numero: numero || null,
            complemento: complemento || null,
            bairro: bairro || null,
            cidade: cidade || null,
            estado: estado || null,
            recipient: destinatario || null,
            paymentMethod: paymentMethod || null,
            utmSource: utmSource || null,
            utmMedium: utmMedium || null,
            utmCampaign: utmCampaign || null,
            utmTerm: utmTerm || null,
            utmContent: utmContent || null,
            utmPlacement: utmPlacement || null,
            utmId: utmId || null,
            utmCreativeName: utmCreativeName || null,
        };

        if (id) {
            // Try to update existing order, but NEVER downgrade status from 'pago'
            const existing = await prisma.order.findUnique({ where: { id } });
            if (existing) {
                if (existing.paymentStatus === 'pago') {
                    return NextResponse.json({ success: true, id, note: "already paid" });
                }
                const updated = await prisma.order.update({
                    where: { id },
                    data: payload,
                });
                return NextResponse.json({ success: true, id: updated.id });
            }
        }

        // Create new order record
        const created = await prisma.order.create({ data: payload });
        return NextResponse.json({ success: true, id: created.id });
    } catch (error: any) {
        console.error("Save Abandoned Lead Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
