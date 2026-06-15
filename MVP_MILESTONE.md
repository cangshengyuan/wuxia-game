# MVP_MILESTONE.md — 最小可玩里程碑

> 本清单基于 `ARCHITECTURE.md`（项目最高规范）与当前代码库状态制定。
> 目标：用最少的内容跑通一条**「读档 → 探索场景 → 触发战斗 → 时间轴自动战斗 → 战斗结算 → 功法熟练度成长 → 存档」**的最小闭环，让玩家拥有一个可玩、可循环的游戏雏形。
>
> 所有里程碑严格遵守五层依赖方向：`types ← data ← engine ← store ← ui`。
> 每个里程碑均给出 **可验证的完成标准**，未达标不得宣称完成。

---

## 总览

| 里程碑 | 主题 | 交付物（用户可感知） | 工程闸 |
|--------|------|----------------------|--------|
| M0 | 基线（已完成） | 骨架 + 1 内功 + 1 剑法 + 单回合占位战斗 | ✅ lint/typecheck/test/build 绿 |
| M1 | 类型与数据契约对齐 ✅ | 4 内功 + 4 剑法 + 3 敌人 + 1 教学场景的可读 JSON | ✅ 全部 JSON 通过 zod/类型守卫校验 |
| M2 | 时间轴战斗引擎 ✅ | 用动态优先队列 + 事件总线打完一场战斗 | ✅ 战斗可分出胜负，事件流可日志化 |
| M3 | 战斗 UI 与战斗 store ✅ | 玩家点击"开战"看到时间轴推进与战报 | ✅ 战斗页可视化，无业务逻辑泄漏到 .tsx |
| M4 | 功法成长闭环 ✅ | 战斗后获得熟练度，达到阈值解锁新招式 | ✅ 熟练度门槛由 engine 计算，UI 仅读取 |
| M5 | 场景探索与战斗触发 | 主城/野外两个场景，野外可遇敌 | 场景切换走 store action，战斗在场景内触发 |
| M6 | 存档持久化 ✅ | 关闭网页再打开，进度（角色、功法、场景）保留 | gameStore 持久化到 localStorage，可清档 |
| M7 | 教学任务串联 | 一条"出村 → 击败山贼 → 习得新招"的主线任务 | 从新建角色到完成教学任务全流程可玩 |

完成 M0~M7 即视为达成「最小可玩里程碑」。

---

## M0 · 基线（已完成 ✅）

> 当前代码库已具备的内容，作为后续里程碑的起点。不再投入工作量。

- [x] React + TS + Vite + Zustand 工程骨架
- [x] 五层目录（`types / data / engine / store / ui`）
- [x] 1 个内功（`skill_internal_001_huntuan`）+ 1 个剑法（`skill_sword_010_qingmang`）
- [x] `skillEngine`：JSON 加载 + 类型守卫
- [x] `battleEngine.simulateOneTurn`：单回合占位伤害计算
- [x] `gameStore.defaultPlayer` + `battleStore.runOneTurn`
- [x] 工程闸：`lint` / `typecheck` / `test:run` / `build`
- [x] `App.tsx` 渲染玩家、技能目录、战斗快照与"执行一回合"按钮

---

## M1 · 类型与数据契约对齐 ✅

**目标**：把 `ARCHITECTURE.md §7、§8` 要求的"类型即契约 + 纯数据"落实，给后续战斗与成长准备好 JSON 内容与运行时校验。

### 1.1 完善类型契约
- [x] `types/skill.ts`：补 `unlockProficiency`（每个 `SkillMove` 的解锁熟练度阈值）、`element?`/`tag?`（占位即可）
- [x] `types/character.ts`：拆出 `SkillRuntime { skillId, proficiency, unlockedMoveIds }`；`CharacterState` 增加 `learnedSkills: SkillRuntime[]`、`speed: number`（用于战斗优先队列）
- [x] `types/battle.ts`：新增判别联合 `BattleEvent`（`SkillReady` / `SkillExecuted` / `DamageDealt` / `BattleEnded`）
- [x] `types/world.ts`（新增）：`SceneDefinition`、`EncounterEntry`
- [x] `types/item.ts`（新增占位）：`ItemDefinition`（M1 内只占位，不实现）
- [x] `types/event.ts`（新增）：导出 `BattleEvent` 等所有引擎事件类型
- [x] `types/id.ts`（新增）：定义 branded `SkillId / SceneId / EnemyId / ItemId / NpcId / QuestId`
- [x] `types/index.ts`：统一导出新增类型

