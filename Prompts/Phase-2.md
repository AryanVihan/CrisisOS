Build the interactive hotel floor map component for CrisisOS. This is the most important visual element — it must look like a real command centre display.

Create src/components/FloorMap/FloorMap.jsx:

1. An SVG-based floor map of a hotel floor. Each floor is a rectangle with:
   - Room blocks arranged realistically (corridor down the middle, rooms on both sides)
   - Labeled zones: East Wing, West Wing, Stairwell A, Stairwell B, Elevator Bank, Emergency Exit
   - Floor selector tabs at the top (Lobby, F1, F2, F3, F4, Roof) — clicking switches the view
   - Each floor has a slightly different layout

2. Guest dots:
   - Small filled circles (8px), color-coded: white = safe, yellow = moving, red = unaccounted, green = evacuated
   - Animate smoothly between positions using CSS transitions (0.8s ease)
   - Show count badge per zone
   - When crisis starts, dots begin moving toward nearest exit based on their floor's evacuation route

3. Sensor indicators:
   - Small diamond shapes on the map at pre-defined coordinates
   - Color: green = normal, amber = elevated, red = critical, pulsing red glow when critical
   - Hover tooltip showing sensor ID, type, current reading, last updated

4. Staff dots:
   - Slightly larger circles (12px) with role initials inside
   - Color: blue = available, orange = en route, red = on scene
   - Show name tooltip on hover

5. Emergency exits:
   - Green arrow indicators on map edges
   - When evacuation is active, animate with pulsing green arrows showing direction
   - Label with "EXIT A", "EXIT B" etc.

6. Evacuation route overlay:
   - When active, show animated dashed lines from zones to exits
   - Different colors per route (primary = green, secondary = amber)
   - Arrows along the path showing direction of movement

7. Crisis zone highlight:
   - When a crisis is detected on a floor, that zone gets a semi-transparent red overlay with animated border
   - Blocked zones (hazard detected) get dark overlay with X marker

8. Floor status bar below map:
   - Per-floor mini status showing: guest count, sensor status, staff count, exit status
   - Color coded by threat level

The component receives props: activeFloor, sensors, guests, staff, crisisZones, evacuationRoutes, isEvacuating. Export a usable component with realistic hotel aesthetics — dark background, cyan/blue room outlines, professional command center feel.