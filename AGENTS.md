# Ireland Bus Tracking Domain Rules

1. `stop_id` is ALWAYS `VARCHAR` - never `INTEGER` (e.g. `"8460B001"`).
2. `arrival.time` does NOT exist in GTFS-RT - always fallback to `stop_times.arrival_time + delay`.
3. GTFS times can exceed `24:00:00` (e.g. `"25:30:00"`) - store as `VARCHAR`, parse manually.
4. Always use `route_short_name` in public API - never expose `route_id` internally.
5. Galway stops have prefix `"8460"`.
6. `vehicle.position` may not exist - handle missing coordinates without crashing.

