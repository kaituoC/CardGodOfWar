## ADDED Requirements

### Requirement: Battle state includes explicit phase
The battle state SHALL include an explicit phase that represents whether the battle is waiting for player action, resolving monster action, resolving end-of-turn effects, or complete.

#### Scenario: New battle starts in player action phase
- **WHEN** a new battle is created
- **THEN** the battle phase MUST be player action

#### Scenario: Completed battle enters game over phase
- **WHEN** the battle reaches a hero victory, monster victory, or max-turn defeat
- **THEN** the battle phase MUST be game over

#### Scenario: Player input is accepted only during player action phase
- **WHEN** the battle phase is not player action
- **THEN** the system MUST reject player card and skip actions

### Requirement: Battle state records level and result
The battle state SHALL record the level that generated the battle and SHALL represent battle result separately from transient phase data.

#### Scenario: Created battle stores level
- **WHEN** a battle is created for level N
- **THEN** the battle state MUST store level N

#### Scenario: Active battle has no result
- **WHEN** a battle is still active
- **THEN** the battle result MUST be empty or null

#### Scenario: Finished battle has result
- **WHEN** the battle ends
- **THEN** the battle result MUST identify hero victory or monster victory

### Requirement: Run hero and battle hero have explicit synchronization points
The game state SHALL treat the run-level hero as the between-battle snapshot and the battle-level hero as the active in-battle state.

#### Scenario: Battle starts from run hero snapshot
- **WHEN** a battle starts
- **THEN** the battle hero MUST be initialized from the current run hero snapshot

#### Scenario: Victory updates run hero from battle hero
- **WHEN** the player advances to the next level after victory
- **THEN** the run hero MUST be updated from the victorious battle hero plus victory growth

#### Scenario: Battle actions do not silently mutate run hero
- **WHEN** the player plays cards during an active battle
- **THEN** the system MUST update the battle hero and MUST NOT silently mutate the run hero until an explicit synchronization point

### Requirement: Save data restores canonical battle state
The save system SHALL persist enough data to restore the run state and active battle state without changing battle semantics.

#### Scenario: Save active battle
- **WHEN** the game saves during an active battle
- **THEN** the save data MUST include level, run hero snapshot, battle state, and timestamp

#### Scenario: Restore active battle
- **WHEN** the player loads a save with battle state
- **THEN** the system MUST restore the battle state, run hero snapshot, level, phase, result, hand, and status effects consistently

#### Scenario: Restore older save
- **WHEN** the player loads an older save that lacks newly added battle fields
- **THEN** the system MUST provide safe default values that preserve the saved battle as closely as possible

### Requirement: Card generation uses battle level consistently
The battle engine SHALL use the battle state's level when generating new hands during turn advancement.

#### Scenario: Initial hand uses battle level
- **WHEN** a battle is created for level N
- **THEN** the initial hand MUST be generated using level N

#### Scenario: Next hand uses battle level
- **WHEN** a turn advances and a new hand is generated
- **THEN** the new hand MUST be generated using the battle state's level
