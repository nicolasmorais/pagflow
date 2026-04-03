'use client'

import { useState } from 'react'
import { createEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '@/app/actions'
import { Mail, Edit2, Trash2, Plus, Save, Eye, Hash, Info, History, ArrowLeft, Copy, CheckCircle } from 'lucide-react'

export default function EmailsClient({ initialTemplates }: { initialTemplates: any[] }) {
    const [templates, setTemplates] = useState(initialTemplates);
    const [selectedId, setSelectedId] = useState<string | null>(initialTemplates[0]?.id || null);
    const [editData, setEditData] = useState<any>(initialTemplates[0] || { name: '', slug: '', subject: '', content: '' });
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

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

    const handleCreateDefaults = async () => {
        const defaults = [
            {
                name: 'Confirmação de Compra',
                slug: 'confirmation',
                subject: 'Pedido Aprovado! #{{orderId}}',
                content: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
    <div style="background: #0075ff; padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 800;">Tudo pronto!</h1>
        <p style="opacity: 0.9; margin-top: 10px; font-size: 16px;">Olá, {{firstName}}, sua compra foi confirmada com sucesso.</p>
    </div>
    <div style="padding: 40px;">
        <div style="margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px;">
            <p style="font-size: 14px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Detalhes do Produto</p>
            <h2 style="font-size: 20px; color: #1e293b; margin: 0;">{{productName}}</h2>
            <p style="font-size: 16px; font-weight: 700; color: #0075ff; margin-top: 5px;">R$ {{totalPrice}}</p>
        </div>
        <div style="background: #f8fafc; padding: 25px; border-radius: 16px; border: 1px solid #f1f5f9;">
            <p style="font-size: 14px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">Endereço de Entrega</p>
            <p style="margin: 0; line-height: 1.6; color: #475569;">
                {{rua}}, {{numero}}<br>
                {{bairro}}<br>
                {{cidade}} - CEP: {{cep}}
            </p>
        </div>
        <div style="margin-top: 40px; text-align: center;">
            <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">Qualquer dúvida, estamos à disposição!</p>
            <div style="font-weight: 800; color: #1e293b; font-size: 18px;">Equipe PagFlow</div>
        </div>
    </div>
    <div style="background: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p>© ${new Date().getFullYear()} PagFlow. Todos os direitos reservados.</p>
    </div>
</div>`
            }
        ];

        setLoading(true);
        for (const d of defaults) {
            await createEmailTemplate(d);
        }
        window.location.reload();
    };

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 40px)', margin: '-20px', background: '#f8fafc', overflow: 'hidden' }}>
            {/* Sidebar List */}
            <div style={{ width: '350px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', boxShadow: '10px 0 30px rgba(0,0,0,0.02)' }}>
                <div style={{ padding: '32px 24px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>E-mails</h2>
                        <button onClick={handleNew} style={{ background: '#0075ff', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(0, 117, 255, 0.2)' }}>
                            <Plus size={18} /> Novo
                        </button>
                    </div>
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

                    <div style={{ display: 'flex', gap: '12px' }}>
                        {selectedId && (
                            <button
                                onClick={handleDelete}
                                style={{ background: 'white', border: '1px solid #fee2e2', padding: '12px', borderRadius: '12px', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s' }}
                                title="Excluir"
                            >
                                <Trash2 size={20} />
                            </button>
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '40px', maxWidth: '1200px', margin: '0 auto' }}>
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
                                            { v: '{{cidade}}', d: 'Cidade/UF' }
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
