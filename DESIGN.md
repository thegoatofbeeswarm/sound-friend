---
version: alpha
name: Audiomaxxer
description: A hearing-screening site for teens and young adults that also has to convince judges. One clinical-white system across every page, with a single teal accent, Geist Sans, and one motif taken from the ear itself, the cochlea's tapering coil. The homepage leads with an interactive, colour-coded 3D ear on a pale teal stage.

colors:
  ground: "oklch(1 0 0)"                 # --background, pure white
  surface: "oklch(0.972 0.003 250)"      # --card / --muted, the one tone step
  ink: "oklch(0.18 0.006 250)"           # --foreground
  ink-muted: "oklch(0.46 0.01 250)"      # --muted-foreground, secondary notes only
  accent: "oklch(0.47 0.085 205)"        # --primary / --signal, clinical teal
  tint: "oklch(0.955 0.028 205)"         # --accent, the pale teal stage
  coil-tint: "oklch(0.925 0.04 205)"     # the coil drawn on a tint field
  hazard: "#d93b3f"                      # irreversible actions and the 4–6 kHz band only
  left-ear: "oklch(0.508 0.105 246)"
  right-ear: "oklch(0.496 0.096 58)"
  # ear parts (src/components/home/earColors.ts): the 3D mesh, its tag, its chip and its panel dot
  part-outer: "#ff9e7a"
  part-canal: "#ff7aa8"
  part-drum: "#ffd36b"
  part-ossicles: "#f1e4c8"
  part-cochlea: "#14b8a6"
  part-nerve: "#f59e0b"
  part-vestibular: "#6d8cff"
  part-eustachian: "#7dd3a0"

typography:
  family: Geist Sans 400/500/600 (one family; no mono, no serif)
  display: { size: "clamp(2.5rem, 4.6vw, 4.4rem)", weight: 600, tracking: -0.045em, leading: 1.02 }
  heading: { size: "clamp(2.1rem, 4vw, 3.6rem)", weight: 600, tracking: -0.04em }
  lead: { size: "1.06–1.3rem", weight: 400–500, leading: 1.5 }
  body: { size: "16–17px", leading: 1.6, colour: ink }
  small: { size: "13–15px", colour: ink-muted }

rounded:
  pill: 999px        # every button, chip and tag
  card: 12px         # ui/card.tsx
  stage-corner: "min(15vw, 240px)"   # the coil-curve corner on hero stages and plates
---

## Overview

Audiomaxxer screens hearing in about four minutes in the browser, builds a five-skill listening profile (sensitivity, speech in noise, discrimination, attention, memory) and trains the weakest skill. It has to read as trustworthy to a clinician or judge and still be worth playing with for a sixteen-year-old.

The whole site is one white system:
- **Colour.** White ground, one ink, a single step of grey for surfaces, and teal for actions and the motif.
- **Separation.** Surfaces are told apart by tone, not lines. Nothing at rest casts a shadow. Only things that float (the ear-part panel, menus, the headphone dialog) do.
- **Motif.** The cochlea's coil (`src/components/brand/Coil.tsx`) is the one shape. It tapers like the real cochlea, wide at the base where high notes land and narrow at the apex. It appears:
  - in every hero
  - on the homepage stage
  - as history thumbnails
  - in the footer mark

## Page templates

Every page uses `PageHero` (`src/components/PageHero.tsx`) with the layout that fits what the page is for. The same layout on every page is what made the site feel templated; pick by purpose.

| Variant | Use for | What it looks like |
|---|---|---|
| `stage` | learning pages (science, risks, auditory pathway) | Title on white at the left. A pale teal stage at the right, its top-left corner rounded like the coil, holding the page's picture. |
| `plate` | history and method (validation, research) | The photograph leads at the left half; the title answers it on the surface tone. |
| `band` | tools and personal data (test, speech, train, profile, history, report, data) | A compact teal band, with room on the right for a live readout. |
| `article` | long reads (the ten articles, team) | A journal column with the coil hanging in the margin. |

Below the hero, avoid rows of identical cards. Science lists its topics as an index of large linked rows; the homepage alternates a diagram, a picture split, a statement and an accent-field call to action.

`SiteFooter` closes every page: the coil and the name built large, the site map, the disclaimer, and picture credits from `src/lib/credits.ts`.

## Homepage

- **Hero** (`EarHero.tsx`):
  - The text block is centred in the left half: headline, subheading, actions, lede, fine print.
  - The right half is a pale teal stage holding the three.js ear. Tags float on the parts, a hint or part preview sits top right, and the part chips run along the foot.
  - Pressing a part opens a white floating panel with one live experiment.
  - Permanent damage (noise, synapse loss) stays for the visit, on purpose.
- **Sections** (`HomeSections.tsx`), in order:
  1. How it works: dots scatter, compress, then order into five rows.
  2. "From brass to browser": tabs for 1879, the 1960s and today, with real audiometer pictures.
  3. A statement about the stages of hearing, with inline picture slots.
  4. The first step of the test already open: a headphone picker that saves the model and starts the screening.

## Imagery

Real pictures only, credited in the footer:
- Hughes' 1879 audiometer (Wellcome)
- a 1960s Maico portable audiometer
- a healthy eardrum
- a cochlea and cortex pitch-map diagram
- a Gray's Anatomy engraving

They sit inside the coil-corner shape. Add new ones through `src/lib/credits.ts` and keep them honest: they show the world of hearing tests, never our own product or team.

## Motion

- **Easing:** `cubic-bezier(0.23,1,0.32,1)`.
- **Press:** buttons scale to 0.97.
- **Entrances:** sections rise 16–22px with opacity, staggered 60–90ms, once. Titles are painted on the first frame and only travel in.
- **Signatures:** the history plate opens with a clip-path shutter, and the coil settles from a slight rotation.
- **Reduced motion:** every move has a `prefers-reduced-motion` fallback that keeps the content.

## Writing

All visible copy goes through `/humanizer` (keez97, `.claude/skills/humanizer`) and must pass `score.py --mode light` before it ships; `/humanizer-blader` is there for a second rewrite. Plain, specific sentences: no "not X but Y" contrasts, no one-line closers, no dashes as connectors, no inflated claims, no filler. Keep every fact, number and citation. Write the English first, then update the zh and es dictionaries to match.

## Do / don't

- Do use tokens from `src/styles.css`. Don't hard-code colours.
- Do give the ear real colour. A grey or white ear and the blue "safety sign" look were both rejected.
- Don't add gradients, glows, glass panels, thin divider lines, monospace labels, eyebrow pills, or 01/02/03 numbering.
- Don't claim which ear (left or right) the model shows, and never present a screening as a diagnosis.
