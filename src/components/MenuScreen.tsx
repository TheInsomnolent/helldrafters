/**
 * MenuScreen Component
 *
 * Main menu screen with game start options, load game, past runs, and info modals.
 * Uses common styled-components for consistent styling.
 */

import React from 'react'
import styled from 'styled-components'
import { Bug, MessageSquare, Users } from 'lucide-react'
import { getFactionColors } from '../constants/theme'
import { Title, Card, Button, Grid, Flex, LinkButton, Caption } from '../styles'
import GameFooter from './GameFooter'
import ExplainerModal from './ExplainerModal'
import PatchNotesModal from './PatchNotesModal'
import GenAIDisclosureModal from './GenAIDisclosureModal'
import ContributorsModal from './ContributorsModal'
import RunHistoryModal from './RunHistoryModal'
import RemoveCardConfirmModal from './RemoveCardConfirmModal'
import type { Faction, DraftHandItem } from '../types'
import { trackModalOpen } from '../utils/analytics'

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const MenuContainer = styled.div`
    min-height: 100vh;
    padding: 80px 24px;
`

const ContentWrapper = styled.div`
    max-width: 600px;
    margin: 0 auto;
    text-align: center;
`

const LogoImage = styled.img`
    width: 200px;
    height: auto;
    display: block;
    margin: 20px auto;
`

const SubtitleBar = styled.div`
    background: linear-gradient(to right, #5a5142, #6b6052);
    padding: 12px;
    margin: 0 auto 60px auto;
    max-width: 620px;
`

const SubtitleText = styled.h2`
    font-size: 20px;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.3em;
    margin: 0;
`

const MenuCard = styled(Card)`
    padding: 40px;
`

const HiddenInput = styled.input`
    display: none;
`

const MenuButton = styled(Button)`
    width: 100%;
    display: flex;
`

const MenuLinkButton = styled(LinkButton)`
    width: 100%;
    display: flex;
`

const ButtonSpacer = styled.div`
    margin-top: 12px;
`

const BuildInfo = styled.div`
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid rgba(100, 116, 139, 0.3);
    text-align: center;
`

const BuildText = styled(Caption)`
    font-family: monospace;
    color: #475569;
`

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

