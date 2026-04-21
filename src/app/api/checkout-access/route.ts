import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, source, medium, campaign, term, content, placement, utmId, creativeName } = body;

    const newId = crypto.randomUUID();

    await prisma.checkoutAccess.create({
      data: {
        id: newId,
        productId: productId || null,
        source: source || null,
        medium: medium || null,
        campaign: campaign || null,
        term: term || null,
        content: content || null,
        placement: placement || null,
        utmId: utmId || null,
        creativeName: creativeName || null
      }
    });

    return NextResponse.json({ success: true, accessId: newId });
  } catch (error: any) {
    console.error("Checkout Access Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { accessId, step } = body;

  if (!accessId) {
    return NextResponse.json({ success: false, error: "accessId required" }, { status: 400 });
  }

  let column: string;
  switch (step) {
    case 1: column = 'step1Completed'; break;
    case 2: column = 'step2Completed'; break;
    case 3: column = 'step3Completed'; break;
    case 'payment': column = 'paymentCompleted'; break;
    default: return NextResponse.json({ success: false, error: "invalid step" }, { status: 400 });
  }

  try {
    await (prisma.checkoutAccess as any).update({
      where: { id: accessId },
      data: { [column]: true }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Checkout Update Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
