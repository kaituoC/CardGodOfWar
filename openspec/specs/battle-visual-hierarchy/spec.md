# Battle Visual Hierarchy

## Purpose
Defines the battle page's visual hierarchy: prioritizing current-turn decisions across status, combatants, hand, and log, with narrow-window support and stable spacing during combat feedback.

## Requirements

### Requirement: Battle page presents clear decision hierarchy
The battle page SHALL present status, combatants, player decisions, and battle log in a stable hierarchy that prioritizes current turn decisions.

#### Scenario: Desktop hierarchy
- **WHEN** the battle page renders in a normal desktop Electron window
- **THEN** the page MUST show the status bar first, hero and monster panels second, the hand/decision area as the primary lower-left area, and the battle log as a secondary lower-right area

#### Scenario: Decision area remains primary
- **WHEN** cards, card estimates, battle actions, and battle log are all visible
- **THEN** cards MUST remain visually more prominent than the log and MUST NOT be overlapped by save/back buttons

#### Scenario: Status panels stay readable
- **WHEN** hero and monster status panels render with monster intent content
- **THEN** HP bars, core stats, intent text, and skill labels MUST remain readable without text overlap

### Requirement: Battle page supports narrow windows
The battle page SHALL adapt to narrower desktop windows without horizontal overflow or hidden controls.

#### Scenario: Hand wraps before overflowing
- **WHEN** the available hand width cannot fit all cards in one row
- **THEN** the layout MUST first reduce hand gaps and wrap cards before allowing horizontal page overflow

#### Scenario: Log does not crush cards
- **WHEN** the battle page becomes narrow
- **THEN** the battle log MUST shrink to its readable minimum before card text or action controls become unreadable

#### Scenario: Log moves below after readable minimum
- **WHEN** the battle log cannot remain readable beside the hand after shrinking to its minimum
- **THEN** the battle log MUST move below the decision area or use an equivalent layout that preserves card readability

#### Scenario: Action bar remains reachable
- **WHEN** the hand wraps or the window height is reduced
- **THEN** save/back actions MUST remain visible below the hand in normal layout flow and MUST NOT cover cards

### Requirement: Layout spacing remains stable during combat feedback
Combat feedback SHALL not cause major layout shifts in the battle page.

#### Scenario: Floating numbers do not shift layout
- **WHEN** damage or heal floating numbers appear
- **THEN** they MUST overlay visually without changing the size or position of status panels, cards, action buttons, or the battle log

#### Scenario: Flash states do not resize panels
- **WHEN** hero, monster, or enrage flash effects trigger
- **THEN** affected panels MUST keep their layout dimensions
