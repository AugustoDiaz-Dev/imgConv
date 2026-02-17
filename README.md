# ImgConv

Image batch converter: convert folders of PNG, JPG, or WebP images to WebP, AVIF, PNG, or JPG. Same filename by default, optional responsive widths.

## Structure

- **packages/core** – Conversion logic (Node + Sharp), no UI.
- **packages/desktop** – Electron macOS app (folder picker, format options, progress).

## Requirements

- Node.js 18+
- macOS (desktop app uses native folder picker)

## Setup

```bash
npm install
npm run build
```

## Run

```bash
npm run dev
```

Pick a folder, choose output format (e.g. WebP), optionally add extra widths, then **Convert**. Output goes to a timestamped folder next to the input; use **Open output folder** when done.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Run the Electron desktop app |
| `npm run build` | Build core + desktop |
| `npm run build:core` | Build core only |
| `npm run build:desktop` | Build desktop only |

## License

MIT
