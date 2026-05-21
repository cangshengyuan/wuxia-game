# 战斗引擎（engine/combat）

时间轴自动战斗采用 **动态优先队列 + scoped 事件总线** 双层架构，规范见 `ARCHITECTURE.md` §6.4。

## 职责划分

| 组件 | 职责 |
|------|------|
| `priority_queue.ts` | 按 `triggerAt` 调度招式时间槽 |
| `event_bus.ts`（scoped） | 广播战斗事件；`SkillReady` 时执行资源检查 |
| `combat_runner.ts` | 主循环：pop → emit → 结算 → 重新入队 |
| `damage_calc.ts` | 纯函数伤害公式 |
| `loot.ts` | 从事件流统计熟练度增益（M2 占位） |

## 事件流（成功出招）

```
SkillReady → SkillExecuted → DamageDealt
```

- **SkillReady**：招式时间槽到达；此时检查内力，禁止在入队时锁定资源
- **SkillExecuted**：内力充足且扣费成功
- **DamageDealt**：伤害已结算
- **BattleEnded**：任一方 HP ≤ 0

## 时间轴公式（M2 占位）

```
triggerAt = currentTime + move.cd * (100 / actor.speed)
```

初始双方各将 `equippedSkillIds[0]` 的第一个已解锁招式入队（占位时间槽，不扣内力）。

## 内力不足

在 `SkillReady` 阶段若 `qi < move.qiCost`：跳过出招，不 emit `SkillExecuted` / `DamageDealt`，按 CD 重新入队。

## 禁止事项

- 禁止外部直接修改优先队列堆数组（仅通过 `push` / `pop` / `update_time` / `invalidate`）
- 禁止在入队时扣除或锁定内力
- 禁止在 `engine/` 内 `import React` 或调用 `useGameStore`
- 单场战斗必须使用 `createScopedBus()`，战斗结束随 runner 丢弃

## M3 对接

`startBattle({ player, enemy, rng? })` 同步跑完，返回 `BattleResult`：

- `events`：完整事件流，供 battleStore 回放
- `winnerId` / `finalPlayerHp` / `finalEnemyHp`
- `proficiencyGains`：M4 写入 gameStore
