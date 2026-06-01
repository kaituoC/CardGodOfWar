## ADDED Requirements

### Requirement: Victory creates a pending reward choice
The system SHALL create a pending reward choice after hero victory and before the next level starts.

#### Scenario: Hero victory opens reward choice
- **WHEN** the hero defeats the monster during player action
- **THEN** the battle/run state MUST contain a pending reward choice with exactly three selectable rewards

#### Scenario: Monster victory does not create reward choice
- **WHEN** the battle ends with monster victory or turn-limit failure
- **THEN** the system MUST NOT create a pending reward choice

#### Scenario: Reward choice blocks next level
- **WHEN** a reward choice is pending
- **THEN** the player MUST NOT advance to the next level until one reward is selected

#### Scenario: Reward choice survives save restore
- **WHEN** the game is saved and loaded while a reward choice is pending
- **THEN** the same selectable reward IDs and reward details MUST be restored

### Requirement: Reward choices include supported reward categories
The reward generator SHALL support attribute, relic, and card-bias rewards.

#### Scenario: Attribute reward generated
- **WHEN** a reward choice includes an attribute reward
- **THEN** the reward MUST describe the affected hero stat and exact increase amount

#### Scenario: Relic reward generated
- **WHEN** a reward choice includes a relic reward
- **THEN** the reward MUST reference a relic ID that the hero does not already own

#### Scenario: Card-bias reward generated
- **WHEN** a reward choice includes a card-bias reward
- **THEN** the reward MUST describe the affected card type, element, or rarity bias and the exact bias amount or level

#### Scenario: No duplicate rewards in one offer
- **WHEN** the reward generator creates a three-reward offer
- **THEN** the offer MUST NOT contain duplicate reward IDs

### Requirement: Selecting a reward applies exactly one reward
The system SHALL apply one selected reward atomically and clear the pending reward state.

#### Scenario: Select attribute reward
- **WHEN** the player selects an attribute reward
- **THEN** the hero stat MUST increase by the reward amount and the pending reward choice MUST be cleared

#### Scenario: Select max HP reward
- **WHEN** the player selects a max HP attribute reward
- **THEN** hero max HP MUST increase and current HP MUST increase by the same amount without exceeding the new max HP

#### Scenario: Select relic reward
- **WHEN** the player selects a relic reward
- **THEN** the relic ID MUST be added to the hero relic list exactly once and the pending reward choice MUST be cleared

#### Scenario: Select card-bias reward
- **WHEN** the player selects a card-bias reward
- **THEN** the run card-bias state MUST be updated and the pending reward choice MUST be cleared

#### Scenario: Cannot select unavailable reward
- **WHEN** a reward ID is not present in the pending reward choice
- **THEN** the system MUST reject the selection and MUST NOT mutate hero, relic, card-bias, level, or battle state

### Requirement: Reward selection advances progression explicitly
The system SHALL separate reward selection from starting the next battle.

#### Scenario: Reward selected before next level
- **WHEN** a reward is selected after victory
- **THEN** the system MUST allow the next-level action to apply normal level increment and create the next battle

#### Scenario: Next-level action without reward is blocked
- **WHEN** the player attempts to start the next level while a reward choice is pending
- **THEN** the system MUST keep the player in the reward flow and MUST NOT create a new battle

#### Scenario: Reward dialog closes only after selection
- **WHEN** a reward choice is pending in the UI
- **THEN** the reward selection UI MUST keep at least one visible path to select a reward and MUST NOT offer a normal close action that skips rewards

### Requirement: First-version reward pool remains bounded
The first implementation SHALL provide a bounded reward pool suitable for a compact strategy update.

#### Scenario: Attribute pool includes core stats
- **WHEN** attribute rewards are available
- **THEN** the pool MUST include physical attack, magic attack, defense, max HP, and crit rate rewards

#### Scenario: Card-bias pool supports current generated-hand model
- **WHEN** card-bias rewards are available
- **THEN** the pool MUST include at least one type bias and at least one element bias

#### Scenario: Reward pool excludes out-of-scope systems
- **WHEN** rewards are generated for this change
- **THEN** rewards MUST NOT require map routes, shops, deck removal, card upgrade screens, action points, or meta-progression
