## Context

当前战斗页已经有核心信息：顶部状态栏、英雄/怪兽状态、怪兽意图、手牌、战斗日志、保存/返回操作。问题不在缺信息，而在层级和视觉语义还不够稳定：

- 手牌卡片尺寸偏窄，预估文本加入后容易显得拥挤。
- 攻击、治疗、强化卡的颜色差异主要来自星级背景，卡牌类型不够容易扫读。
- 底部操作按钮使用绝对定位，容易和手牌区形成视觉挤压。
- 怪兽意图预估存在 review 发现的准确性问题，必须先修正再打磨 UI。
- 窗口较窄或日志内容增多时，布局缺少明确的换行/收缩规则。

这个阶段不是给游戏换一套美术风格，而是在现有深色战斗面板上建立更清晰、更稳定的战斗阅读结构。

## Goals / Non-Goals

**Goals:**

- 让玩家第一眼能区分：当前关卡/回合、双方生命和属性、怪兽即将行动、可用手牌、战斗记录。
- 让卡牌通过颜色、标题、数值区、预估区和状态区表达类型与可用性。
- 让卡牌尺寸、间距、文本行数稳定，hover/disabled/stunned 不导致布局跳动。
- 修正预估和实际结算不一致的问题，保证 UI 优化建立在可信数值上。
- 支持常见桌面窗口和窄窗口，手牌不遮挡操作按钮，日志不挤压核心决策区。

**Non-Goals:**

- 不新增卡牌类型、怪兽技能、奖励机制或牌组构筑。
- 不引入新的 UI 组件库或动画库。
- 不重做主菜单、存档弹窗、结果弹窗。
- 不追求复杂特效；只允许轻量 hover/pressed/flash 反馈。
- 不引入 Vue component test 依赖；本阶段仍以纯单测、构建和手动烟雾为主。

## Decisions

### Decision 1: Fix preview correctness before visual polish

Implementation order MUST start with decision preview corrections:

1. Monster intent preview damage includes `enrageMultiplier` when Boss is enraged. This applies to the monster panel / `monsterIntent` damage shown for the monster's upcoming attack. It does NOT apply to hero card estimates, because hero attacks are not affected by Boss enrage.
2. Hero attack card preview uses hero crit assumptions only; monster `critBoost` affects monster action preview, not hero card preview.
3. Heal card preview shows actual recoverable HP: `min(rawHeal, hero.maxHp - hero.currentHp)`. Heal and stat boost estimates MUST still work when `monsterIntent` is missing, because they do not depend on monster intent.
4. Missing or unavailable `monsterIntent` returns a safe unavailable estimate instead of throwing for attack cards.

Recommended fallback type:

```ts
type CardOutcomeEstimate =
  | ExistingDamageHealStatBoostOrBlockedBranches
  | {
      type: 'unavailable'
      reason: 'missingIntent' | 'gameOver'
      text: ''
    }
```

Use `type: 'blocked'` only for player-action blockers such as stun. Do not reuse `blocked` for missing data or game-over states.

Rationale: visual polish should make choices clearer, not amplify wrong information.

Alternative considered: treat these as separate bugfixes outside the UI stage. Rejected because card and monster intent UI are the main consumers of these values.

### Decision 2: Use a two-zone battle page layout

BattleView should be organized into two visual zones:

```text
------------------------------------------------+
| StatusBar                                      |
+------------------------------------------------+
| HeroStatus        MonsterStatus + Intent       |
+------------------------------+-----------------+
| Hand / decision area          | BattleLog       |
| Card row/wrap                 |                 |
| Save / Back action bar        |                 |
+------------------------------+-----------------+
```

The hand/decision area owns cards and battle actions in normal document flow. The action bar MUST sit below the hand inside the left decision column, not between the hand and log, and not as an absolute overlay. Remove `position: absolute` from `.battle-actions-bar` during implementation.

Recommended desktop proportions:

- Main content left decision zone: about 60-68%.
- Battle log: about 32-40%, with a min width so log remains readable.
- Status row panels share width, but MonsterStatus may use slightly more horizontal space if intent text needs it.

Narrow-window behavior:

- Priority 1: preserve card readability at the default card width or the defined responsive minimum.
- Priority 2: reduce hand gaps and allow cards to wrap to a second row.
- Priority 3: shrink the BattleLog down to its readable minimum width.
- Priority 4: if the log can no longer remain readable beside the hand, move the BattleLog below the decision area.
- The page MUST avoid horizontal overflow at common narrow desktop widths.

