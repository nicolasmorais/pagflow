import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const order = await prisma.order.findFirst({
            where: { id: { startsWith: 'cm04u2m9' } }
        });

        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found" });
        }

        await prisma.order.update({
            where: { id: order.id },
            data: {
                totalPrice: 2.00
            }
        });

        return NextResponse.json({ success: true, message: `Order ${order.id} updated to R$ 2,00` });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
