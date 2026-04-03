import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const content = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Seu Pedido Saiu para Entrega – Elabela Store</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:32px 0;">
  <tr>
    <td align="center">

      <!-- CONTAINER -->
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- HEADER LOGO -->
        <tr>
          <td align="center" style="background:#ffffff;border-radius:16px 16px 0 0;padding:32px 40px 24px;">
            <img src="https://pub-da9fd1c19b8e45d691d67626b9a7ba6d.r2.dev/1774394797596-1774394137445-019d2221-7f7a-7d12-8450-88629a0d7765-removebg-preview-(1)-(1).png" alt="Elabela Store" width="160" style="display:block;margin:0 auto;">
          </td>
        </tr>

        <!-- BANNER -->
        <tr>
          <td style="background:#1f2937;padding:28px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:36px;">🚚</p>
            <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#ffffff;">Seu pedido saiu para entrega!</p>
            <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);">Será entregue pela transportadora SPX BR</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px;">

            <!-- Saudação -->
            <p style="margin:0 0 8px;font-size:16px;color:#374151;">Olá, <strong style="color:#111111;">{{firstName}}!</strong> 👋</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
              Boas notícias! Seu pedido já está a caminho e em breve chegará até você.<br>
              Use o link abaixo para rastrear sua encomenda em tempo real.
            </p>

            <!-- Nº do Pedido -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:10px;margin-bottom:28px;">
              <tr>
                <td style="padding:14px 18px;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;">Número do Pedido</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#111111;">#{{orderId}}</p>
                </td>
              </tr>
            </table>

            <!-- RASTREAMENTO -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding-bottom:10px;">
                  <p style="margin:0;font-size:13px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.6px;">📦 Rastreamento</p>
                </td>
              </tr>
              <tr>
                <td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px 18px;">

                  <!-- Transportadora -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                    <tr>
                      <td>
                        <p style="margin:0 0 2px;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Transportadora</p>
                        <p style="margin:0;font-size:14px;color:#374151;font-weight:600;">SPX BR</p>
                      </td>
                      <td align="right" valign="middle">
                        <p style="margin:0 0 2px;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Previsão</p>
                        <p style="margin:0;font-size:14px;color:#374151;font-weight:600;text-align:right;">{{estimatedDate}}</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Botão rastrear -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="{{trackingUrl}}" style="display:inline-block;background:#1f2937;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 32px;border-radius:9px;width:100%;box-sizing:border-box;text-align:center;">
                          🔍 Rastrear meu pedido
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- DIVIDER -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              <tr><td style="border-top:1px solid #f3f4f6;"></td></tr>
            </table>

            <!-- ENTREGA -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
              <tr>
                <td style="padding-bottom:10px;">
                  <p style="margin:0;font-size:13px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.6px;">📍 Endereço de Entrega</p>
                </td>
              </tr>
              <tr>
                <td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 18px;">
                  <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">
                    {{fullAddress}}<br>
                    <span style="color:#6b7280;">{{cidade}}</span>
                  </p>
                </td>
              </tr>
            </table>

            <!-- PRODUTO -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-bottom:10px;">
                  <p style="margin:0;font-size:13px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.6px;">🛍️ Produto</p>
                </td>
              </tr>
              <tr>
                <td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 18px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td><p style="margin:0;font-size:14px;font-weight:600;color:#111111;">{{productName}}</p></td>
                      <td align="right"><p style="margin:0;font-size:14px;font-weight:700;color:#111111;">{{totalPrice}}</p></td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">Dúvidas? Entre em contato com nosso suporte.</p>
            <p style="margin:0;font-size:12px;color:#d1d5db;">© 2025 Elabela Store · Todos os direitos reservados</p>
          </td>
        </tr>

      </table>
      <!-- /CONTAINER -->

    </td>
  </tr>
</table>

</body>
</html>`

    await prisma.emailTemplate.upsert({
        where: { slug: 'tracking' },
        update: {
            content,
            subject: 'Seu pedido saiu para entrega! 🚚',
            name: 'Rastreamento (SPX BR)'
        },
        create: {
            slug: 'tracking',
            name: 'Rastreamento (SPX BR)',
            subject: 'Seu pedido saiu para entrega! 🚚',
            content
        }
    })
}

main().catch(console.error).finally(() => prisma.$disconnect())
