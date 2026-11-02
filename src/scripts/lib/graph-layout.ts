/**
 * 图谱力导向布局（斥力 + 边弹簧 + 向心重力 + 阻尼），纯数值、O(n²)。
 *
 * 节点数 ≤ 200 时 O(n²) 完全够用，也不必引入 quadtree。
 * 冷却用 alpha 衰减，衰减到 0 就不再产生位移 —— 调用方据此停掉 rAF。
 */

import { WORLD_SCALE } from './graph-model';
import type { GraphModel } from './graph-model';

export interface GraphLayout {
  /** 推进一帧；返回 false 表示已经静止 */
  tick(): boolean;
  /** 不计衰减地跑若干步（首帧预热，避免第一眼看到一团挤在原点的点） */
  settle(steps: number): void;
  /** 一直跑到静止（reduced-motion 用：不做逐帧动画，直接出终态） */
  finish(maxSteps?: number): void;
  /** 重新加热：拖动结束后让图轻轻弹一下 */
  heat(alpha: number): void;
  isActive(): boolean;
}

/* 调参记录（重看这段的时候别急着改）：
 * - 下面这些数字都按「CSS 像素」写，最后统一乘 WORLD_SCALE 换到世界坐标；
 *   长度乘 k、斥力乘 k³、限速乘 k，图的形状完全不变（见 graph-model 里的说明）。
 * - 斥力按 1/d² 衰减，距离用 minD 兜底，避免节点重叠时爆成无穷大；
 * - 重力对「到原点距离」成线性，所以孤立节点不会四散到画布外；
 * - 阻尼 0.62，配合 MAX_SPEED 防止一次大的斥力把节点弹飞；
 * - 全局图约 150 帧（≈2.5s）静止，局部图节点少，几乎立刻稳定。 */
const SCALE = WORLD_SCALE;
const REPULSION = 2000 * SCALE * SCALE * SCALE;
const LINK_DISTANCE = 84 * SCALE;
const LINK_STRENGTH = 0.08;
const GRAVITY = 0.0058;
const DAMPING = 0.62;
const MAX_SPEED = 26 * SCALE;
const ALPHA_DECAY = 0.045;
const ALPHA_MIN = 0.001;
/** 局部图谱：中心固定，邻居贴得更近 */
const LOCAL_REPULSION = 1150 * SCALE * SCALE * SCALE;
const LOCAL_LINK_DISTANCE = 54 * SCALE;
const LOCAL_LINK_STRENGTH = 0.11;
const LOCAL_GRAVITY = 0.013;

