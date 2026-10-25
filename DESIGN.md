---
name: WeTrek customer tour flow
description: The inherited forest-green and warm-neutral system as used by customer tour pages.
colors:
  trip-green: "#1f4e43"
  trip-ink: "#193c33"
  trip-muted: "#5a6c61"
  trip-ground: "#f7f5ef"
  trip-line: "#dce2d8"
  trip-orange: "#a63d19"
  trip-pale: "#eaf0e5"
  surface: "#ffffff"
  green-hover: "#173c34"
  control-border: "#aebaad"
  secondary-border: "#aabca9"
  rental-selected: "#edf3e7"
  focus: "#b24f2c"
  error-border: "#ad3824"
  error-text: "#9a301d"
typography:
  headline:
    fontFamily: "Roboto, Arial, sans-serif"
    fontSize: "clamp(28px, 3vw, 44px)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Roboto, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 650
    lineHeight: 1.35
  subtitle:
    fontFamily: "Roboto, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 650
    lineHeight: 1.45
  body:
    fontFamily: "Roboto, Arial, sans-serif"
    fontSize: "15px"
    lineHeight: 1.6
  body-mobile:
    fontFamily: "Roboto, Arial, sans-serif"
    fontSize: "14px"
    lineHeight: 1.6
  field-label:
    fontFamily: "Roboto, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 600
rounded:
  field: "6px"
  button: "7px"
  option: "12px"
  surface: "14px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  field-gap: "20px"
  lg: "24px"
  section: "28px"
  xl: "32px"
  columns: "40px"
components:
  button-primary:
    backgroundColor: "{colors.trip-green}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button}"
    padding: "11px 21px"
  button-primary-hover:
    backgroundColor: "{colors.green-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.trip-green}"
    rounded: "{rounded.button}"
    padding: "11px 21px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.trip-green}"
    padding: "5px 0"
  traveler-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.trip-ink}"
    rounded: "{rounded.field}"
    padding: "10px 13px"
  summary:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
    padding: "26px"
  rental-option:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.option}"
    padding: "21px"
---

# Design System: WeTrek customer tour flow

## Overview

**Creative North Star: "Forest-green guided preparation"**

This records the existing customer tour flow, not a new application identity. Forest green, warm ground, Roboto, project photography, and simple bordered controls carry the inherited visual world. The shared shell retains its existing Roboto stack, warm body background, and dark text; tour-specific tokens remain scoped to the tour surface.

The composition supports one decision at a time with a selected-trip summary nearby. Its separate Travelers → Equipment → Review pages are a chosen customer-flow pattern, not a mandate for unrelated modules.

**Key Characteristics:**

- Warm neutral ground with white, bordered working surfaces.
- Compact sans-serif hierarchy and clearly labeled controls.
- Restrained green interaction states and warm emphasis for totals and selected departure dates.

## Colors

### Primary

Forest green (`trip-green`) carries primary actions, current steps, selected controls, and navigation. `green-hover` deepens primary buttons; `trip-pale` provides a quiet secondary hover surface.

### Secondary

Earth orange (`trip-orange`) emphasizes estimated totals, selected departure dates, and day-plan times. The separate `focus` and error tokens communicate interaction and validation rather than decorative accent.

### Neutral

`trip-ground` is the tour canvas; `surface` is the card and input fill. `trip-ink` carries main text, `trip-muted` supports metadata, and `trip-line` divides sections. `control-border` and `secondary-border` keep controls visible against white and warm ground. `rental-selected` pairs a pale fill with a green outline.

**The Scoped Palette Rule.** Apply these tour tokens within customer tour surfaces; preserve the shared shell and the visual conventions of other modules.

## Typography

Roboto with Arial and sans-serif fallbacks serves headings, body, labels, and numbers. The global serif and mono aliases also resolve to this stack; they are not distinct display faces.

