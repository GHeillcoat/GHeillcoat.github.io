#!/usr/bin/env node
/**
 * 从 Obsidian 库同步到站点并部署。
 *
 *   npm run sync            # 默认从 D:/obsidian 同步
 *   npm run sync -- --from "D:/别的库"
 *
 * 做的事：
 *   1. 重新导入笔记（和 import:vault 一样，清单里的旧文件会被替换）
 *   2. 有变化才提交（git add src/content/posts public/vault scripts/vault-import-manifest.json）
 *   3. 推到 GitHub（master -> main），触发 Pages 部署
 *
 * 不碰手写文章：只 add 上面三个路径，其它改动留给你自己决定。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const flag = (name, fallback = '') => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const FROM = flag('from', process.env.VAULT_PATH || 'D:/obsidian');
const REMOTE = flag('remote', 'git@github.com:GHeillcoat/GHeillcoat.github.io.git');
const BRANCH = flag('branch', 'main');

const run = (cmd, argv, opts = {}) =>
  execFileSync(cmd, argv, { stdio: 'inherit', cwd: process.cwd(), ...opts });

const capture = (cmd, argv) => execFileSync(cmd, argv, { encoding: 'utf8' }).trim();

function main() {
  if (!fs.existsSync(FROM)) {
    console.error(`找不到 Obsidian 库：${FROM}`);
    process.exit(1);
  }

  console.log(`\n[1/3] 导入：${FROM}`);
  run(process.execPath, [path.join('scripts', 'import-vault.mjs'), '--from', FROM]);

  const watchPaths = ['src/content/posts', 'public/vault', 'scripts/vault-import-manifest.json'];
  const staged = capture('git', ['status', '--porcelain', '--', ...watchPaths]);
  if (!staged) {
    console.log('\n[2/3] 内容没有变化，跳过提交与推送。');
    return;
  }

  console.log('\n[2/3] 提交：');
  console.log(staged);
  run('git', ['add', '--', ...watchPaths]);
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  run('git', ['-c', 'user.name=Auntilz', '-c', 'user.email=1739060093@qq.com', 'commit', '-q', '-m', `sync vault: ${stamp}`]);

  console.log(`\n[3/3] 推送 master -> ${BRANCH}`);
  run('git', ['push', REMOTE, `master:${BRANCH}`]);
  console.log('\n完成：GitHub Actions 会开始构建，约 1–2 分钟后线上生效。');
}

main();
