## MODIFIED Requirements

### Requirement: Monster action executes stored intent
The battle engine SHALL resolve monster action from the stored monster intent instead of selecting a new attack type, skill trigger, archetype pressure, or status effect during monster action.

#### Scenario: Attack type matches intent
- **WHEN** monster intent attack type is physical
- **THEN** the monster action MUST use physical attack

#### Scenario: Magic attack matches intent
- **WHEN** monster intent attack type is magic
- **THEN** the monster action MUST use magic attack

#### Scenario: Intent consumed event emitted
- **WHEN** the monster action executes a stored intent
- **THEN** the system MUST emit an intent consumed event containing the intent id

#### Scenario: Archetype pressure matches intent
- **WHEN** monster intent contains archetype pressure metadata
- **THEN** monster action MUST use that stored pressure data and MUST NOT re-roll or reinterpret it independently

### Requirement: Intent monster-action skills are applied during monster action
The battle engine SHALL apply triggered monster-action intent skills and relevant statuses during monster action.

#### Scenario: Crit boost from intent
- **WHEN** the stored intent marks critBoost as triggered
- **THEN** monster damage calculation MUST use the crit boost multiplier if the attack crits

#### Scenario: Lifesteal from intent
- **WHEN** the stored intent marks lifesteal as triggered and the monster deals HP damage after shield absorption
- **THEN** the monster MUST heal based on the configured lifesteal calculation using final HP damage or configured damage basis

#### Scenario: Stun from intent
- **WHEN** the stored intent marks stun as triggered
- **THEN** the hero MUST become stunned after the monster action

#### Scenario: Weak from status
- **WHEN** the monster has weak when its stored intent resolves
- **THEN** monster outgoing damage MUST be reduced by weak before shield absorption and weak MUST be consumed or reduced according to duration rules

#### Scenario: Hero shield absorbs monster damage
- **WHEN** the hero has shield when the stored monster intent resolves
- **THEN** shield MUST absorb incoming damage before hero HP is reduced

### Requirement: Intent defensive skills affect hero action
The battle engine SHALL apply triggered hero-action defensive intent skills during the player's action before the monster action, alongside new status and relic modifiers.

#### Scenario: Shield from intent affects hero attack
- **WHEN** the stored intent marks shield as triggered and the player uses an attack card
- **THEN** the hero attack damage MUST apply shield reduction

#### Scenario: Element immunity from intent affects matching element
- **WHEN** the stored intent marks elementImmune as triggered for fire and the player attacks with fire
- **THEN** the hero attack damage MUST use neutral element multiplier 1.0

#### Scenario: Break defense affects hero attack
- **WHEN** the monster has break-defense status and the player uses an attack card
- **THEN** hero attack damage MUST use reduced effective monster defense before intent defensive modifiers such as shield are applied

#### Scenario: Defensive skills expire on heal
- **WHEN** the stored intent marks shield or elementImmune as triggered and the player uses a heal card
- **THEN** the defensive skill MUST NOT apply to the heal action and MUST NOT carry into the next turn

#### Scenario: Defensive skills expire on stat boost
- **WHEN** the stored intent marks shield or elementImmune as triggered and the player uses a stat boost card
- **THEN** the defensive skill MUST NOT apply to the stat boost action and MUST NOT carry into the next turn

#### Scenario: Defensive skills expire on defense action
- **WHEN** the stored intent marks shield or elementImmune as triggered and the player uses a pure guard card
- **THEN** the defensive skill MUST NOT apply to the guard action and MUST NOT carry into the next turn

#### Scenario: Defensive skills expire on skip
- **WHEN** the stored intent marks shield or elementImmune as triggered and the player skips the turn
- **THEN** the defensive skill MUST NOT apply to any later hero attack and MUST NOT carry into the next turn

#### Scenario: Skip advances new statuses consistently
- **WHEN** the player skips the turn while shield, break-defense, weak, or stun statuses exist
- **THEN** the skip flow MUST resolve the stored monster intent and status cleanup using the same rules as other non-terminal player actions

#### Scenario: Defensive skills do not reroll
- **WHEN** a triggered defensive skill is present in monster intent
- **THEN** the player action MUST use that trigger result and MUST NOT roll the same skill again

#### Scenario: Defensive skills keep stored trigger result unchanged
- **WHEN** a defensive intent skill is applied or expires unused
- **THEN** the system MUST NOT mutate its stored `willTrigger` result; the whole intent is consumed by monster action or battle end

### Requirement: Intent refresh happens after resolution
The battle engine SHALL refresh monster intent only after the current turn resolves and a new player action phase begins.

#### Scenario: Hero victory does not require next intent
- **WHEN** the hero defeats the monster during player action
- **THEN** the battle MUST end with pending rewards and without generating a next-turn monster intent

#### Scenario: Monster victory does not require next intent
- **WHEN** the monster defeats the hero during monster action
- **THEN** the battle MUST end without generating a next-turn monster intent or pending rewards

#### Scenario: Surviving turn creates next intent
- **WHEN** player and monster both survive the turn
- **THEN** the next player action phase MUST have a newly generated monster intent

## ADDED Requirements

### Requirement: Status cleanup is deterministic
The battle engine SHALL update shield, break-defense, weak, and stun durations at deterministic points in the turn sequence.

#### Scenario: Shield cleanup after monster action
- **WHEN** monster action finishes
- **THEN** first-version temporary hero shield MUST be cleared before the next hand is generated

#### Scenario: Break defense duration decreases
- **WHEN** the configured break-defense duration condition occurs
- **THEN** remaining duration or uses MUST decrease and the status MUST be removed at 0

#### Scenario: Weak duration decreases
- **WHEN** weak reduces an outgoing attack or reaches its configured cleanup point
- **THEN** remaining duration or uses MUST decrease and the status MUST be removed at 0

#### Scenario: Stun cleanup remains compatible
- **WHEN** hero stun is consumed by existing stun rules
- **THEN** expanded status state and `hero.isStunned` MUST remain consistent
