# PxEd — Browser Image Editor

A Photoshop-style image editor built with React, TypeScript, Tailwind CSS, and shadcn/ui-style components.

## Run locally

```bash
cd image-editor
npm install
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## Features

- Layer-based editing with blend modes, opacity, reorder, visibility, lock
- Tools: move, selections, brush, pencil, eraser, fill, gradient, eyedropper, text, shapes, crop, zoom
- Adjustments: brightness/contrast, HSL, levels, invert, grayscale, color balance
- Filters: blur, sharpen, noise, pixelate, emboss
- History: 50 states with undo/redo and click-to-jump
- Export: PNG, JPEG, JSON project file
- Keyboard shortcuts (V, M, B, E, Ctrl+Z, etc.)

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Radix UI primitives (shadcn-style components)
