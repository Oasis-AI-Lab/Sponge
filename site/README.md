# Sponge — Site

The Sponge paradigm site. Aurora UI (dark night + aurora gradients + glassmorphism),
bilingual — **English first**, Chinese under `/zh/`.

## Stack
- **Astro** (static-first, i18n routing, zero default JS)
- Standalone package (not part of the pnpm workspace): `npm install --no-workspaces`

## Structure
```
src/
├── styles/          # Aurora design tokens + global styles
├── components/      # Aurora background, Nav, Footer, Landing, glass cards
├── layouts/         # Base layout (global frame)
├── data/            # Bilingual landing content
└── pages/           # index (EN) · zh/index · paradigm · concepts · ecosystem · docs · paper
```

## Commands
```sh
npm install --no-workspaces
npm run dev        # local dev
npm run build      # static build → dist/
npm run check      # astro check
```