**完成标准**：`npm run typecheck` 绿；现有 `gameStore.defaultPlayer` 升级使用 `learnedSkills` 而非 `equippedSkillIds`（保留 `equippedSkillIds` 但语义为"已装备的"招式或功法的子集）。 ✅

### 1.2 数据内容扩充（每个 JSON ≤ 200 行硬上限）
- [x] `data/skills/internal/index.json`：新增至 **4 个内功**（保留混元功，新增 3 个低阶内功，每个含 1~2 招式 + `unlockProficiency`）
- [x] `data/skills/sword/index.json`：新增至 **4 个剑法**（保留青蟒剑法，新增 3 个低阶剑法，每个含 2~3 招式）
- [x] `data/enemies/index.json`：新增 **3 个敌人**（山贼喽啰 / 山贼头目 / 野狼），每个含 `equippedSkillIds`、`attributes`、`speed`
- [x] `data/scenes/index.json`：新增 **2 个场景**（`scene_001_village` 主城新手村、`scene_002_outskirts` 村外野径），含 `encounters` 字段引用敌人 ID
- [x] `data/npcs/index.json`：新增 **1 个教学 NPC**（村口剑客，用于触发教学任务）
- [x] `data/quests/index.json`：新增 **1 条主线任务**（`quest_main_001_first_blood`：出村 → 击败山贼）
- [x] `INDEX.md`（新增）：登记本次所有新 ID（ARCHITECTURE.md §11 要求）

### 1.3 运行时校验
- [x] `engine/skillEngine.ts`：扩展类型守卫覆盖 `unlockProficiency`；新增 `getSkillsByCategory` / `getMoveById`
- [x] `engine/world/sceneEngine.ts`（新增）：`getSceneById` / `listScenes`
- [x] `engine/world/enemyEngine.ts`（新增）：`getEnemyById` / `buildEnemyState`（从 JSON 构建 `CharacterState`）
- [x] 为 `engine/skillEngine.ts`、`engine/world/*` 各加一个 vitest 单测，断言能加载并校验 JSON
- [x] 所有新增 `.ts` 文件包含 `@module / @layer / @forbidden` 头部注释

**完成标准**：`npm run lint && npm run typecheck && npm run test:run && npm run build` 全绿；JSON 文件均未超过 200 行硬上限；`INDEX.md` 记录了所有新 ID。 ✅

---

## M2 · 时间轴战斗引擎（核心）✅

**目标**：把 M0 的 `simulateOneTurn` 占位实现替换为 `ARCHITECTURE.md §6.4` 规定的**动态优先队列 + 事件总线**双层架构。战斗对人类玩家是"自动播放"的，玩家只决定出战阵容与战前装备。

> **说明**：M2 仅交付 `engine/combat/*` 与 `event_bus.ts`，**不修改** `battleStore` / UI。`combat_runner.startBattle` 返回完整 `BattleResult.events`；store 接入与时间轴回放已在 **M3** 完成（`battleStore.startBattle` → `tickPlayback`）。

### 2.1 事件总线
- [x] `engine/event_bus.ts`：
  - 支持类型化订阅 `on<TEvent>(type, listener) => unsubscribe`
  - 支持 `emit(event)`，递归深度 ≤ 5（超过强制中断并 console.warn）
  - 提供 `createScopedBus()`：返回独立实例（战斗结束时丢弃）
- [x] 单测：递归深度限制、unsubscribe 生效、scoped bus 隔离

### 2.2 优先队列
- [x] `engine/combat/priority_queue.ts`：
  - 基于二叉堆，节点带 `id / triggerAt / payload`
  - 暴露 `push / pop / peek / update_time(id, newTime) / invalidate(id)`
  - **不允许外部直接修改堆数组**（封装为类，私有字段）
