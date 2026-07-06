# Systemic Survival v2 — project notes

Main file: `Systemic Survival v2.dc.html` (v1 logistics build kept as backup).

## Read this first - current snapshot

This file is both a current build bible and a chronological build log. The sections below
this snapshot are historical notes from many build packages; older `NEXT`, `QUEUED`, and
`STILL QUEUED` lines may be superseded by later `DONE` sections. Treat this snapshot as the
current routing map before making changes.

### Current package
- Folder: `Systemic Survival`
- Main artifact: `Systemic Survival v2.dc.html`
- Runtime: `support.js`
- Offline runtime assets: `vendor/react.production.min.js` and `vendor/react-dom.production.min.js`
- Game icon: `assets/systemic-survival-icon.png` source and `assets/systemic-survival-icon.ico`
  Windows icon.
- Windows wrapper: `electron/main.js`
- Game-update transplant: `electron/sync-game.js` (payload-only sync + offline scrub; see PACKAGING.md)
- Sendable build: `dist/Systemic-Survival-0.1.0-portable.exe`
- Fallback build: `dist/Systemic-Survival-0.1.0-win-unpacked.zip`
- Save key: `ss_outpost_v6`
- Current architecture: one exported Design Component HTML file plus generated DC runtime,
  with an Electron shell for offline/no-server play.

### Current build state
- Playable horizon-camera outpost survival sim with a 24000 x 13500 world, canvas rendering,
  perspective/mode-7 ground, 3D extruded buildings, billboarded entities, and tower platforms.
- Core loop: defend HQ, gather RAW, refine RAW to MATERIEL through WORKSHOP/cultivators,
  grow civilians, build on typed plots, expand/reclaim sectors, and manually raise threat.
- Economy: RAW, MATERIEL, ALLOY, FOOD, WOOL, CLOTHING, MILK, MEAT, DAIRY, AMMO, horses,
  storage caps, warehouses, trading post, and surplus-gated refinery/ammo production.
- Civilians: homes set pop cap; civilians eat, grow, starve, flee, die, farm/hunt/ranch,
  cultivate, gather, repair, haul construction materiel, and run ammo to turrets.
- Defense/combat: Main Operator, operators, gatherers, runners, technicians, squads,
  specialists, mechs, tanks, branches, vehicles, helicopters, A-10 runs, turrets, gates,
  towers, barricades, med bays, and Command Council automation.
- Latest packages: raised TOWER PLATFORMS T1-T5 with occupant perks; AIRFIELD (HANGAR gates the
  A-10, AVIONICS SHOP discounts helis 30% and unlocks the APACHE); NAVY naval bombardment;
  NAT. GUARD barricade corps; per-vehicle loot parts (engine/plating/gun, auto-fit, persisted);
  RAGDOLLS + DISMEMBERMENT (verlet stick-skeletons on kills, overkill/range-based severing,
  ground blood stains — zombies + civilians; units keep DOWN state).
- Rendering foundation: stick figures + death ragdolls/dismemberment are in; remaining polish is
  living-unit limb detail and entity↔building occlusion.

### Active backlog
- Package/repo hygiene: keep the game, runtime, vendor files, and this bible together; avoid
  editing unrelated Desktop Watchman docs by accident.
- Offline packaging is built: React is vendored locally, Electron loads the game from disk,
  and the wrapper blocks external HTTP/HTTPS. Keep the local `vendor/` files.
- Deeper interior logistics, future slice: the RAW -> MATERIEL, ammo, construction, and repair
  loops are built. The remaining deeper chain is explicit hauling/processing for MATERIEL ->
  REFINERY -> ALLOY -> factory/bay equipment production.
- Visual polish: entity/building occlusion, minimap polish, extreme zoom/fog-wall polish,
  and remaining roughness from the horizon camera.
- Diablo hooks: per-vehicle parts are DONE (engine/plating/gun auto-fit from loot); deeper loot
  progression (set bonuses, rarity depth, vehicle part UI) still open.
- Offline fonts: drop Chakra Petch + IBM Plex Mono .woff2 into `vendor/fonts/` with a `fonts.css`;
  `electron/sync-game.js` auto-wires them into the helmet on the next sync.
- Combat visuals: DONE for the queued scope — death ragdolls + severing landed (see DONE section);
  living-unit jointed limbs and occlusion remain future polish.
- Balance pass: preserve the doctrine that capped systems use reachable polynomial costs and
  difficulty is player-gated by threat/sector, not runaway timers.

### Current doctrine
- No timers for core construction. The walk is the timer: civilians physically haul resources.
- Threat is player-gated. Spacebar/Raise Threat should matter.
- Capped systems must stay reachable. Use polynomial cost curves for capped build/upgrade caps.
- Keep the game alive and readable before adding breadth. New resources should be added
  methodically with caps, HUD, save/load, and at least one sink.

### Historical scan rules
- The top snapshot is canonical. The long build log below is useful evidence, but old
  `NEXT`, `QUEUED`, and `STILL QUEUED` lines are not automatically current work.
- Treat a queued item as current only if it is restated in `Active backlog`.
- Superseded queue examples: Branches, A-10, helicopters, day/night sieges, loot drops,
  interior plots, raw cultivation, food/population, ammo runs, repair hauling, trading post,
  milk/meat/dairy, workhorses, tower platforms, airfield hangar/avionics, navy/NG unique
  unlocks, and vehicle parts all have later `DONE` sections.
- Still-current rough edges: horizon-camera polish, occlusion/readability, and deeper
  MATERIEL -> ALLOY -> factory/bay logistics.

## Vision (north star)
One game blending: Tower Defense (Bloons), resource management (Anno 1800),
strategy (C&C Generals: Zero Hour), upgrades/replayability (Diablo), survival (Infection Free Zone).
Commercial-grade, performant, zero bloat. Balanced — nothing outpaces anything.

## Balance targets
- Difficulty is PLAYER-GATED: threat only rises via the Raise Threat button (Spacebar),
  and only after clearing a kill quota at the current level. Enemy stats scale linearly
  with threat so the power ratio stays flat (upgrades never trivialize, horde never outpaces).
- Economy: ~1 month to max everything at 3h/day active; ~6 months pure-idle.
  Upgrade cost curve is polynomial (not exponential) so caps are reachable.