interface MenuScreenProps {
    faction: Faction
    onStartSolo: () => void
    onStartMultiplayer: () => void
    onLoadGame: () => void
    fileInputRef: React.RefObject<HTMLInputElement | null>
    onImportGameState: (event: React.ChangeEvent<HTMLInputElement>) => void
    // Modal states
    showExplainer: boolean
    setShowExplainer: (show: boolean) => void
    showPatchNotes: boolean
    setShowPatchNotes: (show: boolean) => void
    showGenAIDisclosure: boolean
    setShowGenAIDisclosure: (show: boolean) => void
    showContributors: boolean
    setShowContributors: (show: boolean) => void
    showRunHistory: boolean
    setShowRunHistory: (show: boolean) => void
    showRemoveCardConfirm: boolean
    setShowRemoveCardConfirm: (show: boolean) => void
    pendingCardRemoval: DraftHandItem | null
    setPendingCardRemoval: (card: DraftHandItem | null) => void
    confirmRemoveCardFromDraft: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

const MenuScreen: React.FC<MenuScreenProps> = ({
    faction,
    onStartSolo,
    onStartMultiplayer,
    onLoadGame,
    fileInputRef,
    onImportGameState,
    showExplainer,
    setShowExplainer,
    showPatchNotes,
    setShowPatchNotes,
    showGenAIDisclosure,
    setShowGenAIDisclosure,
    showContributors,
    setShowContributors,
    showRunHistory,
    setShowRunHistory,
    showRemoveCardConfirm,
    setShowRemoveCardConfirm,
    pendingCardRemoval,
    setPendingCardRemoval,
    confirmRemoveCardFromDraft,
}) => {
    const factionColors = getFactionColors(faction)

    return (
        <MenuContainer>
            <ContentWrapper>
                <Title
                    $factionColor={factionColors.PRIMARY}
                    $factionGlow={factionColors.GLOW}
                    style={{ marginBottom: 0 }}
                >
                    HELLDRAFTERS
                </Title>

                <LogoImage src={`${process.env.PUBLIC_URL}/logo.png`} alt="Helldrafters Logo" />

                <SubtitleBar>
                    <SubtitleText>Roguelike Director</SubtitleText>
                </SubtitleBar>

                <MenuCard>
                    {/* Hidden file input for loading saves */}
                    <HiddenInput
                        type="file"
                        ref={fileInputRef}
                        accept=".json"
                        onChange={onImportGameState}
                    />

                    {/* Start Buttons */}
                    <Grid $columns={2} $gap="md">
                        <MenuButton $variant="primary" $size="md" onClick={onStartSolo}>
                            Solo
                        </MenuButton>

                        <MenuButton
                            $variant="tinted"
                            $size="md"
                            $accentColor="#3b82f6"
                            onClick={onStartMultiplayer}
                        >
                            <Flex $align="center" $justify="center" $gap="sm">
                                <Users size={18} />
                                Multiplayer
                            </Flex>
                        </MenuButton>
                    </Grid>

                    {/* Load Game Button */}
                    <ButtonSpacer>
                        <MenuButton $variant="ghost" $size="sm" onClick={onLoadGame}>
                            Load Game
                        </MenuButton>
                    </ButtonSpacer>

                    {/* Past Runs Button */}
                    <ButtonSpacer>
                        <MenuButton
                            $variant="ghost"
                            $size="sm"
                            $accentColor="#a78bfa"
                            onClick={() => {
                                trackModalOpen('run_history')
                                setShowRunHistory(true)
                            }}
                        >
                            <Flex $align="center" $justify="center" $gap="sm">
                                <span>📊</span> Past Runs
                            </Flex>
                        </MenuButton>
                    </ButtonSpacer>

                    {/* Help Button */}
                    <ButtonSpacer>
                        <MenuButton
                            $variant="ghost"
                            $size="sm"
                            $factionPrimary={factionColors.PRIMARY}
                            $factionHover={factionColors.PRIMARY_HOVER}
                            onClick={() => {
                                trackModalOpen('explainer')
                                setShowExplainer(true)
                            }}
                        >
                            <Flex $align="center" $justify="center" $gap="sm">
                                <span>📖</span> How to Play
                            </Flex>
                        </MenuButton>
                    </ButtonSpacer>

                    {/* Patch Notes Button */}
                    <ButtonSpacer>
                        <MenuButton
                            $variant="ghost"
                            $size="sm"
                            $factionPrimary={factionColors.PRIMARY}
                            $factionHover={factionColors.PRIMARY_HOVER}
                            onClick={() => {
                                trackModalOpen('patch_notes')
                                setShowPatchNotes(true)
                            }}
                        >
                            <Flex $align="center" $justify="center" $gap="sm">
                                <span>📝</span> Patch Notes
                            </Flex>
                        </MenuButton>
                    </ButtonSpacer>

                    {/* Report Bug/Feedback Link */}
                    <ButtonSpacer>
                        <MenuLinkButton
                            href="https://github.com/TheInsomnolent/helldrafters/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                            $variant="ghost"
                            $size="sm"
                        >
                            <Flex $align="center" $justify="center" $gap="sm">
                                <Bug size={16} /> Report Bug/Feedback
                            </Flex>
                        </MenuLinkButton>
                    </ButtonSpacer>

                    {/* Discussions & Contributors Links */}
                    <ButtonSpacer>
                        <Grid $columns={2} $gap="md">
                            <MenuLinkButton
                                href="https://github.com/TheInsomnolent/helldrafters/discussions"
                                target="_blank"
                                rel="noopener noreferrer"
                                $size="sm"
                                $accentColor="#a78bfa"
                            >
                                <Flex $align="center" $justify="center" $gap="sm">
                                    <MessageSquare size={16} /> Discussions
                                </Flex>
                            </MenuLinkButton>
                            <MenuLinkButton
                                href="https://github.com/TheInsomnolent/helldrafters/graphs/contributors"
                                target="_blank"
                                rel="noopener noreferrer"
                                $size="sm"
                                $accentColor="#a78bfa"
                            >
                                <Flex $align="center" $justify="center" $gap="sm">
                                    <Users size={16} /> Contributors
                                </Flex>
                            </MenuLinkButton>
                        </Grid>
                    </ButtonSpacer>

                    {/* Gen AI Disclosure Button */}
                    <ButtonSpacer>
                        <MenuButton
                            $variant="ghost"
                            $size="sm"
                            $factionPrimary={factionColors.PRIMARY}
                            $factionHover={factionColors.PRIMARY_HOVER}
                            onClick={() => {
                                trackModalOpen('genai_disclosure')
                                setShowGenAIDisclosure(true)
                            }}
                        >
                            <Flex $align="center" $justify="center" $gap="sm">
                                <span>✨</span> Gen AI Disclosure
                            </Flex>
                        </MenuButton>
                    </ButtonSpacer>

                    {/* Contributors Button */}
                    <ButtonSpacer>
                        <MenuButton
                            $variant="ghost"
                            $size="sm"
                            $accentColor="#ff5e5b"
                            onClick={() => {
                                trackModalOpen('contributors')
                                setShowContributors(true)
                            }}
                        >
                            <Flex $align="center" $justify="center" $gap="sm">
                                <span>❤️</span> Community Supporters
                            </Flex>
                        </MenuButton>
                    </ButtonSpacer>

                    {/* Build Info */}
                    <BuildInfo>
                        <BuildText>
                            {process.env.REACT_APP_BUILD_TIME && (
                                <div>Build: {process.env.REACT_APP_BUILD_TIME}</div>
                            )}
                            {process.env.REACT_APP_COMMIT_SHA && (
                                <div>
                                    Commit: {process.env.REACT_APP_COMMIT_SHA.substring(0, 7)}
                                </div>
                            )}
                            {!process.env.REACT_APP_BUILD_TIME &&
                                !process.env.REACT_APP_COMMIT_SHA && (
                                    <div>Local Development Build</div>
                                )}
                        </BuildText>
                    </BuildInfo>
                </MenuCard>
            </ContentWrapper>

            {/* FOOTER */}
            <GameFooter />

            {/* Remove Card Confirmation Modal */}
            <RemoveCardConfirmModal
                isOpen={showRemoveCardConfirm}
                pendingCardRemoval={pendingCardRemoval}
                onCancel={() => {
                    setShowRemoveCardConfirm(false)
                    setPendingCardRemoval(null)
                }}
                onConfirm={confirmRemoveCardFromDraft}
            />

            {/* Explainer Modal */}
            <ExplainerModal
                isOpen={showExplainer}
                onClose={() => setShowExplainer(false)}
                faction={faction}
            />

            {/* Patch Notes Modal */}
            <PatchNotesModal
                isOpen={showPatchNotes}
                onClose={() => setShowPatchNotes(false)}
                faction={faction}
            />

            {/* Gen AI Disclosure Modal */}
            <GenAIDisclosureModal
                isOpen={showGenAIDisclosure}
                onClose={() => setShowGenAIDisclosure(false)}
                faction={faction}
            />

            {/* Contributors Modal */}
            <ContributorsModal
                isOpen={showContributors}
                onClose={() => setShowContributors(false)}
                faction={faction}
            />

            {/* Run History Modal */}
            <RunHistoryModal isOpen={showRunHistory} onClose={() => setShowRunHistory(false)} />
        </MenuContainer>
    )
}

export default MenuScreen
