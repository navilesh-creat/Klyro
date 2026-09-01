# Klyro

A free, no-login, no-ads toolkit for everyday tasks — built to run entirely in your browser.

Klyro brings together the utilities people usually pay for (PDF merging, image
compression, QR generation, and more) into one clean, fast, mobile-friendly hub.
Nothing gets uploaded to a server — every tool processes your files locally,
so your data never leaves your device.

## Tools included

**Everyday**
- Image compressor & converter (JPG / WebP / PNG)
- QR code generator with custom colors
- Word & character counter
- Password generator

**Advanced**
- Merge PDFs
- Images → PDF
- Case converter (UPPER, lower, Title, camelCase, snake_case…)
- JSON ⇄ CSV converter
- Text diff checker

## Why it's free

Almost everything runs client-side using the browser's own engine (Canvas API,
`pdf-lib`, `qrcode.js`) — there's no server doing the work, so there's no cost
to keep it free.

## Tech stack

Vanilla HTML / CSS / JavaScript — no framework, no build step. Open `index.html`
and it just works.

## Getting started

```bash
git clone https://github.com/yourusername/klyro.git
cd klyro
# open index.html in a browser, or serve it locally:
npx serve .
```

## Project structure

```
klyro/
├── index.html      # markup + tool grid + modal shell
├── style.css        # theme, layout, animations
├── script.js         # tool logic, particle background, modal system
├── favicon (optional)
├── robots.txt
├── sitemap.xml
├── LICENSE
└── .gitignore
```

## Contributing

Issues and pull requests are welcome. If you're adding a new tool, keep it
client-side only (no server calls) to stay in line with the project's
no-backend, privacy-first approach.

## License

MIT — see [LICENSE](./LICENSE).
