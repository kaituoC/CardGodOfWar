## MODIFIED Requirements

### Requirement: Monster intent contains executable action data
The monster intent SHALL contain all data needed for the later monster action to execute without reselecting attack type, skill triggers, archetype pressure, or status-relevant preview data.

#### Scenario: Intent generator uses explicit input object
- **WHEN** code generates a monster intent
- **THEN** it MUST call a pure helper equivalent to `generateMonsterIntent(input: GenerateMonsterIntentInput)` with explicit `level`, `hero`, `monster`, `currentTurn`, `maxTurns`, `isEnraged`, optional `source`, and any required status/relic context fields

#### Scenario: Intent helper is isolated
- **WHEN** intent generation and preview helpers are implemented
- **THEN** they MUST live in `src/renderer/src/game/monster-intent.ts` or adjacent game-layer helpers and MUST NOT depend on Vue, Pinia, Electron, or UI components

#### Scenario: Intent contains attack data
- **WHEN** a monster intent is generated
- **THEN** it MUST include action type, attack type, base attack value, element, estimated damage, crit damage, enrage multiplier, weak-adjusted preview data when applicable, and display message

#### Scenario: Intent contains skill trigger data
- **WHEN** a monster with skills generates intent
- **THEN** the intent MUST include each relevant skill with timing, trigger result, label, and immune element when applicable

#### Scenario: Intent contains archetype pressure data
- **WHEN** a monster archetype changes intent weighting or creates a special pressure pattern
- **THEN** the intent MUST include JSON-serializable archetype pressure metadata sufficient for UI display and event correlation

#### Scenario: Intent id is readable for event correlation
- **WHEN** a monster intent is generated for a turn
- **THEN** it MUST include a readable id in the format `intent-turn-{turn}-{sequence}` that can be copied into intent-related battle events

#### Scenario: Intent records source
- **WHEN** a monster intent is generated
- **THEN** it MUST include `source` as `generated` for normal battle flow or `restored` for old save recovery

### Requirement: Intent generation is deterministic under controlled skill chances
The monster intent generator SHALL honor monster skill trigger chances and configured archetype pressure so tests can force triggered and non-triggered outcomes.

#### Scenario: Skill chance 100 triggers
- **WHEN** a monster skill has triggerChance 100
- **THEN** generated intent MUST mark that skill as triggered

#### Scenario: Skill chance 0 does not trigger
- **WHEN** a monster skill has triggerChance 0
- **THEN** generated intent MUST mark that skill as not triggered

#### Scenario: Stone General shield pressure is testable
- **WHEN** Stone General intent generation is run under configured deterministic shield-pressure conditions
- **THEN** the resulting intent MUST expose the expected shield pressure without requiring random retries

#### Scenario: Stone General shield cadence
- **WHEN** Stone General reaches a turn matching its configured shield cadence
- **THEN** generated intent MUST include shield pressure according to that cadence regardless of random skill rolls

## ADDED Requirements

### Requirement: Archetype tuning affects intent generation
Monster intent generation SHALL apply archetype tuning when choosing attack type, element tendency, skill tendency, or special pressure metadata.

#### Scenario: Archetype favors shield
- **WHEN** a shield-focused archetype generates intent
- **THEN** shield-related defensive intent skills or pressure metadata MUST occur according to that archetype's configured tendency

#### Scenario: Archetype favors lifesteal
- **WHEN** a lifesteal-focused archetype generates intent
- **THEN** lifesteal-related skill trigger chance or availability MUST reflect that tendency

#### Scenario: Archetype favors stun or crit
- **WHEN** a stun/crit-focused archetype generates intent
- **THEN** stun or crit-related pressure MUST reflect that archetype's configured tendency

#### Scenario: Generic fallback remains random baseline
- **WHEN** a monster has no specific archetype
- **THEN** intent generation MUST preserve existing generic random behavior as closely as possible

### Requirement: Intent estimates include existing statuses
Monster intent generation or preview refresh SHALL account for battle statuses that already exist before the monster action.

#### Scenario: Weak monster intent
- **WHEN** the monster is weak before player action
- **THEN** generated or displayed intent estimated damage MUST include weak reduction

#### Scenario: Shielded hero intent
- **WHEN** the hero already has shield before player action
- **THEN** the UI MAY show shield mitigation separately, but the intent data MUST retain enough raw damage metadata to calculate HP damage after shield without ambiguity