The frontmatter records the observed headline, title, subtitle, body, and field-label roles. Mobile body copy uses `body-mobile`; text inputs become larger (16px) at the mobile breakpoint. Help text is smaller (13px), with a relaxed line height (1.65). Prose is limited to a readable measure (72ch). Dates and prices use tabular figures where implemented; long titles and user-entered text wrap rather than expanding their column.

## Layout

The customer tour container is centered with a maximum width (1240px), desktop side padding (32px), and top padding (32px). Main content and summary use a flexible left column plus a fixed right column (352px), with a gap (40px). At widths up to 1023px the summary narrows (310px), the gap reduces (28px), and summary padding reduces (22px).

At widths up to 767px, the container side padding becomes (20px), columns stack with a gap (32px), and preparation summaries follow the form in normal document order. Detail pages intentionally place departure selection before detail content on mobile. Sidebars are sticky only above this breakpoint, offset from the viewport top (24px).

Traveler fields use two columns with a gap (20px), with the name spanning both; mobile uses one column and a smaller gap (18px). Step navigation keeps all three stages visible, reducing marker size from (30px) to (26px) and label size from (14px) to (12px) on mobile. Browse cards change from three columns to two at 1023px and one at 767px.

**The Unobstructed Actions Rule.** Preparation actions remain in normal flow beneath the current form or review content. They must not cover fields or review text.

## Elevation & Depth

Customer tour surfaces have no box shadows. White fills, pale selected states, thin borders, and section dividers establish depth. Sticky desktop summaries remain flat; stickiness does not imply a floating action bar. Hover movement is limited to a subtle photo scale (1.035) on tour cards.

## Shapes

Soft rectangular surfaces use the documented surface radius; rental choices use the option radius, and inputs and buttons use tighter corners. Borders are thin (1px). Steps use circular number markers; difficulty tags use compact corners (4px). Photos are clipped to their container and use cover cropping. Search controls retain their distinct bottom-border treatment rather than inheriting traveler-field boxes.

## Components

### Buttons

Primary buttons have a minimum height (46px), medium-weight labels (600), green fill, and white text. Secondary buttons use a transparent fill and visible border; text actions use an unfilled, underline-on-hover treatment. Primary background transitions last (160ms, ease). Disabled buttons reduce opacity (0.48). Visible keyboard focus uses a warm outline (3px) with an offset (4px).

### Inputs / Fields

Traveler inputs use white fill, a thin control border, the field radius, and minimum height (46px). Labels sit above controls with spacing (8px). Invalid fields pair an error border with adjacent error text; disabled fields use a pale fill. Native radios and checkboxes retain green accent treatment and explicit labels. Validation moves focus to the first invalid input.

### Navigation

Preparation stages use numbered circles, current green fill, and pale completed markers. Backward navigation preserves entered details; a stage change focuses its heading and returns the viewport to the top. Detail tabs use muted labels, green active text, and a green bottom border. These are local tour navigation patterns; they do not redefine the shared application header.

### Cards / Containers

Tour cards, departure panels, and summaries use white fill, a subtle border, and the surface radius. Summary information separates dates, meeting point, and price rows; the total receives larger orange numerals. Rental options expose selected and unavailable states through both controls and surface treatment. Difficulty tags are white labels over photos, not a general-purpose marketing badge system.

### Review

Review uses the same content grid and summary, with a pale green status panel and editable section headings. Its status describes an unsubmitted selection, not a confirmed reservation. Required personal items remain visually separate from rental choices.

## Do's and Don'ts

### Do:

- **Do** preserve the inherited Roboto, forest-green, and warm-neutral world within the tour scope.
- **Do** keep preparation actions in normal flow and the mobile summary after the form.
- **Do** keep keyboard focus, error text, and selected control states visible.
- **Do** use API-backed tour content and distinguish synthetic review fixtures from product data.

### Don't:

- **Don't** impose the three-stage tour composition or scoped palette on unrelated modules.
- **Don't** present selection review as booking or payment confirmation.
- **Don't** introduce a persistent action layer that obscures form or review content.
- **Don't** infer photo authorship or licensing from project asset reuse.
