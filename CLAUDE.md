# english7

Personal English-learning app for a 7-year-old in Shanghai. Start with `docs/plan.md` for the learning design, `GLOSSARY.md` for domain terms, and `docs/adr/` for recorded decisions.

## Working agreements

- **Coordinate, don't do everything inline.** The main agent acts as coordinator: delegate multi-file implementation and verification work to subagents with detailed briefs. Keep design decisions, coordination, and final review in the main thread. Do not delegate tiny lookups or one-line edits.
- **Small commits.** Commit one logical unit at a time (docs, scaffold, data + scheduler, screens, styles, README). Never batch unrelated changes into one large commit. Do not push unless asked.
- **Verify before claiming done.** Run `npm test` and `npm run build`, and report the actual results.

## Commands

- `npm run dev` — local server (listens on the LAN for tablet access)
- `npm test` — scheduler tests
- `npm run build` — type-check plus production build
