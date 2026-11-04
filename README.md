# AI Radar

一个轻量的 AI 开源项目看板：从全历史的 AI 相关仓库中筛出至少 1,000 Star 的高质量项目；同时以每日快照计算近 7 天的 Star 增长，并按类型整理。

## 本地预览

```bash
npm run serve
```

也可以直接打开 `index.html`（建议用任意静态服务器，以确保浏览器能加载数据文件）。

## 数据更新

GitHub Actions 每天在北京时间 09:15 运行一次，也可在 Actions 页面手动触发。它会：

1. 搜索全历史、总 Star 至少 1,000 的 AI 主题仓库；
2. 保存每日 Star 快照到 `data/star-history.json`；
3. 以当前 Star 减去 7 天前的快照计算增长值；当数据齐全时优先按增长排序，否则按总 Star 数排序生成 `data/projects.json`；
4. 自动提交新的数据文件。

首次采集的项目没有 7 天前的快照，增长值会显示为 0；连续运行满 7 天后会开始得到完整的周增长数据。

## 部署

将仓库发布到 GitHub Pages、Netlify 或 Vercel 即可。没有构建步骤；部署根目录即可。