## Built so far
Hero (WASD + hold-click), operators/squads→formations, mechs/tanks, Command Council
(veteran→commander, 5 automation chairs), endless research, med bay, perimeter wall
(expands, pad slots, gates Lv1-10 gated by HQ upgrade), turret types (gun/cryo/mortar/
tesla/railgun/sniper, Lv1-10), flow-field maze maps (random, always solvable),
Alloy production chain (Refinery: Materiel→Alloy, gates Mechs/Tanks).

## DONE — Gatherer Vehicles
Motor Pool research → assign HAULER/APC/GUN RIG per gatherer (costs Alloy). Distinct traits.
TODO later: per-vehicle equip slots (gear/guns/armor) = Diablo loot hook.

## AIRCRAFT (requested) — ALL aircraft gate behind the AIRFORCE BRANCH only
- Heli stat foundation (HELIS: cobra, apache) added & dormant in _statRaw — no way to obtain
  yet. Wire assignment ONLY after Airforce Branch exists. Apache = apex; Huey aids gatherers.
- A-10 gun runs = special field upgrade after Airforce Branch + research: strafes the OUTSIDE
  of the HQ perimeter, hits STRONGEST enemy every 20s; upgrade speed/gun-run; final adds BOMBS.
- ⇒ Build BRANCHES first (Airforce gateway), then wire all aircraft to it.

## Then queued
Branches (Navy/Air/Army/Marine/NG-CG) [prereq for A-10], loot/gear drops, day/night sieges.

## DONE this package
A-10 gun runs (Airforce + research, strafes strongest, bombs at high tier), helicopters
(5 attack: littlebird→apache + Huey gatherer, airborne over walls, Airforce-gated),
gatherer vehicles (hauler/apc/rig), Branches (Army→tanks, Marines→mechs, Airforce→aircraft,
Navy +dmg, NG +HQ), loot/gear drops (rarity tiers auto-equip to hero), day/night + sieges,
interior build spots (revealed by expand+HQ lv, typed turret/medbay). ALL plan items done.

## DONE — Massive map + CAMERA + UNIT DASHBOARD
Arena scaled 2200x1240 -> 12000x6750 (TS=40, 50,400 tiles). Hero (168px/s) crosses ~70s;
basic foot/gatherers (~46px/s) ~5 min -> the logistics pain that justifies vehicles.
CAMERA: world-space transform (cam{x,y}+zoom, default .82, wheel/Q-E zoom .45-1.7), follows
hero/selected unit, arrow-keys + middle-drag + minimap-click pan (pan breaks follow), clamped
to world. draw() culls walls/grid/zombies/units/bullets to viewport. Minimap (TACMAP) bottom-
right on canvas. PERF: replaced O(V^2) enemy Dijkstra with binary-heap (enemy field 17ms,
full genMap 58ms at 50k tiles). Zombies now ring-spawn just beyond viewport around HQ (not
world edges) so the siege stays coherent at any map scale. Save key bumped v3->v4 (old saves
were in old coords). Maze density (barriers/gaps/blobs) scales with map area.
DASHBOARD (C&C-style, bottom bar 'FIELD COMMAND'): filter ALL/COMBAT/GATHER/ARMOR/AIR, unit
cards (click=select+center, (.) =follow), box-select (Shift+drag), control groups 1-9
(Ctrl+N set / N recall, dbl-click chip to rename, auto-label by composition), follow toggle
(F: HERO->UNIT->FREE), HQ snap. Selection is inspect/camera/group only (units stay autonomous).

## DONE this package (camera follow-ups)
RUNNER unit: combat escort bound to one gatherer (u.guard=gathererId), bought from the gatherer's
inspector (scrap, one per gatherer), operator stats with dmg ×0.8. Shadows its gatherer by riding
the gatherer's OWN flow-field when far (threads the maze, no trailing) and hugging within ~34px;
fires at nearby zombies; falls back to bunker if its gatherer dies. Persists guard. Counts as
COMBAT in dashboard; own icon/color. LATER: Runner becomes the gatherer's driver/pilot once a
vehicle/heli is assigned.
ZOMBIES = plain walking dead: removed ALL types/mutations (brute/runner zombie gone) — one uniform
model, only a subtle ±8% gait jitter. Deadliness is RELENTLESS ACTIVITY HOMING: each corpse roams
toward the nearest activity (hero beacon ≤700px, any unit ≤540px / 620 if firing / mech-tank taunt
820px) and only streams to the HQ hub via the maze flow-field when nothing closer stirs — roaming
Bobbit-worm style. Makes field gatherers/hero into bait (justifies Runners/escorts).
PAUSE MENU: pausing now shows a PAUSED overlay with RESUME + RESTART (confirm). Unified both reset
buttons (game-over RE-DEPLOY + pause RESTART) into one hardened resetGame(confirmFirst): removeItem
save FIRST, wipe+init (fresh S/hero/hq/map, loadSave skipped under _wipe), explicitly clear all
transient view/selection/tool/group state, then overwrite storage clean. Verified no carryover
across dirty→reset→reload.

## DONE this package (QoL + fixes)
WALL-CLIP FIX: collision was center-point only (isWallPx), so ~6px of body clipped into walls/
corners. Added radius-aware isBlockedPx(x,y,rad) (center + 4 cardinal offsets) used by fieldMove,
moveAvoid, hero, civilians. Added unstickLocal() safety net (relocate any center-in-wall entity to
nearest open tile LOCALLY, not HQ) throttled every 1.5s in update().
TOGGLEABLE HUD: per-panel collapse chevrons on BARRACKS/RESEARCH/PERIMETER (body wrapped in sc-if,
header keeps a button) + master HUD button in top bar (hides all three + collapses FIELD
COMMAND). State in S.panels{barracks,research,perimeter}+dashOpen, persisted in save/load.
BARRICADES: now a 3-square (3×22px) wall SEGMENT with orientation o:'h'|'v'; ROTATE with R while the
barricade tool is active (ghost shows oriented green/red preview). Build CAP = 8 + expand*4 +
(hqLevel-1)*4, shown as N/CAP in the button. AABB collision via barHalf/barrierBlocks (h:33×11,
v:11×33) in zombie + moveAvoid paths; footprint check blocks overlap/walls. Save stores o (old r
dropped; old saves default 'h').

