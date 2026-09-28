# Copilot instructions

## Project overview

This repository is a small, dependency-free browser game built with vanilla HTML, CSS, and JavaScript. `index.html` defines the Japanese game UI and loads `style.css` and `game.js`; there is no framework, bundler, or application server.

The game is drawn on the `#game` canvas in `game.js`. It uses a fixed 960 × 522 logical coordinate space, scales the canvas for the element size and device pixel ratio, and renders a wider world with a following camera. The same script handles physics, keyboard and pointer input, coin collection, goal detection, and updates the HTML counters and intro/result overlays. `style.css` owns the responsive page layout, controls, overlays, and the countryside-inspired palette.

## Commands

There is no package manifest or configured build, test, or lint runner. Check JavaScript syntax with:

```sh
node --check game.js
```

There is no test framework or single-test command. For a browser smoke test, open `index.html`, start the game, and check keyboard and touch controls, coin collection, falling/recovery, and the goal screen.

## Codebase conventions

- Write explanations in Japanese.
- Keep the app framework-free and split changes by responsibility: document/UI in `index.html`, presentation and responsive behavior in `style.css`, and game behavior/rendering in `game.js`.
- Canvas positions and dimensions are in the logical world coordinate system declared by `VIEW_WIDTH`, `VIEW_HEIGHT`, and the game constants. `resizeCanvas()` handles physical pixel scaling; do not mix CSS pixel measurements into world physics.
- Keep visible game status in sync across the canvas and DOM. Use the existing element IDs for counters, messages, and overlays rather than drawing text UI into the canvas.
- Preserve both keyboard and touch play. Keyboard input is tracked in `keys`; on-screen pointer controls are tracked in `touchControls` and should release on pointer cancellation/capture loss.
- The drawing loop is driven by `requestAnimationFrame`; keep frame-dependent movement and physics based on the `delta` time passed to `update()`.
- The game and interface copy are Japanese. Keep player-facing text and accessibility labels in Japanese when adding or changing UI.
