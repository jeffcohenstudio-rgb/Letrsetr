# Letrsetr

Interactive letter tile app — type words, drag tiles around a canvas, arrange them freely.

## Stack

- **TypeScript** — strict mode
- **Vite** — dev server and bundler
- **Vitest** — tests (jsdom environment)
- **vite-plugin-singlefile** — production build outputs a single self-contained `dist/index.html`

Node is managed via nvm. Load it before running any commands:

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"
```

## Commands

```bash
npm run dev        # dev server at localhost:5173
npm run build      # type-check + bundle → dist/index.html (single file)
npm run preview    # serve the dist build locally
npm test           # run all tests once
npm run test:watch # watch mode
npm run coverage   # test coverage report
```

## Source layout

```
src/
  types.ts       # shared types (TileSnapshot, LayoutData, Point)
  history.ts     # undo stack (History class)
  lasso.ts       # pointInPoly, buildPathD
  separation.ts  # tile collision/separation algorithm
  theme.ts       # applyTheme, getTileFilter
  storage.ts     # localStorage wrapper
  pie.ts         # long-press pie color menu
  main.ts        # entry point — wires everything together
  style.css      # all styles
  tests/         # vitest tests for pure modules
```
