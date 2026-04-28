Build the comparison and counterfactual simulation features for CrisisOS.

1. Create src/components/Comparison/BeforeAfterComparison.jsx:
   A modal overlay triggered by a "COMPARE RESPONSE" button.
   
   Two-column layout: "WITHOUT CrisisOS" (left, dark red theme) vs "WITH CrisisOS" (right, dark green theme).
   
   Each column shows a mini animated timeline of the same crisis:
   Without CrisisOS:
   - T+0:00 — Fire starts
   - T+2:30 — Guest notices smoke, calls front desk
   - T+4:00 — Front desk calls manager
   - T+6:30 — Manager manually calls 911
   - T+8:00 — Staff begin informal evacuation
   - T+11:00 — First responders arrive with minimal briefing
   - T+14:00 — Evacuation complete (estimated)
   - T+18:00 — All guests accounted for (estimated)
   - TOTAL: 18 minutes | 2 guests with smoke inhalation
   
   With CrisisOS:
   - T+0:00 — Fire starts
   - T+0:03 — Sensor detection
   - T+0:18 — AI analysis complete
   - T+0:28 — Emergency services dispatched with full brief
   - T+0:38 — Evacuation underway
   - T+0:52 — All guests moving to exits
   - T+1:15 — All guests accounted for
   - TOTAL: 75 seconds | 0 injuries
   
   Below each column: key stats comparison table:
   | Metric | Without | With CrisisOS |
   | Detection time | ~150s | 3s |
   | Coordination | ~8 min | 52s |
   | Responder brief | None | Auto-generated |
   | Accountability | Manual/unknown | Real-time |
   | Injuries (projected) | 2-3 | 0 |
   
   Animate the timelines playing out simultaneously when modal opens.

2. Create src/components/Counterfactual/CounterfactualSimulator.jsx:
   A panel with 3 pre-computed "what if" scenarios:
   
   Scenario A — "What if Stairwell A was also blocked?"
   - Show: evacuation time +3.2 min, risk score +40%, 12 additional guests at risk
   - Floor map shows stairwell A turning red, routes rerouting
   
   Scenario B — "What if the crisis started 30 minutes later (peak dinner service, +80 guests)?"
   - Show: accountability complexity +32%, coordination time +45 seconds, 3 additional staff required
   
   Scenario C — "What if the detection system was offline?"
   - Show: reverts to the "Without CrisisOS" timeline
   
   Each scenario has a "RUN SIMULATION" button that briefly animates the floor map to show the alternate state. The key insight: "CrisisOS adapts the response plan in real time to any configuration. These results are computed by our predictive engine."
   
   Present as cards with a graph showing projected outcomes for each scenario vs the baseline.

3. Add a "DRILL MODE" toggle in the settings:
   When active, a banner shows "DRILL MODE — FOR TRAINING PURPOSES ONLY". All the same systems run but no external services are actually called. This is how the system would be used for staff training drills in real deployment.

4. Create src/components/PostIncident/PostIncidentReport.jsx:
   After simulation completes, auto-generate a summary report card:
   - Incident summary paragraph
   - Key metrics table  
   - What went well (3 bullet points)
   - Protocol gaps identified (2 bullet points, e.g. "Stairwell B signage should be improved based on confusion detected at T+0:45")
   - Recommended training focus areas
   - This report would feed back into improving future response — show a "SYNC TO TRAINING DATABASE" button
   
   This proves the post-incident learning loop.