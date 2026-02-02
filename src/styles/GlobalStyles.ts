/**
 * Global styles for the application
 */

import { createGlobalStyle } from 'styled-components'

export const GlobalStyles = createGlobalStyle`
    * {
        box-sizing: border-box;
    }

    body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: ${({ theme }) => theme.colors.bgMain};
        color: ${({ theme }) => theme.colors.textPrimary};
    }

    /* Custom scrollbar styling */
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    ::-webkit-scrollbar-track {
        background: ${({ theme }) => theme.colors.bgMain};
    }

    ::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.colors.textDisabled};
        border-radius: ${({ theme }) => theme.radii.md};
    }

    ::-webkit-scrollbar-thumb:hover {
        background: ${({ theme }) => theme.colors.textMuted};
    }

    /* Remove default button styles */
    button {
        font-family: inherit;
    }

    /* Remove default input styles */
    input {
        font-family: inherit;
    }
`
