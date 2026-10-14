# WeTrek Alpine Expeditionary Field System

A production-grade, editorial mountain expedition marketplace and backcountry operations system faithfully implementing the 5 provided screen designs: **Marketplace Discovery**, **Climber Registration & Expedition ID**, **Digital E-Ticket & Mountain Gate Check-in**, **Settlement Ledger & Balance Payment**, and **Wayfarer Expedition Logbook Review**, with an interactive connected flow, screen switcher, and Gemini AI Mountain Dispatch assistant.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user in Phase 1:
> - **Navigation Strategy**: Full interactive connected user journey (Search & Book → Register Climber Account → View Digital E-Ticket & Gate Check-in → Pay Remaining Balance → Submit Verified Logbook Review) paired with a persistent top/floating Quick Screen Selector bar for instant jumping between all 5 visual screens.
> - **State & Persistence**: Interactive reactive client-side store persisted in `localStorage`, pre-seeded with authentic expedition data (Fansipan Cloud Ridge, Ky Quan San, Ta Nang - Phan Dung, Pu Luong, Ta Xua, and Lan Ha Bay), supporting active bookings, traveler check-ins, balance payments, and review publications.
> - **Gemini AI Integration**: Real interactive Alpine Ranger & Trail Dispatch assistant accessible from the E-Ticket via a modal/drawer, powered by `gemini-3.8-flash` on an Express backend route (`/api/ranger-chat`) for real mountain briefings, weather forecasts, gear checklists, and emergency guidance.

---

## 1. Overview & Core Concept

