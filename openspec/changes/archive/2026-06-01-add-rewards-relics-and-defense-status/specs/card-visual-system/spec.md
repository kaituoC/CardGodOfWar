## MODIFIED Requirements

### Requirement: Cards use type-first visual semantics
Card visuals SHALL communicate card type before rarity decoration, including newly introduced defense and tactical/status cards.

#### Scenario: Physical attack card styling
- **WHEN** a physical attack card renders
- **THEN** it MUST use `#e94560` as the primary physical accent in the card border, header, badge, or main value area

#### Scenario: Magic attack card styling
- **WHEN** a magic attack card renders
- **THEN** it MUST use `#5dade2` as the primary magic accent and MUST remain visually distinct from physical attack styling

#### Scenario: Heal card styling
- **WHEN** a heal card renders
- **THEN** it MUST use `#27ae60` as the primary recovery accent and MUST be visually distinct from attack cards

#### Scenario: Stat boost card styling
- **WHEN** a stat boost card renders
- **THEN** it MUST use `#f0c040` as the primary enhancement accent and MUST be visually distinct from attack and heal cards

#### Scenario: Defense card styling
- **WHEN** a guard or defense card renders
- **THEN** it MUST use a distinct defensive accent such as `#8e9aaf` and MUST remain visually distinct from attack, heal, and stat boost cards

#### Scenario: Tactical status card styling
- **WHEN** an armor-break, suppress, or tactical status card renders
- **THEN** it MUST use a distinct tactical/control accent such as `#b084cc` and MUST remain visually distinct from defense and permanent stat boost cards

#### Scenario: Disabled and stunned styling
- **WHEN** a card is disabled or blocked by stun
- **THEN** it MUST use `#6c7380` as the disabled/stunned accent with muted supporting text `#95a5a6`

#### Scenario: Type colors are accents
- **WHEN** type colors are applied
- **THEN** they MUST be used as accents rather than full saturated card backgrounds so card text remains readable

#### Scenario: Rarity remains secondary
- **WHEN** a card has a star rating
- **THEN** rarity styling MUST be visible but MUST NOT override the card type's primary visual meaning

## ADDED Requirements

### Requirement: New card mechanics preserve stable card layout
Defense and tactical/status cards SHALL use the archived card structural regions and SHALL keep estimates readable inside the fixed estimate area.

#### Scenario: Defense estimate fits
- **WHEN** a defense card displays shield estimate text
- **THEN** the estimate MUST fit in the reserved estimate region without moving the action/state region outside the card

#### Scenario: Tactical estimate fits
- **WHEN** an armor-break or suppress card displays damage plus status text
- **THEN** the estimate MUST fit by using compact text, wrapping, or line clamping without overlapping other card regions

#### Scenario: Stunned tactical damage card
- **WHEN** the hero is stunned and a tactical damage card is blocked
- **THEN** the card MUST use the existing blocked-by-stun visual behavior and MUST NOT present itself as a usable damage option
