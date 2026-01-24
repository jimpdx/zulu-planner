# Changelog

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