- [x] 单测：覆盖 `update_time`、`invalidate`、堆序正确性

### 2.3 战斗主循环
- [x] `engine/combat/damage_calc.ts`（纯函数）：`calcDamage({ attacker, defender, move })` → `DamageResult`
- [x] `engine/combat/combat_runner.ts`：
  - `startBattle({ player, enemy, rng? }) → BattleResult`（同步跑完，返回事件流与胜负）
  - 内部使用本地 scoped 事件总线 + 优先队列
  - 招式入队仅占位时间槽，**资源检查在 `SkillReady` 触发时执行**（§6.4）
  - 任一方 HP ≤ 0 时 emit `BattleEnded` 并 break
- [x] `engine/combat/README.md`：写清队列与事件交互、禁止事项

### 2.4 战斗结果契约
- [x] `types/battle.ts`：新增 `BattleResult { winnerId, events: BattleEvent[], finalPlayerHp, finalEnemyHp, proficiencyGains: { skillId, amount }[] }`
- [x] `engine/combat/loot.ts`（占位，M4 再扩展）：`calcProficiencyGains(events) → ProficiencyGain[]`，简单按"招式被执行次数 × 1"返回

**完成标准**：
- [x] 给定固定输入与种子 RNG，`startBattle` 返回事件流稳定可复现（写一个快照测试）
- [x] `engine/` 内任何文件均无 `import React` 或 `useGameStore(...)` 调用
- [x] 任一战斗引擎文件未超过 300 行硬上限（`combat_runner.ts` 255 行、`priority_queue.ts` 149 行）
- [x] `npm run test:run` 绿，且至少 3 个战斗相关测试（当前 8 个：`event_bus` 3 + `priority_queue` 3 + `combat_runner` 2）
- [x] M2 范围内不改动 `battleStore` / UI；下游通过 `BattleResult.events` 对接（M3 已接入）✅

---

## M3 · 战斗 store 与战斗 UI ✅

**目标**：把 M2 的引擎接入 store，并提供一个能播放时间轴的战斗页。`.tsx` 中**禁止**出现任何伤害/CD/概率计算。

### 3.1 battleStore 重构
- [x] `store/battleStore.ts`：
  - 字段：`status: 'idle' | 'running' | 'finished'`、`events: BattleEvent[]`、`playbackIndex: number`、`enemy / playerSnapshot / result?`
  - actions：`prepareBattle(enemyId)`、`startBattle()`（调用 `combat_runner.startBattle`）、`tickPlayback()`（按固定时间步推进 `playbackIndex`）、`endBattle()`、`reset()`
  - 通过 `useGameStore.getState()` 读玩家，不在 store 中嵌套订阅 hook（§5.2）

### 3.2 战斗 UI
- [x] `ui/pages/BattlePage.tsx`（≤ 250 行）：上方对阵双方血/气条，中部滚动战报，下部"开战 / 重来"按钮
- [x] `ui/components/HpBar.tsx`、`ui/components/EventLogItem.tsx`：纯展示
- [x] `ui/panels/BattleControls.tsx`：调用 `startBattle / reset`
- [x] `App.tsx`：根据 `uiStore.currentPage` 在主城页与战斗页之间切换（最简单的条件渲染即可，M5 再做正式路由）
- [x] `store/uiStore.ts`（新增）：`currentPage: 'home' | 'battle' | 'scene'`、`setPage(page)`

**完成标准**：
- [x] 点击"开战" → 战报按时间步逐条出现 → 战斗结束显示胜负
- [x] 用 RTL 写一个测试：mock `startBattle` 返回固定事件流，断言 UI 按顺序渲染至少 3 条事件
- [x] 任一 `.tsx` 内**不出现** `Math.` / 伤害公式 / `qiCost` 计算
- [x] 任一 `.tsx` 文件未超过 250 行 ✅

---

## M4 · 功法成长闭环 ✅

**目标**：让战斗"有意义"——战胜后获得功法熟练度，达到阈值解锁新招式。这是养成游戏的最小成长循环。

