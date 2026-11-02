/**
 * 浮层登记处。
 *
 * 命令面板、灯箱、批注编辑器、抽屉、移动端菜单都登记在这里，
 * 按 z 值决定谁是「最上层」——这样 Esc 永远只关掉用户看见的那一层。
 */

export interface Overlay {
  /** 便于调试的名字 */
  name: string;
  /** 与 CSS z-index 对应的层级，越大越靠上 */
  z: number;
  isOpen: () => boolean;
  close: () => void;
}

const overlays: Overlay[] = [];

export function registerOverlay(overlay: Overlay): void {
  overlays.push(overlay);
}

export function anyOverlayOpen(): boolean {
  return overlays.some((overlay) => overlay.isOpen());
}

/** 关掉最上面那层；没有浮层时返回 false，让调用方决定是否拦默认行为 */
export function closeTopmostOverlay(): boolean {
  const open = overlays
    .filter((overlay) => overlay.isOpen())
    .sort((a, b) => b.z - a.z);
  const top = open[0];
  if (!top) return false;
  top.close();
  return true;
}
