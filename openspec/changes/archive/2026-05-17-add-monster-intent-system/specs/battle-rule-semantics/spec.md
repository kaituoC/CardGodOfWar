## MODIFIED Requirements

### Requirement: Canonical turn sequence
The battle engine SHALL resolve every non-terminal turn through the same ordered sequence: monster intent generation for the player action phase, player action, monster action using the stored intent, end-of-turn status resolution, turn advancement, battle-end check, next-hand generation, and next monster intent generation.

#### Scenario: New player action phase has monster intent
- **WHEN** the battle enters a player action phase
- **THEN** the system MUST have a monster intent available before the player chooses a card

#### Scenario: Attack action continues to monster action
- **WHEN** the player uses an attack card and the monster survives
- **THEN** the system MUST resolve a monster action from the stored monster intent before advancing to the next player turn

#### Scenario: Heal action continues to monster action
- **WHEN** the player uses a heal card and the battle is not already over
- **THEN** the system MUST resolve a monster action from the stored monster intent before advancing to the next player turn

#### Scenario: Stat boost action continues to monster action
- **WHEN** the player uses a stat boost card and the battle is not already over
- **THEN** the system MUST resolve a monster action from the stored monster intent before advancing to the next player turn

#### Scenario: Hero victory stops monster action
- **WHEN** the player action reduces the monster HP to 0
- **THEN** the system MUST end the battle with hero victory without resolving a monster action or generating a next-turn intent

#### Scenario: Next turn refreshes intent
- **WHEN** the turn advances and a new hand is generated
- **THEN** the system MUST also generate a monster intent for the new current turn
