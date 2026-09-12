# 我的博客（极简静态站）

纯 HTML + CSS + JS，无后端、无构建、无依赖。数据全部在 `data/posts.js` 里。

## 文件结构

```
index.html          列表页（支持 ?tag=关键字 筛选）
post.html           详情页（?id=文章ID）
edit.html           写文章 / 管理页（富文本编辑器 + 线上同步）
assets/style.css     样式（自动跟随系统深浅色）
assets/app.js        列表/详情/编辑的渲染逻辑
assets/admin.js      网页内直连 GitHub 保存/发布
data/posts.js        文章数据源  ← 所有文章都在这里
```

## 本地预览

双击 `index.html` 即可；或起个服务：

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```

## 写文章（推荐：网页内直接发布）

1. 打开 `edit.html`，第一次填入 GitHub Token（勾选 `repo` 权限）→ 点「连接」
   - Token 只存在当前浏览器的 localStorage，不会上传到任何地方
2. 上方会自动列出线上所有文章，点任意一篇可加载修改
3. 写好后点「保存并发布到线上」→ 内容直接提交到 `data/posts.js`，GitHub Pages 约 1 分钟后生效
4. 删除：加载某篇后点「删除这篇」

整个过程不需要本地 git、不需要命令行。

### 备用方式（离线）

「存本地草稿」→「导出 posts.js」→ 手动覆盖 `data/posts.js` → `git push`

## 部署

### GitHub Pages（主站，自动部署）

- 仓库：https://github.com/peak-gao/blog
- **访问地址：https://peak-gao.github.io/blog/**
- 来源：`main` 分支根目录，push 完自动重新构建，不用手动点任何按钮

```bash
git push origin main
```

### Gitee（仅代码备份）

- 仓库：https://gitee.com/peakgao/blog
- 该账号未开通 Gitee Pages（服务页无入口），只做异地备份

```bash
git push gitee main
```
