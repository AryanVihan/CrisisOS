Add browser-based voice announcements to CrisisOS using the Web Speech API 
(window.speechSynthesis). This requires zero external libraries and zero API calls.

1. Create src/services/voiceAnnouncer.js:

A service that manages all voice output for the system.

const VoiceAnnouncer = {
  enabled: true,
  queue: [],
  speaking: false,

  speak(message, priority = 'normal', zone = 'all') {
    Use window.speechSynthesis.speak() with a SpeechSynthesisUtterance.
    Settings: rate 0.9, pitch 1.0, volume 1.0
    Pick a voice: prefer a female English voice if available 
    (filter speechSynthesis.getVoices() for en-US or en-GB).
    For priority 'critical': rate 0.85, pitch 0.95 — slower and more serious
    For priority 'calm': rate 1.0, pitch 1.05 — normal and reassuring
    Queue messages so they don't overlap — speak next after current ends.
  },

  announceZone(zone, message, priority) {
    Prepend zone name: "Attention Floor 3. [message]"
    For 'all zones': "Attention all guests and staff. [message]"
  },

  cancel() {
    window.speechSynthesis.cancel()
    Clear queue.
  }
}

2. Define these exact announcement scripts triggered at simulation milestones:

T+0 (crisis detected, severity 4+):
  Zone ALL, calm priority:
  "Your attention please. We are conducting a precautionary safety check. 
   Please remain calm and await further instructions from hotel staff."

T+18 (severity hits 7, emergency declared):
  Zone ALL, critical priority:
  "Emergency alert. An emergency has been detected on Floor 3. 
   All guests please begin evacuating the building immediately. 
   Do not use elevators. Proceed to the nearest stairwell."

T+22 (evacuation routes assigned):
  Zone Floor 3, critical priority:
  "Attention Floor 3 guests. Please evacuate immediately using Stairwell A. 
   Do not use Stairwell B or the elevators. Staff are guiding you to safety."

  Zone Floor 1 and 2, calm priority:
  "Attention guests on Floors 1 and 2. Please proceed calmly to the main exit. 
   Use the central stairwell. Hotel staff are available to assist you."

  Zone Lobby, calm priority:
  "Attention lobby guests. Please exit the building through the main entrance. 
   Move away from the building and await instructions from emergency services."

T+31 (responder brief generated):
  Zone ALL, calm priority:
  "Emergency services have been notified and are on their way. 
   Estimated arrival in 4 minutes. Please continue evacuating calmly."

T+75 (all guests accounted):
  Zone ALL, calm priority:
  "All guests have been successfully evacuated. 
   Thank you for your cooperation. Emergency services are on scene."

3. Create src/components/VoicePanel/VoicePanel.jsx:

A compact panel in the left sidebar showing voice announcement status.

  - Header: "SPEAKER SYSTEM" with a speaker icon
  - Toggle switch: ACTIVE / MUTED (persists to localStorage)
  - When speaking: show animated sound wave bars (4 bars, CSS animation, 
    heights cycling like an equalizer)
  - Current announcement text displayed in a speech bubble style
  - Log of last 5 announcements with timestamps
  - Zone badge showing which zone the current message targets
  - A "TEST ANNOUNCEMENT" button that says 
    "CrisisOS speaker system is active and operational."

4. Wire into useCrisisSimulation:

In the simulation loop, at each milestone timestamp, call 
VoiceAnnouncer.announceZone() with the appropriate message.

Check VoiceAnnouncer.enabled before speaking — respect the mute toggle.

On simulation reset, call VoiceAnnouncer.cancel() to stop any queued speech.

5. Add a visual "speaking" indicator on the ZoneCommunications panel:

When a zone is actively being announced, show animated sound wave bars 
next to that zone's speaker icon — same CSS equalizer animation.
The bars animate only while speech is active, then stop.

Important implementation note: 
speechSynthesis.getVoices() is async on first load. 
Call it inside a 'voiceschanged' event listener to ensure voices are loaded 
before the first announcement fires. Add a fallback so if no preferred voice 
is found, it uses whatever voice is available — never fail silently.

The moment evacuation is announced out loud during the demo, the room will 
go completely silent. This is your most memorable demo moment and costs 
almost nothing to build.