# Lekka Stop Shop — Design Language

This is a **premium retail brand**, not a generic grocery UI.  
The customer experience is as important as the code.

**Source of truth for identity:** the Westridge shop exterior — bright red building, white wordmark, service-at-the-door lifestyle.  
Do **not** redesign the building. Use it as inspiration for the digital experience.

Hero reference asset: `/public/brand/lekka-stop-shop-hero.png`

---

## Customer should feel

- This doesn’t feel like a traditional spaza shop
- It feels like a luxury neighbourhood market
- Trustworthy · Calm · Beautiful · Expensive · Easy

---

## Principles borrowed (not copied)

| Inspiration | Borrow *why* it feels premium |
|-------------|-------------------------------|
| Woolworths SA | Calm confidence, food as craft |
| Babylonstoren | Natural light, produce honesty, warm materiality |
| Apple | Restraint, sticky nav, one job per view |
| Aesop | Typography + whitespace as luxury |
| Nike | Bold brand moments, emotional photography |
| Airbnb | Belonging, place, lifestyle storytelling |
| Checkers Sixty60 | Local grocery speed, mobile-first checkout |
| Uber Eats | One-thumb flow, clear cart momentum |

---

## Colour palette

Red is **accent**, never the whole interface.

| Token | Role | Value |
|-------|------|--------|
| `--lekka-red` | Brand accent (from building) | `#C8102E` |
| `--lekka-red-deep` | Pressed / emphasis | `#A00D24` |
| `--lekka-gold` | Soft highlight (price badge edge) | `#D4A017` |
| `--lekka-bg` | Warm white page | `#FAF7F2` |
| `--lekka-surface` | Pure white cards | `#FFFFFF` |
| `--lekka-text` | Dark charcoal | `#1C1917` |
| `--lekka-muted` | Warm grey secondary | `#78716C` |
| `--lekka-border` | Soft warm border | `#E7E0D6` |
| `--lekka-fresh` | Fresh produce accent | `#3F6F4A` |

---

## Typography

- **Display / brand:** Bold, confident sans (all-caps only for brand lockups — not body)
- **UI body:** Clean humanist sans, generous line-height
- Prefer expressive fonts (e.g. **DM Sans** + **Fraunces** or similar) — never Inter/Roboto/Arial defaults
- Minimal copy. Let photography carry the story.

---

## Layout language

- Large photography, full-bleed hero on marketing surfaces
- Beautiful spacing — every screen should breathe
- Rounded corners (~12–16px interactive surfaces)
- Subtle shadows (lift, not glow)
- Soft, Apple-like motion (150–280ms, ease-out)
- Glass only on sticky nav / overlays where it earns clarity
- **No clutter:** no pill clusters, stat strips, floating promo stickers on hero media

### Homepage (first viewport)

Brand-first composition only:

1. Lekka Stop Shop (hero-level brand)
2. One elegant headline
3. One short supporting line
4. One CTA group
5. Dominant full-bleed lifestyle image (shop / produce / service)

### Product cards

- Large product image
- Short name / description
- Clear price (ZAR)
- Elegant Add to cart
- Lots of spacing — cards exist because they are the interaction container

### Navigation

- Apple-simple, sticky, minimal
- Large search
- Mega menus that feel curated, not dense
- Mobile-first, large touch targets, one-thumb checkout

---

## Photography

Babylonstoren-adjacent: natural light, fresh produce, wood/warm textures, farm freshness, premium grocery lifestyle.  
Golden-hour warmth matching the Westridge shop photo.

---

## Brand personality

Friendly · Professional · Community · Affordable · Premium · Trustworthy · Modern

---

## Scope

- **Lekka Stop Shop storefront** uses this system (`lekka-*` tokens).
- **TammyShop Admin** keeps its own product UI — do not force Lekka red onto admin unless explicitly requested.

## Implementation files

- Tokens: `src/styles/lekka-tokens.css`
- Cursor rule: `.cursor/rules/lekka-stop-shop-design.mdc`
- Hero: `public/brand/lekka-stop-shop-hero.png`
