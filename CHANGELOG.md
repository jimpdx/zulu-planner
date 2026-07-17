# Changelog

## 1.4.0

Timeline readability, enroute sectors, and input safeguards.

- Enroute facilities now split the cruise into sequential sectors (in add-order) instead of all sharing one fixed 20-80% slice: the first sector overlaps the departure phase, the last overlaps the arrival phase, and adjacent sectors overlap at the mid-cruise handoff
- Timeline facility bars now show each facility's local coverage range inline (e.g. `ZAK (1500-2100 local)`), translated from Zulu to the facility's own timezone
- Renamed the top two timeline bars to "Departure Window" and "Arrival Window" for clarity
- Warn when a departure window exceeds 12 hours (usually a start/end typo that triggers an unintended midnight rollover); the plan still computes, the warning is advisory only

## 1.3.0

Shared-plan persistence fixes.

- Fixed shared plans overwriting your own saved plan: opening a `/events/<id>` share link no longer writes the shared snapshot into your localStorage
- "New Plan" and the header title now clear the shared-plan state, so a fresh plan persists again and the "Shared by" label reverts to "Created by"
- Consolidated the three reset entry points (New Plan button, header title, shared-plan flag) into a single `resetPlan()` action

## 1.2.1

Timezone picker improvements.

- Expanded timezone list to cover every main UTC offset from -11 to +13
- Added missing offsets: UTC+2 (Cairo), UTC+3 (Moscow), UTC+4 (Dubai), UTC+5 (Karachi), UTC+6 (Dhaka), UTC-1 (Cape Verde), UTC-3 (São Paulo), UTC-4 (Halifax)
- Removed duplicate entries sharing the same offset (e.g. Vancouver/Los Angeles, Toronto/New York, Paris/Berlin)
- Reduced list from 36 entries to 28 with no gaps in coverage

## 1.2.0

New Plan reset, navigation, and shared-by attribution.

- Clickable header title resets to a blank plan and returns to `/events/`
- "New Plan" button in Plan Inputs header for explicit reset
- Header shows pointer cursor and hover feedback as a navigation cue
- "Created by" field on the plan form, stored as `sharedBy` in Firestore when sharing
- Recipients see the field labeled "Shared by" with the sharer's name pre-populated
- Rearranged Plan Inputs column layout for better grouping

## 1.1.3

Plan sharing and deployment improvements.

- Share plans via URL (e.g., `https://perflight.com/events/c8fh23ds`) using Firebase Firestore
- Share button in Plan Inputs header saves current plan and copies link to clipboard
- Recipients can edit a shared plan and generate their own share link (gist-style)
- Input validation and Firestore security rules to prevent malformed data
- SPA routing via .htaccess for path-based share URLs
- Build-time version injection into HTML meta tag
- Google Analytics tracking
- Fixed SFTP deploy configuration (context + remotePath)

## 1.1.2

UI refinements and project housekeeping.

- Added Lexend font for improved readability
- Updated header styling
- Renamed "Controller Staffing" to "Coverage/Shift Planning"
- Clarified form labels and placeholders
- Added docs/ directory with story-based feature planning

## 1.1.1

Bug fix.

- Fixed crash when typing partial time values in departure inputs (invalid Luxon DateTime from incomplete HH:mm strings)
- Deployment path updated to /events/

## 1.1.0

UI polish and usability improvements.

- Time inputs accept colons as optional (e.g. "1200" auto-formats to "12:00" on blur)
- Timeline hour markers now display correctly when departure starts exactly on the hour
- Timeline bars padded with spacing before first and after last hour markers
- Timeline bars increased in size (taller bars, larger text, more padding)
- Facilities panel redesigned: name/type/timezone on one line, natural language lead/lag below
- Facilities coverage displayed as pill-shaped badges matching controller shift style
- Removed "date differs from UTC" warning (local pill still turns amber)
- Add/Cancel buttons restyled with royal blue background and white text
- Consistent text sizing across Facilities and Controllers panels

## 1.0.0

Initial release.

- Plan creation with event name, base date (UTC), departure window, flight duration, and arrival offset
- Facility management with departure/arrival/enroute types, IANA timezones, and lead/lag buffers
- Controller management with local timezone shift display
- Automatic coverage window computation in UTC and local time
- Shift splitting based on configurable shift length
- International Date Line / midnight crossing handling
- Timeline bar visualization (UTC)
- Timezone picker with dynamic UTC offset display
- Custom color theming via CSS tokens
- localStorage persistence
