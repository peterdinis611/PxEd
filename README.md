# PxEd — Browser Image Editor

A Photoshop-style image editor built with React, TypeScript, Tailwind CSS, and shadcn/ui-style components.

## Run locally

Uses [Bun](https://bun.sh) as the package manager:

```bash
cd image-editor
bun install
bun run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## Features

- Layer-based editing with blend modes, opacity, reorder, visibility, lock
- Tools: move, selections, brush, pencil, eraser, fill, gradient, eyedropper, text, shapes, crop, zoom
- Adjustments: brightness/contrast, HSL, levels, invert, grayscale, color balance
- Filters: blur, sharpen, noise, pixelate, emboss
- History: 50 states with undo/redo and click-to-jump
- Export: PNG, JPEG, JSON project file
- Keyboard shortcuts via **TanStack Hotkeys** (`Mod+Z`, `V`, `B`, etc.)
- Autosaved drafts in IndexedDB
- Virtualized layer list and history panel (**TanStack Virtual**)

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Radix UI primitives (shadcn-style components)
- [@tanstack/react-hotkeys](https://tanstack.com/hotkeys)
- [@tanstack/react-virtual](https://tanstack.com/virtual)

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `bun run dev`  | Start dev server         |
| `bun run build`| Production build         |
| `bun run lint` | ESLint                   |
| `bun run preview` | Preview production build |
| `bun run test` | Run tests in watch mode |
| `bun run test:run` | Run tests once |
| `bun run test:coverage` | Run tests with coverage report |

Tests live in the top-level [`tests/`](tests/) directory (mirrors `src/` layout). Shared helpers: `tests/helpers.ts`.
