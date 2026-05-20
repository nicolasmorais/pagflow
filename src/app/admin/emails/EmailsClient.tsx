'use client'

import { useState } from 'react'
import { createEmailTemplate, updateEmailTemplate, deleteEmailTemplate, sendTestEmail } from '@/app/actions'
import { Mail, Edit2, Trash2, Plus, Save, Eye, Hash, Info, History, ArrowLeft, Copy, CheckCircle } from 'lucide-react'

export default function EmailsClient({ initialTemplates }: { initialTemplates: any[] }) {
    const [templates, setTemplates] = useState(initialTemplates);
    const [selectedId, setSelectedId] = useState<string | null>(initialTemplates[0]?.id || null);
    const [editData, setEditData] = useState<any>(initialTemplates[0] || { name: '', slug: '', subject: '', content: '' });
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [testEmail, setTestEmail] = useState('');
    const [testSending, setTestSending] = useState(false);
    const [testResult, setTestResult] = useState<string | null>(null);

    const handleSelect = (id: string) => {
        const t = templates.find(x => x.id === id);
        setSelectedId(id);
        setEditData(t);
        setShowPreview(false);
    };

    const handleNew = () => {
        setSelectedId(null);
        setEditData({ name: 'Novo Template', slug: 'novo-slug', subject: '', content: '<div style="font-family: sans-serif; padding: 20px;">\n  <h1>Olá, {{firstName}}!</h1>\n  <p>Seu pedido está sendo processado.</p>\n</div>' });
        setShowPreview(false);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            if (selectedId) {
                const res = await updateEmailTemplate(selectedId, editData);
                if (res.success) {
                    setTemplates(prev => prev.map(t => t.id === selectedId ? res.data : t));
                }
            } else {
                const res = await createEmailTemplate(editData);
                if (res.success) {
                    setTemplates(prev => [...prev, res.data]);
                    setSelectedId(res.data.id);
                }
            }
            alert('Template salvo com sucesso!');
        } catch (err) {
            alert('Erro ao salvar template.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        if (!confirm('Tem certeza que deseja excluir este template?')) return;

        setLoading(true);
        try {
            await deleteEmailTemplate(selectedId);
            setTemplates(prev => prev.filter(t => t.id !== selectedId));
            if (templates.length > 1) {
                handleSelect(templates[0].id === selectedId ? templates[1].id : templates[0].id);
            } else {
                handleNew();
            }
        } catch (err) {
            alert('Erro ao excluir');
        } finally {
            setLoading(false);
        }
    };

    const copyPlaceholder = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleSendTest = async () => {
        if (!selectedId || !testEmail.trim()) return;
        setTestSending(true);
        setTestResult(null);
        try {
            const res = await sendTestEmail(selectedId, testEmail.trim());
            setTestResult(res.success ? 'E-mail de teste enviado com sucesso!' : `Erro: ${res.error}`);
        } catch {
            setTestResult('Erro ao enviar e-mail de teste.');
        } finally {
            setTestSending(false);
        }
    };

    const handleCreateDefaults = async () => {
        const defaults = [
            {
                name: 'Compra Aprovada',
                slug: 'confirmation',
                subject: 'Pagamento Aprovado! #{{orderId}}',
                content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagamento Aprovado – PagFlow</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#0d1f17;font-family:'DM Sans',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d1f17;padding:40px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- HEADER -->
      <tr>
        <td style="background:#0d1f17;padding:0 0 28px;text-align:center;">
          <span style="font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#4ade80;">PagFlow</span>
        </td>
      </tr>

      <!-- HERO CARD -->
      <tr>
        <td style="background:linear-gradient(160deg,#052e16 0%,#14532d 60%,#166534 100%);border-radius:20px 20px 0 0;padding:52px 40px 44px;text-align:center;position:relative;overflow:hidden;">
          <div style="display:inline-block;width:72px;height:72px;background:#16a34a;border-radius:50%;line-height:72px;font-size:34px;margin-bottom:20px;box-shadow:0 0 0 12px rgba(74,222,128,0.12),0 0 0 24px rgba(74,222,128,0.05);">✓</div>
          <h1 style="margin:0 0 10px;font-family:'DM Serif Display',serif;font-size:34px;font-weight:400;color:#f0fdf4;letter-spacing:-0.5px;">Pagamento Aprovado!</h1>
          <p style="margin:0;font-size:15px;color:#86efac;line-height:1.5;">Olá, <strong style="color:#bbf7d0;">{{firstName}}</strong> — seu pedido está confirmado e em processamento.</p>
        </td>
      </tr>

      <!-- ORDER ID RIBBON -->
      <tr>
        <td style="background:#16a34a;padding:14px 40px;text-align:center;">
          <span style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#dcfce7;">Pedido</span>
          &nbsp;&nbsp;
          <span style="font-size:15px;font-weight:700;color:#fff;letter-spacing:0.04em;">#{{orderId}}</span>
        </td>
      </tr>

      <!-- MAIN BODY -->
      <tr>
        <td style="background:#fff;padding:40px;border-radius:0 0 20px 20px;">

          <p style="margin:0 0 32px;font-size:15px;color:#334155;line-height:1.65;">
            Olá, <strong>{{fullName}}</strong>! Recebemos e confirmamos seu pagamento com sucesso. Confira o resumo do pedido abaixo.
          </p>

          <!-- Product block -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="border-left:3px solid #16a34a;padding:0 0 0 16px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;">Produto</p>
                <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#0f172a;">{{productName}}</p>
                <p style="margin:0;font-size:26px;font-weight:700;color:#16a34a;letter-spacing:-0.5px;">R$&nbsp;{{totalPrice}}</p>
              </td>
            </tr>
          </table>

          <!-- 2-col detail row -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td width="50%" style="padding-right:12px;">
                <div style="background:#f8fafc;border-radius:12px;padding:16px 18px;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;">Pagamento</p>
                  <p style="margin:0;font-size:14px;font-weight:600;color:#1e293b;">{{paymentMethod}}</p>
                </div>
              </td>
              <td width="50%" style="padding-left:12px;">
                <div style="background:#f8fafc;border-radius:12px;padding:16px 18px;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;">Entrega prevista</p>
                  <p style="margin:0;font-size:14px;font-weight:600;color:#1e293b;">{{estimatedDate}}</p>
                </div>
              </td>
            </tr>
          </table>

          <!-- Address -->
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:20px 22px;margin-bottom:28px;">
            <p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#15803d;">📦 Endereço de Entrega</p>
            <p style="margin:0 0 4px;font-size:14px;color:#1e293b;line-height:1.6;">{{fullAddress}}</p>
            <p style="margin:0;font-size:14px;color:#1e293b;font-weight:600;">{{cidade}}</p>
          </div>

          <!-- Tracking -->
          <div style="background:#0f172a;border-radius:14px;padding:20px 22px;margin-bottom:28px;">
            <p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;">🚚 Rastreamento</p>
            <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;">Código: <span style="color:#4ade80;font-weight:700;letter-spacing:0.08em;">{{trackingCode}}</span></p>
            <a href="{{trackingUrl}}" style="display:inline-block;margin-top:10px;background:#16a34a;color:#fff;font-size:13px;font-weight:700;text-decoration:none;padding:10px 22px;border-radius:8px;letter-spacing:0.03em;">Rastrear pedido →</a>
          </div>

          <p style="margin:0;text-align:center;font-size:13px;color:#94a3b8;line-height:1.6;">
            Alguma dúvida? Basta responder este e-mail e nossa equipe te ajuda em breve.
          </p>

        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="padding:28px 16px 8px;text-align:center;">
          <p style="margin:0 0 6px;font-size:11px;color:#4b5563;letter-spacing:0.08em;text-transform:uppercase;">PagFlow</p>
          <p style="margin:0;font-size:11px;color:#374151;">© 2026 PagFlow. Todos os direitos reservados.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
            },
            {
                name: 'Compra Recusada',
                slug: 'rejected',
                subject: 'Pagamento não aprovado - Pedido #{{orderId}}',
                content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:36px 32px;text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">❌</div>
        <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;">Pagamento Não Aprovado</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">Olá, {{firstName}}, houve um problema com seu pagamento.</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">

        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#dc2626;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Pedido</p>
            <p style="margin:0;font-size:20px;font-weight:800;color:#991b1b;">#{{orderId}}</p>
        </div>

        <div style="margin-bottom:24px;">
            <h2 style="margin:0 0 12px;font-size:16px;font-weight:800;color:#0f172a;">O que aconteceu?</h2>
            <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">Seu pagamento não foi aprovado pela operadora. Isso pode acontecer por diversos motivos:</p>
            <ul style="margin:12px 0 0;padding-left:20px;font-size:14px;color:#64748b;line-height:1.8;">
                <li>Dados do cartão incorretos</li>
                <li>Limite insuficiente</li>
                <li>Cartão bloqueado para compras online</li>
                <li>Senha incorreta</li>
            </ul>
        </div>

        <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:28px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;font-weight:700;text-transform:uppercase;">Produto</p>
            <h3 style="margin:0;font-size:16px;font-weight:800;color:#0f172a;">{{productName}}</h3>
            <p style="margin:6px 0 0;font-size:18px;font-weight:900;color:#0f172a;">R$ {{totalPrice}}</p>
        </div>

        <div style="text-align:center;margin-bottom:20px;">
            <p style="margin:0;font-size:14px;color:#64748b;">Você pode tentar novamente com outro cartão ou método de pagamento.</p>
        </div>
    </div>

    <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #f1f5f9;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} PagFlow. Todos os direitos reservados.</p>
    </div>

</div>
</body>
</html>`
            },
            {
                name: 'PIX Pendente',
                slug: 'pix_pending',
                subject: 'Seu PIX está aguardando pagamento - #{{orderId}}',
                content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#d97706,#f59e0b);padding:36px 32px;text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">⏳</div>
        <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;">PIX Aguardando Pagamento</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">Olá, {{firstName}}, finalize seu pagamento via PIX.</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">

        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#d97706;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Pedido</p>
            <p style="margin:0;font-size:20px;font-weight:800;color:#92400e;">#{{orderId}}</p>
        </div>

        <div style="margin-bottom:24px;">
            <h2 style="margin:0 0 12px;font-size:16px;font-weight:800;color:#0f172a;">Como pagar com PIX:</h2>
            <ol style="margin:0;padding-left:20px;font-size:14px;color:#475569;line-height:2;">
                <li>Abra o aplicativo do seu banco</li>
                <li>Escolha a opção <strong>PIX</strong></li>
                <li>Escaneie o QR Code ou cole o código copia e cola</li>
                <li>Confirme o pagamento</li>
            </ol>
        </div>

        <div style="border-bottom:1px solid #f1f5f9;padding-bottom:20px;margin-bottom:20px;">
            <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Produto</p>
            <h2 style="margin:0;font-size:18px;font-weight:800;color:#0f172a;">{{productName}}</h2>
            <p style="margin:6px 0 0;font-size:22px;font-weight:900;color:#d97706;">R$ {{totalPrice}}</p>
        </div>

        <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:24px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#92400e;font-weight:700;">⏰ O PIX expira em 30 minutos. Pague agora para garantir seu pedido!</p>
        </div>
    </div>

    <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #f1f5f9;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} PagFlow. Todos os direitos reservados.</p>
    </div>

</div>
</body>
</html>`
            },
            {
                name: 'Rastreamento',
                slug: 'tracking',
                subject: 'Seu pedido foi enviado! 📦 #{{orderId}}',
                content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido Enviado – PagFlow</title>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'Inter',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:40px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- LOGO -->
      <tr>
        <td style="padding:0 0 24px;text-align:center;">
          <span style="font-family:'Syne',sans-serif;font-size:14px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#3b82f6;">PagFlow</span>
        </td>
      </tr>

      <!-- HERO -->
      <tr>
        <td style="background:linear-gradient(145deg,#0f1f4a 0%,#1a3580 50%,#1d4ed8 100%);border-radius:20px 20px 0 0;padding:56px 40px 48px;text-align:center;">
          <div style="display:inline-block;background:#1d4ed8;border-radius:50%;width:76px;height:76px;line-height:76px;font-size:36px;margin-bottom:22px;box-shadow:0 0 0 14px rgba(59,130,246,0.15),0 0 0 28px rgba(59,130,246,0.06);">🚚</div>
          <h1 style="margin:0 0 10px;font-family:'Syne',sans-serif;font-size:36px;font-weight:800;color:#f0f9ff;letter-spacing:-0.5px;">Pedido Enviado!</h1>
          <p style="margin:0;font-size:15px;color:#93c5fd;line-height:1.5;">Olá, <strong style="color:#bfdbfe;">{{firstName}}</strong> — seu pedido saiu e está a caminho de você.</p>
        </td>
      </tr>

      <!-- ORDER RIBBON -->
      <tr>
        <td style="background:#1d4ed8;padding:13px 40px;text-align:center;">
          <span style="font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#bfdbfe;">Pedido</span>
          &nbsp;&nbsp;
          <span style="font-size:15px;font-weight:700;color:#fff;letter-spacing:0.05em;">#{{orderId}}</span>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="background:#fff;padding:40px;border-radius:0 0 20px 20px;">

          <!-- Tracking hero block -->
          <div style="background:#0a0f1e;border-radius:16px;padding:28px 24px;margin-bottom:28px;text-align:center;position:relative;overflow:hidden;">
            <div style="position:absolute;top:-30px;left:50%;transform:translateX(-50%);width:200px;height:60px;background:rgba(59,130,246,0.25);border-radius:50%;filter:blur(20px);"></div>
            <p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#4b5563;">Código de Rastreio</p>
            <p style="margin:0 0 18px;font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:#3b82f6;letter-spacing:0.08em;">{{trackingCode}}</p>
            <a href="{{trackingUrl}}" style="display:inline-block;background:#1d4ed8;color:#fff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:10px;letter-spacing:0.04em;">Rastrear agora →</a>
          </div>

          <!-- Product -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="border-left:3px solid #3b82f6;padding:0 0 0 16px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;">Produto</p>
                <p style="margin:0;font-size:17px;font-weight:700;color:#0f172a;">{{productName}}</p>
              </td>
            </tr>
          </table>

          <!-- How to track steps -->
          <div style="background:#f8fafc;border-radius:14px;padding:22px 24px;margin-bottom:24px;">
            <p style="margin:0 0 14px;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;">Como rastrear</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:6px 0;"><span style="display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:700;width:20px;height:20px;line-height:20px;text-align:center;border-radius:50%;margin-right:10px;">1</span><span style="font-size:13px;color:#475569;">Acesse o site dos <strong style="color:#1e293b;">Correios</strong> ou transportadora</span></td></tr>
              <tr><td style="padding:6px 0;"><span style="display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:700;width:20px;height:20px;line-height:20px;text-align:center;border-radius:50%;margin-right:10px;">2</span><span style="font-size:13px;color:#475569;">Cole o código de rastreio acima</span></td></tr>
              <tr><td style="padding:6px 0;"><span style="display:inline-block;background:#1d4ed8;color:#fff;font-size:10px;font-weight:700;width:20px;height:20px;line-height:20px;text-align:center;border-radius:50%;margin-right:10px;">3</span><span style="font-size:13px;color:#475569;">Acompanhe a entrega em tempo real</span></td></tr>
            </table>
          </div>

          <!-- Address -->
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:20px 22px;margin-bottom:28px;">
            <p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#2563eb;">📍 Endereço de Entrega</p>
            <p style="margin:0;font-size:14px;color:#1e3a8a;line-height:1.65;">{{fullAddress}}</p>
          </div>

          <p style="margin:0;text-align:center;font-size:13px;color:#94a3b8;line-height:1.6;">Dúvidas? Responda este e-mail e nossa equipe te ajuda.</p>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="padding:28px 16px 8px;text-align:center;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#374151;">PagFlow</p>
          <p style="margin:0;font-size:11px;color:#4b5563;">© 2026 PagFlow. Todos os direitos reservados.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
            },
            {
                name: 'Pedido Entregue',
                slug: 'delivered',
                subject: 'Seu pedido foi entregue! 🎉 #{{orderId}}',
                content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#8b5cf6);padding:36px 32px;text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">🎉</div>
        <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;">Pedido Entregue!</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">Olá, {{firstName}}, seu pedido foi entregue com sucesso.</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">

        <div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Pedido</p>
            <p style="margin:0;font-size:20px;font-weight:800;color:#5b21b6;">#{{orderId}}</p>
        </div>

        <div style="border-bottom:1px solid #f1f5f9;padding-bottom:20px;margin-bottom:20px;">
            <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Produto Entregue</p>
            <h2 style="margin:0;font-size:18px;font-weight:800;color:#0f172a;">{{productName}}</h2>
        </div>

        <div style="background:#faf5ff;border-radius:12px;padding:24px;margin-bottom:28px;text-align:center;">
            <p style="margin:0 0 12px;font-size:14px;color:#5b21b6;font-weight:700;">Avalie sua experiência!</p>
            <p style="margin:0;font-size:13px;color:#7c3aed;line-height:1.6;">Sua opinião nos ajuda a melhorar. Se tiver qualquer dúvida ou problema, responda este e-mail.</p>
        </div>

        <div style="text-align:center;">
            <p style="margin:0;font-size:14px;color:#64748b;">Obrigado por comprar conosco! 💜</p>
            <p style="margin:8px 0 0;font-size:16px;font-weight:800;color:#0f172a;">Equipe PagFlow</p>
        </div>
    </div>

    <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #f1f5f9;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} PagFlow. Todos os direitos reservados.</p>
    </div>

</div>
</body>
</html>`
            }
        ];

        setLoading(true);
        try {
            for (const d of defaults) {
                // Atualiza se já existe com o mesmo slug, senão cria
                const existing = templates.find(t => t.slug === d.slug);
                if (existing) {
                    await updateEmailTemplate(existing.id, d);
                } else {
                    await createEmailTemplate(d);
                }
            }
            window.location.reload();
        } catch (err) {
            console.error('Erro ao gerar templates:', err);
            alert('Erro ao gerar templates. Verifique o console.');
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 40px)', margin: '-20px', background: '#f8fafc', overflow: 'hidden' }}>
            {/* Sidebar List */}
            <div style={{ width: '350px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', boxShadow: '10px 0 30px rgba(0,0,0,0.02)' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>E-mails</h2>
                        <button onClick={handleNew} style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700 }}>
                            <Plus size={14} /> Novo
                        </button>
                    </div>
                    <button onClick={handleCreateDefaults} style={{
                        width: '100%', padding: '10px', borderRadius: '10px', border: '1px dashed #e2e8f0',
                        background: '#f8fafc', color: '#64748b', fontSize: '12px', fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        transition: 'all 0.15s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#0f172a'; e.currentTarget.style.color = '#0f172a' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b' }}
                    >
                        <Plus size={14} /> Gerar templates padrão
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    {templates.map(t => (
                        <div
                            key={t.id}
                            onClick={() => handleSelect(t.id)}
                            style={{
                                padding: '20px',
                                borderRadius: '16px',
                                marginBottom: '12px',
                                cursor: 'pointer',
                                background: selectedId === t.id ? '#eff6ff' : 'transparent',
                                border: selectedId === t.id ? '1px solid #dbeafe' : '1px solid transparent',
                                transition: 'all 0.2s',
                                position: 'relative'
                            }}
                        >
                            <div style={{ fontWeight: 800, color: selectedId === t.id ? '#0075ff' : '#1e293b', fontSize: '0.95rem' }}>{t.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                <Hash size={12} color={selectedId === t.id ? '#0075ff' : '#94a3b8'} /> {t.slug}
                            </div>
                            {selectedId === t.id && (
                                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '6px', borderRadius: '50%', background: '#0075ff' }} />
                            )}
                        </div>
                    ))}

                    {templates.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <div style={{ width: '60px', height: '60px', background: '#f8fafc', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <Mail size={24} color="#cbd5e1" />
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, marginBottom: '20px' }}>Nenhum template encontrado</p>
                            <button onClick={handleCreateDefaults} style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                                Criar templates padrão
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Editor Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
                {/* Header/Toolbar */}
                <div style={{ padding: '24px 40px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', background: '#f8fafc', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Edit2 size={20} color="#64748b" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                                {selectedId ? editData.name : 'Configurando novo template'}
                            </h2>
                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '2px 0 0' }}>Editor de mensagens e automação</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {selectedId && (
                            <>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <input
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={testEmail}
                                        onChange={e => setTestEmail(e.target.value)}
                                        style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', width: '180px', outline: 'none' }}
                                    />
                                    <button
                                        onClick={handleSendTest}
                                        disabled={testSending || !testEmail.trim()}
                                        style={{ background: '#10b981', border: 'none', padding: '10px 16px', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: testSending || !testEmail.trim() ? 0.6 : 1 }}
                                    >
                                        <Mail size={14} /> {testSending ? 'Enviando...' : 'Teste'}
                                    </button>
                                </div>
                                <button
                                    onClick={handleDelete}
                                    style={{ background: 'white', border: '1px solid #fee2e2', padding: '12px', borderRadius: '12px', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s' }}
                                    title="Excluir"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </>
                        )}
                        {testResult && (
                            <div style={{
                                fontSize: '12px', fontWeight: 700, padding: '8px 14px', borderRadius: '8px',
                                background: testResult.includes('sucesso') ? '#f0fdf4' : '#fee2e2',
                                color: testResult.includes('sucesso') ? '#16a34a' : '#dc2626',
                                border: `1px solid ${testResult.includes('sucesso') ? '#bbf7d0' : '#fecaca'}`,
                            }}>
                                {testResult}
                            </div>
                        )}
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            style={{ background: '#f1f5f9', border: 'none', padding: '12px 24px', borderRadius: '12px', color: '#1e293b', fontWeight: 750, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                        >
                            {showPreview ? <><Edit2 size={18} /> Editar</> : <><Eye size={18} /> Preview</>}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            style={{ background: '#0075ff', padding: '12px 28px', borderRadius: '12px', color: 'white', fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(0, 117, 255, 0.2)' }}
                        >
                            <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Template'}
                        </button>
                    </div>
                </div>

                {/* Editor Surface */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                    {!showPreview ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '40px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                {/* Info Section */}
                                <div style={{ padding: '32px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Info size={16} color="#0075ff" /> Configurações Gerais
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Nome do Template</label>
                                            <input
                                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                                                value={editData.name}
                                                onChange={e => setEditData({ ...editData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Identifier (Slug)</label>
                                            <input
                                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                                                value={editData.slug}
                                                onChange={e => setEditData({ ...editData, slug: e.target.value })}
                                            />
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Assunto do E-mail</label>
                                            <input
                                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                                                value={editData.subject}
                                                onChange={e => setEditData({ ...editData, subject: e.target.value })}
                                                placeholder="ex: Seu pedido foi aprovado! 🎉"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div style={{ padding: '32px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>Corpo do E-mail (HTML)</h3>
                                    <textarea
                                        style={{
                                            width: '100%',
                                            minHeight: '450px',
                                            padding: '24px',
                                            borderRadius: '16px',
                                            border: '1px solid #e2e8f0',
                                            background: '#f8fafc',
                                            fontFamily: 'monospace',
                                            fontSize: '13px',
                                            lineHeight: '1.6',
                                            color: '#1e293b',
                                            outline: 'none'
                                        }}
                                        value={editData.content}
                                        onChange={e => setEditData({ ...editData, content: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Sidebar Tips */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ background: '#0075ff', borderRadius: '24px', padding: '32px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                                    <Mail size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1, transform: 'rotate(-15deg)' }} />
                                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 16px' }}>Variáveis Dinâmicas</h3>
                                    <p style={{ fontSize: '0.8rem', lineHeight: '1.6', opacity: 0.9, marginBottom: '24px' }}>Clique para copiar e usar no seu template:</p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {[
                                            { v: '{{orderId}}', d: 'ID do Pedido' },
                                            { v: '{{fullName}}', d: 'Nome Completo' },
                                            { v: '{{firstName}}', d: 'Primeiro Nome' },
                                            { v: '{{productName}}', d: 'Nome do Produto' },
                                            { v: '{{totalPrice}}', d: 'Valor Pago' },
                                            { v: '{{paymentMethod}}', d: 'Forma de Pagamento' },
                                            { v: '{{fullAddress}}', d: 'Endereço Completo' },
                                            { v: '{{cidade}}', d: 'Cidade/UF' },
                                            { v: '{{trackingCode}}', d: 'Código de Rastreio' },
                                            { v: '{{trackingUrl}}', d: 'Link de Rastreio' },
                                            { v: '{{estimatedDate}}', d: 'Data Estimada' }
                                        ].map(item => (
                                            <div
                                                key={item.v}
                                                onClick={() => copyPlaceholder(item.v)}
                                                style={{
                                                    background: 'rgba(255,255,255,0.15)',
                                                    padding: '10px 14px',
                                                    borderRadius: '12px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                }}
                                            >
                                                <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>{item.v}</div>
                                                {copied === item.v ? <CheckCircle size={14} /> : <Copy size={14} style={{ opacity: 0.5 }} />}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '32px' }}>
                                    <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', marginBottom: '16px' }}>Slugs do Sistema</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4', margin: 0 }}>
                                            <strong style={{ color: '#0075ff' }}>confirmation</strong><br />
                                            Enviado automaticamente quando o pagamento é aprovado.
                                        </p>
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4', margin: 0 }}>
                                            <strong style={{ color: '#0075ff' }}>tracking</strong><br />
                                            Enviado ao salvar um código de rastreio no pedido.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
                            <div style={{ background: '#f8fafc', padding: '12px 24px', borderRadius: '20px 20px 0 0', border: '1px solid #e2e8f0', borderBottom: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f57' }} />
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#28c940' }} />
                                    <div style={{ marginLeft: '12px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{editData.subject}</div>
                                </div>
                            </div>
                            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0 0 20px 20px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.1)' }}>
                                <iframe
                                    srcDoc={editData.content}
                                    style={{ width: '100%', height: '700px', border: 'none' }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