### 4.1 引擎
- [x] `engine/skill/proficiency.ts`：
  - `applyProficiencyGain(runtime, gain) → SkillRuntime`（纯函数，不变更入参）
  - `checkUnlocks(runtime, skillDef) → { newlyUnlockedMoveIds }`
- [x] `engine/character/skill_runtime.ts`：`grantSkill / upgradeSkill / canUseMove` 等纯查询
- [x] 完善 `engine/combat/loot.ts`：按"该功法被使用次数 + 战斗胜利系数"返回熟练度增益

### 4.2 store
- [x] `gameStore.ts` 新增 action：`applyBattleResult(result: BattleResult)`
  - 写入玩家 HP/Qi 终值
  - 调用 `applyProficiencyGain` 与 `checkUnlocks` 更新 `learnedSkills`
  - 解锁新招式时 push 到 `recentUnlocks: UnlockNotice[]`（M5 可用于 toast）
- [x] `gameStore.canUpgradeSkill(skillId) / upgradeSkill(skillId)` 占位（M5/M6 不强求 UI）

### 4.3 UI
- [x] `ui/panels/SkillPanel.tsx`：列出 `learnedSkills`，每条显示当前熟练度 / 上限 / 已解锁招式（仅展示，按钮逻辑走 store action）
- [x] `ui/components/UnlockToast.tsx`：监听 `recentUnlocks`，3 秒后通过 store action 自行消除

**完成标准**：
- [x] 跑一场胜利战斗后，对应功法熟练度 +N，达到阈值时 `unlockedMoveIds` 增加
- [x] 单测覆盖：阈值未达不解锁、刚达阈值解锁、熟练度封顶不再增长
- [x] `.tsx` 中无业务判断（"能否解锁"全部从 store selector 读） ✅

---

## M5 · 场景探索与战斗触发 ✅

**目标**：玩家在场景间移动，野外场景可触发遭遇战。这是把战斗"嵌入世界"的最薄一层。

### 5.1 引擎
- [x] `engine/world/encounter.ts`：`rollEncounter(scene, rng) → EnemyId | null`（基于场景 `encounters` 权重表）
- [x] `engine/world/scene_transition.ts`：`canEnter(fromSceneId, toSceneId) → boolean`（M5 内全部返回 true，留扩展位；额外提供 `getSceneExits` 供 store 查询邻接场景）

### 5.2 store
- [x] `gameStore.ts`：新增 `currentSceneId: SceneId`、action `enterScene(sceneId)`、`explore()`
  - `explore()` 内部：调用 `rollEncounter` → 若返回敌人 ID，则调用 `battleStore.prepareBattle(enemyId)` 并切换 `uiStore` 到 `'battle'`
- [x] `gameStore` 注入种子 RNG（`engine/util/rng.ts`，可被测试替换为确定性 RNG）

### 5.3 UI
- [x] `ui/pages/ScenePage.tsx`：显示当前场景名称 / 描述 / NPC 列表 / "探索"按钮 / "前往……"按钮组
- [x] `ui/panels/NpcList.tsx`：占位展示，点击仅切换"对话面板"（M5 可不实现对话内容）
- [x] 接入 `uiStore.currentPage`：`'scene' | 'battle' | 'home'`

**完成标准**：
- [x] 在「村外野径」点"探索"有概率进入战斗，胜利后通过「返回场景」按钮回到场景页（`BattleControls` 手动切页，非自动跳转）
- [x] 在「新手村」无遭遇，可以前往「村外野径」
- [x] `ui/pages/*.tsx` 不直接 import `engine/*` ✅

---

## M6 · 存档持久化 ✅

**目标**：浏览器刷新或重开页面后，玩家状态、功法成长、当前场景全部保留。`battleStore`、`uiStore` 不持久化（§5.3）。

