# Buyer Information Architecture

## Dashboard

## Discover

-   Search Properties
-   Map View
-   Saved Properties
-   Property Detail

### Discover Routes (Current Web Implementation)

-   `/app/listings` — Search, filter, and map discovery
-   `/app/property/:propertyId` — Property detail (`PropertyDetailEnhanced`)
-   `/agent-profile/:agentId` — Agent profile (`AgentProfile`)
-   Primary flow: clicking a listing card or map marker in `/app/listings` opens `/app/property/:propertyId`
-   Supporting flows (comparison and agent surfaces) also route to `/app/property/:propertyId`
-   When opening agent profile from property detail, `?back=/app/property/:propertyId` preserves return navigation

## Purchase Journey

-   Make Offer
-   Sales Tracker
-   Documents
-   Escrow
-   Completion

## Build / Renovate

-   Find Contractor
-   BOQ Builder
-   Supplier Quotes
-   Project Tracker

## Compliance

-   Inspection Status
-   Certificates

## Lifecycle

-   Maintenance
-   Warranty
-   Rental

## Settings
