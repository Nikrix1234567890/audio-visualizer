# Fonts

`Geist-Regular.ttf` is the font used by Text elements in a scene. It is
loaded from here by the editor preview and by the server render, so text
never depends on a download from another site at render time.

- Typeface: Geist, by Vercel
- Source: copied from `next/dist/compiled/@vercel/og/Geist-Regular.ttf`
  (bundled with the `next` package this project already depends on)
- Licence: SIL Open Font License 1.1 - see https://github.com/vercel/geist-font

The other typefaces a text can use were copied from the `@fontsource/*`
npm packages (version 5.3.0, Latin subset, `.woff`). All are under the SIL
Open Font License 1.1; each licence text is next to the files as
`LICENSE-<name>.txt`:

- Montserrat Bold - `montserrat-latin-700-normal.woff`
- Bebas Neue - `bebas-neue-latin-400-normal.woff`
- Orbitron Bold - `orbitron-latin-700-normal.woff`
- Playfair Display Bold - `playfair-display-latin-700-normal.woff`
- Space Mono - `space-mono-latin-400-normal.woff`

The list the editor offers is `FONTS` in `remotion/scene/definitions.ts`.

To offer more fonts, add `.ttf`, `.otf` or `.woff` files here (not `.woff2`,
which the text renderer cannot read) and extend the Text element.
