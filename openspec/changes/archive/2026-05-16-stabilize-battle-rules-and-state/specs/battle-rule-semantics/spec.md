## ADDED Requirements

### Requirement: Canonical turn sequence
The battle engine SHALL resolve every non-terminal turn through the same ordered sequence: player action, monster action, end-of-turn status resolution, turn advancement, battle-end check, and next-hand generation.

#### Scenario: Attack action continues to monster action
- **WHEN** the player uses an attack card and the monster survives
- **THEN** the system MUST resolve a monster action before advancing to the next player turn

#### Scenario: Heal action continues to monster action
- **WHEN** the player uses a heal card and the battle is not already over
- **THEN** the system MUST resolve a monster action before advancing to the next player turn

#### Scenario: Stat boost action continues to monster action
- **WHEN** the player uses a stat boost card and the battle is not already over
- **THEN** the system MUST resolve a monster action before advancing to the next player turn

#### Scenario: Hero victory stops monster action
- **WHEN** the player action reduces the monster HP to 0
- **THEN** the system MUST end the battle with hero victory without resolving a monster action

### Requirement: Stun restricts the next player action
The battle engine SHALL treat stun as a one-action status effect that prevents the hero from using physical and magic attack cards during the next player action while still allowing heal and stat boost cards.

#### Scenario: Stunned hero cannot play attack cards
- **WHEN** the hero is stunned and attempts to play a physical or magic attack card
- **THEN** the system MUST reject the attack action without applying card effects

#### Scenario: Stunned hero can play non-attack cards
- **WHEN** the hero is stunned and plays a heal or stat boost card
- **THEN** the system MUST apply the card effect and continue through the canonical turn sequence

#### Scenario: Stun is consumed after legal action
- **WHEN** the stunned hero completes a legal non-attack action
- **THEN** the system MUST clear the stun before the next player action begins

### Requirement: Skip is a player action with consequences
The battle engine SHALL treat skip as a player action that applies no hero card effect but still resolves monster action and end-of-turn processing.

#### Scenario: Stunned hero with no legal cards can skip
- **WHEN** the hero is stunned and all cards in hand are physical or magic attack cards
- **THEN** the system MUST allow the player to skip the player action

#### Scenario: Skip triggers monster action
- **WHEN** the player skips the player action
- **THEN** the system MUST resolve a monster action before advancing to the next player turn

#### Scenario: Skip consumes stun
- **WHEN** the player skips because stun leaves no legal cards
- **THEN** the system MUST clear the stun before the next player action begins

### Requirement: Element immunity neutralizes element relationships
The battle engine SHALL apply triggered element immunity by setting the element multiplier to 1.0 for matching incoming card elements while preserving all other damage calculation steps.

#### Scenario: Immune element uses neutral multiplier
- **WHEN** a monster triggers fire immunity and the hero attacks with a fire card
- **THEN** the system MUST calculate damage with element multiplier 1.0

#### Scenario: Immune element still applies defense and crit
- **WHEN** a monster triggers immunity to the incoming card element
- **THEN** the system MUST still apply defense, crit, shield, and minimum damage rules normally

#### Scenario: Non-immune element uses normal relationship
- **WHEN** a monster triggers fire immunity and the hero attacks with a thunder or water card
- **THEN** the system MUST calculate the normal element advantage or disadvantage multiplier

### Requirement: Lifesteal heals from monster damage dealt
The battle engine SHALL apply monster lifesteal during monster action by healing the monster based on actual final damage dealt to the hero.

#### Scenario: Lifesteal heals after monster deals damage
- **WHEN** the monster triggers lifesteal and deals damage to the hero
- **THEN** the system MUST heal the monster by the configured percentage of final damage dealt

#### Scenario: Lifesteal cannot exceed max HP
- **WHEN** lifesteal healing would raise monster HP above max HP
- **THEN** the system MUST cap monster current HP at max HP

#### Scenario: Hero damage does not trigger monster lifesteal
- **WHEN** the hero damages a monster that has a lifesteal skill
- **THEN** the system MUST NOT heal the monster from the hero's damage unless a separate rule explicitly grants that behavior

### Requirement: Battle end conditions are deterministic
The battle engine SHALL set the battle result deterministically when hero HP reaches 0, monster HP reaches 0, or the max turn limit is exceeded.

#### Scenario: Monster defeated
- **WHEN** monster current HP becomes 0
- **THEN** the system MUST set the battle result to hero victory and prevent further actions

#### Scenario: Hero defeated
- **WHEN** hero current HP becomes 0
- **THEN** the system MUST set the battle result to monster victory and prevent further actions

#### Scenario: Max turns exceeded
- **WHEN** advancing the turn would exceed the configured max turn count
- **THEN** the system MUST set the battle result to monster victory and prevent further player actions
