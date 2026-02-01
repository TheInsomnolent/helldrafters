module.exports = {
    extends: ['react-app', 'react-app/jest', 'prettier'],
    plugins: ['prettier'],
    rules: {
        // Prettier integration
        'prettier/prettier': 'error',

        // Prefer arrow functions for cleaner code
        'prefer-arrow-callback': 'error',
        'arrow-body-style': ['error', 'as-needed'],

        // No semicolons (handled by prettier, but enforce in ESLint too)
        semi: ['error', 'never'],

        // Clean code practices
        'no-console': ['warn', { allow: ['warn', 'error', 'debug'] }], // Use inline disable for legitimate logs
        'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'no-var': 'error',
        'prefer-const': 'error',
        'prefer-template': 'error',
        'object-shorthand': 'error',
        'no-duplicate-imports': 'error',

        // React specific
        'react/jsx-no-duplicate-props': 'error',
        'react/jsx-pascal-case': 'error',
        'react/self-closing-comp': 'error',
        'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
        'react/jsx-no-comment-textnodes': 'off', // Allow // in JSX for visual separators

        // Hooks
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
    env: {
        browser: true,
        es2021: true,
        node: true,
        jest: true,
    },
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    overrides: [
        {
            // TypeScript files - use react-app's built-in TypeScript support
            // and add our custom rules on top
            files: ['**/*.ts', '**/*.tsx'],
            rules: {
                // Prettier integration
                'prettier/prettier': 'error',

                // Prefer arrow functions for cleaner code
                'prefer-arrow-callback': 'error',
                'arrow-body-style': ['error', 'as-needed'],

                // No semicolons
                semi: ['error', 'never'],

                // TypeScript-specific rules (replaces JS equivalents)
                // react-app already configures @typescript-eslint/no-unused-vars
                'no-unused-vars': 'off',

                // Clean code practices
                'no-console': ['warn', { allow: ['warn', 'error', 'debug'] }],
                'no-var': 'error',
                'prefer-const': 'error',
                'prefer-template': 'error',
                'object-shorthand': 'error',
                'no-duplicate-imports': 'error',

                // TypeScript best practices - override react-app defaults
                '@typescript-eslint/explicit-function-return-type': 'off',
                '@typescript-eslint/explicit-module-boundary-types': 'off',
                '@typescript-eslint/no-explicit-any': 'warn',
                '@typescript-eslint/no-non-null-assertion': 'warn',
                '@typescript-eslint/no-unused-vars': [
                    'error',
                    { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
                ],

                // React specific
                'react/jsx-no-duplicate-props': 'error',
                'react/jsx-pascal-case': 'error',
                'react/self-closing-comp': 'error',
                'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
                'react/jsx-no-comment-textnodes': 'off',

                // Hooks
                'react-hooks/rules-of-hooks': 'error',
                'react-hooks/exhaustive-deps': 'warn',
            },
        },
    ],
}
