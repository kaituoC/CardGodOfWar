# defense-and-status-combat Specification

## Purpose
TBD - created by archiving change add-rewards-relics-and-defense-status. Update Purpose after archive.
## Requirements
### Requirement: Combat supports shield status
The battle system SHALL support temporary shield that absorbs incoming monster damage before hero HP is reduced.

#### Scenario: Shield absorbs damage
- **WHEN** the hero has shield and the monster deals damage
- **THEN** damage MUST reduce shield before reducing hero HP

#### Scenario: Partial shield absorption
- **WHEN** incoming damage is greater than current shield
- **THEN** shield MUST be reduced to 0 and only the remaining damage MUST reduce hero HP

#### Scenario: Full shield absorption
- **WHEN** incoming damage is less than or equal to current shield
- **THEN** hero HP MUST NOT decrease and shield MUST decrease by the damage amount

#### Scenario: Shield expires after monster action
- **WHEN** the current monster action has resolved
- **THEN** first-version temporary shield MUST be cleared before the next player action unless a relic explicitly says otherwise

#### Scenario: Shield is visible
- **WHEN** the hero has shield
- **THEN** hero status UI MUST show the current shield amount

### Requirement: Defense card grants shield
The card system SHALL include a defensive card that grants temporary shield.

#### Scenario: Guard card generated
- **WHEN** cards are generated after this feature is enabled
- **THEN** the card pool MUST be able to generate a guard/defense card with type/effect metadata distinct from attack, heal, and permanent stat boost cards

#### Scenario: Guard card resolves
- **WHEN** the player uses a guard card
- **THEN** the hero MUST gain shield based on hero defense and the card coefficient/star tuning

#### Scenario: Guard card continues to monster action
- **WHEN** the player uses a guard card and the battle is not over
- **THEN** the stored monster intent MUST resolve in the same turn

#### Scenario: Guard card preview
- **WHEN** a guard card is displayed
- **THEN** the card MUST show estimated shield gain as render-ready text

### Requirement: Combat supports break defense
The battle system SHALL support first-version break-defense status on monsters, lowering the monster's effective defense for a bounded number of hero attack or tactical damage actions. Hero-side break defense is reserved for a future change and is not required here.

#### Scenario: Break defense lowers monster defense for damage
- **WHEN** the monster has break defense and the hero uses an attack card
- **THEN** damage calculation MUST use monster defense reduced by 40%, rounded down, with effective defense not going below 0

#### Scenario: Break defense has bounded duration
- **WHEN** break defense is applied
- **THEN** the status MUST include JSON-serializable remaining uses initialized to 3 and MUST be removed when that counter reaches 0

#### Scenario: Break defense is shown on monster
- **WHEN** a monster has break defense
- **THEN** the monster status panel MUST show a status tag with reduction amount and remaining uses

#### Scenario: Break defense preview
- **WHEN** the monster has break defense and an attack card is displayed
- **THEN** the attack estimate MUST include the reduced effective defense

### Requirement: Armor Break card applies break defense
The card system SHALL include a tactical card that deals low damage and applies break defense to the monster.

#### Scenario: Armor Break card generated
- **WHEN** cards are generated after this feature is enabled
- **THEN** the card pool MUST be able to generate an armor-break tactical card

#### Scenario: Armor Break damage resolves
- **WHEN** the player uses an armor-break card
- **THEN** the card MUST deal its configured low damage using the normal attack pipeline unless the monster is defeated earlier by that action

#### Scenario: Armor Break applies status
- **WHEN** the player uses an armor-break card and the monster survives
- **THEN** the monster MUST receive break-defense status with configured amount and duration/uses

#### Scenario: Armor Break preview
- **WHEN** an armor-break card is displayed
- **THEN** the card MUST show both estimated damage and break-defense application text

### Requirement: Combat supports weak
The battle system SHALL support first-version weak status on monsters, reducing the monster's next outgoing damage. Hero-side weak is reserved for a future change and is not required here.

#### Scenario: Weak lowers next monster attack
- **WHEN** the monster has weak and executes its next attack
- **THEN** monster damage MUST be multiplied by `0.8` before final damage is applied to shield or HP

#### Scenario: Weak is consumed
- **WHEN** weak affects a monster attack
- **THEN** the weak status MUST be consumed or its remaining counter MUST decrease according to the configured model

#### Scenario: Weak preview affects intent
- **WHEN** the monster has weak during player action
- **THEN** the monster intent estimated damage MUST include the weak reduction

#### Scenario: Weak is shown on monster
- **WHEN** a monster has weak
- **THEN** the monster status panel MUST show a weak status tag with remaining duration/uses

### Requirement: Suppress card applies weak
The card system SHALL include a tactical card that deals low damage and applies weak to the monster.

#### Scenario: Suppress card generated
- **WHEN** cards are generated after this feature is enabled
- **THEN** the card pool MUST be able to generate a suppress tactical card

#### Scenario: Suppress damage resolves
- **WHEN** the player uses a suppress card
- **THEN** the card MUST deal its configured low damage using the normal attack pipeline unless the monster is defeated earlier by that action

#### Scenario: Suppress applies weak
- **WHEN** the player uses a suppress card and the monster survives
- **THEN** the monster MUST receive weak status with configured reduction and duration/uses

#### Scenario: Suppress preview
- **WHEN** a suppress card is displayed
- **THEN** the card MUST show both estimated damage and weak application text

### Requirement: Existing stun remains compatible
The existing stun behavior SHALL remain compatible with the expanded status system.

#### Scenario: Stun blocks attack cards
- **WHEN** the hero is stunned and an attack or tactical damage card is displayed
- **THEN** the card MUST be disabled or blocked and MUST show `眩晕中`

#### Scenario: Stun allows non-attack defensive card
- **WHEN** the hero is stunned and a pure guard card is displayed
- **THEN** the card MUST remain usable unless the implementation explicitly classifies it as an attack card

#### Scenario: Stun consumed by non-attack action
- **WHEN** the stunned hero uses heal, stat boost, guard, or skip according to existing stun flow
- **THEN** stun MUST be consumed consistently and status UI MUST update

