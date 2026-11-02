# 部署到 GitHub Pages

站点是纯静态输出（`dist/`），用 GitHub Actions 直接发布到 Pages，不需要服务器。

## 一、关键前提：仓库名

GitHub Pages 的用户站点地址是 `https://<用户名>.github.io/`，**只有仓库名等于
`GHeillcoat.github.io` 时才会挂在根路径**。

本项目的所有链接、字体、图片都写成根路径（`/posts/…`、`/fonts/…`、`/images/…`），
所以：

| 仓库名 | 地址 | 是否直接可用 |
| --- | --- | --- |
| `GHeillcoat.github.io` | `https://gheillcoat.github.io/` | ✅ 直接可用 |
| 其它名字（如 `blog`） | `https://gheillcoat.github.io/blog/` | ❌ 需要给全站加 `base`，链接得改成带前缀 |

推荐做法：新建仓库 **`GHeillcoat.github.io`**，把本项目推上去。

如果已经用了别的仓库名，两个选择：

1. 用自定义域名（`CNAME`），仍是根路径；
2. 让我把全站改成 `import.meta.env.BASE_URL` 感知（约 10 处硬编码 + 图谱/双链生成器里的 URL），再配 `base: '/仓库名/'`。

## 二、开启 Pages

1. 把仓库推到 GitHub 的默认分支（`master` 或 `main` 都行，workflow 两个都监听）。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**（不要选 “Deploy from a branch”）。
3. 推一次代码（或手动跑一次 `Deploy to GitHub Pages` workflow）。
4. 构建约 1–2 分钟，完成后访问 `https://gheillcoat.github.io/`。

## 三、workflow 做了什么

`.github/workflows/deploy.yml`：

```text
checkout → setup-node 22 → npm ci → npm run build → upload-pages-artifact(dist) → deploy-pages
```

`npm run build` 里包含三步：字体子集（`scripts/fetch-fonts.mjs`）→ Astro 静态构建 →
Pagefind 全文索引，所以线上搜索是可用的。

`SITE_URL` 在 workflow 里固定为 `https://gheillcoat.github.io`（用于 canonical、OG、
sitemap、RSS）。换成自定义域名时改这一处即可。

## 四、本地验证线上形态

```bash
npm run build
npm run preview      # http://localhost:4322，和 Pages 上是同一份 dist
```

## 五、几个容易踩的点

- **不要**开启 “Deploy from a branch” 同时保留这个 workflow，二者会互相覆盖。
- `dist/` 不进 git（已在 `.gitignore`），只提交源码；构建在 CI 里做。
- `public/.nojekyll` 已放好，避免 Pages 用 Jekyll 处理 `_astro/` 目录（用 Actions 发布时其实用不到，但留着无妨）。
- 内容里的 455 篇笔记会一起参与构建，CI 首次构建约 1–2 分钟；字体子集脚本失败会保留旧文件并继续，不会挂掉部署。
- 中文路径（`/posts/ch13-rag/133-分块策略…`）在 Pages 上是 UTF-8 百分号编码，正常可访问。
- 仓库体积：源码 + 455 篇笔记约 3 MB，`dist/` 约 40–60 MB（Pages 上限 1 GB，没问题）。