## NEXT (requested) — CIVILIAN INTERIOR LOGISTICS (the inner economy)
Civilians become the INNER supply chain (gatherers stay the OUTER raw-haulers). HOLD — user wants to
PLAN this together before building. Chain:
- Gatherers bring RAW material from outside nodes -> drop at HQ/stockpile.
- Civilians CULTIVATE raw -> usable MATERIEL (currently materiel is direct from gatherers; split it).
- Civilians HAUL materiel -> REFINERY -> processed into ALLOY.
- ALLOY hauled -> the respective FACTORY/bay -> produces the tool/equipment/asset being built.
- Civilians FARM FOOD (their own upkeep / pop sustain).
- Civilians MAKE AMMO -> deliver to operators in TOWERS + restock TURRETS.
- Civilians HAUL materiel to maintain/REPAIR WALLS (while gatherers resupply raw from outside).
Implies new stocks (RAW, FOOD, AMMO) + civilian JOBS (porter/cultivator/farmer/ammo/wall) with
pickup->carry->deposit state machines between interior buildings near HQ. Needs HUD for new
stocks + civilian assignment UI. Big balance pass. Build as its own focused package.

## DONE — Civilians
Pop (farmers/gatherers): cap = SCALE (expand+HQ+sector), NOT a gate; grows on a scale-driven
interval (independent of pop); flee zombies, die on contact; farmers add scrap+materiel. HUD POP.

## QUEUED — Realistic combat visuals (requested, future)
Character models will have LIMBS and RAGDOLL on death based on how they die. Gun + range
determine severing: limbs can be shot off (high dmg / close range = more dismemberment).
Aiming for realistic physics. (Big rendering rework — current entities are simple shapes;
needs a limb/skeleton model + ragdoll physics layer before this lands.)

