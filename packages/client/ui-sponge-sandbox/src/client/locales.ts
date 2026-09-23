/**
 * `sponge-sandbox` namespace dictionaries: the sidebar entry button and the
 * development testbed surface (title badge, hint, and pan/zoom canvas copy).
 */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'entry.sandbox': '沙盒',
  'entry.sandbox.aria': '打开沙盒',
  'shell.title': '沙盒',
  'shell.badge': '开发用沙盒',
  'shell.subtitle': 'UI 试验台——下一步 Editor 的画板界面在这里验证。',
  'shell.close.aria': '关闭沙盒',
  'canvas.label': '平移缩放视口',
  'canvas.hint': '拖拽平移 · 滚轮缩放 · 点击选中',
  'canvas.box.aria': '方框 {name}',
  'canvas.selected.aria': '已选中方框 {name}',
} satisfies Record<string, string>

/** The sponge-sandbox namespace key union. */
export type SpongeSandboxKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'entry.sandbox': 'Sandbox',
  'entry.sandbox.aria': 'Open the Sandbox',
  'shell.title': 'Sandbox',
  'shell.badge': 'Development sandbox',
  'shell.subtitle': 'UI testbed — the next Editor canvas surface is validated here.',
  'shell.close.aria': 'Close the Sandbox',
  'canvas.label': 'Pan/zoom viewport',
  'canvas.hint': 'Drag to pan · scroll to zoom · click to select',
  'canvas.box.aria': 'Box {name}',
  'canvas.selected.aria': 'Selected box {name}',
} satisfies Record<SpongeSandboxKey, string>
