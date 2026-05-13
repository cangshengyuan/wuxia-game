# Wuxia Game (Skeleton)

基于 React + TypeScript + Vite 的武侠项目骨架。当前阶段重点是基础设施与分层约定，而非完整玩法实现。

## 项目目标

- 建立可持续迭代的工程底座（Lint / Typecheck / Test / Build / CI）。
- 建立 `data -> engine -> store -> UI` 的最小可运行链路。
- 通过 `DEVELOPMENT_RULES.md` 固化开发规则，便于多人和 AI 协作。

## 目录结构

```text
wuxia-game/
├─ DEVELOPMENT_RULES.md
├─ src/
│  ├─ data/        # 样例功法数据
│  ├─ types/       # 领域类型契约
│  ├─ engine/      # 纯 TS 业务引擎（无 React 依赖）
│  ├─ store/       # Zustand 状态层
│  ├─ test/        # 测试初始化
│  ├─ App.tsx      # 最小集成演示
│  └─ main.tsx
├─ vitest.config.ts
└─ .github/workflows/ci.yml
```

## 开发命令

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test:run
npm run build
```

格式化命令：

```bash
npm run format
npm run format:check
```

## 开发流程建议

1. 先改 `src/types` 与 `src/data`，明确契约和样例数据。
2. 再在 `src/engine` 实现通用逻辑，不耦合 UI。
3. 通过 `src/store` 暴露状态和动作给 UI。
4. 最后在 `src/components` / `src/pages` 组装界面。

## 验收标准

合入前至少通过以下检查：

- `npm run lint`
- `npm run typecheck`
- `npm run test:run`
- `npm run build`
