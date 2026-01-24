# Story: Reorganize Plan Inputs Layout

## Summary

Move "Default Shift Length" from the left column (row 4) to the right column, and fill the vacated left-column slot with a new metadata field.

## Current State

The Plan Inputs panel uses a 2-column grid with 7 fields:

| Left | Right |
|------|-------|
| Event Name | Event Date |
| Departure Start | Departure End |
| Flight Duration | Arrival Offset |
| Default Shift Length | *(empty)* |

"Default Shift Length" is a shift-shaping parameter that conceptually belongs more with Coverage/Shift Planning than with the core event timing inputs.

## Proposed Change

Move "Default Shift Length" to the right column of row 4, and add a new field to the left column:

| Left | Right |
|------|-------|
| Event Name | Event Date |
| Departure Start | Departure End |
| Flight Duration | Arrival Offset |
| *(new field)* | Default Shift Length |

## Candidate Fields for the Left Column

1. **Shift Overlap (minutes)** -- Handoff/transition time between consecutive shifts to avoid coverage gaps. Pairs naturally with Default Shift Length as a shift-shaping parameter.

2. **Expected Flights** -- Anticipated number of aircraft for the event. Could enable future staffing ratio indicators or under-staffed warnings.

3. **Event Type** (dropdown: departure, arrival, roundtrip) -- Could influence how coverage windows are calculated for facilities.

4. **Notes** -- Free-text field for route info, special instructions, frequency assignments, etc.

## Decision

TBD -- evaluate options and choose during implementation.

## Acceptance Criteria

- [ ] Default Shift Length appears in the right column of row 4
- [ ] New metadata field occupies the left column of row 4
- [ ] Grid remains balanced (4 rows, 2 columns)
- [ ] No functional regression in shift calculation