- **What It Does**: A complete alpine expedition platform bridging independent mountain guides, certified guilds (IFMGA/WFR), and backcountry trekkers. It handles discovery and tour comparison, climber safety credentialing and OTP verification, offline-ready digital gate passes with QR validation, escrowed milestone payments (VietQR and credit card), and verified expedition debriefs with photo uploads.
- **Target Audience / Persona**: High-altitude trekkers, backcountry climbers, international adventurers, and licensed mountain guiding guilds operating in Southeast Asian peaks (Fansipan, Ky Quan San, Ta Xua, Langbiang, Pu Luong) and worldwide alpine zones.
- **Key Value**: Replaces scattered messaging and cash-on-trail friction with transparent guide pricing, verified licensing (#Gov Lic numbers), weather escrow protection, live emergency radio dispatch, and park gate digital check-in.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Marketplace Discovery (Image 1)**
   - Top banner & header with unboxed navigation, search input, and guide recruitment CTA.
   - Hero search console: *Where To?*, *Tour Company*, *Difficulty*, and *Dates* with responsive search execution.
   - Popular trip pills & trust badges: 180+ verified local guides, 12,400+ reviews, 100% safe payments, 0% markup.
   - Featured tour operators (Wayfarer Alpine Guild, Highland Nomads Outfitter, Indochina Summiters Guild) with active routes, on-time rate, and accreditation badges.
   - Seasonal discount voucher cards with instant 1-click clipboard copy (15% OFF, $50 CREDIT, $20 OFF).
   - Popular Mountain Destinations cards with elevation tags and operator count.
   - Verified Tour Cards grid with sort options (Highest Guide Safety Score, Price, Duration), Bring Your Own Gear vs. Rent All Gear price comparisons, and direct "Book This Trip" actions.
   - Value proposition cards ("Why Book With Us"), safety promise banner, and partner lead-gen footer.

2. **Backcountry Climber Account Registration (Image 3)**
   - Step indicator: *Step 1 of 2: Create Backcountry Climber Account*.
   - Left-hand Alpine Trust guarantees: 100% Weather Escrow, Certified Alpine Guides, 24/7 Satellite SOS.
   - Registration card: Full legal name (trail pass requirement), international phone input with country selector, email with simulated live OTP dispatch (`Resend (45s)` countdown and 6-digit verification code boxes), password with real-time strength meter, and safety protocol checkboxes.
   - Submitting routes the climber directly to their confirmed reservation and E-Ticket.

3. **Digital E-Ticket & Gate Check-in (Image 6)**
   - Header with booking reference `#TRK-98421-FANSIPAN` (copyable), Hoang Lien Son National Biosphere context, and quick "Download Ticket" button.
   - Pass ticket card: Hard trip level badge, 3,143m peak elevation, main traveler Eleanor Vance, meeting location Tram Ton Pass Gate (1,900m MSL), lead guide Giang A Pao (WFR certified).
   - Perforated dashed divider with dynamic high-contrast QR code, validation token `#HLP-8924-VALID`, and VHF Emergency Radio frequency `147.425 MHz`.
   - Gate Check-in station: Live status for Eleanor Vance (Checked In 06:14 AM) and Marcus Thorne (Waiting at Gate, with interactive "Check Status" / "Mark Checked-In" button).
   - Interactive SVG Trail Elevation Profile: 1,900m Tram Ton Gate → Camp I (2,200m) → Camp II (2,800m) → Fansipan Peak (3,143m) with interactive waypoint tooltips.
   - Sidebar: Countdown timer (`04d 16h 39m`), Payment breakdown with "Pay Remaining Money Now" trigger, 100% Bad Weather Guarantee breakdown preview, and Tour Guide contact card with "Call Tour Guide Now" and "Chat with AI Help".

4. **Settlement Ledger & Pay Remaining Balance (Image 8)**
   - Breadcrumb returning to E-Ticket, payment window countdown (`02 days : 16 hours left`).
   - Payment method selector: VietQR / NAPAS (with dynamic generated QR, instant clearing steps simulation, transfer note), Bank Card, Bank Transfer, Wallets.
   - Optional Trail Services: Interactive toggle for *1x Extra Personal Porter (+400,000 VND / ~$16 USD)* that dynamically updates the balance in real-time.
   - Permitting contact validation and primary traveler details.
   - Live order statement calculating Total Expedition Price, Deposit Paid, National Park Fee, and Final Balance to Pay Now.
   - Interactive payment clearing button with simulated bank receipt and status update.

5. **Wayfarer Expedition Logbook & Tour Review (Image 10)**
   - Breadcrumb to My Bookings, verified expedition header (*Ha Long & Lan Ha Bay 5-Star Luxury Cruise* or *Fansipan Cloud Ridge*), and `+250 pts` reward preview.
   - Section 1: Multi-factor interactive star rating inputs (Overall Tour Experience, Guide & Crew Service, Kayak & Excursions Scenery) with descriptive score feedback labels.
   - Clickable highlight tags (Pristine Nature, Knowledgeable Guide, Delicious Local Cuisine, Great Kayaking, 5-Star Balcony Cabin, Seamless Harbor Transfer, Sunset Cocktails).
   - Section 2: Expedition photo & video upload dropzone with preview thumbnails (including remove actions).
   - Section 3: Field notes narrative textarea with character counter (`342 / 2,000`) and quick insertion helper prompts.
   - Endorsement options (*Enthusiastically*, *Neutral*, *Not Advised*) and Expedition Dynamic options (*Solo*, *Couple*, *Family*, *Friends*).
   - Submit review button with immutable traveler attestation badge, celebratory reward animation, and storage into the review ledger.

6. **Interactive AI Mountain Ranger & Dispatch Drawer**
   - Clickable from the "Chat with AI Help" button on the E-Ticket.
   - Full conversation with Giang A Pao / Basecamp Dispatch: answers questions about weather conditions at Fansipan/Sapa, mandatory gear (thermal layers, headlamps, trekking poles), Tram Ton meeting points, park regulations, and altitude sickness prevention.

### Visual Identity & Theme
- **Color Palette (Alpine Expeditionary Field System)**:
  - Canvas Base: `#FDFBF7` (Warm unbleached paper)
  - Surface Level 1: `#F7F4EE` (Muted sandstone)
  - Surface Level 2: `#EFECE4` (Recessed well & table header)
  - Card Surface: `#FFFFFF` with hairline border `#E6E1D8`
  - Primary Accent: `#C2410C` (Alpine Rust / Terracotta)
  - Secondary Accent: `#1F4E43` (Deep Cedar Pine)
  - Tertiary Accent: `#D97706` (Warm Amber Beacon)
  - Ink Primary: `#1C2526` (Forest Slate Ink)
  - Ink Secondary: `#2D3748` (Weathered Shale)
  - Ink Muted: `#64748B` (Slate Muted)
- **Typography**:
  - Editorial Headings: `Newsreader`, `serif` for elegant expedition titles and narrative callouts.
  - Interface & Data: `Plus Jakarta Sans`, `sans-serif` for high-density forms, buttons, and navigation.
  - Coordinates & Telemetry: `JetBrains Mono` / tabular numerals for altitudes, frequencies, and prices.
- **Anti-Slop Discipline**: No generic AI purple gradients, no floating pill bubbles on metadata, crisp 1px borders, authentic expedition terminology, and real working handlers for every button.

---

## 3. Key Product Decisions & Trade-Offs

- **Screen Navigation**: A fixed top preview bar allows jumping immediately to any of the 5 reference screens (*1. Marketplace*, *2. Registration*, *3. E-Ticket*, *4. Balance Payment*, *5. Tour Review*), while also allowing realistic in-flow clicks (e.g., clicking "Book This Trip" goes to Registration or Ticket; clicking "Pay Remaining Money Now" goes to Balance Payment; clicking "Review Tour" goes to Logbook).
- **Backend Architecture**: A lightweight Express server (`server.ts`) combined with Vite serving frontend assets in development and production. The Express server provides `/api/ranger-chat` with `@google/genai` using `gemini-3.8-flash` and `User-Agent: 'aistudio-build'`.
- **Payment & QR Simulation**: VietQR generation uses standard EMVCo/VietQR styling with dynamic transaction notes, real VND currency calculation, and an instant "Simulate App Scan & Pay" trigger that marks the booking paid in full and updates the E-ticket.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        WeTrek / Wayfarer Web App                       │
├────────────────────────────────────────────────────────────────────────┤
│  Top Global Switcher: [Marketplace] [Register] [Ticket] [Pay] [Review] │
├────────────────────────────────────────────────────────────────────────┤
│                               Views                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │ 1. Marketplace  │  │ 2. Climber Reg  │  │ 3. Digital E-Ticket     │ │
│  │   • Hero search │  │   • Legal name  │  │   • Perforated QR Pass  │ │
│  │   • Top Guides  │  │   • OTP Code    │  │   • Gate Check-in list  │ │
│  │   • Tour Cards  │  │   • Strength    │  │   • Elevation Profile   │ │
│  │   • Destinations│  │   • Escrow T&C  │  │   • AI Ranger Drawer    │ │
│  └────────┬────────┘  └────────┬────────┘  └────────────┬────────────┘ │
│           │                    │                        │              │
│           └────────────────────┼────────────────────────┤              │
│                                │                        │              │
│  ┌─────────────────────────────┴────┐  ┌────────────────┴────────────┐ │
│  │ 4. Settlement Ledger (Pay)       │  │ 5. Wayfarer Review Logbook  │ │
│  │   • VietQR & Bank selection      │  │   • 3-Factor Star Ratings   │ │
│  │   • Porter add-on toggle (+400k) │  │   • Highlight tags & photo  │ │
│  │   • Real-time ledger summary     │  │   • Field notes & attestation││
│  └──────────────────────────────────┘  └─────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│                       Expedition State Store                           │
│     localStorage: tours, currentBooking, travelerRoster, reviews       │
├────────────────────────────────────────────────────────────────────────┤
│              Express Server (/api/ranger-chat)                         │
│            @google/genai SDK (gemini-3.8-flash)                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

- **`Tour`**: ID, title, operator, license, rating, review count, difficulty, duration, elevation, priceOwnGear, priceRentGear, image, tags.
- **`Booking`**: ID (`#TRK-98421-FANSIPAN`), tourId, leadTraveler, travelers (`[{ name, passport, status, tag }]`), meetingPoint, guide, depositPaid, remainingBalance, currency, porterAddon (boolean), qrCodeToken, emergencyFreq.
- **`Review`**: ID, expeditionTitle, completedDate, guideName, ratings (`{ overall, guide, scenery }`), tags, photos, narrative, endorsement, travelerDynamic, pointsAwarded.

### API & Server Flow

- `POST /api/ranger-chat`: Accepts `{ message, history }`, queries `gemini-3.8-flash` with system prompt instructing it to act as Giang A Pao & Basecamp Alpine Dispatch for Hoang Lien Son & Fansipan expeditions, and returns structured advice with trail tips and safety rules.
