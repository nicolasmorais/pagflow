'use client'

import React from 'react'
import { Truck, Check, Edit2 } from 'lucide-react'
import { updateOrderTracking } from '../../../actions'

interface TrackingCodeInputProps {
    orderId: string
    initialTrackingCode: string | null
}

export default function TrackingCodeInput({ orderId, initialTrackingCode }: TrackingCodeInputProps) {
    const [isEditing, setIsEditing] = React.useState(false)
    const [trackingCode, setTrackingCode] = React.useState(initialTrackingCode || '')
    const [isSaving, setIsSaving] = React.useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateOrderTracking(orderId, trackingCode)
            setIsEditing(false)
        } catch (error) {
            console.error('Failed to update tracking code:', error)
        } finally {
            setIsSaving(false)
        }
    }

    if (!isEditing && !trackingCode) {
        return (
            <button
                onClick={() => setIsEditing(true)}
                style={{
                    fontSize: '0.7rem',
                    color: '#64748b',
                    background: '#f1f5f9',
                    border: '1px dashed #cbd5e1',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}
            >
                <Truck size={12} /> Add Rastreio
            </button>
        )
    }

    if (isEditing) {
        return (
            <div style={{ display: 'flex', gap: '4px' }}>
                <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="Código"
                    style={{
                        fontSize: '0.7rem',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        border: '1px solid #3b82f6',
                        width: '100px',
                        outline: 'none'
                    }}
                    autoFocus
                />
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Check size={12} />
                </button>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#3b82f6',
                background: '#eff6ff',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #dbeafe'
            }}>
                {trackingCode}
            </span>
            <button
                onClick={() => setIsEditing(true)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    display: 'flex',
                    padding: '2px'
                }}
            >
                <Edit2 size={10} />
            </button>
        </div>
    )
}
