# FACTION PLAYBOOK — THE IRONCLAD LEGION ⬢
_Mech/armor doctrine · str 9 · base ~22km SE of HQ · offer: military_
_Status: mechanics beta-tested v0.4.3 — every number below is measured, not aspirational._
_This file is the design spec for the faction AND the knowledge base for its future adaptive director
(and the literal system-prompt if an LLM commander is ever wired into a dev build)._

## IDENTITY
The Legion does one thing: it walks a **column of armor** at your wall and grinds through it. No
subtlety, no economy games — pressure you can see coming for a quarter of an hour and must still
answer. Ironclad tests whether the defense you built is real.

Voice: procedural, unhurried. "Schedule the breach."

## FORCE (threat 1 measured)
- Wave: **10 = 5 BREAKERS + 5 ASSAULT** (45% armor, n = 4 + str·0.6 + sector·0.4).
- Breaker: **414.7 hp · 35 px/s · 35.6 dmg · dr 0.45** — shrugs 45% of every hit (verified: a
  100-dmg round removes 55).
- Assault: 172.8 hp · 51.5 px/s · 23.8 dmg · no armor.

## TACTICS (as the sim actually plays them)
1. **The long telegraph** — muster toast + permanent minimap tracking, then a **12–15 minute**
   cross-map column march (the march IS the raid cooldown; one wave afield at a time).
2. **Column cohesion** (beta fix): escorts pace their armor while a living breaker is within 700px —
   measured 24–26 px/s *together*. The Legion arrives as ONE fist, not a trickle.
3. **The grind** — breakers claw gates/barricades at **49.8 hp/s each** (35.6 dmg / 0.7s swing) and
   assault the HQ at ~47.5 dps each on arrival. Assault troops claw at ~34 hp/s alongside.
4. **Armor lost → escorts sprint** — cohesion releases (+40%, measured 34 px/s) and the light wave
   presses the attack. Killing the armor first is a real choice, not a free win.
5. Navigation is honest walking (zNav boundary tracing) — open pad slots and gates funnel it exactly
   like the horde; it does not teleport or cheat through terrain.

## FACTION LAW COMPLIANCE (what it may act on)
- OBSERVES: where the column took fire; which wall section stopped it; what killed its breakers.
- INFERS: which approach was thin (few turret deaths = soft side).
- REMEMBERS (dossier, planned step 3): your wall's historically weak octant, gate levels it broke.
- EXPLOITS: the side it saw thin. (Director, step 4: pick the approach vector by observed defense density.)
- TELEGRAPHS: the muster toast + a quarter-hour of visible column on the minimap. No un-warned punish.

## COUNTERPLAY (verified in beta)
- **Time is the gift**: 12–15 minutes of warning — reinforce the threatened side, stage the squad,
  intercept afield, or raise the gate the column is marching at.
- **dr 0.45 math**: high single-hit weapons stay efficient (a .50 still lands 46+); low-caliber
  spray is nearly halved. Tesla knockdown/stagger and HE overpressure (physics Δv) ignore nothing.
- **Two valid kill orders**: shred the fragile escorts first and kite the slow armor, or focus the
  breakers and accept a fast light wave. Both were played in beta; neither is dominant.
- **Physics**: tanks/mechs bulldoze and momentum-fell breakers like anything else that weighs 80kg.

## DIRECTOR HOOKS (step 4 — smarter, never stronger)
Signals to read: per-octant turret/platform density its raiders experienced · which gate held ·
casualty attribution (turrets vs units vs hero). Dials it may move: approach vector, breaker/assault
ratio (±15%), regroup-before-assault behavior. Dials it may NEVER move: stats, dr, wave size beyond
the str/sector formula (player-gated difficulty law).

## COMMANDER VOICE (step 5 guidelines)
Taunts reference REAL observations only ("Your east wall spent its shells on my shields.").
Tone: siege engineer reading a checklist; treats your defenses as a schedule, not a threat.
