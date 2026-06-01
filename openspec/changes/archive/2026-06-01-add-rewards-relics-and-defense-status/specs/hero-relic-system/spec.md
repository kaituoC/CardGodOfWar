## ADDED Requirements

### Requirement: Hero owns persistent relics
The hero/run state SHALL store persistent relic ownership across battles and saves.

#### Scenario: New hero starts without relics
- **WHEN** a new game starts
- **THEN** the hero MUST have an empty relic list

#### Scenario: Relic persists across next battle
- **WHEN** the hero selects a relic reward and starts the next level
- **THEN** the selected relic MUST remain present in the hero relic list

#### Scenario: Relic persists through save load
- **WHEN** a save containing hero relics is loaded
- **THEN** the restored hero MUST contain the same relic IDs

#### Scenario: Duplicate relic is prevented
- **WHEN** the hero already owns a relic
- **THEN** reward generation and reward application MUST NOT add a second copy of the same relic ID

### Requirement: Relic definitions are stable and renderable
Each relic SHALL have stable metadata and effect semantics that can be used by game logic and UI.

#### Scenario: Relic metadata exists
- **WHEN** a relic ID appears in hero state
- **THEN** the system MUST be able to resolve display name, short description, trigger timing, and effect metadata

#### Scenario: Unknown relic is safe
- **WHEN** loaded save data contains an unknown relic ID
- **THEN** the UI MUST render a safe fallback label and battle logic MUST ignore unknown effects instead of crashing

#### Scenario: Relic descriptions match behavior
- **WHEN** the UI displays a relic description
- **THEN** the description MUST describe the actual implemented trigger and effect values

### Requirement: First relic pool supports multiple build directions
The first-version relic pool SHALL include relics that support elemental, defense, sustain, crit, low-HP, and Boss-pressure play.

#### Scenario: Elemental relic exists
- **WHEN** the relic pool is initialized
- **THEN** it MUST include a fire damage relic equivalent to `flame-emblem`

#### Scenario: Defense relic exists
- **WHEN** the relic pool is initialized
- **THEN** it MUST include a shield or defense synergy relic equivalent to `ironwall-crest`

#### Scenario: Sustain relic exists
- **WHEN** the relic pool is initialized
- **THEN** it MUST include at least one healing or battle-start recovery relic equivalent to `water-spirit-bottle` or `regrowth-seed`

#### Scenario: Crit relic exists
- **WHEN** the relic pool is initialized
- **THEN** it MUST include a crit multiplier relic equivalent to `sharp-charm`

#### Scenario: Boss pressure relic exists
- **WHEN** the relic pool is initialized
- **THEN** it MUST include a relic that provides value against Boss or high-pressure fights

### Requirement: Relic effects apply at defined timing points
Relic effects SHALL apply only at their defined timing points and SHALL remain consistent with previews when they affect decisions.

#### Scenario: Outgoing damage relic applies to attack
- **WHEN** the hero uses an attack card matching an owned outgoing damage relic condition
- **THEN** final damage and attack card preview MUST include the relic modifier

#### Scenario: Crit relic applies to crit damage
- **WHEN** the hero owns a crit multiplier relic and a hero attack crits
- **THEN** the battle engine MUST use the relic-adjusted crit multiplier

#### Scenario: Healing overflow relic creates shield
- **WHEN** the hero owns a healing overflow relic and a heal would exceed max HP
- **THEN** the overflow portion defined by the relic MUST become temporary shield

#### Scenario: Armor Breaker Blade applies break defense
- **WHEN** the hero owns `armor-breaker-blade` and uses an attack card whose element has advantage over the monster element
- **THEN** the monster MUST receive break-defense status with the configured reduction amount and remaining uses if it survives the attack

#### Scenario: Battle-start relic triggers once
- **WHEN** a battle starts and the hero owns a battle-start recovery relic
- **THEN** the recovery MUST apply once for that battle and MUST NOT repeat during later turns

#### Scenario: Conditional next-turn relic stores pending modifier
- **WHEN** a relic grants a next-turn bonus after a qualifying action
- **THEN** the system MUST store a JSON-serializable pending modifier and consume it when its condition is fulfilled or expires

### Requirement: Relic triggers are visible
The system SHALL provide visible feedback when a relic materially changes battle outcome.

#### Scenario: Relic trigger event emitted
- **WHEN** a relic modifies damage, healing, shield, status, or battle-start HP
- **THEN** the battle engine MUST emit a structured relic trigger event or equivalent structured metadata containing relic ID, trigger type, and affected amount when applicable

#### Scenario: Relic trigger appears in log
- **WHEN** a relic trigger event is visible to the player
- **THEN** the battle log MUST show concise trigger text naming the relic and its effect

#### Scenario: Relics displayed in battle
- **WHEN** the battle UI renders hero status
- **THEN** it MUST display owned relics as compact labels or tags without obscuring HP, statuses, hand, or intent