- [x] `engine/persistence/save_schema.ts`：定义版本化 `SaveV1` 类型 + 迁移占位
- [x] `engine/persistence/save_io.ts`：`saveToStorage(state)` / `loadFromStorage() → SaveV1 | null` / `clearStorage()`
- [x] `gameStore.ts`：使用 `zustand/middleware` 的 `persist`，只持久化必要字段（玩家、`learnedSkills`、`currentSceneId`、完成任务列表）
- [x] 添加 `ui/panels/SaveControls.tsx`：手动"保存 / 读取 / 清档"按钮（即便有自动持久化，也提供显式入口便于调试）
- [x] 单测：写入 → 读取 → 字段一一相等；版本号缺失时回退到默认

**完成标准**：
- [x] 跑完一场战斗 → 刷新页面 → 熟练度 / 当前场景 / 解锁招式仍在
- [x] 清档后回到 `defaultPlayer`，且 `learnedSkills` 只含初始两个功法 ✅

---

## M7 · 教学任务串联

**目标**：用一条主线把 M1~M6 全部串起来，让"最小可玩"具有起点与终点。

### 数据
- [x] `data/quests/index.json` 完善 `quest_main_001_first_blood`：
  - [x] 步骤 1：与村口剑客对话（NPC `npc_001_village_swordsman`）
  - [x] 步骤 2：前往「村外野径」
  - [x] 步骤 3：击败山贼喽啰（`enemy_001_bandit_grunt`）
  - [x] 步骤 4：返回村口剑客，习得新剑法（奖励 `skill_sword_011_baihong`）

### 引擎
- [x] `engine/quest/quest_engine.ts`：纯函数 `advanceQuest(quest, event) → QuestState`
- [x] `engine/game_event_bus.ts`：在 `BattleEnded`、`SceneEntered`、`DialogClosed` 等事件触发时由 `gameStore` 统一转发给 `quest_engine`（`registerQuestEventHandlers` → `handleGameEvent`）

### store / UI
- [x] `gameStore`：`activeQuests`、`completedQuests`，action `acceptQuest / handleGameEvent / completeQuest`（事件驱动推进，等价于原 `progressQuest`）
- [x] `ui/panels/QuestLog.tsx`：列出活动任务及当前步骤描述

**完成标准（即「最小可玩里程碑」总验收）**：
- [x] 从清档状态开始：
  1. [x] 进入新手村，与 NPC 对话接到任务（`ScenePage` + `acceptQuest`）
  2. [x] 进入村外野径，遭遇并击败山贼（`explore` → `battleStore` → `BattleEnded` 事件）
  3. [x] 回到 NPC 处完成任务，获得一本新剑法（`completeQuest` → `learnSkill`）
  4. [x] 刷新页面进度保留（`persist` 含 `activeQuests` / `completedQuests` / `learnedSkills`）
- [x] 全程未出现报错；`npm run lint && npm run typecheck && npm run test:run && npm run build` 全绿（81 测例通过；带 coverage 时 vitest worker OOM，与业务无关）

---

## Post-MVP / v0.2 总览：功法核心系统成型

> M0~M7 已完成「能玩一轮」；M8~M12 的目标是让项目从“可玩原型”进入“以功法为核心的收集养成系统”。
>
> v0.2 验收口径：玩家不只是获得新功法，而是能感受到**功法品阶、熟练度、境界、传承、连携、属性养成、战前编成**共同构成的长期成长线。

| 里程碑 | 主题 | 交付物（用户可感知） | 工程闸 |
|--------|------|----------------------|--------|
| M8 | 工程闸与架构收口 | 当前项目重新满足架构约束，后续扩展不被参考目录污染 | ✅ lint/typecheck/test/build 全绿 |
| M9 | 功法数据模型 v1 | 功法拥有境界、属性加成、成长曲线、标签、传承/连携关系 | ✅ JSON 校验 + 类型契约测试 |
| M10 | 功法成长引擎 v1 | 熟练度、境界突破、悟性/感悟、传承初始等级可计算 | ✅ 纯 engine 单测覆盖关键公式 |
| M11 | 战前功法编成 | 玩家可配置参战功法槽位，战斗按配置自动释放 | ✅ UI 不含战斗业务逻辑 |
| M12 | 第一批功法内容切片 | 15~25 门功法形成低→中→高成长链路 | ✅ 一条完整养成路线可玩且可验收 |

