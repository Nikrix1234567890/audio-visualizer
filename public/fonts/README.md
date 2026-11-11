# Fonts

`Geist-Regular.ttf` is the font used by Text elements in a scene. It is
loaded from here by the editor preview and by the server render, so text
never depends on a download from another site at render time.

- Typeface: Geist, by Vercel
- Source: copied from `next/dist/compiled/@vercel/og/Geist-Regular.ttf`
  (bundled with the `next` package this project already depends on)
- Licence: SIL Open Font License 1.1 - see https://github.com/vercel/geist-font

To offer more fonts, add `.ttf`, `.otf` or `.woff` files here (not `.woff2`,
which the text renderer cannot read) and extend the Text element.
