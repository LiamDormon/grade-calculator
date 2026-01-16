# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Grade Calculator (neobrutalism + shadcn)

This workspace includes a simple University Grade Calculator demo built with React, TypeScript, Vite and Zustand. Features:

- Define Years (with weights), Modules (with credits), and Assignments (weights + scores)
- Assignment weights per module must sum to 100% (validated)
- UK-style grade computation: module averages weighted by credits, year averages weighted by year weight
- Minimal neobrutalism styling in `src/styles/neobrutalism.css`

### Installing shadcn components (neobrutalism-ready)

This project uses components from the shadcn ecosystem. Install/add example components with bunx:

```
# example: add a Button component from neobrutalism collection
bunx --bun shadcn@latest add https://neobrutalism.dev/r/button.json

# add more components as needed:
bunx --bun shadcn@latest add https://neobrutalism.dev/r/input.json
bunx --bun shadcn@latest add https://neobrutalism.dev/r/card.json
```

After adding components, import them into your UI and style with `neobrutal` helpers in `src/styles/neobrutalism.css`.

### Persistence

The app automatically saves to your browser's Local Storage under the key `grade-calculator:state`. There is no server; your data stays in your browser. To clear saved data open your devtools and delete that key or call `localStorage.removeItem('grade-calculator:state')`.

### Validation helper

A small local script is included to validate sample data (checks assignments sum to 100%):

```bash
# run with bunx
bunx tsx src/lib/checkGrades.ts
```


---

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
