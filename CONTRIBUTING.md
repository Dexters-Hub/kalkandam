# Contributing

Thanks for helping. Kalkandam is plain HTML, CSS and ES modules with no build step.

## Ways to help

- **Know who designed a font?** Use the form at [kalkandam.in/about](https://kalkandam.in/about#contribute). No account needed.
- **Found a bug or want a font added?** [Open an issue](https://github.com/Dexters-Hub/kalkandam/issues/new/choose).
- **Code:** fork, branch, and open a pull request.

## Working on the code

```sh
npm start   # http://localhost:8000, with local stand-ins for the /api endpoints
npm test    # converter tests
```

- Asset URLs carry a version query (`?v=15`). Bump it everywhere when you change a JS or CSS file, so browsers fetch the new copy.
- Fonts are cached for a week. If you change font files, bump `FONT_VERSION` in `js/app.js` too.
- Adding fonts is covered in the [README](README.md#add-a-font). Only add fonts whose licence allows sharing.
- Keep new dependencies to a minimum. Open an issue first if you think one is needed.

## Accepting font info

See [docs/font-info.md](docs/font-info.md).
