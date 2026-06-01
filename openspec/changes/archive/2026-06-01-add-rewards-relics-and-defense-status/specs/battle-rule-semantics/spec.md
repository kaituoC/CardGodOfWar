## MODIFIED Requirements

### Requirement: Canonical turn sequence
The battle engine SHALL resolve every non-terminal turn through the same ordered sequence: monster intent generation for the player action phase, player action including card/relic/status resolution, monster action using the stored intent, shield and status consumption, end-of-turn status resolution, turn advancement, battle-end check, next-hand generation using card-bias data, and next monster intent generation.

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

#### Scenario: Skip action continues to monster action
- **WHEN** the player skips the turn and the battle is not already over
- **THEN** the system MUST resolve a monster action from the stored monster intent before advancing to the next player turn

#### Scenario: Defense action continues to monster action
- **WHEN** the player uses a guard, armor-break, suppress, or other defensive/tactical card and the battle is not already over
- **THEN** the system MUST resolve a monster action from the stored monster intent before advancing to the next player turn

#### Scenario: Hero victory stops monster action
- **WHEN** the player action reduces the monster HP to 0
- **THEN** the system MUST end the battle with hero victory, create pending victory rewards, and avoid resolving a monster action or generating a next-turn intent

#### Scenario: Next turn refreshes intent
- **WHEN** the turn advances and a new hand is generated
- **THEN** the system MUST also generate a monster intent for the new current turn

## ADDED Requirements

### Requirement: Damage calculation applies new modifiers in deterministic order
Damage resolution SHALL apply shield, break-defense, weak, and relic modifiers in a deterministic order shared by previews and actual combat.

#### Scenario: Hero attack uses effective monster defense
- **WHEN** hero attack damage is calculated against a monster with break defense
- **THEN** defense reduction MUST be applied before elemental multiplier and crit calculation

#### Scenario: Hero outgoing relic applies consistently
- **WHEN** a hero outgoing damage relic condition applies
- **THEN** the relic modifier MUST be applied in the configured damage step and the same step MUST be used by previews

#### Scenario: Monster weak applies before shield absorption
- **WHEN** a weak monster attacks a shielded hero
- **THEN** weak damage reduction MUST be applied before shield absorbs final incoming damage

#### Scenario: Shield absorption does not change raw dealt damage metadata
- **WHEN** shield absorbs all or part of incoming monster damage
- **THEN** events MUST preserve enough metadata to distinguish calculated incoming damage, shield absorbed amount, and HP damage

#### Scenario: Break defense uses fixed first-version tuning
- **WHEN** break-defense status is applied by a first-version player card or relic
- **THEN** it MUST reduce effective defense by 40%, rounded down, for the next 3 hero attack or tactical damage actions against that target

#### Scenario: Weak uses fixed first-version tuning
- **WHEN** weak status is applied by a first-version player card
- **THEN** it MUST reduce the next monster attack to 80% of its otherwise final pre-shield damage and then be consumed

### Requirement: Reward selection replaces fixed victory growth
The battle progression rules SHALL use reward selection for victory growth instead of unconditional fixed stat growth.

#### Scenario: Hero victory does not automatically apply fixed growth
- **WHEN** the hero wins a battle
- **THEN** the engine MUST create reward choices and MUST NOT immediately apply all fixed `HERO_VICTORY_GROWTH` values

#### Scenario: Attribute reward applies chosen growth only
- **WHEN** the player chooses an attribute reward
- **THEN** only the chosen attribute reward MUST apply before the next level

#### Scenario: Non-attribute reward does not add hidden stats
- **WHEN** the player chooses a relic or card-bias reward
- **THEN** the system MUST NOT also apply hidden fixed stat growth unless explicitly represented as part of that reward

### Requirement: Card generation uses card-bias state
Card generation SHALL use persistent card-bias state while preserving a three-card hand each turn.

#### Scenario: Biased hand still has three cards
- **WHEN** a new hand is generated with any card-bias state
- **THEN** the hand MUST contain exactly three cards

#### Scenario: Type bias affects generation
- **WHEN** the run has a card type bias
- **THEN** future generated hands MUST use adjusted type weights reflecting that bias

#### Scenario: Element bias affects attack cards
- **WHEN** the run has an element bias
- **THEN** generated physical or magic attack cards MUST use adjusted element weights reflecting that bias

#### Scenario: Neutral bias preserves baseline behavior
- **WHEN** the run has no card-bias rewards
- **THEN** card generation MUST preserve baseline card generation behavior except for the intentionally added defense/tactical card pool

#### Scenario: Card bias levels are capped
- **WHEN** the same card-bias reward category is selected repeatedly
- **THEN** its bias level MUST stack additively up to the configured cap of 3 and MUST NOT grow beyond that cap
