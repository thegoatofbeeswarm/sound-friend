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

Run all user-facing text (i18n dictionaries in `src/lib/i18n-dicts/`, article routes, alt text) through the humanizer skill in `.claude/skills/humanizer` before committing it. Keep facts, numbers and citations exactly; remove AI writing patterns such as "not X but Y" contrasts, one-line closers, em dashes used as connectors, inflated claims and filler. Update the English first, then bring the `zh` and `es` dictionaries in line. Design rules for every page live in `DESIGN.md`.