const GOLDEN_ANGLE = 2.399963229728653;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function createLayout(model: GraphModel): GraphLayout {
  const nodes = model.nodes;
  const links = model.links;
  const count = nodes.length;
  const local = model.mode === 'local' && model.focus >= 0;
  const repulsion = local ? LOCAL_REPULSION : REPULSION;
  const linkDistance = local ? LOCAL_LINK_DISTANCE : LINK_DISTANCE;
  const linkStrength = local ? LOCAL_LINK_STRENGTH : LINK_STRENGTH;
  const gravity = local ? LOCAL_GRAVITY : GRAVITY;

  const forceX = new Float64Array(count);
  const forceY = new Float64Array(count);
  let alpha = 1;

  seed();

  /** 初值：全局用向日葵螺旋，局部把邻居摆成一圈（节点少时圈更小） */
  function seed(): void {
    if (local) {
      const focus = model.focus;
      const ring = nodes.filter((node) => node.index !== focus);
      const radius = clamp(46 + ring.length * 11, 62, 190) * SCALE;
      ring.forEach((node, order) => {
        const angle = -Math.PI / 2 + (order / Math.max(1, ring.length)) * Math.PI * 2;
        node.x = Math.cos(angle) * radius;
        node.y = Math.sin(angle) * radius;
      });
      return;
    }
    nodes.forEach((node, order) => {
      const angle = order * GOLDEN_ANGLE;
      const radius = 9.5 * SCALE * Math.sqrt(order + 0.5);
      node.x = Math.cos(angle) * radius;
      node.y = Math.sin(angle) * radius;
    });
  }

  function step(current: number): void {
    forceX.fill(0);
    forceY.fill(0);

    // 向心重力：跟到原点的距离成正比，等效于一根很软的橡皮筋
    for (let i = 0; i < count; i++) {
      const node = nodes[i]!;
      if (node.fixed) continue;
      forceX[i]! -= node.x * gravity * current;
      forceY[i]! -= node.y * gravity * current;
    }

    // 斥力：两两相推，距离下限取半径和，避免完全重叠时的数值爆炸
    for (let i = 0; i < count; i++) {
      const a = nodes[i]!;
      const aFixed = a.fixed;
      for (let j = i + 1; j < count; j++) {
        const b = nodes[j]!;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 1e-3) {
          // 完全重合：用下标做一点确定性的偏移，别用随机数（否则每次刷新图都不一样）
          dx = ((i % 7) - 3) * 0.02 + 0.013;
          dy = ((j % 5) - 2) * 0.02 + 0.019;
          distance = Math.sqrt(dx * dx + dy * dy);
        }
        const minimum = (a.r + b.r) * 1.6;
        const effective = Math.max(distance, minimum);
        const magnitude = (repulsion * current) / (effective * effective);
        const ux = (dx / distance) * magnitude;
        const uy = (dy / distance) * magnitude;
        if (!aFixed) {
          forceX[i]! -= ux;
          forceY[i]! -= uy;
        }
        if (!b.fixed) {
          forceX[j]! += ux;
          forceY[j]! += uy;
        }
      }
    }

    // 边弹簧：把有双链的节点拉到一起
    for (const link of links) {
      const a = nodes[link.source]!;
      const b = nodes[link.target]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.max(1e-3, Math.sqrt(dx * dx + dy * dy));
      const rest = linkDistance + a.r + b.r;
      const scale = ((distance - rest) / distance) * linkStrength * current;
      const fx = dx * scale;
      const fy = dy * scale;
      if (!a.fixed) {
        forceX[link.source]! += fx;
        forceY[link.source]! += fy;
      }
      if (!b.fixed) {
        forceX[link.target]! -= fx;
        forceY[link.target]! -= fy;
      }
    }

    // 积分：阻尼 + 限速
    for (let i = 0; i < count; i++) {
      const node = nodes[i]!;
      if (node.fixed) {
        node.vx = 0;
        node.vy = 0;
        continue;
      }
      let vx = (node.vx + forceX[i]!) * DAMPING;
      let vy = (node.vy + forceY[i]!) * DAMPING;
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > MAX_SPEED) {
        vx = (vx / speed) * MAX_SPEED;
        vy = (vy / speed) * MAX_SPEED;
      }
      node.vx = vx;
      node.vy = vy;
      node.x += vx;
      node.y += vy;
    }
  }

  /** 推进一帧：alpha 决定这一帧的力道，衰减到 0 就彻底静止 */
  function tick(): boolean {
    if (alpha <= 0) return false;
    step(alpha);
    alpha *= 1 - ALPHA_DECAY;
    if (alpha < ALPHA_MIN) alpha = 0;
    return alpha > 0;
  }

  return {
    tick,
    settle(steps: number): void {
      const total = Math.max(0, Math.min(400, Math.floor(steps)));
      const strength = alpha > 0 ? Math.min(1, Math.max(0.4, alpha * 0.8)) : 0;
      for (let i = 0; i < total; i++) step(strength);
    },
    finish(maxSteps = 600): void {
      let guard = Math.max(0, Math.floor(maxSteps));
      while (alpha > 0 && guard-- > 0) tick();
    },
    heat(value: number): void {
      alpha = Math.max(alpha, clamp(value, 0, 1));
    },
    isActive(): boolean {
      return alpha > 0;
    },
  };
}
