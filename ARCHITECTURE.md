# ARCHITECTURE.md — 项目架构契约

> **本文档是项目的最高规范。任何代码（包括 AI 生成的代码）违反本文档的规则，视为不合格代码，必须立即修正。​**
> **AI 在执行任何修改/新增代码任务前，必须先阅读本文档，并在响应中说明本次改动遵循了哪些条款。​**

---

## 0. 项目总览

- **项目类型**：单人游玩、网页端、文字/类 MUD 武侠游戏
- **核心系统**：功法收集养成 + 时间轴自动战斗
- **技术栈**：React + TypeScript + Zustand + Vite
- **运行环境**：浏览器（无后端，存档落地 localStorage）

---

## 1. 分层架构（不可违反）

项目分为五层，依赖方向**严格单向，自上而下**：

```
┌────────────────────────────────────────┐
│  ui/         React 组件（仅 .tsx）      │  只能 import: store, types, 同层
├────────────────────────────────────────┤
│  store/      Zustand 状态容器            │  只能 import: engine, types
├────────────────────────────────────────┤
│  engine/     纯 TS 业务逻辑             │  只能 import: engine 内部, types, data
├────────────────────────────────────────┤
│  data/       纯 JSON 数据                │  不 import 任何代码
├────────────────────────────────────────┤
│  types/      TS 类型定义                 │  不 import 任何运行时代码
└────────────────────────────────────────┘
```

**禁止事项（违反即重写）​**：

- ❌ `engine/` 中出现任何 `import React` 或 `.tsx` 文件
- ❌ `engine/` 中出现任何 `useGameStore(...)` 形式的 hook 调用（如需读 store，必须用 `useGameStore.getState()`）
- ❌ `ui/` 中出现任何业务逻辑计算（伤害公式、CD 计算、属性聚合等）
- ❌ `ui/` 中直接修改 store 状态（必须调用 store 暴露的 action）
- ❌ `data/` 目录下出现 `.ts` 或 `.js` 文件（只允许 `.json`）
- ❌ 跨层反向依赖（如 engine 引用 ui，store 引用 ui）
- ❌ 同层模块之间隐式依赖全局变量

---

## 2. 目录结构

```
/src/
  ├── /types/              TS 类型定义
  │   ├── skill.ts
  │   ├── character.ts
  │   ├── battle.ts
  │   ├── item.ts
  │   ├── world.ts
  │   └── index.ts         统一导出
  │
  ├── /data/               纯 JSON 数据
  │   ├── /skills/         功法（按类别分子目录）
  │   ├── /items/
  │   ├── /enemies/
  │   ├── /npcs/
  │   ├── /scenes/
  │   ├── /quests/
  │   ├── /sects/
  │   ├── /shops/
  │   ├── /skill_relations/
  │   └── /config/
  │
  ├── /engine/             纯 TS，零 React 依赖
  │   ├── /skill/          功法引擎
  │   ├── /combat/         战斗引擎
  │   ├── /character/      角色属性
  │   ├── /world/          世界系统
  │   ├── /persistence/    存档读档
  │   └── event_bus.ts     全局事件总线
  │
  ├── /store/              Zustand
  │   ├── gameStore.ts
  │   ├── battleStore.ts
  │   └── uiStore.ts
  │
  ├── /ui/                 React 组件
  │   ├── /components/     通用小组件
  │   ├── /panels/         功能面板（背包、功法、任务）
  │   ├── /pages/          整页（地图、战斗、门派）
  │   └── App.tsx
  │
  └── main.tsx
```

---

## 3. 文件级硬性约束

### 3.1 文件长度上限（超过即必须拆分）

| 文件类型 | 软上限（建议） | 硬上限（必须拆分） |
|---------|--------------|------------------|
| `.tsx` UI 组件 | 150 行 | 250 行 |
| `.ts` 引擎模块 | 200 行 | 300 行 |
| `.ts` store | 150 行 | 250 行 |
| `.ts` 类型定义 | 不限 | 不限 |
| `.json` 数据文件（单个） | 100 行 | 200 行 |

**说明**：上限不含注释和空行。超过硬上限时，AI 必须主动提出拆分方案，禁止"先写完再说"。

### 3.2 文件命名规范

- TS 文件：`snake_case.ts`（如 `damage_calc.ts`）
- TSX 文件：`PascalCase.tsx`（如 `SkillPanel.tsx`）
- JSON 文件：`snake_case.json`
- 类型文件：`snake_case.ts`，类型本身用 `PascalCase`

### 3.3 文件头部注释（强制）

**所有 `.ts` 和 `.tsx` 文件必须包含头部注释**，格式如下：

