## ADDED Requirements

### Requirement: Monster action executes stored intent
The battle engine SHALL resolve monster action from the stored monster intent instead of selecting a new attack type or skill trigger during monster action.

#### Scenario: Attack type matches intent
- **WHEN** monster intent attack type is physical
- **THEN** the monster action MUST use physical attack

#### Scenario: Magic attack matches intent
- **WHEN** monster intent attack type is magic
- **THEN** the monster action MUST use magic attack

#### Scenario: Intent consumed event emitted
- **WHEN** the monster action executes a stored intent
- **THEN** the system MUST emit an intent consumed event containing the intent id

### Requirement: Intent monster-action skills are applied during monster action
The battle engine SHALL apply triggered monster-action intent skills during monster action.

#### Scenario: Crit boost from intent
- **WHEN** the stored intent marks critBoost as triggered
- **THEN** monster damage calculation MUST use the crit boost multiplier if the attack crits

#### Scenario: Lifesteal from intent
- **WHEN** the stored intent marks lifesteal as triggered and the monster deals damage
- **THEN** the monster MUST heal based on final damage dealt

#### Scenario: Stun from intent
- **WHEN** the stored intent marks stun as triggered
- **THEN** the hero MUST become stunned after the monster action

### Requirement: Intent defensive skills affect hero action
The battle engine SHALL apply triggered hero-action defensive intent skills during the player's action before the monster action.

#### Scenario: Shield from intent affects hero attack
- **WHEN** the stored intent marks shield as triggered and the player uses an attack card
- **THEN** the hero attack damage MUST apply shield reduction

#### Scenario: Element immunity from intent affects matching element
- **WHEN** the stored intent marks elementImmune as triggered for fire and the player attacks with fire
- **THEN** the hero attack damage MUST use neutral element multiplier 1.0

#### Scenario: Defensive skills expire on heal
- **WHEN** the stored intent marks shield or elementImmune as triggered and the player uses a heal card
- **THEN** the defensive skill MUST NOT apply to the heal action and MUST NOT carry into the next turn

#### Scenario: Defensive skills expire on stat boost
- **WHEN** the stored intent marks shield or elementImmune as triggered and the player uses a stat boost card
- **THEN** the defensive skill MUST NOT apply to the stat boost action and MUST NOT carry into the next turn

#### Scenario: Defensive skills expire on skip
- **WHEN** the stored intent marks shield or elementImmune as triggered and the player skips the turn
- **THEN** the defensive skill MUST NOT apply to any later hero attack and MUST NOT carry into the next turn

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
- **THEN** the battle MUST end without generating a next-turn monster intent

#### Scenario: Monster victory does not require next intent
- **WHEN** the monster defeats the hero during monster action
- **THEN** the battle MUST end without generating a next-turn monster intent

#### Scenario: Surviving turn creates next intent
- **WHEN** player and monster both survive the turn
- **THEN** the next player action phase MUST have a newly generated monster intent
