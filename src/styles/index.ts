/**
 * Styled-components barrel export
 *
 * Usage:
 *   import { Button, Card, Text } from '../styles'
 *   import { theme, COLORS } from '../styles'
 */

// Theme and global styles
export {
    theme,
    COLORS,
    SHADOWS,
    TYPOGRAPHY,
    SPACING,
    RADII,
    FONT_SIZES,
    FONT_WEIGHTS,
    Z_INDEX,
    TRANSITIONS,
    BREAKPOINTS,
    FACTION_COLORS,
    getFactionColors,
} from './theme'
export type { Theme, ThemeSpacing, FactionColorSet } from './theme'
export { GlobalStyles } from './GlobalStyles'

// Button components
export { Button, IconButton, LinkButton } from './Button'
export type {
    ButtonProps,
    ButtonVariant,
    ButtonSize,
    IconButtonProps,
    LinkButtonProps,
} from './Button'

// Card components
export { Card, SelectableCard, CardHeader, CardContent, Alert } from './Card'
export type {
    CardProps,
    CardVariant,
    CardPadding,
    SelectableCardProps,
    AlertProps,
    AlertVariant,
} from './Card'

// Text components
export { Title, Heading, Subheading, ModalTitle, Label, Text, Caption, Mono, Strong } from './Text'
export type {
    TextProps,
    TextColor,
    TitleProps,
    HeadingProps,
    SubheadingProps,
    BodyTextProps,
    MonoProps,
} from './Text'

// Layout components
export { Flex, Grid, Container, PageContainer, HeaderBar } from './Layout'
export type {
    FlexProps,
    GridProps,
    ContainerProps,
    PageContainerProps,
    HeaderBarProps,
} from './Layout'

// Form components
export { Input, Checkbox, CheckboxLabel } from './Form'
export type { InputProps, CheckboxProps, CheckboxLabelProps } from './Form'

// Badge components
export { Badge, WarbondTypeBadge, DifficultyBadge } from './Badge'
export type {
    BadgeProps,
    BadgeVariant,
    BadgeSize,
    WarbondTypeBadgeProps,
    DifficultyBadgeProps,
} from './Badge'

// Modal components
export { ModalBackdrop, ModalContainer, ModalHeader, ModalContent, ModalFooter } from './Modal'
export type {
    ModalSize,
    ModalContainerProps,
    ModalHeaderProps,
    ModalContentProps,
    ModalFooterProps,
} from './Modal'

// Icon components
export { ProgressCircle, LockButton } from './Icon'
export type { ProgressCircleProps, LockButtonProps } from './Icon'
