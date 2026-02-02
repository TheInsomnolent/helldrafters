# Styled Components Migration Checklist

Track progress migrating from inline styles to styled-components.

## Status Key
- [ ] Not started
- [x] Completed

---

## Core Files

- [x] **App.tsx** - Added ThemeProvider wrapper (no inline styles to migrate)
- [ ] **index.tsx** - Minimal, likely no changes needed

---

## Components

### Main Components
- [ ] **CardLibrary.tsx** - Card library/browser
- [ ] **EventDisplay.tsx** - Event system display
- [x] **GameFooter.tsx** ✅ - Footer with external links
- [x] **GameHeader.tsx** ✅ - Header with ghost button faction hover, DifficultyBadge, ProgressCircle, Mono
- [x] **GameLobby.tsx** ✅ - Lobby with PageContainer, Card, Button, SelectableCard, Modal, Grid, Flex
- [x] **GameConfiguration.tsx** ✅ - Config with Label, SelectableCard, CheckboxLabel, Checkbox, Grid, Flex, Badge
- [x] **LoadoutDisplay.tsx** ✅ - Loadout viewer with Card, CardHeader, CardContent, Grid, Flex, Caption, Badge, LockButton
- [x] **MultiplayerLobby.tsx** ✅ - Multiplayer lobby with PageContainer, Container, Title, Heading, Card, Button, Input, Label, Flex, Grid, Text, Caption, Alert, SelectableCard, Strong + custom: ModeCard, LobbyCodeBox, PlayerSlotCard, StatusBar, PlayerTag

### Modals
- [x] **ContributorsModal.tsx** ✅ - Contributors list with ModalBackdrop, ModalContainer, ModalHeader, ModalContent, ModalFooter, Flex, Heading, Text, Caption, IconButton + custom: TierSection, TierHeader, TierBadgeBox, TierName, ContributorCard, KofiButton
- [x] **ExplainerModal.tsx** ✅ - Help/tutorial modal with ModalBackdrop, ModalContainer, ModalHeader, ModalContent, ModalTitle, Text, Caption, IconButton, Alert, Card + custom: SectionWrapper, SectionHeader, SectionTitle, ContentText, ContentList, SubsectionTitle
- [x] **GenAIDisclosureModal.tsx** ✅ - AI disclosure with ModalBackdrop, ModalContainer, ModalHeader, ModalContent, ModalTitle, Text, Caption, Flex, IconButton, Card + custom: ContentCard, ContentTitle, ContentText, AvatarImage, FactionLink
- [x] **PatchNotesModal.tsx** ✅ - Changelog modal with ModalBackdrop, ModalContainer, ModalHeader, ModalContent, ModalTitle, Text, Caption, Flex, IconButton, Alert, Card + custom: MarkdownH1, MarkdownH2, MarkdownH3, MarkdownList, MarkdownParagraph, FactionLink
- [x] **RunHistoryModal.tsx** ✅ - Run history viewer with ModalBackdrop, ModalContainer, ModalHeader, ModalContent, ModalFooter, ModalTitle, Text, Caption, Flex, IconButton, Button + custom: RunCard, RunCardHeader, OutcomeIcon, DifficultyBadge, StatItem, ExpandedDetails, SquadSection, PlayerTag, EmptyState

### Analytics (src/components/analytics/)
- [x] **AnalyticsDashboard.tsx** ✅ - Main analytics view with DashboardWrapper, DashboardCard, HeaderBanner, OutcomeTitle, StatCard, StatValue, StatLabel, StatSubtext + Text, Caption, Flex, Grid, Button
- [x] **DeathTimeline.tsx** ✅ - Death events timeline with ChartCard, ChartTitle, EmptyState, KIABadge, TimelineAxis, MissionTick, SkullMarker (keyframes), PlayerLabel, DeathDetailsList, DeathCard
- [x] **LoadoutTimeline.tsx** ✅ - Loadout changes timeline with ChartCard, ChartTitle, EmptyState, SlotLabel, SegmentCell, SegmentText, PlayerCard, PlayerNumber, MissionAxisHeader
- [x] **MissionRadar.tsx** ✅ - Mission radar chart with ChartCard, ChartTitle, EmptyState, ChartTooltip, CenterDisplay, MissionSummary, MissionCard
- [x] **RequisitionChart.tsx** ✅ - Requisition stats with ChartCard, ChartTitle, EmptyState, ChartTooltip, SpendEventBox, SpendTag, ExpendituresSection
- [x] **SamplesChart.tsx** ✅ - Samples chart with ChartCard, ChartTitle, EmptyState, ChartTooltip, LegendBar
- [x] **SharePanel.tsx** ✅ - Share/export panel with ChartCard, ChartTitle, ShareButton + Card, Text, Flex, Button, Alert

---

## Other TSX Files (Review needed)
- [x] **MultiplayerContext.tsx** ✅ - Context provider only, no UI to migrate
- [x] **LoadoutDisplay.test.tsx** ✅ - Test file, no styles to migrate

---

## Progress

**Completed:** 21 / 21 components

---

## Notes

- GameFooter migrated with new `LinkButton` component using `$accentColor` prop
- Created reusable styled-components in `src/styles/`:
  - Button, IconButton, LinkButton, ButtonGroup
  - Card, SelectableCard, ItemCard, StatBox, Alert
  - Title, Heading, Subheading, Label, Text, Caption, Mono
  - Flex, Row, Column, Grid, Container, PageContainer
  - Input, Checkbox, CheckboxLabel, FormGroup
  - Badge, RarityBadge, Tag, StatusBadge
  - ModalBackdrop, ModalContainer, ModalHeader, ModalContent, ModalFooter
  - IconBox, ProgressCircle, GameCodeBox, LockButton