## DONE this package (seeds on plots + BALANCE PASS)
SEEDS OBEY PLOTS: seedHomes + the seeded workshop snap to nearest free home/industry plots
(nearestFreeSpot, unlimited radius; fallback to old free positions if plots missing). genBuildSpots
innermost ring uses a guaranteed type queue [home,home,industry,home,storage,industry] so the
starter layout is always legal.
POLYNOMIAL COSTS (doctrine: caps reachable — converted every CAPPED exponential curve):
homeCost 60+8n² (was 1.2^n), warehouseCost 40+4n² (1.22^n), medbayCost 50+10n² (1.4^n),
turretCost 260+70n² (1.5^n — 57× at #10!), turretUpgradeCost def×120×(1+0.35l²) (1.55^l),
gateCost 70×(1+0.35l²) (1.5^l). Left exponential ON PURPOSE (uncapped soft-cap sinks): unit
hires/mech/tank/hero gun/att, cmd chairs, endless research, expand(cap4)/HQ(cap2) few-step.
ECONOMY FLOW GATES: refinery converts only above 60% mat stock (surplus), ammo depot crafts only
above a 25% mat floor — neither can starve construction/repair anymore. Gatherer UNIT deposits
×2 raw per load (RAW is bulk salvage) so 2:1 cultivation lands at parity with the old direct-mat
income; civ gatherers already at 0.16 raw/s (2.6× old 0.06 mat/s).

## DONE this package (EXPANSION BUILD SPOTS — full plot system, plan locked with user)
STRICT Anno-style plots: ALL placement (homes/warehouses/medbays/free turrets/BLDS structures)
now requires a matching typed interior PLOT — free placement removed (barricades + wall pads
exempt). genBuildSpots rewritten: concentric rings (rad 2.4 → R-1.4, step 2 tiles), seeded LCG
(this._spotSeed; re-rolled in genMap = per-map procedural, kept across doExpand so EXPAND only
ADDS rings), weighted type mix home3/storage2/industry3/medbay1/turret2, 44px min spacing.
TYPE reveal by HQ LEVEL (spotTier: home/storage/industry 1, medbay/turret 2; HQ max lv2) — locked
plots hidden, fade in via sp._a when unlocked. Build fns (buildHome/buildBld/buildMedbay/
buildWarehouse/buildTurret) snap to nearestFreeSpot(type, 40px) or refuse w/ toast; ghosts snap +
red when off-plot; matching plots light up while a tool is armed. spotOccupied covers turrets/
medbays/homes/warehouses/blds/sites (22px). Plot inspector: per-type stake/build buttons (industry
plots say pick a structure tool). buildOnSpot handles home/storage too. Tips + HQ-upgrade
milestone updated. Seeded HQ-side workshop/homes stay off-plot (grandfathered).

## BRANCH → UNIT/ASSET MAPPING (requested)
- AIRFORCE branch → ALL aircraft (helicopters: Cobra/Apache, Huey for gatherers; A-10 gun runs).
- ARMY branch → Tanks (currently buildable directly; move behind Army branch when Branches land).
- MARINES branch → Mechs (currently buildable directly; move behind Marines branch).
- Navy, NG/CG → TBD unique unlocks.
- When Branches are built: gate Tank deploy behind Army, Mech deploy behind Marines, aircraft behind Airforce.

## DONE this package (Slice 1: capped economy + Hero patrol)
CAPPED STORAGE: materiel & alloy now obey caps (scrap stays uncapped currency). resCap(res)=RESBASE
(materials 1000 / alloy 200 at HQ) + sum of warehouse contributions. clampStorage() each frame +
on load; gatherer deposit only fills up to cap (excess held, u.waitFull) so nothing is wasted;
refinery won't convert into a full alloy store. STORABLE=['materials','alloy'] (more added as coded).
WAREHOUSES (Anno-style, max 20): placed building (free placement via tool + ghost). Inspector: pick
stored resource via icons (MATERIEL/ALLOY), set HOLD CAP 25/50/75/100% (w.fillCap), ENLARGE through
5 sizes (WSIZES 250/1000/2500/5000/7500), REMOVE. Top bar shows current/cap (matStr/alloyStr).
Saved as {res,size,fillCap}. Barracks body now scrolls (max-height) to fit the new buttons.
HERO 'GO ON PATROL' (idle autopilot): h.patrol toggled from Barracks. AI guards the perimeter band
(ringR*TS+150 around HQ), chases & shoots the closest zombie there, orbits the wall when clear,
falls back to HQ to regen when hurt/strayed, never wanders far. WASD instantly reclaims control. Not
invincible (no request for that) — strong existing regen keeps it alive at the wall.
PATROL v2: now circles the EXTERIOR of the wall (orbitR = wallR + 0.85*TS, wallR = ringR*TS), only
engages zombies in the outer band [wallR-34 .. wallR+175] (ignores interior breaches — defenders'
job), and if it starts inside it routes out through the nearest pad opening first. HERO MELEE: any
zombie within 28px triggers a melee swing (st.dmg*1.5, ~32px cleave + knockback, 0.4s cd) instead of
shooting — fixes point-blank zombies you couldn't shoot without moving. Applies in manual + patrol
(h.mcd cooldown).
PATROL v3 (wall nav): a circle can't track a SQUARE wall (it cuts the corners), so patrol now follows
waypoints sampled directly on the wall's exterior at a constant CHEBYSHEV distance ((ringR+1.5)*TS),
24 points kept only where isBlockedPx is clear \u2014 a square loop that hugs the outside without dipping
in (verified steady radius 219-295, wall at 160) or wedging. genMap clears a wider band (R-1..R+2) so
that annulus is walkable. Targets the zombie CLOSEST TO HQ (biggest base threat), not closest to hero.

## DONE this package (Attack Squads + nav robustness)
ATTACK SQUAD (breaks C&C direct control): S.attackSquad{ids,mode}. Field Command: select units \u2192
"+ SQUAD" adds them, "HUNT/RECALL" toggles. On HUNT they leave base as a CONVOY and roam toward the
densest ZOMBIE activity (computeSquadTarget = coarse 700px bucket centroid of the largest cluster,
refreshed ~1s), navigating by a flow-field to that tile (this.squadField, trap-free), attacking any
zombie in view; convoy cohesion pulls stragglers to the squad centroid; badly hurt members peel to a
med bay. RECALL/idle \u2192 normal leashed behavior. Persisted in save/load. Excludes gatherers/techs/runners.
NAV ROBUSTNESS (fixes units wedging in wall corners): moveAvoid now tries 12 angles incl. backward,
and \u2014 critically \u2014 when a unit is ALREADY wall-jammed (isBlockedPx(7) true, e.g. pressed into a corner)
it relaxes to CENTER-ONLY collision (isWallPx) so it can peel off; final fallback follows flowHQ out
(center-only). Verified a corner-jammed operator frees itself (+322px). Same moveAvoid powers squad +
operators + runners, so none trap themselves now.

## DONE this package (wall subsystem fixes)
TOWER SELECT: a garrisoned operator (u.inTower) is now SKIPPED in the click-pick loop, so clicking a
manned tower selects the TURRET (upgrade UI) instead of the operator sitting on it.
PATROL vs SQUARE WALL: target-band test switched from Euclidean to CHEBYSHEV (max axis) — a Euclidean
radius inflates the square wall's corners ~1.41× and let true-interior zombies pass the filter, which
froze the patrol. Now interior breaches are excluded (defenders' job). ANTI-FREEZE: when engaging but
no waypoint has clear LOS, the hero ORBITS toward the threat's bearing (advances waypoints) instead of
freezing — verified interior-only zombie ⇒ keeps patrolling 160/160 frames; exterior ⇒ stops & fires.
EXPAND ≠ REGEN: doExpand now calls regrowPerimeter() (restores baseWall maze snapshot + re-stamps only
the ring) so EXPANDING the wall no longer regenerates the environment — only ADVANCE THE FRONT does.
genMap snapshots this.baseWall (bare maze, pre-ring). Verified maze + nodes identical across expand.
TRAPPED ZOMBIES: ejectZombiesFromWalls() relocates any zombie a freshly-built ring caught inside a wall
tile to the nearest open tile; called in doExpand + advance.
CLEAR COMPOUND: stampPerimeter now clears the ENTIRE interior (Chebyshev ≤ R+2), not just a band — no
maze barriers inside the perimeter wall (the walled compound is open buildable space). Map isn't
persisted, so this applies on next load/reset/expand. Verified 0 wall tiles inside the ring.

## DONE this package (Slice 2 spine: FOOD + POPULATION + HOMES)
FOOD is now a capped STORABLE (STORABLE=['materials','alloy','food'], RESBASE.food=200) — warehouse-
storable + HUD FOOD chip. resName/resColor handle 'food' (#9ad06b).
HOMES = placed buildings that set the POP CAP. 4 tiers (HOME_TIERS caps 2/3/5/8), start with 3 (seedHomes,
just inside the ring), build up to HOMES_MAX=30 via the BUILD HOME tool (free placement + ghost, like
warehouses). popCap()=Σ home caps; civCap() now returns popCap(). Home inspector: upgrade tier / remove.
ECONOMY: FARMERS produce food (civFarmRate 0.14/s ea), whole POP consumes (foodPerCap 0.05/s). Pop grows
toward popCap only while FED; STARVATION (no stock AND production<demand) pops a civ every 4s toward what
food supports. assignCivJobs() auto-balances farmers↔gatherers by food need each 1s (pushes harder to farm
when food<15%). Gatherers feed MATERIEL/scrap (respect cap); farmers feed FOOD. workhorseMult()=1 stub for
the WORKHORSE buff (Slice 2c). Civs drawn by job color (farm green / gather blue). Persisted: food, homes,
civ count (jobs re-balance on load). Verified: seed 3/cap 6, growth when fed, 3:2 farmer:gather balance,
build home raises cap 6→8, starvation drops 5→1 under genuine shortage.
NEXT in Slice 2: producer VARIETY (hunters/ranchers) → 2c derived goods (wool→clothing need, milk,
workhorse) → 2d adaptive workers.

## DONE this package (Slice 2: producer variety + workhorse)
Civ jobs now FARM / HUNT / RANCH (producers, all feed FOOD) + GATHER (materiel). isProducerJob() +
civJobRate(j) (farm .14 / hunt .16 / ranch .13 per sec). assignCivJobs() sizes producers to food demand
then spreads them evenly across the 3 producer jobs for variety (thirds); the rest gather. HUNTERS roam a
wider radius (60 vs 22) at higher speed = flavor + exposure. WORKHORSE is an emergent buff for now:
workhorseMult()=1+min(.3, ranchers×.06) boosts FARM+RANCH output (the full rancher→horse→workhorse entity
+ WOOL/MILK goods come in 2c). Civs drawn by job color (farm green / hunt amber / ranch tan / gather blue).
POP HUD chip has a title tooltip with the live role breakdown + workhorse mult. Verified: pop 6 spreads
2 farm/1 hunt/1 ranch/2 gather, workhorse ×1.06 with 1 rancher, food stable.

## DONE this package (Slice 2d: adaptive workers)
A worker whose OWN output is capped keeps its job but lends a hand to the other active job, returning the
instant its own work frees up. Each frame in updateCivilians: foodHi/foodLo + matHi/matLo thresholds (98%/
85% hysteresis so it doesn't flicker at the cap). Producers set c.assist='gather' when FOOD is topped off
(and materiel has room), clear it when food dips <85% or materiel tops off; gatherers set c.assist='farm'
symmetrically. farmOut + gatherCivs use the EFFECTIVE job (c.assist||c.job). assist is transient (recomputed
each frame, not saved). Verified: food full ⇒ 4 producers lend to gather (all 6 effectively gathering); food
<85% ⇒ all return to farm; materiel full + food low ⇒ gatherers lend to farm.

## NEXT (requested) — CIVILIAN FOOD + POPULATION (Slice 2, plan locked)
Locked decisions: pop capped by HOMES (build up to 30; food shortage starves toward what you can feed)
— reconcile earlier 'homes max 10'. Adaptive workers: a worker whose job stalls (output full / input
empty) keeps its assigned job but leaves to assist the nearest active job, returns fast when its own
work is possible again. Repair = COMBAT damage only, no idle decay yet. Production buildings = HYBRID
(research unlocks ability, building enables/scales output). Camera rescale DEFERRED (beta milestone,
after lighting + character models). Food tracking + building placement: user wants OPTIONS prototyped.
Producers (auto-assigned): FARMERS (wheat/potato/apple), HUNTERS (deer/rabbit), RANCHERS (sheep→WOOL
→clothing[a civ NEED]; cow→MEAT via slaughterhouse + MILK→cooking/butter/cheese; horse→WORKHORSE
→+speed/efficiency/quality for farmers&ranchers). Trading system later.

## QUEUED BUILDINGS (from spec, after food)
Shop=vehicle repair. Barn=building build/repair. Vehicle Depot=builds ground vehicles (the FIRST/MAIN
depot has the FIX-IT crew = builds AND repairs; afterward Build & Repair are separate). Airfield:
Hangar(store planes)/Helipad(store helis)/Workshop(build aircraft). Ammo Depot=munitions made+stored.
Comms Tower=reveals minimap. Homes=4 tiers, start 3, up to 30 (housing=pop cap).

## ON HOLD — deeper civilian interior chain (raw→materiel→alloy→factory, ammo→towers, wall repair)
User said MORE gatherable resources are coming; add each resource's cap as it's coded in (methodical,
no broken pieces). The full raw→materiel→alloy split + ammo/wall-repair loops come after food + buildings.

## DONE this package (perf pass)
SPATIAL HASH: zombies bucketed once per frame into 160px cells (buildZGrid/zNear/zAnyNear).
All hot proximity loops now query the grid instead of scanning every zombie: bullet hit tests
+ tesla chain + mortar splash, hero contact damage + melee scans (manual & patrol), civilian
flee scan, threatTarget (380px band; global-nearest fallback only when band empty), offense-
chair cluster count (was O(Z²)), dashboard unitStatus. Zombie→unit scan got a ±820px box
early-out. stat(u) cached per frame (u._stC/_stF, invalidated on manual upgrade). Grid cleared
in init(). FIXES: playerPower() NaN (g.shots never existed — dead code, fixed anyway);
gatherer supply lanes drew to HQ both ways (u.node legacy-null) — now use resNodes[u.nodeIdx].

## DONE this package (Slice 2c + spec buildings + civilian-hauled construction)
STRUCTURES (S.blds, shared tool/pick/inspector pipeline, BLDS table): TAILOR (WOOL→CLOTHING),
BARN (repair crew: auto-repairs nearest damaged structure ≤300px, 6hp/s, rescans 0.8s),
COMMS TOWER (TACMAP hostile feed; without it minimap shows only viewport zombies + 'NO FEED'),
VEHICLE DEPOT (REQUIRED for gatherer vehicles + fix-it aura repairs vehicle'd units ≤320px),
HELIPAD (REQUIRED for helis + rearm aura). Costs escalate ×1.35 per copy. BLDS_MAX 24.
GOODS CHAIN (Slice 2c partial): ranchers shear WOOL (0.09/s ea, workhorse-boosted) → TAILOR weaves
CLOTHING (0.15/s per tailor) → pop consumes 0.008/civ/s; CLOTHED = growth interval ×0.65 (soft need,
never lethal). WOOL+CLOTHING are STORABLE (caps 100/120, warehouse-storable). HUD WOOL·CLOTH chip.
STILL QUEUED from 2c: milk/butter/cheese, meat/slaughterhouse, workhorse entity, trading.
CONSTRUCTION = LOGISTICS, NO TIMERS (user doctrine: never put the player on a clock for core
functions): placed builds (structures/homes/warehouses/medbays/free turrets) stake a SITE
(S.sites {kind,sub,x,y,cost,got,crew}); civilians assigned as PORTERS haul materiel HQ→site
(civCarry 8/trip, deducted from stock at pickup, refunded on cancel/release); build completes when
got≥cost (completeSite spawns the real object). Crew size = trips = speed: site inspector has
−/+ CREW, ½ WAVE (2 trips), FULL WAVE (1 massive wave). crewSites() re-recruits each 1s (gather-job
civs first); porters skip production/assist; stall (no stock or no civs) just waits — no fail state.
Pad/spot/gate builds remain instant (fortification slots). Sites persisted in save.

## DONE this package (automation IQ pass)
PATROL v4 "situational awareness": target = DENSEST cluster in the perimeter band (packmates ≤110px
scored ×90, minus distance penalties; rescan 0.4s), not the closest corpse. Navigation WALKS THE LOOP
one waypoint at a time the shorter way around (never beelines across the compound — the old wall-shove).
Firing position = LOS waypoint costing fewest loop steps; once in position with clear LOS it HOLDS and
fires. KITES like a player: zombie ≤44px → backpedal (away+outward blend) while firing. TURRET DOCTRINE
(rescan 0.25s, cached target): MORTAR/TESLA → densest pack; RAILGUN/SNIPER → toughest (maxhp); GUN/CRYO
→ nearest. TOWER MANNING threat-aware: claimTower scores pads by padPressure (zombies ≤480px ×60 − walk
dist ×0.25); operators re-evaluate every ~3-5s and rotate to a pad with ≥3 more pressure. Defense chair
no longer toast-spams 'NEEDS MARINES' on legacy saves (branch check added).

## DONE this package (Ammo Depot + munitions logistics)
AMMO DEPOT structure (BLDS.ammo, 140 MAT base): crafts AMMO from materiel (0.5/s, 2 MAT : 1 AMMO),
AMMO is STORABLE (cap 150, warehouse-storable, HUD chip w/ tooltip). Turrets carry a magazine t.mag
(start 20, cap 60, −0.15/shot); ONLY once an ammo depot exists: stocked mag = rof ×1.2, dry = ×0.55
(scavenged rounds — never a hard stop, no timers). AMMO RUNS: assignAmmoRuns (1s) — turret mag <25 →
a free civ (not porter/fleeing) picks 20 rounds at nearest depot, sprints them out (amber runner,
'▮ RESTOCK' float); turret draws a mag bar / '▮ DRY' when the depot system is active. Tower-manning
operators get +15% dmg while global ammo > 0. Runners excluded from production + porter pools; loads
refunded if turret/depot vanish. mag persisted in save. Bible: 'Shop' (vehicle repair) is covered by
VEHICLE DEPOT fix-it aura. STILL QUEUED: milk/butter/cheese + slaughterhouse (2c), workhorse entity,
trading, raw→materiel cultivation split. (Wall/structure-repair hauling DONE — see WORKFORCE package.)

## DONE this package (RAW→MATERIEL cultivation split — plan locked with user — 2c COMPLETE)
HARD SPLIT, 2 RAW → 1 MAT, fresh start (SAVE v5→v6). New stock RAW (base cap 400, warehouse-
storable, tan #c9a06b, HUD chip): ALL outside income is now RAW — gatherer units/vehicles deposit
RAW at HQ (waitFull vs raw cap), civ gatherers feed RAW 0.16/s ea (fast; bottleneck = supply).
WORKSHOP (BLDS.workshop, 100 MAT): local bench buffer b.raw (cap 40, persisted). CULTIVATE job
(materiel-blue civs; gather recolored tan): auto splits duties — bench <6 → porter runs (HQ→bench,
civCarry 8), stocked → work it 0.5 RAW/s → 0.25 MAT/s each (halts at mat cap). In AI allocator
(sized by raw backlog + mat shortfall, cap 35% pop, 0 without workshop/raw), pinnable like the
rest; assists to GATHER when nothing to work. Adaptive-assist thresholds rekeyed matHi→rawHi.
Everything SPENDING materiel unchanged (construction/ammo/repair/refinery/trades). Trading post
gained SELL 25 RAW → 10 SCRAP. Refinery research desc reworded. BOOTSTRAP: init seeds one
WORKSHOP beside the HQ (loadSave too, via same guard) — without it a fresh colony could never
afford the first one (all field income is RAW).

## DONE this package (TRADING POST)
TRADING POST (BLDS.trade, 160 MAT): player-driven exchange board in its inspector — no trader
ships/timers. this.TRADES rows: SELL wool/clothing/meat/dairy/food → SCRAP; BUY materiel/alloy/
food ← SCRAP, with a deliberate spread (round-tripping loses). doTrade guards stock + storage
caps (refuses when the bought resource wouldn't fit — nothing wasted); buttons grey out when
unaffordable. Goods finally have a sink; scrap is the pivot currency.

## DONE this package (Slice 2c goods + HERO DEFEND HQ)
GOODS: ranchers also give MILK (0.05/s ea, storable 100). New BLDS: SLAUGHTERHOUSE (ranch→MEAT
0.12/s scaled by ranchers; MEAT stocked = hearty meals, ALL producer output ×1.1, pop eats
0.006/civ/s), CREAMERY (2 MILK→1 DAIRY butter·cheese 0.10/s; DAIRY stocked = growth interval
×0.85, stacks w/ clothing ×0.65; eaten 0.005/civ/s), STABLE (stalls 2 WORKHORSES; ranchers breed
a foal ~45s + 8 FOOD while stalls free; workhorseMult = 1+0.10/horse cap ×1.5, replaces emergent
rancher fallback; horses drawn grazing around stables). MEAT·DAIRY HUD chip. milk/meat/dairy/
horses persisted. STILL QUEUED from 2c: raw→materiel cultivation split.
HERO DEFEND HQ (replaces glitchy waypoint patrol): no more wall-loop — targets the zombie
CLOSEST TO HQ within wallR+240 (Chebyshev), beelines at it (interior is open ground; wall
contact slides, wedge falls back HQ-ward), holds+fires at ≤250 w/ LOS, kites, drops unreachable
targets (no-LOS + unmoved >1.2s), idles at a ready spot beside HQ when clear. Same regen/melee/
down rules; WASD reclaims. Button now '⛨ DEFEND HQ'. h.patrol save field unchanged.
WALL AWARENESS (follow-up): when a wall blocks the straight line to the target, the hero follows
a flow-field to the target's tile (this.heroField via field(tc), recomputed only on target tile
change, cleared when idle) — threads pad openings/maze to a firing position; clear-LOS goals stay
beeline. Unreachable guard retained as backstop.

## DONE this package (need-driven WORKFORCE + user pins + REPAIR crews)
LABOR ALLOCATOR: assignCivJobs rewritten — AI computes per-job demand each 1s (producers sized to
feed the pop w/ low-food surge, REPAIR sized from damaged-structure missing HP, remainder GATHER)
and fills AUTO jobs by need with minimal churn (only surplus civs move). USER PINS take precedence:
S.labor{farm,hunt,ranch,gather,repair} null=AUTO, number=pinned headcount. WORKFORCE section in
BARRACKS panel: per-job row (live count, −/+ to pin, AI/PIN chip to release); pinned rows amber.
Persisted in save. Overflow past an all-pinned board falls to gather.
REPAIR job (new, cyan civs): haul MAT HQ→damaged structure (gates/barricades/turrets/medbays/
warehouses/homes/blds via cached dmgStructs()), mend on site 1 MAT = 3 HP at 9 HP/s — the queued
wall-repair hauling. Auto only when damage exists + MAT≥4, capped at 25% of pop; idle repairers
adaptive-assist to GATHER. Ammo runs now prefer gatherers and never pull repair crews first.

## DONE this package (STICK FIGURES — rendering foundation, pre-ragdoll)
Shared limbed renderer: stickPose(e,H) derives walk phase/facing/move-blend from frame-to-frame
position deltas (state in _ph/_mv/_fc/_sx/_sy; d clamped vs teleport/knockback; armed units face
aim, others face travel) — zero changes to update logic. drawStick(ctx,o): billboard side-view
sticks + silhouette hints — 2-bone scissor legs, torso-mass ellipse (tilts with lean), head
(o.head = class-helmet color), zombie mode (hunched, groping desynced arms, eye dot, min mv .35
sway), carry mode (crate at chest), weapon = true top-down aim ray with both hands on it + muzzle
flash. World-space line widths (bodies scale with zoom); LOD: H×scale<6.5 → old blob. Wired:
zombies(15), hero(20, gold), operators/techs(14), runners(12.5), on-foot gatherers(13.5, carry),
civilians(11, job colors + carry). Kept iconic: vehicle'd gatherers, heli operators (cockpit
disc), mechs/tanks, dead units = collapsed lying stick placeholder. NEXT on this track: limbs as
jointed data + ragdoll/dismemberment (guns/range determine severing).

## DONE this package (PRECINCT CAMERA — rotating overhead perspective, "The Precinct" feel)
Sim stays 100% 2D; only rendering projects. Ground plane: screen = C + R(rot)·(w−cam)·zoom
(identity at rot=0 → click/aim math exact). Q/E HOLD-rotates (orbit, this.rot, transient);
zoom moved to wheel + '-'/'='. Height = radial splay from screen center (GTA2-style):
project(wx,wy,alt) m=1+alt·zoom/640. groundFrame(ctx) = rotated world transform; billboard(ctx,
wx,wy,alt) = upright frame anchored at projected pos where world coords still work (all entity
draw fns unchanged inside it). extrudeRect(...) = screen-space prism (4 side quads + roof).
WALLS extruded (ring h30 / maze h24), visible tiles bit-packed + sorted far→near from camera
(painter). BARRICADES extruded h12. Entities billboarded: zombies/units/civs/hero (+floats
upright); HELIS fly at alt 64 with ground-plane shadow; hero reticle/aim ray stays on ground
plane (split from body). Rotation-aware: evtPt inverse, panDrag delta, arrow pan, viewBounds
(AABB of rotated quad), WASD screen-relative (W=screen-up), zombie spawn ring uses hypot.
Runner tether + gatherer lanes moved to ground pass (billboard frames don't rotate). Night tint
now screen-space. KNOWN ROUGHNESS (queued): structure labels/art (HQ, turrets, homes, blds…)
still rotate with the ground — billboard their labels + extrude the buildings in the next
"3D buildings" package; entities draw over walls (no occlusion).

## DONE this package (3D BUILDINGS — extrusion + billboarded signage, Precinct pass 2)
extrudePoly (n-gon prism) + extrudeRect (delegates) + extrudeCirc (cylinder: base-arc→top-arc hull
+ roof disc) + dim(hex,f) darkener. Extruded: HOMES (h18+5/tier), WAREHOUSES (h20+3/size, fill
gauge moved to roof), BLDS structures (h28), HQ (hex tower h44, roof '#0e3a37'), BUNKER (h14),
GATES (h24 in pads loop), TURRETS (cylinders h15). All labels/icons/hp bars/gauges billboarded at
roof height (upright at any rotation); ground keeps: selection dashes, range rings, comms pulse,
barn _fix lines, medbay pad (stays flat — its circle IS the heal area, cross+label billboarded),
sites (flat foundations, text billboarded), SALVAGE node labels, horses (billboarded sprites).
AIM RAYS in billboard frames rotated into screen space (+this.rot): drawStick weapon/hands,
stickPose facing, mech/tank + heli-disc barrels, turret barrels. KNOWN ROUGHNESS: entities still
draw over roofs (no occlusion); build-spot glyphs + ghost previews still rotate with ground.

## DONE this package (HORIZON CAMERA — pitched mode-7 perspective, you can see the horizon)
Real perspective; sim + click math stay 100% 2D. Eye sits E=L·cosφ above / B=L·sinφ behind the
look-at (this.cam), pitch φ=50°, L=760, F=zoom·L, look-at at Cy=0.56·ch. calcProj() caches the
constants per frame. project(wx,wy,alt): yaw-rotate → (x,y); yv=−(y−B)cosφ+(alt−E)sinφ;
zv=−(y−B)sinφ−(alt−E)cosφ (clamp≥40); return {x:Cx+x·s, y:Cy−yv·s, s:F/zv, zv}. billboard()
scales by depth s (not zoom); extrudeCirc uses g.s/t.s radii. Horizon at Cy−F·cotφ.
GROUND = mode-7: drawGround() renders ALL flat content (floor/grid/border, flat pad slots, build
spots, node diamonds, gatherer lanes + runner tethers, site foundations, medbay pads, turret range
rings, HQ hp arc, comms pulse, barn _fix lines, bullets, fx, box-select, multi-sel rings, hero
reticle+aim ray, build ghosts) into an OFFSCREEN canvas in the rotated top-down frame at offZoom
(groundCanvas sizes it ≤~4200px). compositeGround() then draws it per device scanline: a=(Cy−sy)/F,
w=−E(sinφ+a·cosφ)/(cosφ−a·sinφ), yv=w+B, zv=−w·sinφ+E·cosφ, srcRow=(yv−yFar)·offZoom, srcW=cw·zv/F·
offZoom centered → 1px drawImage strips. draw() = phase1 ground→offscreen (this.scale=offZoom during
it), phase2 sky gradient + composite + fog band at the horizon, phase3 drawProps().
PHASE 3 drawProps(): all extruded structures (walls/gates/barricades/homes/warehouses/blds/horses/
bunker/HQ/turrets/site+medbay+salvage signage) collected as depth-tagged closures, sorted by
rotated-frame y (far→near), painted; THEN entities (zombies/units/civs/hero) in a second depth-sorted
pass, always above structures (entities-over-roofs still un-occluded — acceptable); floats on top.
Hero split: drawHeroGround (aim ray+reticle, flat) + drawHeroBody / drawHeroDown (billboarded).
INVERSES: evtPt full perspective un-project (a=(Cy−sy)/F, den=cosφ−a·sinφ clamp>0.02, then un-yaw) so
clicks/aim land where you SEE them; viewBounds = AABB of the perspective ground trapezoid far-clamped
at zv=3L (the fog wall). Old drawOLD_UNUSED body removed. KNOWN ROUGHNESS: no entity↔building
occlusion; minimap unchanged; extreme zoom-out can show the far fog wall.

## DONE this package (TOWER PLATFORMS — raised, upgradable wall slots)
Every open wall pad is a raised gold PLATFORM prism (T1) drawn in drawProps (footprint TS−6, height
8+6·tier, T3+ gets a second smaller deck +5); garrisoned operators BILLBOARD at towerAlt(idx) so they
stand ON the deck; sign shows T#/name or MANNED. Tiers T1-T5 (PLATFORM/SANDBAGS/WATCHTOWER/BASTION/
CITADEL), S.padTiers {padIdx:tier} persisted (default 1; kept across expand by ordinal — acceptable).
Costs polynomial: towerCost(t)=60·(1+0.45·(t−1)²) MAT (87/168/303/492). OCCUPANT PERKS (stack): range
mult 1.65+0.12/tier-above-1 (was flat 1.65), dmg ×(1+0.10·(t−1)) in fire(), T3+ self-repair 2·(t−2)
hp/s while garrisoned, T5 shots pierce +1. Pad inspector: RAISE TOWER upgrade card (ins.upgrades) +
tier in role line + perks as hpStr; gate/turret options unchanged (gate pads have no platform).

## DONE this package (AIRFIELD + NAVY/NG UNLOCKS + VEHICLE GEAR — three bible items)
AIRFIELD: BLDS.hangar (200 MAT) — REQUIRED for A-10 gun runs (update loop gated on hasBld('hangar');
buying A-10 research without one toasts 'BUILD A HANGAR TO FLY'; research desc updated). BLDS.avionics
(220 MAT) — heliCost ×0.7 and the APACHE is hidden from the heli list until it stands.
NAVY/NG UNIQUE UNLOCKS: NAVY = NAVAL BOMBARDMENT — every 25s (4s rescan when quiet) shells the densest
zombie cluster (computeSquadTarget n≥6) with 3× strike() + float; stacks with the +15% dmg passive.
NAT. GUARD = BARRICADE CORPS — barricadeCap +6 and new barricades built at 300 hp (vs 200); stacks with
+25% HQ. BRANCHES() unlock strings updated for the pick overlay.
VEHICLE GEAR (Diablo hook, per-vehicle equip slots): once any gatherer runs a vehicle, HALF of loot
drops roll a VEHICLE PART {engine|plating|gun} at the drop's rarity; it auto-fits the vehicle whose
slot is weakest, strictly-better-only (no churn), float '⚙ RARE ENGINE → GA-07'. Effects in _statRaw:
engine = spd ×(1+m) + cap ×(1+m/2); plating = hp ×(1+m) + dr +0.3m (cap 0.7); gun = rig/Huey
self-defense dmg ×(1+2m) via st.vgun. u.vgear persisted in save/load unit maps; gatherer inspector
role line lists fitted parts.

## EXE UPDATE CONTRACT
Game payload = `<x-dc>`…end of `data-dc-script` script block; the wrapper owns everything outside it.
`electron/sync-game.js <new.html> [support.js]` transplants a new payload without touching the wrapper
and validates against external script/link/import and file:// dependencies. INVARIANTS every game
update must keep (smoke-test hooks): canvas id `#ss-canvas`; visible 'SYSTEMIC' wordmark; no runtime dependency on external URLs;
bump the save key (ss_outpost_vN) on breaking save-schema changes. This package's support.js carries
the red-team local-first React loader (SRI on ./vendor files) — never regress it on runtime syncs.

## DONE this package (RAGDOLLS + DISMEMBERMENT — the last queued bible track)
Verlet stick-skeleton ragdolls in billboard-local space (origin = death anchor, ground at +H/2,
gravity 540, damp .985, 2 constraint iters, ground friction). spawnRagdoll(wx,wy,H,color,{dmg,
maxhp,fx,fy,fc,zombie}): 11 joints / 10 links matching drawStick anatomy; impulse follows the
killing shot's SCREEN direction (world angle + this.rot), torso topples hardest, up-kick scales
with overkill. DISMEMBERMENT per bible (gun + range determine severing): chance = min(.85,
overkill×.5 + point-blank bonus (<90px +.3, <200px +.1)); max severs 1/2/3 at overkill >0/1.6/3;
parts head/armL/armR/legL/legR = cut link → limb flies separately w/ extra impulse (severed head
= rolling dot). Ground blood stains = fx kind 'blood' (green zombies / red civs, r scales w/
overkill, 7-9s fade, drawn in the warped ground pass). Zombie kills (hurtZombie) + civilian
deaths (zombie contact) both spawn ragdolls; units keep DOWN state. Transient (this._rags, cap
42, life ~5-6.5s, fade-out final 1.2s, depth-sorted with entities as kind 5). NOT saved.

## Conventions
- Debug handle: temporarily add `window.__ss = this;` in componentDidMount for eval_js tests; REMOVE before delivery.
- str_replace edits to logic need a show_html reload (no hot-reload); dc_* edits hot-reload.
- After edits: reset save via `localStorage.setItem('ss_outpost_v3','null'); __ss.init(); __ss.save()`.
