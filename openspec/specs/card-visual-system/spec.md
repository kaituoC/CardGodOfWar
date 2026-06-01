# Card Visual System

## Purpose
Defines card visual semantics: type-first color accents, stable internal layout regions, explicit interaction/disabled states, and text readability.
## Requirements
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

### Requirement: Cards have stable internal layout
Card components SHALL use fixed internal regions so content changes do not resize or shift the card layout.

#### Scenario: Card structural regions
- **WHEN** a card renders
- **THEN** it MUST reserve stable regions for type/rarity header, main value, element or stat detail, estimate text, and action/state text

#### Scenario: Estimate region is stable
- **WHEN** estimate text changes between damage, crit, heal, stat boost, unavailable, or blocked states
- **THEN** the estimate region MUST keep enough reserved height for one or two compact lines without moving the action/state region outside the card

#### Scenario: Card dimensions are stable
- **WHEN** cards of different type, rarity, or estimate text render in the same hand
- **THEN** they MUST use a desktop baseline of `160px` width and `200px` minimum height so the hand does not visually jump

#### Scenario: Narrow responsive card width
- **WHEN** the window is too narrow for the desktop baseline card width
- **THEN** cards MAY shrink responsively but MUST NOT go below `148px` width

### Requirement: Card interaction states are explicit
Card components SHALL visibly distinguish available, hover, pressed, disabled, and blocked-by-stun states without changing layout dimensions.

#### Scenario: Available card hover
- **WHEN** the pointer hovers over an available card
- **THEN** the card MAY lift or brighten subtly but MUST NOT change width or height

#### Scenario: Disabled card
- **WHEN** a card is disabled
- **THEN** it MUST show muted styling, MUST NOT use the normal hover lift, and MUST NOT emit play action on click

#### Scenario: Blocked by stun card
- **WHEN** the hero is stunned and an attack card renders
- **THEN** the card MUST show blocked text `眩晕中` in the estimate area and MUST NOT present itself as a usable damage option

#### Scenario: Blocked by stun action text
- **WHEN** the estimate area already shows `眩晕中`
- **THEN** the action/state area SHOULD show a neutral disabled affordance such as `不可用` and MUST NOT duplicate `眩晕中`

#### Scenario: Blocked by stun fallback text
- **WHEN** the estimate area is unavailable for a stunned attack card
- **THEN** the action/state area MAY show `眩晕中` as fallback so the reason remains visible

### Requirement: Card text remains readable
Card text SHALL fit within the card at supported desktop sizes.

#### Scenario: Long estimate text
- **WHEN** an attack estimate includes crit risk text
- **THEN** the estimate text MUST fit within the card by using compact text, wrapping, or line clamping without overlapping other regions

#### Scenario: Stat label text
- **WHEN** a stat boost card displays a stat name and amount
- **THEN** the stat label and value MUST remain readable within the card detail area

#### Scenario: Action text
- **WHEN** a card is available, disabled, or blocked
- **THEN** the action/state text MUST be readable and MUST stay aligned with other cards in the same hand

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

