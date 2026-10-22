<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Writing copy

Two humanizer skills ship in `.claude/skills/`:

- `/humanizer` is keez97/humanizer, the primary one. It names 43 AI-writing tells and includes `score.py`, a pass/fail checker.
- `/humanizer-blader` is blader/humanizer, a second opinion for rewriting a passage.

Run all user-facing English text (i18n dictionaries in `src/lib/i18n-dicts/`, article routes, alt text) through `/humanizer` before committing, then gate it with the checker:

```bash
python3 .claude/skills/humanizer/score.py <file> --mode light   # UI copy and articles; must PASS
python3 .claude/skills/humanizer/score.py <file> --mode full    # optional, long published prose
```

Use light mode for this site: it is clinical and technical copy, and its careful hedges ("estimate", "may", "not a diagnosis") must stay. Keep every fact, number and citation. Revise at most twice against the checker. Update the English first, then bring the `zh` and `es` dictionaries in line; Chinese keeps its normal `——` punctuation. Design rules for every page live in `DESIGN.md`.
