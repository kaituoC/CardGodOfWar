## MODIFIED Requirements

### Requirement: 怪兽面板网格属性与技能标签
怪兽状态面板中的属性 MUST 使用 2×2 网格布局展示，标题居中且使用红色区分。技能以彩色标签形式展示。元素克制信息整合到属性网格中。怪兽面板 MUST 在玩家行动阶段展示当前怪兽意图，包括下一行动、预计伤害、触发技能、怪兽原型、状态标签和 Boss 压力信息。怪兽意图区域 MUST 使用紧凑但明确的层级，不得挤压 HP 条或属性网格。

#### Scenario: 怪兽属性与技能展示
- **WHEN** 怪兽状态面板渲染
- **THEN** 显示"怪兽 元素名"或具体原型/Boss 名称标题（红色，居中），HP 条下方为 2×2 网格（物攻/魔攻/防御/元素），技能以彩色标签横向排列

#### Scenario: 怪兽原型展示
- **WHEN** 怪兽拥有原型元数据
- **THEN** 怪兽状态面板 MUST 显示可读原型名称或 Boss 名称

#### Scenario: 怪兽状态展示
- **WHEN** 怪兽拥有破甲、虚弱或其他可见状态
- **THEN** 怪兽状态面板 MUST 显示紧凑状态标签，包含必要的数值和剩余持续信息

#### Scenario: 怪兽意图展示
- **WHEN** 战斗处于玩家行动阶段且存在当前怪兽意图
- **THEN** 怪兽状态面板 MUST 显示下一行动类型、预计伤害、已触发技能标签和原型压力提示（如果存在）

#### Scenario: Boss 压力展示
- **WHEN** 当前怪兽是 Boss
- **THEN** 怪兽状态面板 MUST 显示狂暴倒计时或当前狂暴倍率，并在 Stone General 等固定 Boss 中显示其核心压力提示

#### Scenario: 怪兽意图不挤压基础状态
- **WHEN** 怪兽同时显示属性、技能、意图、状态标签和 Boss 压力
- **THEN** HP 条、属性网格、意图内容、状态标签和 Boss 压力 MUST 不重叠，并保持可读

### Requirement: 卡牌结果预估展示
卡牌组件 MUST 在不破坏现有卡牌布局的前提下显示当前战斗状态下的紧凑结果预估，包括攻击、治疗、强化、防御、破甲和虚弱等新战术结果。预估文本 MUST 被放置在卡牌的固定预估区域中，并且不同类型卡牌的预估区域 MUST 对齐。

#### Scenario: 攻击卡展示预计伤害
- **WHEN** 攻击卡在玩家行动阶段渲染
- **THEN** 卡牌 MUST 显示对当前怪兽的预计伤害

#### Scenario: 治疗卡展示预计治疗
- **WHEN** 治疗卡在玩家行动阶段渲染
- **THEN** 卡牌 MUST 显示预计恢复 HP，并在有溢出转护盾时显示护盾收益

#### Scenario: 强化卡展示属性变化
- **WHEN** 属性提升卡在玩家行动阶段渲染
- **THEN** 卡牌 MUST 显示将提升的属性和数值

#### Scenario: 防御卡展示护盾
- **WHEN** 防御卡在玩家行动阶段渲染
- **THEN** 卡牌 MUST 显示预计获得的护盾值

#### Scenario: 战术卡展示状态
- **WHEN** 破甲或压制卡在玩家行动阶段渲染
- **THEN** 卡牌 MUST 显示预计伤害和将施加的状态

#### Scenario: 卡牌预估区域对齐
- **WHEN** 手牌中同时存在攻击、治疗、强化、防御、战术和不可用卡牌
- **THEN** 每张卡的预估文本 MUST 位于一致的视觉区域，不得导致卡牌高度明显跳动

## ADDED Requirements

### Requirement: Reward selection UI is first-class
The UI SHALL show a dedicated victory reward selection surface after hero victory.

#### Scenario: Reward dialog shows three choices
- **WHEN** hero victory creates pending rewards
- **THEN** the UI MUST show exactly three reward choices with name, category, and effect description

#### Scenario: Reward choice is selectable
- **WHEN** the player clicks a reward choice
- **THEN** the UI MUST call the reward selection action with the selected reward ID

#### Scenario: Next level unavailable before reward
- **WHEN** reward choice is pending
- **THEN** the UI MUST NOT show a working direct next-level action that bypasses reward selection

#### Scenario: Reward UI fits desktop battle view
- **WHEN** reward selection is displayed in the normal Electron window
- **THEN** reward cards MUST fit without overlapping result actions, battle logs, or persistent navigation controls

### Requirement: Hero panel displays relics and statuses
The hero status UI SHALL display owned relics and active hero statuses compactly.

#### Scenario: Hero relics displayed
- **WHEN** the hero owns one or more relics
- **THEN** the hero status area MUST show compact relic labels or tags

#### Scenario: Hero shield displayed
- **WHEN** the hero has shield
- **THEN** the hero status area MUST show shield amount

#### Scenario: Hero negative statuses displayed
- **WHEN** the hero has stun or another supported hero-side negative status
- **THEN** the hero status area MUST show compact status labels without hiding HP or core stats

### Requirement: New UI surfaces remain layout-safe
Reward, relic, status, archetype, and defensive card UI SHALL not regress battle readability.

#### Scenario: Battle hand remains primary
- **WHEN** the battle UI renders with relics, statuses, and defensive cards
- **THEN** the hand area MUST remain readable and cards MUST NOT be overlapped by status or action controls

#### Scenario: Logs remain readable
- **WHEN** new relic/status/reward log entries exist
- **THEN** BattleLog MUST remain scrollable and MUST NOT force the hand below usable size on normal desktop widths

#### Scenario: Narrow window remains usable
- **WHEN** the window is narrow enough for responsive layout
- **THEN** relic/status tags and reward choices MUST wrap or compact without causing horizontal overflow
