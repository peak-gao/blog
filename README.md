# 我的博客（极简静态站）

纯 HTML + CSS + JS，无后端、无构建、无依赖。数据全部在 `data/posts.js` 里。

## 文件结构

```
index.html          列表页（支持 ?tag=关键字 筛选）
post.html           详情页（?id=文章ID）
edit.html           写文章页（富文本编辑器 + 导出数据）
assets/style.css     样式（自动跟随系统深浅色）
assets/app.js        列表/详情/编辑的渲染逻辑
data/posts.js        文章数据源  ← 所有文章都在这里
```

## 本地预览

双击 `index.html` 即可；或起个服务：

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```

## 写文章

1. 打开 `edit.html`，填标题、关键字（逗号/空格分隔）、正文（支持加粗、标题、列表、引用、代码块、链接、图片）
2. 点「保存到本地草稿」→ 可先在列表页预览
3. 点「导出 posts.js」下载文件
4. 覆盖 `data/posts.js`，然后提交推送：

```bash
git add .
git commit -m "new post"
git push
```

5. Gitee 仓库 → 服务 → Gitee Pages → 点「更新」重新部署

## 部署到 Gitee Pages

- 仓库：https://gitee.com/peakgao/blog （已设为公开）
- 远端：`git@gitee.com:peakgao/blog.git` / `https://gitee.com/peakgao/blog.git`
- Pages 地址：https://peakgao.gitee.io/blog

首次开启：仓库 → 服务 → Gitee Pages → 分支选 `master`、部署目录留空 → 部署（需实名认证）。
之后每次推送新文章，去同一页面点「更新」重新部署即可。
