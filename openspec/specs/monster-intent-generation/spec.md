## ADDED Requirements

### Requirement: Battle creates a monster intent
The battle engine SHALL create a monster intent whenever a battle enters a player action phase.

#### Scenario: New battle has intent
- **WHEN** a new battle is created
- **THEN** the battle state MUST include a monster intent for turn 1

#### Scenario: Next turn has refreshed intent
- **WHEN** a turn advances to the next player action phase
- **THEN** the battle state MUST include a new monster intent whose turn matches the new current turn

#### Scenario: Intent remains stable during player decision
- **WHEN** the battle is in player action phase and the player has not acted
- **THEN** repeated UI reads MUST return the same monster intent data without re-rolling action or skill triggers

### Requirement: Monster intent contains executable action data
The monster intent SHALL contain all data needed for the later monster action to execute without reselecting attack type or skill triggers.

#### Scenario: Intent generator uses explicit input object
- **WHEN** code generates a monster intent
- **THEN** it MUST call a pure helper equivalent to `generateMonsterIntent(input: GenerateMonsterIntentInput)` with explicit `level`, `hero`, `monster`, `currentTurn`, `maxTurns`, `isEnraged`, and optional `source` fields

#### Scenario: Intent helper is isolated
- **WHEN** intent generation and preview helpers are implemented
- **THEN** they MUST live in `src/renderer/src/game/monster-intent.ts` and MUST NOT depend on Vue, Pinia, Electron, or UI components

#### Scenario: Intent contains attack data
- **WHEN** a monster intent is generated
- **THEN** it MUST include action type, attack type, base attack value, element, estimated damage, enrage multiplier, and display message

#### Scenario: Intent contains skill trigger data
- **WHEN** a monster with skills generates intent
- **THEN** the intent MUST include each relevant skill with timing, trigger result, label, and immune element when applicable

#### Scenario: Intent id is readable for event correlation
- **WHEN** a monster intent is generated for a turn
- **THEN** it MUST include a readable id in the format `intent-turn-{turn}-{sequence}` that can be copied into intent-related battle events

#### Scenario: Intent records source
- **WHEN** a monster intent is generated
- **THEN** it MUST include `source` as `generated` for normal battle flow or `restored` for old save recovery

### Requirement: Intent generation is deterministic under controlled skill chances
The monster intent generator SHALL honor monster skill trigger chances so tests can force triggered and non-triggered outcomes.

#### Scenario: Skill chance 100 triggers
- **WHEN** a monster skill has triggerChance 100
- **THEN** generated intent MUST mark that skill as triggered

#### Scenario: Skill chance 0 does not trigger
- **WHEN** a monster skill has triggerChance 0
- **THEN** generated intent MUST mark that skill as not triggered

### Requirement: Old saves recover missing intent
The save restore path SHALL generate a safe monster intent when loading an active battle that lacks monster intent.

#### Scenario: Restore old active battle
- **WHEN** a save file contains a non-game-over active battle without monster intent and the restored phase is missing or `playerAction`
- **THEN** restore MUST add a monster intent matching the restored current turn with `source` set to `restored`

#### Scenario: Restore old non-actionable active battle
- **WHEN** a save file contains a non-game-over battle without monster intent in an old or unknown non-player-action phase
- **THEN** restore MUST normalize the phase to `playerAction` before adding a restored monster intent

#### Scenario: Restore completed battle
- **WHEN** a save file contains a completed battle without monster intent
- **THEN** restore MUST NOT require a new actionable monster intent for player input
