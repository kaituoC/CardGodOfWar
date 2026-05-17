## ADDED Requirements

### Requirement: Monster panel displays current intent
The battle UI SHALL display the current monster intent in the monster status area during player action.

#### Scenario: Intent attack displayed
- **WHEN** the battle is in player action phase
- **THEN** the monster panel MUST show the monster's next attack type and estimated damage

#### Scenario: Triggered skill displayed
- **WHEN** the current monster intent contains triggered skills
- **THEN** the monster panel MUST show those triggered skill labels

#### Scenario: No triggered skills displayed compactly
- **WHEN** the current monster intent contains no triggered skills
- **THEN** the monster panel MUST still show the next attack without occupying excessive empty space

### Requirement: Boss pressure is previewed
The battle UI SHALL make Boss enrage pressure visible before the player acts.

#### Scenario: Boss before enrage
- **WHEN** the monster is a Boss and the current turn is before enrage
- **THEN** the UI MUST show how many turns remain before enrage starts

#### Scenario: Boss enraged
- **WHEN** the monster is a Boss and enrage is active
- **THEN** the UI MUST show the current enrage multiplier used by the monster intent

### Requirement: Card outcome estimates are shown
The battle UI SHALL show compact card outcome estimates based on the current battle state and monster intent.

#### Scenario: Attack card estimate
- **WHEN** a physical or magic attack card is displayed
- **THEN** the card MUST show estimated damage against the current monster using current defensive intent effects as render-ready text such as `预计 18`

#### Scenario: Attack card estimate includes crit risk
- **WHEN** an attack card estimate is calculated with a crit chance above 0
- **THEN** the estimate MUST include `critRate`, `critDamage`, `critMultiplier`, and render-ready text such as `预计 18 | 暴击15%→27`

#### Scenario: Crit boost estimate is labeled
- **WHEN** the current monster intent includes triggered crit boost affecting preview risk
- **THEN** the estimate MUST use a distinct crit label such as `强化暴击15%→36`

#### Scenario: Heal card estimate
- **WHEN** a heal card is displayed
- **THEN** the card MUST show estimated HP restoration

#### Scenario: Stat boost card estimate
- **WHEN** a stat boost card is displayed
- **THEN** the card MUST show the stat and amount to be increased

#### Scenario: Stunned attack estimate
- **WHEN** the hero is stunned and an attack card is displayed
- **THEN** the card MUST show blocked text `眩晕中` instead of showing it as a valid damage choice or `0` damage

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
