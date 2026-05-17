## ADDED Requirements

### Requirement: Battle engine emits structured events
The battle engine SHALL emit structured battle events for meaningful combat outcomes instead of requiring UI code to infer outcomes from display text.

#### Scenario: Damage event emitted
- **WHEN** an actor deals damage to a target
- **THEN** the system MUST emit a damage event containing actor, target, final damage amount, damage type, element metadata when applicable, crit flag, and relevant modifier flags

#### Scenario: Heal event emitted
- **WHEN** an actor restores HP
- **THEN** the system MUST emit a heal event containing actor, target, heal amount, previous HP, and resulting HP

#### Scenario: Status event emitted
- **WHEN** a status effect is applied or consumed
- **THEN** the system MUST emit a status event containing target, status type, and whether the status was applied or consumed

### Requirement: Human-readable logs derive from events
The battle log UI SHALL render human-readable log lines from structured events while preserving enough display text for localized presentation.

#### Scenario: Log line rendered from event
- **WHEN** the battle state contains a structured damage event
- **THEN** the battle log MUST render a readable log line without requiring battle logic to parse that line later

#### Scenario: Text changes do not break effects
- **WHEN** the display text for a damage, heal, crit, or element event changes
- **THEN** floating numbers and flash effects MUST continue to work from structured event fields

### Requirement: Presentation effects consume event metadata
The battle UI SHALL trigger floating numbers, damage flashes, heal indicators, crit indicators, element indicators, and enrage flashes from structured event metadata.

#### Scenario: Damage flash from damage event
- **WHEN** a damage event targets the hero or monster
- **THEN** the UI MUST flash the target based on the event target field

#### Scenario: Floating damage from damage event
- **WHEN** a damage event is emitted
- **THEN** the UI MUST show the final damage number from the event amount field

#### Scenario: Crit indicator from damage event
- **WHEN** a damage event has crit set to true
- **THEN** the UI MUST show a crit indicator without scanning display text

#### Scenario: Enrage indicator from event metadata
- **WHEN** a monster damage event includes an enrage multiplier greater than 1.0
- **THEN** the UI MUST show the enrage indicator without scanning display text

### Requirement: Event history is save-safe
The battle state SHALL store event history in a JSON-serializable form suitable for Electron IPC and save files.

#### Scenario: Events survive save and load
- **WHEN** a battle with event history is saved and loaded
- **THEN** the restored battle MUST retain the event history needed to render the battle log

#### Scenario: Events contain no reactive objects
- **WHEN** battle events are sent through Electron IPC
- **THEN** the events MUST be plain JSON-serializable data
