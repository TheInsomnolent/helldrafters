# Code Style Guide

This project enforces consistent code style through ESLint and Prettier. All code contributions must follow these guidelines.

## Quick Start

Style enforcement is **automatic**. After cloning:

```bash
yarn  # Automatically sets up git hooks via postinstall
```

That's it! Pre-commit hooks will format and lint your code automatically.

## Core Style Rules

### Indentation & Formatting

- **4 spaces** for indentation (no tabs)
- **No semicolons** at end of statements
- **Single quotes** for strings in JavaScript
- **Double quotes** for JSX attributes
- **100 character** line width maximum
- **Trailing commas** in multi-line arrays/objects
- **LF line endings** (Unix-style)

### Functions

✅ **Do:** Use arrow functions
```javascript
// Good
const handleClick = () => {
    doSomething()
}

const items = data.map((item) => item.name)
```

❌ **Don't:** Use function declarations for callbacks
```javascript
// Bad
function handleClick() {
    doSomething()
}

const items = data.map(function(item) {
    return item.name
})
```

### Variables

✅ **Do:** Use `const` and `let`
```javascript
const MAX_ITEMS = 10
let counter = 0
```

❌ **Don't:** Use `var`
```javascript
var MAX_ITEMS = 10  // Never use var
```

### Objects & Arrays

✅ **Do:** Use shorthand syntax and template literals
```javascript
const name = 'Player'
const score = 100

// Object shorthand
const player = { name, score }

// Template literals
const message = `Welcome, ${name}!`
```

### React Components

✅ **Do:** Use functional components with hooks
```javascript
const PlayerCard = ({ name, score }) => {
    const [isActive, setIsActive] = useState(false)

    return (
        <div className="player-card">
            <h2>{name}</h2>
            <p>Score: {score}</p>
        </div>
    )
}
```

✅ **Do:** Self-close components without children
```javascript
<PlayerCard name="Hero" score={100} />
```

❌ **Don't:** Add unnecessary curly braces
```javascript
// Bad - unnecessary braces around string
<PlayerCard name={"Hero"} />

// Good
<PlayerCard name="Hero" />
```

### Imports

✅ **Do:** Group and organize imports
```javascript
// External packages first
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Internal components
import { Button } from './components/Button'
import { useGame } from './hooks/useGame'

// Styles last
import './styles.css'
```

❌ **Don't:** Duplicate imports
```javascript
import { Button } from './Button'
import { Icon } from './Button'  // Combine these!

// Do this instead:
import { Button, Icon } from './Button'
```

## Console Logging

- `console.log()` triggers warnings by default
- `console.warn()`, `console.error()`, and `console.debug()` are allowed
- For legitimate debug logging, use an inline disable comment:

```javascript
// eslint-disable-next-line no-console
console.log('[Feature] Debug message:', data)
```

- For multiple related logs, use block disable:

```javascript
/* eslint-disable no-console */
console.log('Line 1')
console.log('Line 2')
/* eslint-enable no-console */
```
- `console.warn()` and `console.error()` are allowed
- Use proper error handling instead of logging

## Automatic Enforcement

### Pre-commit Hook

Every commit automatically runs:
1. **Prettier** - Formats staged files
2. **ESLint** - Checks for code issues

If either fails, the commit is blocked until issues are fixed.

### PR Checks

All pull requests run:
1. Format verification (`yarn format:check`)
2. Linting (`yarn lint`)
3. Tests (`yarn test`)
4. Build verification (`yarn build`)

PRs with style violations cannot be merged.

## Available Scripts

| Command | Description |
|---------|-------------|
| `yarn lint` | Check for ESLint errors |
| `yarn lint:fix` | Auto-fix ESLint errors |
| `yarn format` | Format all files with Prettier |
| `yarn format:check` | Check if files are formatted |
| `yarn style` | Run both format:check and lint |
| `yarn style:fix` | Fix all style issues |

## Editor Setup

### VS Code (Recommended)

The project includes VS Code settings that enable:
- Format on save
- ESLint auto-fix on save
- Recommended extensions

**Required Extensions:**
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [EditorConfig](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)

VS Code will prompt you to install these when you open the project.

### Other Editors

Ensure your editor:
1. Respects `.editorconfig` settings
2. Can run Prettier on save
3. Shows ESLint warnings/errors

## Exceptions

### Firebase Functions

The `functions/` directory uses Google's JavaScript style guide and is **excluded** from the main project's ESLint/Prettier rules. It has its own configuration.

### Generated Files

Build outputs, `node_modules`, and minified files are excluded from formatting.

## Troubleshooting

### "Pre-commit hook failed"

Run `yarn style:fix` to auto-fix most issues, then commit again.

### "My editor isn't formatting"

1. Ensure recommended extensions are installed
2. Reload VS Code window
3. Check that Prettier is set as default formatter

### "ESLint errors in new code"

Run `yarn lint:fix` to auto-fix what's possible. Manual fixes needed for:
- Unused variables (remove or prefix with `_`)
- Missing dependencies in useEffect

## Questions?

If you're unsure about a style decision, check existing code in the `src/` directory for examples, or ask in a PR comment.