```typescript
/**
 * @module combat/damage_calc
 * @layer engine
 * @description 伤害计算：根据攻击方功法和防御方属性计算最终伤害
 * @inputs  CombatContext, Move
 * @outputs DamageResult
 * @depends types, engine/character/attributes
 * @forbidden 禁止直接修改角色状态、禁止 import React、禁止访问 store
 */
```

AI 修改文件前必须先读头部注释，确认本次修改不违反 `@forbidden`。

---

## 4. UI 层（.tsx）的硬性限制

### 4.1 .tsx 文件只能包含 UI 逻辑

**允许出现**：

- ✅ JSX 结构
- ✅ 从 Zustand store 读取状态（`useGameStore(selector)`）
- ✅ 调用 store 暴露的 action（`store.gainProficiency(...)`）
- ✅ 纯展示性的格式化（如数字千分位、时间格式化）
- ✅ React hooks（useState 仅用于 UI 局部状态如"面板是否展开"、useEffect 仅用于 UI 副作用如滚动）
- ✅ 事件处理器（onClick 等），但内部只能调用 store action 或 UI 状态变更

**禁止出现**：

- ❌ 任何伤害/属性/CD/概率计算
- ❌ 直接读写 JSON 数据（必须通过 engine 加载后存入 store）
- ❌ 调用 engine 模块（除非是纯展示用的格式化函数）
- ❌ 修改全局状态的逻辑（必须封装为 store action）
- ❌ 业务规则判断（如"该功法能否升级"——这种判断必须在 engine 实现，UI 只读取结果）

### 4.2 反例与正例

**反例（禁止）​**：

```tsx
function SkillCard({ skill }: Props) {
  // ❌ UI 里写业务规则
  const canUpgrade = skill.proficiency < skill.max_proficiency 
                  && player.qi >= skill.upgrade_cost;
  
  return <button disabled={!canUpgrade}>升级</button>;
}
```

**正例（允许）​**：

```tsx
function SkillCard({ skillId }: Props) {
  // ✅ UI 只读取由 engine 计算好的结果
  const canUpgrade = useGameStore((s) => s.canUpgradeSkill(skillId));
  const upgrade = useGameStore((s) => s.upgradeSkill);
  
  return <button disabled={!canUpgrade} onClick={() => upgrade(skillId)}>升级</button>;
}
```

---

## 5. 状态管理规则（Zustand）

### 5.1 状态唯一来源原则

- **所有游戏状态必须存在 Zustand store 中**，禁止散落在组件 useState、模块级变量、window 对象等位置
- **UI 局部状态例外**：仅用于不影响游戏逻辑的 UI 行为（如"侧边栏是否展开"、"当前选中的标签页"），可以用 useState 或独立的 `uiStore`
- **战斗运行时状态例外**：战斗中的事件队列、临时累计值等可放在 engine 内部维护，战斗结束后销毁；但战斗的关键结果（玩家血量、获得经验等）必须写回 gameStore

### 5.2 状态修改规则

- **只能通过 store 内定义的 action 修改状态**
- 禁止在 UI 或 engine 中直接 `useGameStore.setState({...})` 修改业务字段
- engine 调用 store 时使用 `useGameStore.getState()` 读，使用 store 暴露的 action 写
- 每个 action 必须是**单一职责**，命名为动词短语（`gainProficiency`、`addSkill`、`changeScene`）

### 5.3 store 拆分原则

| store | 职责 | 持久化 |
|-------|------|--------|
| `gameStore` | 玩家、功法、背包、任务、世界进度 | ✅ 持久化到 localStorage |
| `battleStore` | 当前战斗的实时状态 | ❌ 不持久化 |
| `uiStore` | 纯 UI 状态（面板展开、当前页面等） | ⚠️ 部分持久化 |

---

## 6. 引擎层（engine/）规则

### 6.1 纯函数优先

引擎模块**优先写成纯函数**：相同输入 → 相同输出，无副作用。这让 AI 写单元测试和数值平衡测试极其简单。

### 6.2 模块间通信

- 引擎模块之间**不允许直接互相 import 业务逻辑函数**
- 必须通过两种方式之一通信：
  - **显式参数传递**（首选，最清晰）
  - **event_bus 广播**（用于被动技能、监听器场景）

### 6.3 事件总线规则

- `event_bus.ts` 是引擎层唯一的全局通信通道
- 所有事件类型必须在 `types/event.ts` 中定义为判别联合类型
- 监听器必须可注销（注册时返回 unsubscribe 函数）
- 战斗结束时必须清理所有战斗相关监听器

### 6.4 战斗引擎特殊规则