### Decision 3: Cards get fixed layout slots

CardComponent should use stable internal slots:

```text
card
├─ rarity/type header
├─ main value block
├─ element/stat detail block
├─ estimate block
└─ action/state block
```

Default desktop sizing:

- Width: `160px`.
- Min height: `200px`.
- Responsive minimum width: `148px` only when needed for narrow windows.
- Border radius: 6-8px.
- Estimate block: fixed min-height for 1-2 lines, so cards do not change height when estimates appear.
- Action/state block: fixed height.

Text rules:

- Card title/type text MUST fit without overlap.
- Estimate text MAY wrap to two lines, but MUST NOT push the action block out of the card.
- Use smaller, tighter headings inside cards; avoid hero-scale text inside cards.

### Decision 4: Card color semantics come from card type first, rarity second

Use card type as the main scan color:

- Physical attack: `#e94560`.
- Magic attack: `#5dade2`.
- Heal: `#27ae60`.
- Stat boost: `#f0c040`.
- Stunned/disabled border/text accent: `#6c7380` with supporting muted text `#95a5a6`.

Use these as accents for borders, headers, badges, or main value areas. Do not flood the entire card with a solid saturated color; keep the dark card body readable.

Use rarity/star as a secondary treatment:

- Star count, small shine/border strength, or top badge.
- Do not make rarity gradient dominate card type color.

Rationale: in combat, “what can this card do now?” is more important than rarity decoration.

### Decision 5: Card states are explicit and layout-stable

Card states:

- `available`: normal opacity, clear hover lift/shadow.
- `hover`: subtle lift only; no width/height changes.
- `pressed`: small brightness/translate feedback.
- `disabled`: no click, muted opacity, no hover lift.
- `blockedByStun`: disabled style plus estimate text `眩晕中`.

Blocked attack cards MUST show why they are unavailable. Do not rely only on disabled opacity. The preferred placement for `眩晕中` is the estimate region because that is where card outcome information lives. The action/state region SHOULD show a neutral disabled state such as `不可用` or a muted disabled affordance, and MUST NOT duplicate `眩晕中` if the estimate region already shows it. If the estimate region is unavailable, the action/state region MAY show `眩晕中` as fallback.

### Decision 6: Keep design tokens local and conservative

Prefer existing SCSS conventions and current theme colors. Add component-local CSS variables or SCSS variables only when they remove duplication. Avoid a broad design-system refactor in this change.

The palette should remain dark combat UI, but not one-note:

- Keep dark panel base.
- Use type accents for cards.
- Keep HP/status colors distinct.
- Avoid making every surface the same blue/slate tone.

### Decision 7: Visual QA is part of acceptance

Because the current test stack has no DOM/component infrastructure, visual acceptance requires manual smoke checks after implementation:

- Normal desktop battle view.
- Narrow desktop/window view.
- Stunned hand with blocked attack cards.
- Boss before enrage and enraged states.
- Save/load restored battle.

Screenshots are recommended during implementation, but this change does not require adding browser automation as a formal test dependency.

## Risks / Trade-offs

- [Risk] Card colors become too decorative and reduce readability → Mitigation: type accent first, dark readable body, strong text contrast.
- [Risk] Wider cards reduce available hand space → Mitigation: allow controlled wrapping and keep card count fixed to current hand size.
- [Risk] Layout changes create hidden overflow in Electron windows → Mitigation: define min/max widths and manual smoke narrow windows.
- [Risk] Preview fallback type expands TypeScript touch points → Mitigation: keep fallback shape small and adapt only components that render estimates.
- [Risk] UI polish slips into gameplay changes → Mitigation: explicitly exclude new card/monster/reward mechanics.

## Migration Plan

1. Correct preview helper behavior and add focused unit tests.
2. Update estimate/fallback types only if needed.
3. Refactor card component internal layout and state styling.
4. Refactor hand/action/log layout in BattleView and CardHand.
5. Adjust status panels only where needed to preserve hierarchy.
6. Run `npm run test` and `npm run build`.
7. Perform manual smoke checks for desktop, narrow window, stunned, Boss, and restored save cases.

Rollback is safe: this change is visual/helper-layer only and does not change save format or combat progression semantics.
