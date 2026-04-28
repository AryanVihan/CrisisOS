Build the guest-facing mobile interface for CrisisOS. This is shown as a second browser tab during the demo to prove the full communication loop.

Create src/pages/GuestView.jsx and wire it to /guest route using React Router.

1. Mobile phone frame wrapper:
   - Simulate a phone screen (375px wide, centered on page, with phone bezels drawn in CSS)
   - Status bar at top (time, battery, signal)
   - Everything inside looks like a native mobile app

2. Normal state (before crisis):
   - Hotel branded header: "Horizon Grand — Guest Services"
   - Room number: "Room 312"
   - Welcome message
   - Quick links: Room Service, Concierge, Checkout
   - Large red "SOS / EMERGENCY" button at the bottom — always visible
   - When SOS is pressed: sends event to simulation engine, triggers the guest SOS event in the timeline

3. Crisis state (triggered when simulation severity > 4):
   - Full-screen amber then red alert takes over
   - Large pulsing: "EMERGENCY IN PROGRESS"
   - Your floor: "You are on Floor 3"
   - Clear instruction card: "EVACUATE IMMEDIATELY — Use Stairwell A (turn left from your room). Do NOT use elevators. Staff are guiding you."
   - Live status: "Emergency services have been notified. ETA: 3 minutes"
   - Accountability check-in button: "TAP TO CONFIRM YOU ARE SAFE" — when tapped, the accountability counter in main app increments
   - Live updates feed showing what's happening: "14:32:45 — Staff member on your floor. Follow their guidance."
   - Call for help button: "I NEED ASSISTANCE" — flags the guest as needing physical help

4. Resolved state:
   - Green screen: "YOU ARE SAFE"
   - Thank you message
   - Incident reference number
   - "Your feedback helps us improve" one-tap rating

5. Add route /staff for a simplified staff view:
   - Shows their current assignment from the dispatch board
   - Their zone responsibility
   - Guest count in their zone
   - Quick status updates: "En Route", "On Scene", "Zone Clear"
   - Direct comms button to command center

Add a QR code display in the main CrisisOS dashboard (just an image or generated pattern) that says "Scan to see guest view" — when the judge scans it, they see the guest mobile interface. This proves the full ecosystem.

Make the guest view auto-sync with the main simulation state using a shared state store (Zustand or just a global event bus with window.addEventListener for the demo).