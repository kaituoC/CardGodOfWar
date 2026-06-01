# Battle State Model

## Purpose
Defines battle state fields and save-normalization rules, including stored monster intent and new reward/relic/status/card-bias/archetype data.
## Requirements
### Requirement: Save data restores canonical battle state
The save system SHALL persist enough data to restore the run state and active battle state without changing battle semantics, including the current monster intent when the battle is active, pending reward choices, hero relics, card-bias data, expanded status effects, shield state, and monster archetype metadata.

#### Scenario: Save active battle
- **WHEN** the game saves during an active battle
- **THEN** the save data MUST include level, run hero snapshot including relics, battle state, current monster intent, expanded status effects, card-bias state, monster archetype metadata, and timestamp

#### Scenario: Save pending reward
- **WHEN** the game saves after hero victory while a reward choice is pending
- **THEN** the save data MUST include the pending reward choice, selected battle result, level, hero snapshot, relics, card-bias state, and timestamp

#### Scenario: Restore active battle
- **WHEN** the player loads a save with battle state
- **THEN** the system MUST restore the battle state, run hero snapshot, level, phase, result, hand, status effects, shield state, monster archetype metadata, card-bias state, and monster intent consistently

#### Scenario: Restore pending reward
- **WHEN** the player loads a save with a pending reward choice
- **THEN** the system MUST restore the pending rewards and MUST keep next-level progression blocked until one reward is selected

#### Scenario: Restore older save
- **WHEN** the player loads an older save that lacks newly added battle fields, relics, card-bias data, expanded statuses, archetype metadata, reward state, or monster intent
- **THEN** the system MUST provide safe default values and generate missing non-game-over active-battle intent with `source` set to `restored` to preserve the saved battle as closely as possible

### Requirement: Battle state stores current monster intent
The battle state SHALL store the current monster intent for active player action phases.

#### Scenario: Active player action stores intent
- **WHEN** battle phase is player action
- **THEN** battle state MUST contain a monster intent for the current turn

#### Scenario: Game over does not require actionable intent
- **WHEN** battle phase is game over
- **THEN** battle state MUST NOT require an actionable monster intent for further player input

### Requirement: Battle state stores reward progression
The battle/run state SHALL represent whether the player is resolving battle, choosing a reward, or ready to enter the next level.

#### Scenario: Active battle has no reward choice
- **WHEN** battle phase is player action or monster action
- **THEN** pending reward choice MUST be null or absent

#### Scenario: Hero victory stores reward choice
- **WHEN** hero victory creates rewards
- **THEN** the state MUST store exactly three JSON-serializable rewards

#### Scenario: Reward selection clears pending choice
- **WHEN** a valid reward is selected
- **THEN** pending reward choice MUST be cleared before the next battle is created

### Requirement: Hero model stores relics and card-bias data
The hero/run model SHALL store persistent build-shaping state independently of a single battle.

#### Scenario: Hero stores relic list
- **WHEN** hero state is serialized
- **THEN** it MUST include a JSON-serializable relic ID list

#### Scenario: Run stores card bias
- **WHEN** run state is serialized
- **THEN** it MUST include JSON-serializable card-bias values or default-neutral values

#### Scenario: Battle hero snapshot receives relic effects
- **WHEN** a battle starts
- **THEN** battle hero state MUST be created from run hero state in a way that preserves relic ownership and pending build modifiers needed during combat

### Requirement: Battle state stores expanded statuses
The battle state SHALL store status effects with enough data for UI, save/load, preview, and combat resolution.

#### Scenario: Shield status serialized
- **WHEN** the hero has shield
- **THEN** battle state MUST include the current shield amount in JSON-serializable form

#### Scenario: Break defense status serialized
- **WHEN** a target has break defense
- **THEN** battle state MUST include target, amount, and remaining duration or uses

#### Scenario: Weak status serialized
- **WHEN** a target has weak
- **THEN** battle state MUST include target, reduction amount or multiplier, and remaining duration or uses

#### Scenario: Stun status remains derivable
- **WHEN** the hero is stunned
- **THEN** battle state MUST either store stun in the expanded status list or preserve existing `hero.isStunned` with normalization that keeps UI and combat consistent

