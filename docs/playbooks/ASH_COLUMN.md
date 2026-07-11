# FACTION PLAYBOOK — THE ASH COLUMN ▲
_Guerrilla doctrine · str 5 · base ~12.2km N of HQ (a close neighbor) · offer: intel_
_Status: mechanics beta-tested v0.4.3 — every number below is measured, not aspirational._
_This file is the design spec for the faction AND the knowledge base for its future adaptive director
(and the literal system-prompt if an LLM commander is ever wired into a dev build)._

## IDENTITY
Ash never fights your wall. Ash fights your **economy** — the crews and routes you leave exposed in
the open field. A colony that never leaves its walls never loses to Ash; it starves instead. That is
the extortion: your field operation is the target, and you must run one.

Voice: patient, contemptuous of fortifications. "Walls keep men, not wealth."

## FORCE (threat 1 measured)
- Wave: **7/7 SKIRMISHERS** (n = 4 + str·0.6 + sector·0.4).
- Skirmisher: **67 hp · 68.3 px/s (×1.5) · 12.3 dmg** (18.5/swing vs crews, 0.5s cadence) · no armor.
- Scales linearly with threat/sector like everything else (player-gated difficulty law).

## TACTICS (as the sim actually plays them)
1. **March** — musters at the base (toast + red minimap tracking from the first step; raidCd means
   one wave afield at a time). ~4–6 min approach depending on terrain.
2. **Hunt** — acquires gatherers/runners only inside a **2,400px intel bubble** (Faction Law: it
   hunts what the sweep can see, never map-wide). A fleeing foot crew is run down at ~22–32 px/s
   net — caught in ~20–30s. Vehicle crews generally outrun it.
3. **Rob the route** — no prey in sight → nearest **WORKED** salvage node (your operation's smoke
   is visible for miles; idle nodes hold nothing). Pillage = −3 scrap −3 raw per swing, floats + pings.
4. **Withdraw sated** — smash-and-grab ledger (kill 10 pts, node swing 1 pt); at ≥8× live raiders
   the whole raid breaks off ("⌖ ASH COLUMN WITHDRAWS — SATED"), jogs home at 75 px/s, despawns at
   its base. Ash raids are bounded robberies, not sieges.
5. **Never claws** — verified zero damage to gates/barricades; blocked skirmishers trace around.
   With nothing to rob it drifts to your perimeter and mills — turret food, by design.

## FACTION LAW COMPLIANCE (what it may act on)
- OBSERVES: crews/escorts inside its 2,400px sweep; which of its raiders die, and to what.
- INFERS: that a colony with worked nodes has routes worth robbing.
- REMEMBERS (dossier, planned step 3): your escort habit, lockdown discipline, response time.
- EXPLOITS: the field you leave exposed. (Director, step 4: bias waves toward the node you defend least.)
- TELEGRAPHS: muster toast + always-on minimap tracking + pillage floats — you always get the warning.

## COUNTERPLAY (verified in beta)
- **LOCKDOWN / going to ground breaks the track** — a hidden crew (`hid`) is unseeable; an acquired
  target that hides drops the hunt. Lockdown is THE Ash counter.
- **Runners & escorts** fight back at the crew's side; **vehicles outrun** skirmishers.
- **Fragile raiders** (67 hp, no dr): any interception afield or perimeter guns end the raid early.
- **Do nothing** and the raid still ends — but it leaves with your scrap, raw, and possibly crews.

## DIRECTOR HOOKS (step 4 — smarter, never stronger)
Signals to read: gatherer escort ratio · lockdown reaction time · which nodes are worked but undefended ·
where its raiders died last raid. Dials it may move: target-node choice, approach vector, withdraw
threshold (±25%), wave timing vs your shift patterns. Dials it may NEVER move: stats, wave size beyond
the str/sector formula (player-gated difficulty law).

## COMMANDER VOICE (step 5 guidelines)
Taunts reference REAL observations only ("Your diggers at the north field walk alone."). Never
meta-knowledge. Tone: quiet ledger-keeper of debts; treats raids as collections.
