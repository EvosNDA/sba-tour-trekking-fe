# WeTrek customer tour flow

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Vietnamese and English speaking customers finding a trekking tour, choosing a departure, entering traveler information, and choosing rental equipment.

## Product Purpose

Help customers understand a tour and prepare their selection using the project's actual tour data. The customer flow is being rebuilt; the old placeholder UI is not a functional specification.

## Operating Context

React and TypeScript frontend with an existing shared header, authentication store, and Vietnamese/English translation provider. Spring Boot owns tour, departure, activity, and image APIs. Work is scoped to the tour module; booking and payment belong to other team members.

## Capabilities and Constraints

- A tour has multiple departures, activities by day, and multiple images stored on Cloudinary.
- The equipment database describes a required-items checklist, one rental package per tour, and individual rental prices for items in that package. Stock management is outside this tour configuration.
- Tour and schedule lists use Spring Page and zero-based pagination. Existing tour APIs currently require authentication.
- Prices are integer VND. Tour and schedule statuses and difficulty use uppercase enum names in JSON.
- The user requested a real customer flow from tour search through traveler information and rental selection, with a matching API contract.
- The user approved read APIs for required items and equipment inside the tour package. Reuse existing tour/schedule/activity endpoints; add optional list filters rather than a duplicate catalog API.
- The flow stops at review and hands a typed selection to Booking. It does not submit bookings or payments.
- After departure selection, use separate pages for travelers, rental equipment, and review, with the trip summary beside each page. Preserve entered details when moving between steps.
- Use plain labels such as “Day plan”; avoid specialist English where everyday words work.

## Brand Commitments

Keep the shared application shell compatible with other modules. Toong Adventure is a reference for the steps of choosing a trip, not content to copy or a required visual clone.

## Evidence on Hand

- Backend source: `../sba-tour-trekking-be/src/main/java/com/trekking/app/features/tour`.
- Equipment schema: `../sba-tour-trekking-be/schema/migrations/007_add_tour_equipment_catalog.sql`.
- Existing project imagery: `src/assets/images`.
- Tour titles, prices, schedules, images, and equipment shown as live data must come from the API. Do not invent ratings, inventory, destinations, or commercial claims.

## Product Principles

- Show the selected tour, departure, travelers, equipment, and price together before handoff.
- Keep required personal items separate from rental choices.
- Make missing data and API failures understandable and recoverable.
- Keep customer content in both Vietnamese and English.
