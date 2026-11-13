# Message templates

Text the Flisk bots post, kept here so the wording can change without touching workflow code.

| File | Used by |
| --- | --- |
| [claim-badge.md](claim-badge.md) | The thank-you comment on every merged community PR in flisk-sh/flisk (`contributor-merged.yml`) |
| [start-here.md](start-here.md) | The pinned message in `#start-here` on Discord (posted by hand) |

Each file starts with an HTML comment that lists its placeholders. The bot removes that comment before posting. If the bot cannot read a file, it posts a short built-in version instead, so a broken edit never stops a thank-you.
