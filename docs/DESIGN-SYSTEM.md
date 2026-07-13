# Smart Inventory OS — Design System v1.0

Quick reference for designers and developers. Pairs with `WIREFRAMES.md` and Brand Brief v1.1.

---

## Logo

| Variant | Use |
|---------|-----|
| Horizontal | Header, email |
| Mark only | App icon, favicon |
| Stacked | Splash, social |

**Name:** Smart Inventory OS — "OS" in teal `#14B8A6` at 70% size or pill badge.

---

## Colour Tokens

```css
/* Primary */
--color-primary: #4F46E5;
--color-primary-dark: #3730A3;
--color-accent: #14B8A6;
--color-accent-light: #99F6E4;

/* Semantic */
--color-success: #22C55E;
--color-warning: #F59E0B;
--color-error: #EF4444;

/* Surfaces */
--color-bg: #F8FAFC;
--color-surface: #FFFFFF;
--color-border: #E2E8F0;

/* Text */
--color-text: #0F172A;
--color-text-secondary: #64748B;
--color-text-muted: #94A3B8;

/* CTA gradient */
--gradient-cta: linear-gradient(90deg, #4F46E5 0%, #6366F1 100%);
```

---

## Typography — Plus Jakarta Sans

| Token | Size | Weight |
|-------|------|--------|
| hero-number | 40px | 700 |
| h1 | 24px | 600 |
| body | 16px | 400 |
| label | 12px | 600 uppercase |
| button | 16px | 600 |
| caption | 13px | 400 |

---

## Spacing Scale

4 · 8 · 12 · 16 · 24 · 32 · 48 (px)

---

## Radius

| Token | Value |
|-------|-------|
| button | 12px |
| card | 16px |
| input | 8px |
| pill | 999px |

---

## Shadow

```css
--shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
--shadow-elevated: 0 4px 24px rgba(15,23,42,0.08);
```

---

## Components

### Hero Card (Stock Value)
- Full width, white, `--shadow-elevated`
- Label: 12px uppercase muted
- Value: 40px bold `--color-text`
- Sub: 13px `--color-text-secondary`

### Stat Card (2-col)
- Half width minus gap
- Icon in 48px circle, primary at 12% opacity
- Number: 28px bold

### Primary CTA
- Full width, 56px height
- Gradient background, white text
- Optional camera icon left

### Product Row
- 72px min height
- Name 16px semibold
- Meta line 14px secondary: `Qty · Cost · Sell`
- Badge `WEEKLY` amber pill for manual products

### PRO Badge
- Background `#4F46E5`, white text, 10px semibold
- Padding 4px 8px, radius pill

### PIN Key
- 64×64px circle
- Background white, border `--color-border`
- Pressed: `--color-primary` fill, white text

---

## Icons (24px grid, 2px stroke)

| Context | Icon |
|---------|------|
| Stock value | coins / wallet |
| Products | box |
| Low stock | alert triangle |
| Buy list | cart |
| Purchases | download/inbox |
| Add stock | camera |
| Sold | minus circle |
| Documents | folder |

---

## Motion

| Animation | Duration | Easing |
|-----------|----------|--------|
| Splash logo | 600ms | ease-out |
| Card enter | 400ms | ease-out |
| Button press | 100ms | ease-in |

**No** bottom ticker / marquee (explicitly rejected).

**Respect** `prefers-reduced-motion`.

---

## Staff vs Owner Visual Diff

| Element | Owner | Staff |
|---------|-------|-------|
| Header subline | Shop name | "Hi, {name}" |
| Hero stock value | ✓ | Hidden |
| Bottom nav | 4 tabs | 3 tabs |
| PRO / billing | ✓ | Hidden |

---

*Design System v1.0*
