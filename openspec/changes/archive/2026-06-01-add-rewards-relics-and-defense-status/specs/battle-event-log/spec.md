## MODIFIED Requirements

### Requirement: Battle engine emits structured events
The battle engine SHALL emit structured battle events for meaningful combat outcomes, including monster intent creation and consumption, reward selection, relic triggers, status changes, shield absorption, and monster archetype pressure, instead of requiring UI code to infer outcomes from display text.

#### Scenario: Damage event emitted
- **WHEN** an actor deals damage to a target
- **THEN** the system MUST emit a damage event containing actor, target, final HP damage amount, damage type, element metadata when applicable, crit flag, relevant modifier flags, shield absorbed amount when applicable, effective defense metadata when applicable, and intent id when the damage came from a monster intent

#### Scenario: Heal event emitted
- **WHEN** an actor restores HP
- **THEN** the system MUST emit a heal event containing actor, target, heal amount, previous HP, resulting HP, overflow amount when applicable, shield conversion amount when applicable, and intent id when the healing came from a monster intent skill

#### Scenario: Status event emitted
- **WHEN** a status effect is applied, consumed, reduced, or expired
- **THEN** the system MUST emit a status event containing target, status type, amount or multiplier when applicable, remaining duration or uses when applicable, action, and intent id when the status came from a monster intent

#### Scenario: Intent created event emitted
- **WHEN** the battle engine generates a monster intent
- **THEN** the system MUST emit or store a structured event or equivalent event history entry that includes the intent id and turn

#### Scenario: Intent consumed event emitted
- **WHEN** the monster action executes a monster intent
- **THEN** the system MUST emit a structured event that includes the consumed intent id

#### Scenario: Relic trigger event emitted
- **WHEN** a relic changes damage, healing, shield, status, or battle-start HP
- **THEN** the system MUST emit a structured event containing relic ID, actor, trigger timing, and affected amount when applicable

#### Scenario: Reward selected event emitted
- **WHEN** the player selects a reward
- **THEN** the system MUST emit or persist a structured reward event containing reward ID and reward type

## ADDED Requirements

### Requirement: Shield absorption is visible
Battle logs and events SHALL make shield absorption understandable without requiring text parsing.

#### Scenario: Shield absorbs incoming damage
- **WHEN** shield absorbs any incoming monster damage
- **THEN** events MUST include absorbed shield amount and visible log text MUST mention shield absorption

#### Scenario: Shield fully blocks HP loss
- **WHEN** shield fully absorbs incoming monster damage
- **THEN** visible log text MUST make clear that hero HP did not decrease

### Requirement: Reward and relic logs are concise
Reward and relic feedback SHALL be visible but not flood the battle log.

#### Scenario: Reward selected log
- **WHEN** a reward is selected
- **THEN** visible feedback MUST name the reward and summarize its effect in one concise entry or reward UI transition

#### Scenario: Relic trigger log
- **WHEN** a relic triggers during battle
- **THEN** visible feedback MUST name the relic and summarize the changed amount or effect

#### Scenario: Passive relic does not spam every render
- **WHEN** UI repeatedly renders a battle state with an owned relic
- **THEN** no new relic trigger log MUST be created unless battle state actually changes through a trigger

### Requirement: Archetype and Boss pressure events are inspectable
Battle events SHALL expose important archetype/Boss pressure changes in structured form when they affect combat.

#### Scenario: Boss shield pressure event
- **WHEN** Stone General creates or uses a shield-pressure intent
- **THEN** event or intent metadata MUST identify the relevant archetype/Boss pressure without relying only on localized message text

#### Scenario: Generic archetype does not require event
- **WHEN** a generic archetype has no special combat pressure
- **THEN** the engine MUST NOT emit unnecessary visible log noise solely for having an archetype