- 战斗使用**动态优先队列 + 事件总线**双层架构（详见 `engine/combat/README.md`）
- 内力/资源检查必须在 `SkillReady` 事件触发时进行，**禁止在入队时锁定资源**
- 队列事件修改必须通过 `update_time` 或 `invalidate` 接口，禁止直接操作堆数组
- 事件总线广播的递归深度限制为 5 层，超过强制中断

---

## 7. 数据层（data/）规则

### 7.1 纯数据原则

- 只允许 `.json` 文件，不允许任何代码
- JSON 必须可通过对应的 TS 类型校验（推荐用 `zod` 做运行时校验）
- 每个 JSON 文件必须有 `id` 字段，全局唯一

### 7.2 ID 命名规范

| 实体 | 格式 | 示例 |
|------|------|------|
| 功法 | `skill_{类别}_{编号}_{拼音}` | `skill_sword_010_qingmang` |
| 招式 | `move_{功法编号}_{招式编号}` | `move_qingmang_01` |
| 物品 | `item_{类别}_{编号}_{拼音}` | `item_weapon_001_jianxiao` |
| 场景 | `scene_{编号}_{拼音}` | `scene_001_village` |
| NPC | `npc_{编号}_{拼音}` | `npc_010_huangrong` |
| 任务 | `quest_{类别}_{编号}` | `quest_main_001` |
| 战斗 | `combat_{编号}_{拼音}` | `combat_001_wolf` |

**编号一旦使用永不复用**，即使该实体被废弃。

### 7.3 关系表设计

- 功法连携、传承等"多对多关系"放在 `data/skill_relations/` 下
- 在源功法 JSON 中描述"我能加成谁"，**禁止反向描述**
- 关系表的修改不应导致其他 JSON 文件被修改

---

## 8. 类型系统（types/）规则

### 8.1 类型即契约

- 所有跨层数据必须有明确的 TS 类型定义
- 禁止使用 `any`（如确实需要，必须用 `unknown` 并附注释说明原因）
- 联合类型优先用判别联合（discriminated union），便于穷尽匹配

### 8.2 ID 类型化

为每种 ID 定义 branded type，防止串用：

```typescript
type SkillId = string & { readonly __brand: "SkillId" };
type ItemId = string & { readonly __brand: "ItemId" };
type SceneId = string & { readonly __brand: "SceneId" };
```

这样 `function getSkill(id: SkillId)` 传入 `ItemId` 会编译失败。

---

## 9. AI 协作工作流

### 9.1 AI 接到任务时必须先做的事

1. **声明本次任务涉及的层级和文件**
2. **声明本次任务是否需要修改架构**（如需要，必须先与人类确认）
3. **阅读涉及文件的头部注释和相关类型定义**
4. **在响应中明确指出本次修改遵循/违反了 ARCHITECTURE.md 的哪些条款**

### 9.2 禁止行为

- ❌ 跨层重构未经人类同意
- ❌ 修改 `ARCHITECTURE.md`、`INDEX.md`、`tsconfig.json`、`package.json` 未经人类同意
- ❌ 写代码时虚构不存在的 ID（必须先检查 `INDEX.md`）

### 9.3 任务粒度建议

人类发布任务时遵循以下模板：

```
任务：[简短描述]
涉及层级：[engine / store / ui / data]
涉及文件：[最多 3 个]
参考文件：[1~2 个已有的相似实现作为参考]
完成标准：[可验证的输出]
```

---

## 10. 强制检查清单（AI 提交代码前自检）

每次完成修改后，AI 必须在响应中确认以下检查项：

- [ ] 所有修改/新增的 `.tsx` 文件不包含业务逻辑
- [ ] 所有修改/新增的 `.ts` engine 文件不 import React
- [ ] 所有文件未超过硬上限行数
- [ ] 所有新增文件包含头部注释
- [ ] 所有状态修改通过 store action 完成
- [ ] 所有新增 ID 已记录到 `INDEX.md`
- [ ] 所有新增类型已加入 `types/index.ts` 导出
- [ ] 未引入新的 npm 依赖（如需要已单独提出确认）
- [ ] 未跨层依赖
- [ ] 未使用 `any` 类型

任何一项未通过，必须在响应中明确说明原因并请求人类决策。

---

## 11. 文档维护

- `ARCHITECTURE.md`（本文件）：架构契约，修改需人类同意
- `INDEX.md`：所有实体 ID 总索引，每次新增 ID 必须更新
- `engine/{module}/README.md`：各引擎模块的内部设计说明
- `data/README.md`：数据格式说明和编辑指南

---

**最后一条铁律：当本文档与 AI 的"直觉"冲突时，永远以本文档为准。​**
