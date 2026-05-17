## MODIFIED Requirements

### Requirement: Save data restores canonical battle state
The save system SHALL persist enough data to restore the run state and active battle state without changing battle semantics, including the current monster intent when the battle is active.

#### Scenario: Save active battle
- **WHEN** the game saves during an active battle
- **THEN** the save data MUST include level, run hero snapshot, battle state, current monster intent, and timestamp

#### Scenario: Restore active battle
- **WHEN** the player loads a save with battle state
- **THEN** the system MUST restore the battle state, run hero snapshot, level, phase, result, hand, status effects, and monster intent consistently

#### Scenario: Restore older save
- **WHEN** the player loads an older save that lacks newly added battle fields or monster intent
- **THEN** the system MUST provide safe default values and generate missing non-game-over active-battle intent with `source` set to `restored` to preserve the saved battle as closely as possible

## ADDED Requirements

### Requirement: Battle state stores current monster intent
The battle state SHALL store the current monster intent for active player action phases.

#### Scenario: Active player action stores intent
- **WHEN** battle phase is player action
- **THEN** battle state MUST contain a monster intent for the current turn

#### Scenario: Game over does not require actionable intent
- **WHEN** battle phase is game over
- **THEN** battle state MUST NOT require an actionable monster intent for further player input