完成 M8~M12 即视为达成「v0.2 功法核心系统雏形」。

---

## M8 · 工程闸与架构收口

**目标**：把 M0~M7 后遗留的工程债清掉，确保后续复杂功法系统不会在不稳定的工程闸上继续膨胀。

### 8.1 lint 范围收口
- [x] `eslint.config.js` 排除 `references/`、`dist/`、`coverage/` 等非主项目目录
- [x] `npm run lint` 不再扫描外部参考项目
- [x] 若未来需要 lint 参考项目，必须单独增加脚本，不能污染主项目工程闸

### 8.2 UI 与 engine 解耦
- [x] `ui/` 下所有 `.tsx` 不再直接 import `engine/*`
- [x] `QuestLog.tsx` 通过 `gameStore.getActiveQuestDisplays()` 获取展示数据
- [x] `SaveControls.tsx` 只调用 `gameStore` action，不直接调用 `save_io`
- [x] `ScenePage.tsx` 的任务查询、对话推进、任务交付均走 `gameStore` action/selector

### 8.3 文件头注释补齐
- [x] 所有 `src/**/*.ts` 与 `src/**/*.tsx` 都包含 `@module / @layer / @description / @forbidden` 头部注释
- [x] 头部注释中的 `@layer` 与实际目录一致
- [x] 头部注释中的 `@forbidden` 不与当前 import 冲突

**完成标准**：
- [x] `rg -n "from ['\\\"]\\.\\./\\.\\./engine|from ['\\\"]\\.\\./engine" src/ui src/App.tsx` 无结果
- [x] `npm run lint && npm run typecheck && npm run test:run && npm run build` 全绿
- [x] 不修改 `ARCHITECTURE.md` 的前提下，当前代码重新满足五层依赖方向

---

## M9 · 功法数据模型 v1

**目标**：把最终目标中“功法本身是核心收藏物”的信息进入类型契约与 JSON 数据，而不是只靠描述文本表达。

### 9.1 类型契约扩展
- [ ] `types/skill.ts`：新增或完善以下字段：
  - [ ] `tier`: 保留低/中/高，作为功法难度与成长速度的基础维度
  - [ ] `realm`: 功法境界/星级运行时字段放在 `SkillRuntime`，定义等级范围与上限
  - [ ] `tags`: 如 `sword`、`snake_style`、`basic`、`advanced`、`internal_qi`
  - [ ] `attributeGrowth`: 熟练度/境界提供的属性加成配置
  - [ ] `growthCurve`: 熟练度升级速度、战斗收益倍率、突破成本倍率
  - [ ] `weaponRequirement?`: 专用或推荐武器占位
- [ ] `types/character.ts`：`SkillRuntime` 新增 `realmLevel`、`insight` 或等价字段
- [ ] `types/skill_relation.ts`（新增）：定义功法连携、传承、相似度关系
- [ ] `types/index.ts` 导出所有新增类型

### 9.2 数据关系表
- [ ] `data/skill_relations/index.json` 不再为空，至少包含：
  - [ ] 3 条传承关系（低阶功法影响同类/高阶功法初始熟练度）
  - [ ] 3 条连携关系（低阶功法达到条件后加成指定高阶功法）
  - [ ] 3 条相似度关系（用于境界提升需求）
- [ ] 关系表采用源功法 → 目标功法方向，禁止在目标功法反向声明
- [ ] 所有新 ID 登记进 `INDEX.md`

### 9.3 运行时校验
- [ ] `skillEngine` 校验新增字段
- [ ] 新增 `skillRelationEngine`，提供 `listRelationsForSource`、`listRelationsForTarget`、`getInheritanceSources` 等纯查询
- [ ] JSON 文件仍满足单文件 ≤ 200 行硬上限；必要时按类别拆分

**完成标准**：
- [ ] 固定样例功法可表达：`青蟒剑法` 满足条件后加成一门更高阶蛇系剑法
- [ ] 固定样例功法可表达：30 级低阶剑法能为同类低阶/中高阶功法提供衰减后的初始熟练度
- [ ] `npm run typecheck && npm run test:run && npm run build` 全绿
- [ ] 新增 engine 模块至少 1 个单测，覆盖合法关系、非法 ID、空关系三种情况

