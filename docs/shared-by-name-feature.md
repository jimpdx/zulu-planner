# Feature: "Shared by" Name on Plans

## Goal

When someone shares a plan, show the recipient a message like:
> "$Name wanted to share this plan with you"

## Changes Required

### 1. UI — Name Input on Share
- Prompt the user for their name when they click "Share" (or store it persistently in localStorage as a preference)
- Pass the name to `savePlan()`

### 2. `sharePlan.ts` — Store `sharedBy` Field
- Add `sharedBy: string` to the document written to Firestore
- Existing plans without the field are handled gracefully (skip message)

### 3. Firestore Security Rules
- Add `sharedBy` as an allowed string field in the `create` rule:
  ```
  && request.resource.data.sharedBy is string
  ```

### 4. `PlanContext.tsx` — Display Message on Load
- When a shared plan loads successfully and has a `sharedBy` value, surface it to the UI
- Could be a toast/banner at the top of the page that dismisses after a few seconds

## Notes

- No migration needed — Firestore is schemaless; old plans just won't have the field
- Name is freeform text — sanitize/limit length (e.g., max 50 chars) before saving
