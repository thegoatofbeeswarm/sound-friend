# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary audience of the homepage: judges and partners** (competition panels such as MIT Solve, global public-health organisations, headphone makers). They arrive to evaluate whether the idea is sound, credible and worth backing, usually on a laptop, often in one sitting alongside other entries.
- **End users of the product: teens and young adults who live in headphones.** They take the screening and training; the homepage must still make sense to them.

## Product Purpose

Audiomaxxer (repo name: Sound Sense) is a headphone-based listening-health screening. A short screening builds a five-part listening profile (sensitivity, speech in noise, discrimination, attention, memory), then trains the weakest skill and retests it. Success on the homepage: a judge understands within seconds that hearing loss is a growing worldwide problem, explores the ear to see how damage happens, and goes on to the screening or the auditory-pathway explainer.

## Positioning

Clinical audiograms need booths and equipment; phone volume warnings are one-size-fits-all at 85 dB. Audiomaxxer screens with an adaptive Bayesian staircase over ordinary headphones and measures what a threshold test misses (speech in noise, hidden hearing loss), so it can be distributed free in low-resource settings.

## Operating Context

- Built with TanStack Start + React 19 + Tailwind v4, synced with Lovable; also wrapped with Capacitor for iOS/Android.
- Three UI languages (en, zh, es) via `src/lib/i18n-dicts/*`; every visible string goes through `t()`.
- Screening requires headphones and takes about four minutes. It is a screening, not a diagnosis.

## Capabilities and Constraints

- Routes that must stay reachable from the homepage: `/test` (screening), `/sample-profile`, `/auditory-pathway`.
- Homepage copy confirmed by the owner: "Hearing loss is a growing issue worldwide. To learn more about how it affects the outer and inner ear, interact with the 3D model ear." plus the existing lede, CTAs, fine print and the signal-path chain of parts.
- Ear-part content (what it does, what goes wrong, permanence, profile dimension) lives in `src/lib/i18n-dicts/hero.ts`.

## Evidence on Hand

- Research and validation pages exist in the app (`/research`, `/validation`, `/test-retest-reliability`, `/science`).
- The lede cites "12~17% of teens" affected by unnoticed hearing problems. No customers, partners, endorsements or press exist; none may be invented.

## Product Principles

1. Show the mechanism, don't assert it: the ear itself explains where damage happens.
2. Screening, never diagnosis: every claim stays inside what a headphone test can honestly measure.
3. Credible to an expert panel, approachable to a 15-year-old.
4. Permanent damage is stated plainly, without fear tactics.

## Accessibility & Inclusion

- Keyboard reachable parts, visible focus, `prefers-reduced-motion` respected, works on a phone.
- Avoid: clinical/hospital look, gamer/neon look, childish/cartoon look, generic AI-template look (owner's explicit rejects).
