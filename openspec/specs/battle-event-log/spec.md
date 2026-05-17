## MODIFIED Requirements

### Requirement: Battle engine emits structured events
The battle engine SHALL emit structured battle events for meaningful combat outcomes, including monster intent creation and consumption, instead of requiring UI code to infer outcomes from display text.

#### Scenario: Damage event emitted
- **WHEN** an actor deals damage to a target
- **THEN** the system MUST emit a damage event containing actor, target, final damage amount, damage type, element metadata when applicable, crit flag, relevant modifier flags, and intent id when the damage came from a monster intent

#### Scenario: Heal event emitted
- **WHEN** an actor restores HP
- **THEN** the system MUST emit a heal event containing actor, target, heal amount, previous HP, resulting HP, and intent id when the healing came from a monster intent skill

#### Scenario: Status event emitted
- **WHEN** a status effect is applied or consumed
- **THEN** the system MUST emit a status event containing target, status type, whether the status was applied or consumed, and intent id when the status came from a monster intent

#### Scenario: Intent created event emitted
- **WHEN** the battle engine generates a monster intent
- **THEN** the system MUST emit or store a structured event or equivalent event history entry that includes the intent id and turn

#### Scenario: Intent consumed event emitted
- **WHEN** the monster action executes a monster intent
- **THEN** the system MUST emit a structured event that includes the consumed intent id

## ADDED Requirements

### Requirement: Intent metadata remains machine-readable
Battle events related to monster intent SHALL store intent metadata in JSON-serializable fields rather than only in message text.

#### Scenario: Intent id is available without parsing text
- **WHEN** UI or tests inspect damage, heal, status, or intent consumption events
- **THEN** they MUST be able to read the related intent id from event fields without parsing the message

#### Scenario: Intent lifecycle events are hidden from log by default
- **WHEN** BattleLog renders the visible combat log
- **THEN** `intentCreated` and `intentConsumed` events MUST remain available in `BattleState.events` but MUST NOT be shown as regular visible log rows by default
