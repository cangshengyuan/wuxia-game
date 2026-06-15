/**
 * @module test/setup
 * @layer ui
 * @description 测试环境初始化：挂载 jest-dom 匹配器
 * @inputs testing-library
 * @outputs 测试运行时副作用
 * @depends test
 * @forbidden 禁止在测试初始化中编排游戏业务规则
 */
import '@testing-library/jest-dom/vitest'