---

## M10 · 功法成长引擎 v1

**目标**：实现“练过什么功法，会影响之后怎么成长、战斗有多强、突破概率多高”的核心计算层。

### 10.1 属性加成计算
- [ ] `engine/character/attributes.ts`（新增）：根据角色基础属性 + 已学功法熟练度/境界计算最终属性
- [ ] 同一级别功法属性加成存在上限，不允许低级功法无限堆叠
- [ ] 不同类别功法加成方向不同：
  - [ ] 拳/掌/刀/剑等外功主要影响臂力或招式伤害
  - [ ] 轻功主要影响灵敏、速度或行动间隔
  - [ ] 内功主要影响内力、恢复或体质
  - [ ] 硬功主要影响血量、防御或体质

### 10.2 传承初始熟练度
- [ ] `engine/skill/inheritance.ts`（新增）：计算新学功法的初始熟练度
- [ ] 支持同阶/跨阶不同衰减比例
- [ ] 支持多门来源功法叠加，但叠加收益指数级下降
- [ ] 结果不得超过目标功法配置的初始熟练度上限

### 10.3 境界与感悟
- [ ] `engine/skill/realm.ts`（新增）：判断功法是否可突破境界
- [ ] 境界提升至少支持两种来源：
  - [ ] 收集/练成一定数量相似功法
  - [ ] 随机感悟
- [ ] 悟性由已拥有的高境界功法数量影响
- [ ] 随机逻辑必须支持注入确定性 RNG，便于测试

### 10.4 store 接入
- [ ] `learnSkill(skillId)` 使用传承引擎决定初始熟练度
- [ ] `applyBattleResult(result)` 写入熟练度后，可触发境界/感悟相关状态更新
- [ ] `getSkillDisplay()` 展示境界、属性加成、下一突破条件

**完成标准**：
- [ ] 一个固定测试角色拥有 30 级低阶剑法后，新学同类低阶功法初始熟练度 > 0
- [ ] 一个固定测试角色拥有 30 级低阶剑法后，新学高阶同类功法初始熟练度更低，且符合衰减公式
- [ ] 多门来源功法叠加收益递减，第三门来源收益低于第二门
- [ ] 高境界功法数量增加时，随机感悟概率上升；使用固定 RNG 时结果可复现
- [ ] `npm run lint && npm run typecheck && npm run test:run && npm run build` 全绿

---

## M11 · 战前功法编成

**目标**：让玩家不只“拥有功法”，还要在战斗前做选择。战斗仍保持自动释放，玩家的策略发生在战前配置。

### 11.1 出战槽位
- [ ] `CharacterState` 或独立编成状态新增功法槽位：
  - [ ] 外功槽：用于主要伤害招式
  - [ ] 内功槽：用于内力/续航/被动效果
  - [ ] 轻功槽：用于速度、闪避或行动间隔
  - [ ] 硬功槽：用于防御、血量或减伤
- [ ] 槽位规则由 engine 判断，UI 只读取可装备结果
- [ ] 未满足武器/类别/境界条件时不能装备

### 11.2 战斗引擎接入
- [ ] `combat_runner` 不再只取第一个 `equippedSkillIds[0]`
- [ ] 每个功法按自身招式 CD、内力消耗、释放规则进入时间轴
- [ ] 支持至少一种概率释放必杀或高阶招式的机制
- [ ] 内力不足时的行为可验证：跳过、延后或改用低耗招式，规则必须写入 engine

### 11.3 UI
- [ ] 新增 `FormationPanel` 或等价面板
- [ ] 玩家可以装备/卸下功法，并看到槽位限制
- [ ] 战斗页展示当前参战功法，而不是只展示敌人和血条

