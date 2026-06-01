## MODIFIED Requirements

### Requirement: Card outcome estimates are shown
The battle UI SHALL show compact card outcome estimates based on the current battle state, monster intent, statuses, shield state, card-bias-independent card data, and applicable relic effects, with safe fallback when an estimate is unavailable.

#### Scenario: Attack card estimate
- **WHEN** a physical or magic attack card is displayed
- **THEN** the card MUST show estimated damage against the current monster using current defensive intent effects, monster break-defense status, and applicable hero relic modifiers as render-ready text such as `预计 18`

#### Scenario: Attack card estimate includes hero crit risk
- **WHEN** an attack card estimate is calculated with the hero's crit chance above 0
- **THEN** the estimate MUST include `critRate`, `critDamage`, `critMultiplier`, and render-ready text such as `预计 18 | 暴击15%→27`

#### Scenario: Monster crit boost does not affect hero card estimate
- **WHEN** the current monster intent includes triggered `critBoost`
- **THEN** hero attack card estimates MUST NOT use the monster crit boost multiplier or `强化暴击` label

#### Scenario: Hero crit relic estimate is labeled
- **WHEN** the hero owns a relic that changes hero crit multiplier
- **THEN** the attack estimate MUST use the relic-adjusted crit damage and expose the adjusted `critMultiplier`

#### Scenario: Heal card estimate uses actual recoverable HP
- **WHEN** a heal card is displayed
- **THEN** the card MUST show estimated HP restoration after max HP clamping

#### Scenario: Heal estimate does not require monster intent
- **WHEN** a heal card estimate is calculated while monster intent is missing or unavailable
- **THEN** the estimate MUST still return the actual recoverable HP and MUST NOT return unavailable solely because monster intent is missing

#### Scenario: Heal overflow relic estimate
- **WHEN** a heal card is displayed and a relic converts healing overflow to shield
- **THEN** the card estimate MUST show both actual HP restoration and shield gained from overflow when overflow is positive

#### Scenario: Stat boost card estimate
- **WHEN** a stat boost card is displayed
- **THEN** the card MUST show the stat and amount to be increased

#### Scenario: Stat boost estimate does not require monster intent
- **WHEN** a stat boost card estimate is calculated while monster intent is missing or unavailable
- **THEN** the estimate MUST still return the stat and amount to be increased and MUST NOT return unavailable solely because monster intent is missing

#### Scenario: Guard card estimate
- **WHEN** a guard/defense card is displayed
- **THEN** the card MUST show estimated shield gain

#### Scenario: Tactical status card estimate
- **WHEN** an armor-break or suppress card is displayed
- **THEN** the card MUST show estimated damage and the status that will be applied if the monster survives

#### Scenario: Stunned attack estimate
- **WHEN** the hero is stunned and an attack or tactical damage card is displayed
- **THEN** the card MUST show blocked text `眩晕中` instead of showing it as a valid damage choice or `0` damage

#### Scenario: Missing intent estimate fallback
- **WHEN** a battle has no actionable monster intent because it is completed, restored from an old save, or temporarily unavailable
- **THEN** attack card estimate calculation MUST return `{ type: 'unavailable', reason: 'missingIntent' | 'gameOver', text: '' }` or no rendered estimate instead of throwing an exception

### Requirement: Preview helpers stay consistent with engine formulas
The preview calculation SHALL use the same non-random damage, status, shield, and relic formula inputs as the battle engine.

#### Scenario: Estimate matches non-crit damage
- **WHEN** critRate is 0 and an attack card estimate is calculated
- **THEN** the estimated damage MUST equal the actual damage dealt by that card under the same state and intent

#### Scenario: Estimate includes shield
- **WHEN** current monster intent includes triggered shield
- **THEN** attack card estimated damage MUST include shield reduction

#### Scenario: Estimate includes element immunity
- **WHEN** current monster intent includes triggered element immunity matching the card element
- **THEN** attack card estimated damage MUST use neutral element multiplier 1.0

#### Scenario: Estimate includes break defense
- **WHEN** the monster has break-defense status
- **THEN** hero attack estimated damage MUST use the reduced effective monster defense

#### Scenario: Monster intent estimate includes weak
- **WHEN** the monster has weak before executing its stored intent
- **THEN** monster intent estimated damage and crit damage MUST include weak reduction

#### Scenario: Estimate includes outgoing relic
- **WHEN** a relic modifies a qualifying outgoing hero attack
- **THEN** the estimated damage and crit damage MUST include that relic modifier

#### Scenario: Monster intent estimate matches non-crit monster action
- **WHEN** monster critRate is 0 and monster action executes a stored intent
- **THEN** the intent's estimated damage MUST equal the actual monster damage under the same state and intent

## ADDED Requirements

### Requirement: Reward previews are readable
The reward selection UI SHALL present each reward with enough information to make a choice without reading implementation details.

#### Scenario: Attribute reward preview
- **WHEN** an attribute reward is displayed
- **THEN** it MUST show the affected stat and exact increase amount

#### Scenario: Relic reward preview
- **WHEN** a relic reward is displayed
- **THEN** it MUST show relic name and short effect description

#### Scenario: Card-bias reward preview
- **WHEN** a card-bias reward is displayed
- **THEN** it MUST show the affected card category and bias direction

### Requirement: Status and relic preview fallback is safe
Preview helpers SHALL degrade safely when optional new state is missing.

#### Scenario: Missing relic list
- **WHEN** preview helpers receive old normalized hero state without relics before normalization completes
- **THEN** they MUST treat relics as an empty list rather than throwing

#### Scenario: Missing expanded statuses
- **WHEN** preview helpers receive old normalized battle state without expanded statuses before normalization completes
- **THEN** they MUST treat shield, break-defense, and weak as absent rather than throwing
