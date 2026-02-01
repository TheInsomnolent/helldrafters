import React from 'react'
import { RefreshCw, Lock, Unlock } from 'lucide-react'
import { TYPE } from '../constants/types'
import { getSlotLockCost, MAX_LOCKED_SLOTS } from '../constants/balancingConfig'

/**
 * Draft phase display component
 */
export default function DraftDisplay({
    player,
    draftState,
    currentDiff,
    requisition,
    lockedSlots,
    gameConfig,
    onDraftPick,
    onRemoveCard,
    onReroll,
    onLockSlot,
    onUnlockSlot,
    onExport,
    onStratagemReplacement,
    onCancelStratagemModal,
    getItemById,
    ItemCard,
}) {
    const slotLockCost = getSlotLockCost(gameConfig.playerCount)

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px',
            }}
        >
            {/* Top buttons */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: '16px',
                    gap: '12px',
                }}
            >
                <button
                    onClick={onExport}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        backgroundColor: 'rgba(100, 116, 139, 0.3)',
                        color: '#94a3b8',
                        border: '1px solid rgba(100, 116, 139, 0.5)',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.5)'
                        e.currentTarget.style.color = '#F5C642'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.3)'
                        e.currentTarget.style.color = '#94a3b8'
                    }}
                >
                    💾 Export
                </button>
            </div>

            {/* Stratagem Replacement Modal */}
            {draftState.pendingStratagem && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '24px',
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#283548',
                            borderRadius: '12px',
                            border: '2px solid #F5C642',
                            padding: '32px',
                            maxWidth: '800px',
                            width: '100%',
                        }}
                    >
                        <h2
                            style={{
                                color: '#F5C642',
                                fontSize: '24px',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                marginBottom: '16px',
                            }}
                        >
                            Replace Stratagem
                        </h2>
                        <p style={{ color: '#cbd5e1', textAlign: 'center', marginBottom: '24px' }}>
                            All stratagem slots are full. Select which stratagem to replace with:
                        </p>
                        <div
                            style={{
                                backgroundColor: '#1f2937',
                                padding: '16px',
                                borderRadius: '8px',
                                marginBottom: '24px',
                                textAlign: 'center',
                            }}
                        >
                            <div style={{ color: '#F5C642', fontWeight: 'bold', fontSize: '18px' }}>
                                {draftState.pendingStratagem.name}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                                {draftState.pendingStratagem.rarity}
                            </div>
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '16px',
                                marginBottom: '24px',
                            }}
                        >
                            {player.loadout.stratagems.map((sid, i) => {
                                const stratagem = getItemById(sid)
                                return (
                                    <button
                                        key={i}
                                        onClick={() => onStratagemReplacement(i)}
                                        style={{
                                            backgroundColor: '#1f2937',
                                            border: '2px solid rgba(100, 116, 139, 0.5)',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textAlign: 'left',
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.borderColor = '#F5C642')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.borderColor =
                                                'rgba(100, 116, 139, 0.5)')
                                        }
                                    >
                                        <div
                                            style={{
                                                fontSize: '10px',
                                                color: '#64748b',
                                                textTransform: 'uppercase',
                                                marginBottom: '4px',
                                            }}
                                        >
                                            Slot {i + 1}
                                        </div>
                                        <div
                                            style={{
                                                color: 'white',
                                                fontWeight: 'bold',
                                                fontSize: '14px',
                                            }}
                                        >
                                            {stratagem?.name || 'Empty'}
                                        </div>
                                        {stratagem && (
                                            <div
                                                style={{
                                                    fontSize: '11px',
                                                    color: '#94a3b8',
                                                    marginTop: '4px',
                                                }}
                                            >
                                                {stratagem.rarity}
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        <button
                            onClick={onCancelStratagemModal}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: 'rgba(127, 29, 29, 0.3)',
                                color: '#ef4444',
                                border: '1px solid #7f1d1d',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.5)')
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.3)')
                            }
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Main draft content */}
            <div
                style={{
                    width: '100%',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h2
                        style={{
                            color: '#F5C642',
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            textTransform: 'uppercase',
                            marginBottom: '8px',
                            letterSpacing: '1px',
                        }}
                    >
                        Priority Requisition Authorized
                    </h2>
                    <h1
                        style={{
                            fontSize: '36px',
                            fontWeight: '900',
                            color: 'white',
                            textTransform: 'uppercase',
                            margin: '0 0 8px 0',
                        }}
                    >
                        {player.name} <span style={{ color: '#64748b' }}>//</span> Select Upgrade
                    </h1>
                    <p style={{ color: '#94a3b8', margin: '0' }}>
                        Choose wisely. This equipment is vital for Difficulty {currentDiff}.
                    </p>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '24px',
                        marginBottom: '48px',
                    }}
                >
                    {draftState.roundCards.map((item, idx) => (
                        <ItemCard
                            key={`${item.id}-${idx}`}
                            item={item}
                            onSelect={onDraftPick}
                            onRemove={onRemoveCard}
                        />
                    ))}
                </div>

                {/* Slot Locking Controls */}
                <div
                    style={{
                        marginBottom: '32px',
                        padding: '24px',
                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '8px',
                        border: '1px solid rgba(100, 116, 139, 0.3)',
                    }}
                >
                    <div style={{ marginBottom: '16px' }}>
                        <h3
                            style={{
                                color: '#F5C642',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                margin: '0 0 8px 0',
                            }}
                        >
                            Slot Locking ({slotLockCost} Req each)
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                            Prevent specific item types from appearing in your drafts. Locks persist
                            across missions.
                        </p>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '12px',
                        }}
                    >
                        {[
                            TYPE.ARMOR,
                            TYPE.PRIMARY,
                            TYPE.SECONDARY,
                            TYPE.GRENADE,
                            TYPE.STRATAGEM,
                        ].map((slotType) => {
                            const isLocked = lockedSlots.includes(slotType)
                            const canLock =
                                !isLocked &&
                                requisition >= slotLockCost &&
                                lockedSlots.length < MAX_LOCKED_SLOTS
                            const canUnlock = isLocked

                            return (
                                <button
                                    key={slotType}
                                    onClick={() =>
                                        isLocked ? onUnlockSlot(slotType) : onLockSlot(slotType)
                                    }
                                    disabled={!canLock && !canUnlock}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        padding: '10px 16px',
                                        borderRadius: '4px',
                                        fontWeight: 'bold',
                                        fontSize: '12px',
                                        textTransform: 'uppercase',
                                        border: isLocked
                                            ? '2px solid #ef4444'
                                            : '2px solid rgba(100, 116, 139, 0.5)',
                                        backgroundColor: isLocked
                                            ? 'rgba(239, 68, 68, 0.1)'
                                            : 'transparent',
                                        color: isLocked
                                            ? '#ef4444'
                                            : canLock
                                              ? '#94a3b8'
                                              : '#334155',
                                        cursor: canLock || canUnlock ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (canLock || canUnlock) {
                                            e.currentTarget.style.borderColor = isLocked
                                                ? '#dc2626'
                                                : '#F5C642'
                                            e.currentTarget.style.color = isLocked
                                                ? '#dc2626'
                                                : '#F5C642'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (canLock || canUnlock) {
                                            e.currentTarget.style.borderColor = isLocked
                                                ? '#ef4444'
                                                : 'rgba(100, 116, 139, 0.5)'
                                            e.currentTarget.style.color = isLocked
                                                ? '#ef4444'
                                                : '#94a3b8'
                                        }
                                    }}
                                >
                                    {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                                    {slotType}
                                </button>
                            )
                        })}
                    </div>

                    {lockedSlots.length >= MAX_LOCKED_SLOTS && (
                        <div
                            style={{
                                marginTop: '12px',
                                padding: '8px',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                borderLeft: '3px solid #ef4444',
                                fontSize: '12px',
                                color: '#fca5a5',
                            }}
                        >
                            Maximum of {MAX_LOCKED_SLOTS} slots can be locked simultaneously
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
                    <button
                        onClick={() => onReroll(1)}
                        disabled={requisition < 1}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 32px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            border: requisition >= 1 ? '2px solid white' : '2px solid #334155',
                            backgroundColor: 'transparent',
                            color: requisition >= 1 ? 'white' : '#64748b',
                            cursor: requisition >= 1 ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                        }}
                    >
                        <RefreshCw size={20} />
                        Reroll All Cards (-1 Req)
                    </button>
                </div>

                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: '0' }}>
                        Click the × on a card to remove just that card (free)
                        <br />
                        Or use "Reroll All Cards" to reroll the entire hand
                    </p>
                </div>

                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <span style={{ color: '#F5C642', fontFamily: 'monospace' }}>
                        Current Requisition: {Math.floor(requisition)} R
                    </span>
                </div>
            </div>
        </div>
    )
}
