/**
 * Context Window & Threshold Constants
 * 集中管理模型上下文窗口大小和阈值检查
 */

/**
 * 模型上下文窗口默认大小（tokens）
 * 适用于大多数 Klaude 模型（Sonnet 4, Opus 4 等）
 */
export const MODEL_CONTEXT_WINDOW_DEFAULT = 131_072

/**
 * Context Window 阈值检查常量
 * 用于判断消息是否超过上下文窗口
 */
export const CONTEXT_THRESHOLD = MODEL_CONTEXT_WINDOW_DEFAULT
