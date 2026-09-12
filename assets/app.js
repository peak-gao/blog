/* 极简静态博客 - 公共逻辑 */

/* ---------- 数据 ---------- */
function getPosts() {
  var posts = (window.__POSTS__ || []).slice();
  // 草稿预览：编辑页保存后先写 localStorage，未导出前也能在列表页看到
  try {
    var raw = localStorage.getItem("blog_drafts");
    if (raw) posts = posts.concat(JSON.parse(raw));
  } catch (e) {}
  return posts.sort(function (a, b) {
    return String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id));
  });
}

function getPostById(id) {
  var list = getPosts();
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

function allTags(posts) {
  var map = {};
  posts.forEach(function (p) {
    (p.tags || []).forEach(function (t) {
      t = String(t).trim();
      if (t) map[t] = (map[t] || 0) + 1;
    });
  });
  return Object.keys(map)
    .sort(function (a, b) { return map[b] - map[a] || a.localeCompare(b); })
    .map(function (k) { return { name: k, count: map[k] }; });
}

/* ---------- 工具 ---------- */
function q(name) {
  var m = new RegExp("[?&]" + name + "=([^&#]*)").exec(location.search);
  return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : "";
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

// 个人站内容自己写，只做基础防注入
function sanitize(html) {
  return String(html || "")
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\s*(iframe|object|embed)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
    .replace(/javascript\s*:/gi, "");
}

function summarize(html, len) {
  var text = String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > len ? text.slice(0, len) + "…" : text;
}

function tagLink(name) {
  return "index.html?tag=" + encodeURIComponent(name);
}

function postLink(id) {
  return "post.html?id=" + encodeURIComponent(id);
}

function parseTags(str) {
  return String(str || "")
    .split(/[,，;；\s]+/)
    .map(function (t) { return t.trim(); })
    .filter(function (t, i, arr) { return t && arr.indexOf(t) === i; });
}

/* ---------- 列表页 ---------- */
function renderList() {
  var box = document.getElementById("list");
  var tagBox = document.getElementById("tagbar");
  var note = document.getElementById("filter-note");
  if (!box) return;

  var posts = getPosts();
  var tag = q("tag");

  // 关键字栏
  if (tagBox) {
    var tags = allTags(posts);
    tagBox.innerHTML = tags.map(function (t) {
      var on = t.name === tag;
      return '<a class="tag' + (on ? " active" : "") + '" href="' +
        (on ? "index.html" : tagLink(t.name)) + '">' + esc(t.name) + " " + t.count + "</a>";
    }).join("");
  }

  var shown = tag ? posts.filter(function (p) { return (p.tags || []).indexOf(tag) > -1; }) : posts;

  if (note) {
    note.innerHTML = tag
      ? '<span>关键字：<strong>' + esc(tag) + '</strong>（' + shown.length + " 篇）</span>" +
        '<a href="index.html">清除筛选</a>'
      : "<span>共 " + posts.length + " 篇</span>";
  }

  document.title = tag ? tag + " - 我的博客" : "我的博客";

  if (!shown.length) {
    box.innerHTML = '<li class="empty">没有文章</li>';
    return;
  }

  box.innerHTML = shown.map(function (p) {
    var tags = (p.tags || []).map(function (t) {
      return '<a class="tag" href="' + tagLink(t) + '">' + esc(t) + "</a>";
    }).join("");
    return '<li class="post-item">' +
      '<h2 class="post-title"><a href="' + postLink(p.id) + '">' + esc(p.title || "无标题") + "</a></h2>" +
      '<div class="post-meta">' + esc(p.date || "") + "</div>" +
      '<p class="post-summary">' + esc(summarize(p.content, 120)) + "</p>" +
      '<div class="post-tags">' + tags + "</div>" +
      "</li>";
  }).join("");
}

/* ---------- 详情页 ---------- */
function renderPost() {
  var box = document.getElementById("article");
  if (!box) return;

  var id = q("id");
  var post = getPostById(id);
  if (!post) {
    box.innerHTML = '<div class="empty">文章不存在<br><br><a href="index.html">回到列表</a></div>';
    return;
  }

  document.title = (post.title || "无标题") + " - 我的博客";

  var tags = (post.tags || []).map(function (t) {
    return '<a class="tag" href="' + tagLink(t) + '">' + esc(t) + "</a>";
  }).join("");

  // 上下篇
  var list = getPosts();
  var idx = -1;
  list.forEach(function (p, i) { if (p.id === post.id) idx = i; });
  var prev = idx > 0 ? list[idx - 1] : null;                    // 更新的一篇
  var next = idx > -1 && idx < list.length - 1 ? list[idx + 1] : null; // 更早的一篇

  box.innerHTML =
    '<div class="article-head">' +
      '<h1 class="article-title">' + esc(post.title || "无标题") + "</h1>" +
      '<div class="article-meta"><span>' + esc(post.date || "") + "</span>" + tags + "</div>" +
    "</div>" +
    '<div class="article-body">' + sanitize(post.content) + "</div>" +
    '<div class="article-nav">' +
      (prev ? '<a href="' + postLink(prev.id) + '">← ' + esc(prev.title) + "</a>" : "<span></span>") +
      (next ? '<a href="' + postLink(next.id) + '">' + esc(next.title) + " →</a>" : "<span></span>") +
    "</div>";
}

/* ---------- 编辑页 ---------- */
function initEditor() {
  var editor = document.getElementById("editor");
  if (!editor) return;

  var btn = function (cmd, val) {
    document.execCommand(cmd, false, val);
    editor.focus();
  };

  document.getElementById("toolbar").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    e.preventDefault();
    var cmd = b.dataset.cmd;
    var val = b.dataset.val;
    if (cmd === "h2" || cmd === "h3" || cmd === "p") btn("formatBlock", "<" + cmd + ">");
    else if (cmd === "link") {
      var url = prompt("链接地址：", "https://");
      if (url) btn("createLink", url);
    }     else if (cmd === "image") {
      // 本地图片/截图：交给 admin.js 处理（压缩 + 上传），没加载时退回地址输入
      if (window.__uploadImage) { window.__uploadImage(); return; }
      var src = prompt("图片地址：", "https://");
      if (src) btn("insertImage", src);
    } else if (cmd === "netimg") {
      var u = prompt("网络图片地址：", "https://");
      if (u) btn("insertImage", u);
    } else if (cmd === "clear") btn("removeFormat");
    else if (val) btn(cmd, val);
    else btn(cmd);
  });

  // 编辑已有文章
  var editId = q("id");
  if (editId) {
    var p = getPostById(editId);
    if (p) {
      document.getElementById("f-title").value = p.title || "";
      document.getElementById("f-tags").value = (p.tags || []).join(", ");
      document.getElementById("f-date").value = p.date || "";
      editor.innerHTML = p.content || "";
    }
  } else {
    document.getElementById("f-date").value = new Date().toISOString().slice(0, 10);
  }

  document.getElementById("btn-save").addEventListener("click", function () {
    var title = document.getElementById("f-title").value.trim();
    var tags = parseTags(document.getElementById("f-tags").value);
    var date = document.getElementById("f-date").value || new Date().toISOString().slice(0, 10);
    var content = editor.innerHTML.trim();
    if (!title) return alert("标题不能为空");

    var id = editId || date.replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 7);
    var post = { id: id, title: title, tags: tags, date: date, content: content };

    var drafts = [];
    try { drafts = JSON.parse(localStorage.getItem("blog_drafts") || "[]"); } catch (e) {}
    drafts = drafts.filter(function (d) { return d.id !== id; });
    drafts.push(post);
    localStorage.setItem("blog_drafts", JSON.stringify(drafts));
    alert("已保存到本地草稿（浏览器 localStorage）。\n\n点「导出 posts.js」下载文件，替换 data/posts.js 后提交，内容才会正式上线。");
  });

  document.getElementById("btn-export").addEventListener("click", function () {
    var posts = getPosts();
    var text =
      "/**\n * 文章数据源（纯静态，无后端）\n * 每篇文章：{ id, title, tags[], date, content(富文本 HTML) }\n" +
      " * 用 edit.html 写好后导出本文件，覆盖这里再提交即可上线。\n */\nwindow.__POSTS__ = " +
      JSON.stringify(posts, null, 2) + ";\n";
    download("posts.js", text);
  });

  document.getElementById("btn-json").addEventListener("click", function () {
    download("posts.json", JSON.stringify(getPosts(), null, 2));
  });

  document.getElementById("btn-clear-local").addEventListener("click", function () {
    if (confirm("清空本地草稿（不影响 data/posts.js）？")) {
      localStorage.removeItem("blog_drafts");
      alert("已清空");
    }
  });

  function download(name, text) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    a.download = name;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  renderList();
  renderPost();
  initEditor();
});
