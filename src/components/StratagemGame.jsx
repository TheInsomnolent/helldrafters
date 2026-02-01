/**
 * StratagemGame - Mini-game for guessing stratagem codes while waiting in lobby
 * Players see a stratagem icon and must input the correct directional code
 */

import React, { useState, useEffect, useCallback } from 'react'
import { RotateCcw } from 'lucide-react'
import { COLORS } from '../constants/theme'
import {
    getRandomStratagem,
    DIRECTION_SYMBOLS,
    KEY_TO_DIRECTION,
} from '../constants/stratagemCodes'
import { CUSTOM_ICON_URLS } from '../utils/iconHelpers'

const StratagemGame = ({ factionColors }) => {
    const [currentStratagem, setCurrentStratagem] = useState(null)
    const [userInput, setUserInput] = useState([])
    const [result, setResult] = useState(null) // null, 'success', or 'fail'
    const [stats, setStats] = useState({ correct: 0, total: 0 })

    // Load a new random stratagem
    const loadNewStratagem = useCallback(() => {
        setCurrentStratagem(getRandomStratagem())
        setUserInput([])
        setResult(null)
    }, [])

    // Initialize with first stratagem
    useEffect(() => {
        loadNewStratagem()
    }, [loadNewStratagem])

    // Check if user input matches the code
    const checkAnswer = useCallback(() => {
        if (!currentStratagem || userInput.length === 0) return

        const isCorrect =
            userInput.length === currentStratagem.code.length &&
            userInput.every((dir, idx) => dir === currentStratagem.code[idx])

        if (isCorrect) {
            setResult('success')
            setStats((prev) => ({ correct: prev.correct + 1, total: prev.total + 1 }))
            // Auto-load next after short delay
            setTimeout(() => {
                loadNewStratagem()
            }, 1200)
        } else if (userInput.length >= currentStratagem.code.length) {
            // Wrong answer - input is complete but doesn't match
            setResult('fail')
            setStats((prev) => ({ ...prev, total: prev.total + 1 }))
            // Auto-reset after short delay
            setTimeout(() => {
                setUserInput([])
                setResult(null)
            }, 1200)
        }
    }, [currentStratagem, userInput, loadNewStratagem])

    // Handle keyboard input
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ignore if we're showing a result
            if (result) return

            const direction = KEY_TO_DIRECTION[e.key]
            if (direction && currentStratagem) {
                e.preventDefault()
                setUserInput((prev) => {
                    const newInput = [...prev, direction]
                    return newInput
                })
            }

            // Allow Escape to clear input
            if (e.key === 'Escape' && !result) {
                setUserInput([])
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [result, currentStratagem])

    // Check answer whenever input changes
    useEffect(() => {
        if (userInput.length > 0 && currentStratagem) {
            checkAnswer()
        }
    }, [userInput, checkAnswer, currentStratagem])

    if (!currentStratagem) {
        return null
    }

    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0

    return (
        <div
            style={{
                backgroundColor: COLORS.BG_MAIN,
                borderRadius: '8px',
                padding: '24px',
                border: `2px solid rgba(34, 197, 94, 0.4)`,
                marginBottom: '24px',
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.15)',
            }}
        >
            {/* Waiting Message Header */}
            <div
                style={{
                    textAlign: 'center',
                    padding: '16px 20px',
                    marginBottom: '24px',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: '6px',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
            >
                <p
                    style={{
                        color: '#22c55e',
                        margin: '0 0 8px 0',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}
                >
                    ⏳ Waiting for all players to ready up...
                </p>
                <p
                    style={{
                        color: COLORS.TEXT_MUTED,
                        margin: 0,
                        fontSize: '12px',
                    }}
                >
                    Practice your stratagem codes while you wait
                </p>
            </div>

            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                }}
            >
                <div>
                    <h3
                        style={{
                            fontSize: '16px',
                            fontWeight: '900',
                            color: factionColors.PRIMARY,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: '4px',
                        }}
                    >
                        🎮 STRATAGEM TRAINING
                    </h3>
                    <p
                        style={{
                            fontSize: '11px',
                            color: COLORS.TEXT_MUTED,
                            margin: 0,
                        }}
                    >
                        Input the correct code using arrow keys or WASD
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div
                        style={{
                            fontSize: '12px',
                            color: COLORS.TEXT_SECONDARY,
                            fontWeight: 'bold',
                        }}
                    >
                        {stats.correct}/{stats.total}
                    </div>
                    <div style={{ fontSize: '10px', color: COLORS.TEXT_MUTED }}>
                        {accuracy}% Accuracy
                    </div>
                </div>
            </div>

            {/* Game Area */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    padding: '20px',
                    backgroundColor: COLORS.CARD_BG,
                    borderRadius: '8px',
                    border: `2px solid ${
                        result === 'success'
                            ? '#22c55e'
                            : result === 'fail'
                              ? '#ef4444'
                              : COLORS.CARD_BORDER
                    }`,
                    transition: 'border-color 0.3s',
                }}
            >
                {/* Stratagem Icon */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <div
                        style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: COLORS.BG_MAIN,
                            borderRadius: '8px',
                            border: `2px solid ${COLORS.CARD_BORDER}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px',
                        }}
                    >
                        <img
                            src={CUSTOM_ICON_URLS[currentStratagem.id]}
                            alt={currentStratagem.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                filter: result ? 'grayscale(100%)' : 'none',
                                opacity: result ? 0.5 : 1,
                                transition: 'all 0.3s',
                            }}
                            onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                            }}
                        />
                        <div
                            style={{
                                display: 'none',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '32px',
                            }}
                        >
                            🎯
                        </div>
                    </div>
                    <div
                        style={{
                            fontSize: '10px',
                            color: COLORS.TEXT_MUTED,
                            textAlign: 'center',
                            maxWidth: '100px',
                            lineHeight: '1.2',
                        }}
                    >
                        {currentStratagem.name}
                    </div>
                </div>

                {/* Code Display & Input */}
                <div style={{ flex: 1 }}>
                    {/* Expected Code Length Indicator */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '16px',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                        }}
                    >
                        {currentStratagem.code.map((dir, idx) => {
                            const userDir = userInput[idx]
                            const isCorrectSoFar = !userDir || userDir === dir
                            const isFilled = !!userDir

                            return (
                                <div
                                    key={idx}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        backgroundColor: isFilled
                                            ? isCorrectSoFar
                                                ? 'rgba(34, 197, 94, 0.2)'
                                                : 'rgba(239, 68, 68, 0.2)'
                                            : COLORS.BG_MAIN,
                                        border: `2px solid ${
                                            isFilled
                                                ? isCorrectSoFar
                                                    ? '#22c55e'
                                                    : '#ef4444'
                                                : COLORS.CARD_BORDER
                                        }`,
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        color: isFilled
                                            ? isCorrectSoFar
                                                ? '#22c55e'
                                                : '#ef4444'
                                            : COLORS.TEXT_DISABLED,
                                        transition: 'all 0.2s',
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    {isFilled ? DIRECTION_SYMBOLS[userDir] : '?'}
                                </div>
                            )
                        })}
                    </div>

                    {/* Result Message */}
                    {result && (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '12px',
                                backgroundColor:
                                    result === 'success'
                                        ? 'rgba(34, 197, 94, 0.15)'
                                        : 'rgba(239, 68, 68, 0.15)',
                                borderRadius: '6px',
                                border: `1px solid ${result === 'success' ? '#22c55e' : '#ef4444'}`,
                                marginBottom: '12px',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    color: result === 'success' ? '#22c55e' : '#ef4444',
                                    marginBottom: '4px',
                                }}
                            >
                                {result === 'success' ? '✓ CORRECT!' : '✗ INCORRECT!'}
                            </div>
                            <div
                                style={{
                                    fontSize: '11px',
                                    color: COLORS.TEXT_MUTED,
                                }}
                            >
                                {result === 'success' ? 'Loading next stratagem...' : 'Try again!'}
                            </div>
                        </div>
                    )}

                    {/* Controls Hint */}
                    {!result && userInput.length === 0 && (
                        <div
                            style={{
                                textAlign: 'center',
                                fontSize: '11px',
                                color: COLORS.TEXT_DISABLED,
                                padding: '8px',
                            }}
                        >
                            <div style={{ marginBottom: '4px' }}>
                                Use arrow keys:{' '}
                                <span style={{ fontFamily: 'monospace', color: COLORS.TEXT_MUTED }}>
                                    ▲ ▼ ◄ ►
                                </span>
                            </div>
                            <div>or WASD keys • Press ESC to clear</div>
                        </div>
                    )}
                </div>

                {/* Reset Button */}
                <button
                    onClick={loadNewStratagem}
                    disabled={!!result}
                    style={{
                        padding: '12px',
                        backgroundColor: 'transparent',
                        color: result ? COLORS.TEXT_DISABLED : COLORS.TEXT_SECONDARY,
                        border: `2px solid ${result ? COLORS.CARD_BORDER : COLORS.CARD_BORDER}`,
                        borderRadius: '6px',
                        cursor: result ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        opacity: result ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                        if (!result) {
                            e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.2)'
                            e.currentTarget.style.color = 'white'
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!result) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.color = COLORS.TEXT_SECONDARY
                        }
                    }}
                    title="Skip to new stratagem"
                >
                    <RotateCcw size={18} />
                </button>
            </div>

            {/* Show correct code after fail */}
            {result === 'fail' && (
                <div
                    style={{
                        marginTop: '12px',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: COLORS.TEXT_MUTED,
                    }}
                >
                    Correct code:{' '}
                    {currentStratagem.code.map((dir) => DIRECTION_SYMBOLS[dir]).join(' ')}
                </div>
            )}
        </div>
    )
}

export default StratagemGame
