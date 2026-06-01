## ADDED Requirements

### Requirement: Monsters can have archetypes
The monster generator SHALL support lightweight monster archetypes that affect display and tuning.

#### Scenario: Monster archetype metadata generated
- **WHEN** a non-Boss monster is generated
- **THEN** it MUST either receive a valid archetype ID/name or a safe generic archetype fallback

#### Scenario: Archetype metadata is renderable
- **WHEN** a monster has an archetype
- **THEN** the UI MUST be able to display a readable archetype name without parsing internal IDs

#### Scenario: Archetype affects tuning
- **WHEN** an archetype is applied
- **THEN** it MUST be able to modify stat multipliers, element tendencies, skill tendencies, or intent tendencies through data-driven configuration

#### Scenario: Archetype persists in save
- **WHEN** a battle with an archetyped monster is saved and loaded
- **THEN** the restored monster MUST retain its archetype metadata

### Requirement: First ordinary archetypes are bounded
The first implementation SHALL include a small ordinary-monster archetype set.

#### Scenario: Berserker archetype exists
- **WHEN** ordinary archetypes are initialized
- **THEN** a berserker-like archetype MUST exist with higher physical pressure and lower defensive profile

#### Scenario: Stone Guard archetype exists
- **WHEN** ordinary archetypes are initialized
- **THEN** a stone-guard-like archetype MUST exist with higher defense or shield tendency

#### Scenario: Blood Bat archetype exists
- **WHEN** ordinary archetypes are initialized
- **THEN** a blood-bat-like archetype MUST exist with lifesteal tendency and lower HP profile

#### Scenario: Thunder Bug archetype exists
- **WHEN** ordinary archetypes are initialized
- **THEN** a thunder-bug-like archetype MUST exist with crit or stun tendency and lower HP profile

#### Scenario: Ordinary archetypes stay simple
- **WHEN** ordinary archetype behavior is implemented for this change
- **THEN** it MUST NOT require multi-phase Boss scripting, map routes, or special UI screens

### Requirement: Level 5 Boss is Stone General
The level 5 Boss SHALL use a fixed Stone General archetype that emphasizes shield pressure.

#### Scenario: Level 5 Boss generated
- **WHEN** level 5 monster generation runs
- **THEN** the monster MUST be a Boss with Stone General archetype metadata

#### Scenario: Stone General display
- **WHEN** the battle UI renders the level 5 Boss
- **THEN** the monster status panel MUST show a readable Stone General-style name or archetype label

#### Scenario: Stone General has shield pressure
- **WHEN** Stone General intent is generated
- **THEN** its skill or intent tendencies MUST create deterministic shield pressure on the configured Stone General cadence without requiring random retries in tests

#### Scenario: Stone General remains beatable without perfect rewards
- **WHEN** a player reaches Stone General without a specific relic
- **THEN** the encounter MUST still be mechanically beatable through normal card choices, defensive cards, and damage cards under expected balance

### Requirement: Later Bosses remain generic in this change
Bosses after level 5 SHALL preserve existing Boss interval and enrage behavior without receiving new fixed named Boss mechanics in this change.

#### Scenario: Level 10 Boss remains generic
- **WHEN** level 10 monster generation runs
- **THEN** the monster MUST still be a Boss using existing Boss interval rules, but MUST NOT be forced to Stone General archetype

#### Scenario: Level 15 Boss keeps enrage behavior
- **WHEN** level 15 or later Boss combat reaches the existing enrage threshold
- **THEN** existing Boss enrage timing and multiplier behavior MUST still apply regardless of whether archetype display metadata exists

#### Scenario: Boss interval unchanged
- **WHEN** levels are generated after this change
- **THEN** Bosses MUST still appear at the existing Boss interval unless a separate future change modifies progression rules

### Requirement: Archetypes inform monster intent
Monster intent generation SHALL use archetype tuning when selecting or presenting upcoming actions.

#### Scenario: Archetype skill tendency affects intent
- **WHEN** a monster archetype favors a skill such as shield, lifesteal, crit boost, or stun
- **THEN** generated intents MUST reflect that tendency through skill selection, trigger chance, or configured action weighting

#### Scenario: Intent text includes archetype pressure when useful
- **WHEN** an archetype creates a special pressure pattern visible to the player
- **THEN** the intent message or panel MUST expose concise readable text for that pressure

#### Scenario: Generic monster remains supported
- **WHEN** a monster has no specific archetype due to old save or fallback
- **THEN** monster intent generation MUST continue using existing generic behavior safely
