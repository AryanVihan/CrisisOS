Build a 3D isometric hotel visualization for CrisisOS using Three.js. 
This is a toggle alternative to the 2D floor map — same data, 
dramatically different visual impact.

Use Three.js r128 which is available at:
https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js

1. Create src/components/FloorMap3D/FloorMap3D.jsx:

A React component wrapping a Three.js scene.
Canvas size: fills the same container as the 2D floor map.
Camera: orthographic camera positioned for isometric view 
  (equal angles: rotate 45° around Y, 35.26° around X).

Scene setup:
  Renderer: WebGLRenderer, antialias true, alpha true (transparent background)
  Background: transparent (host CSS handles the dark background)
  Lighting:
    - AmbientLight: 0x404060, intensity 0.6
    - DirectionalLight: 0xffffff, intensity 0.8, position (10, 20, 10)
    - PointLight: 0xff4444, intensity 0, position (5, 10, 5) — 
      this is the fire glow light, intensity 0 normally, 
      ramps up to 2.0 during crisis

2. Build the hotel geometry:

Floor slabs (6 floors):
  For each floor (Lobby, F1, F2, F3, F4, Roof):
    BoxGeometry(20, 0.3, 15) — wide, thin slab
    MeshLambertMaterial with floor-specific color:
      Lobby: 0x1a1a2e
      F1: 0x16213e
      F2: 0x16213e  
      F3: 0x16213e (turns red during crisis)
      F4: 0x16213e
      Roof: 0x0f3460
    Stack floors 2.5 units apart vertically.
    Add thin edge lines (EdgesGeometry) in cyan (0x00ffff) at 0.3 opacity.

Room blocks per floor (simplified):
  East wing: 5 small boxes (2x1.5x1.8) arranged in a row
  West wing: 5 small boxes mirrored
  Central corridor: empty space between wings
  Stairwells: taller thin boxes at each end
  Use MeshLambertMaterial, color 0x1e293b, edges in 0x334155.

Room windows (purely decorative):
  Small flat planes on room faces with emissive yellow (0x332200) 
  material — look like lit windows from the isometric angle.
  During crisis: rooms on F3 get red-tinted windows (0x330000).

3. Person dots in 3D:

For each guest: SphereGeometry(0.15, 8, 8) 
  Normal: MeshBasicMaterial color 0xffffff
  Moving: color 0xffff00
  Unaccounted: color 0xff0000, add pulsing scale animation
  Evacuated: color 0x00ff00

For each staff member: CylinderGeometry(0.12, 0.12, 0.4, 8)
  Available: color 0x3b82f6
  Dispatched: color 0xf59e0b
  On scene: color 0xef4444

Animate person positions: use lerp to smoothly move persons 
between their current and target positions each frame.
During evacuation: persons flow toward exit positions at floor edges.

4. Crisis visualization in 3D:

Fire effect on F3:
  Create a ParticleSystem (Points) with 200 particles above the 
  kitchen zone. Particles: small orange/red/yellow dots moving upward.
  Particle positions randomized within a small radius.
  Each frame: move particles upward by 0.02, reset to base when y > 3.
  Only visible when crisis active on F3.
  
  Note: Do NOT use CapsuleGeometry — it was introduced in r142.
  Use CylinderGeometry or SphereGeometry for any pill shapes.

Floor highlight:
  When a floor is in crisis: change its slab material color to 0x3d0000.
  Add a pulsing point light at crisis location (red glow).
  
Evacuation route lines:
  For each active evacuation route:
    TubeGeometry along a path from floor center to exit point.
    MeshBasicMaterial: color 0x00ff88, transparent true, opacity 0.6.
    Animate: move a glowing sphere along the tube 
    (update its position along the curve each frame).
    This shows the evacuation path as a glowing green river of light.

5. Camera controls:

Auto-rotation: scene slowly rotates on Y axis (0.002 rad/frame) 
during idle state — looks cinematic.
Stop rotation when crisis active — stability matters during emergencies.

Manual orbit: add mouse drag to orbit camera manually.
  mousedown → track drag delta → update camera spherical coordinates.
  Simple implementation without OrbitControls (not available on CDN).

Zoom: mouse wheel adjusts camera zoom level.

Floor focus: when a floor tab is clicked, animate camera to focus 
on that floor (tween its Y position and zoom level over 0.8 seconds).
Simple tween: each frame lerp camera.position toward target position.

6. UI overlay on top of 3D canvas:

Using CSS absolute positioning over the canvas:
  Top-left: floor labels (hover reveals floor stats)
  Top-right: "3D VIEW" badge + "ROTATE: drag | ZOOM: scroll" hint
  Bottom: same floor selector tabs as 2D map
  Crisis overlay text: "EMERGENCY — FLOOR 3" in red when active

7. Add 2D / 3D toggle to floor map header:

A toggle button: [2D MAP] [3D VIEW]
When switching:
  Animate the 2D map fading out (opacity 0, scale 0.95, 0.3s)
  Animate the 3D canvas fading in (opacity 1, scale 1, 0.3s)
  Both components stay mounted — just toggle visibility.
  The 3D scene continues updating in the background.

The switch from 2D to 3D mid-demo — especially when the fire particle 
effect and glowing evacuation routes are visible — is a moment that 
will make every judge in the room react visibly.