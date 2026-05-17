## MODIFIED Requirements

### Requirement: Boss pressure is previewed
The battle UI SHALL make Boss enrage pressure visible before the player acts, and monster damage previews SHALL use the same enrage multiplier that execution will use.

#### Scenario: Boss before enrage
- **WHEN** the monster is a Boss and the current turn is before enrage
- **THEN** the UI MUST show how many turns remain before enrage starts

#### Scenario: Boss enraged
- **WHEN** the monster is a Boss and enrage is active
- **THEN** the UI MUST show the current enrage multiplier used by the monster intent

#### Scenario: Enraged intent damage includes multiplier
- **WHEN** a Boss is enraged and the current monster intent displays estimated damage
- **THEN** the displayed estimated damage and crit damage MUST include the intent's enrage multiplier so non-crit preview matches non-crit execution

#### Scenario: Enrage does not affect hero card estimates
- **WHEN** a Boss is enraged and the player views hero attack card estimates
- **THEN** hero card estimated damage and crit damage MUST NOT include the monster intent's enrage multiplier

### Requirement: Card outcome estimates are shown
The battle UI SHALL show compact card outcome estimates based on the current battle state and monster intent, with safe fallback when an estimate is unavailable.

#### Scenario: Attack card estimate
- **WHEN** a physical or magic attack card is displayed
- **THEN** the card MUST show estimated damage against the current monster using current defensive intent effects as render-ready text such as `预计 18`

#### Scenario: Attack card estimate includes hero crit risk
- **WHEN** an attack card estimate is calculated with the hero's crit chance above 0
- **THEN** the estimate MUST include `critRate`, `critDamage`, `critMultiplier`, and render-ready text such as `预计 18 | 暴击15%→27`

#### Scenario: Monster crit boost does not affect hero card estimate
- **WHEN** the current monster intent includes triggered `critBoost`
- **THEN** hero attack card estimates MUST NOT use the monster crit boost multiplier or `强化暴击` label

#### Scenario: Heal card estimate uses actual recoverable HP
- **WHEN** a heal card is displayed
- **THEN** the card MUST show the actual HP that would be restored after max HP clamping, not only the raw card coefficient amount

#### Scenario: Heal estimate does not require monster intent
- **WHEN** a heal card estimate is calculated while monster intent is missing or unavailable
- **THEN** the estimate MUST still return the actual recoverable HP and MUST NOT return unavailable solely because monster intent is missing

#### Scenario: Stat boost card estimate
- **WHEN** a stat boost card is displayed
- **THEN** the card MUST show the stat and amount to be increased

#### Scenario: Stat boost estimate does not require monster intent
- **WHEN** a stat boost card estimate is calculated while monster intent is missing or unavailable
- **THEN** the estimate MUST still return the stat and amount to be increased and MUST NOT return unavailable solely because monster intent is missing

#### Scenario: Stunned attack estimate
- **WHEN** the hero is stunned and an attack card is displayed
- **THEN** the card MUST show blocked text `眩晕中` instead of showing it as a valid damage choice or `0` damage

#### Scenario: Missing intent estimate fallback
- **WHEN** a battle has no actionable monster intent because it is completed, restored from an old save, or temporarily unavailable
- **THEN** attack card estimate calculation MUST return `{ type: 'unavailable', reason: 'missingIntent' | 'gameOver', text: '' }` or no rendered estimate instead of throwing an exception

### Requirement: Preview helpers stay consistent with engine formulas
The preview calculation SHALL use the same non-random damage formula inputs as the battle engine.

#### Scenario: Estimate matches non-crit damage
- **WHEN** critRate is 0 and an attack card estimate is calculated
- **THEN** the estimated damage MUST equal the actual damage dealt by that card under the same state and intent

#### Scenario: Estimate includes shield
- **WHEN** current monster intent includes triggered shield
- **THEN** attack card estimated damage MUST include shield reduction

#### Scenario: Estimate includes element immunity
- **WHEN** current monster intent includes triggered element immunity matching the card element
- **THEN** attack card estimated damage MUST use neutral element multiplier 1.0

#### Scenario: Monster intent estimate matches non-crit monster action
- **WHEN** monster critRate is 0 and monster action executes a stored intent
- **THEN** the intent's estimated damage MUST equal the actual monster damage under the same state and intent