**完成标准**：
- [ ] 玩家装备两门不同外功后，战报中能看到两门功法的招式均有机会释放
- [ ] 装备轻功后，固定测试战斗中玩家行动间隔缩短或行动次数增加
- [ ] 内功/硬功至少一种对战斗快照产生可观测影响
- [ ] `.tsx` 中不出现伤害、CD、概率、属性聚合计算
- [ ] `npm run lint && npm run typecheck && npm run test:run && npm run build` 全绿

---

## M12 · 第一批功法内容切片

**目标**：用一批可玩的内容验证功法系统，而不是只验证公式。此阶段交付“一个可重复游玩的功法养成小循环”。

### 12.1 功法池
- [ ] 总功法数量达到 15~25 门
- [ ] 至少包含以下类别：
  - [ ] 内功 ≥ 4
  - [ ] 外功/剑法/拳掌/刀法合计 ≥ 8
  - [ ] 轻功 ≥ 2
  - [ ] 硬功 ≥ 2
- [ ] 至少包含以下品阶：
  - [ ] 低阶 ≥ 8
  - [ ] 中阶 ≥ 4
  - [ ] 高阶 ≥ 2

### 12.2 成长路线
- [ ] 至少 2 条低 → 中 → 高的功法路线
- [ ] 至少 1 条路线体现“低阶功法练满后，加速高级功法成型”
- [ ] 至少 1 条路线体现“低阶功法达到条件后，加成同主题高阶功法”
- [ ] 至少 1 条路线体现“多门相似功法帮助境界突破”

### 12.3 内容获取
- [ ] 至少 3 种功法获取方式：
  - [ ] 主线/支线任务奖励
  - [ ] 战斗掉落或探索获得
  - [ ] 商店/NPC/门派占位入口之一
- [ ] 新增内容必须登记 `INDEX.md`
- [ ] 新增 JSON 文件仍满足行数上限

### 12.4 可玩验收流程
- [ ] 清档后从新手村开始
- [ ] 玩家完成教学任务获得第二门功法
- [ ] 玩家通过探索/战斗/任务再获得至少 2 门功法
- [ ] 玩家练满一门低阶功法后，新学相关功法获得可见初始熟练度
- [ ] 玩家通过编成不同功法组合，战斗日志出现不同释放节奏或伤害结果
- [ ] 刷新页面后，功法、熟练度、境界、编成、任务进度保留

**完成标准**：
- [ ] 从清档开始，30 分钟内可完成一条低阶 → 中阶的功法成长体验
- [ ] 至少一场战斗的胜负会因战前功法编成不同而改变
- [ ] 至少一个功法连携效果能在 UI 中被看见，并能在测试中被断言
- [ ] `npm run lint && npm run typecheck && npm run test:run && npm run build` 全绿

---

## 横切要求（每个里程碑都必须满足）

- [ ] **架构契约**：每个 PR 在描述里列出本次涉及的层级与遵循的 `ARCHITECTURE.md` 条款（§9.1）
- [ ] **文件大小**：`.tsx` ≤ 250 行、引擎/store `.ts` ≤ 300/250 行、JSON ≤ 200 行
- [ ] **头部注释**：所有新增 `.ts` / `.tsx` 包含 `@module / @layer / @description / @forbidden`
- [ ] **ID 唯一**：所有新 ID 登记进 `INDEX.md`，编号永不复用（§7.2）
- [ ] **无 `any`**：必要时用 `unknown` 并附注释
- [ ] **测试**：每个新增 engine 模块至少 1 个单测；战斗与成长用确定性 RNG
- [ ] **工程闸**：合入前 `lint / typecheck / test:run / build` 全部绿

---

## 非 MVP（明确**不做**的事，避免范围蔓延）

为了"最小可玩"，以下功能**全部推迟**到后续里程碑：

- 多门派系统、声望、师徒传承
- 装备 / 锻造 / 商店购买
- 战斗中的玩家手动指令（保持自动战斗）
- 动画 / 音效 / 美术资源
- 多语言、设置面板（除清档按钮外）
- 复杂招式连携、心法被动、状态异常（毒/燃烧等）
- 多人 / 联机 / 排行榜

> 上述内容可在 MVP 验收通过后，作为 v0.2、v0.3 的里程碑单独立项。
