/* 网页内直连 GitHub 保存/发布（纯前端，无需后端） */
(function () {
  var CFG = { owner: 'peak-gao', repo: 'blog', branch: 'main', path: 'data/posts.js' };
  var TOKEN_KEY = 'gh_pat';

  var state = { posts: [], sha: '' };

  function $(id) { return document.getElementById(id); }
  function token() { return (localStorage.getItem(TOKEN_KEY) || '').trim(); }
  function q(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function say(msg, kind) {
    var el = $('gh-msg');
    if (!el) return;
    el.className = 'gh-msg' + (kind ? ' ' + kind : '');
    el.innerHTML = msg;
  }

  /* ---------- GitHub API ---------- */
  function api(path, opts) {
    opts = opts || {};
    var headers = { Accept: 'application/vnd.github+json' };
    if (token()) headers.Authorization = 'Bearer ' + token();
    if (opts.body) headers['Content-Type'] = 'application/json';
    return fetch('https://api.github.com' + path, {
      method: opts.method || 'GET',
      headers: Object.assign(headers, opts.headers || {}),
      body: opts.body,
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error(j.message || ('HTTP ' + r.status));
        return j;
      });
    });
  }

  function b64enc(str) {
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function b64dec(b64) {
    var bin = atob(String(b64).replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function buildFile(posts) {
    return '/**\n * 文章数据源（纯静态，无后端）\n' +
      ' * 每篇文章：{ id, title, tags[], date, content(富文本 HTML) }\n */\n' +
      'window.__POSTS__ = ' + JSON.stringify(posts, null, 2) + ';\n';
  }

  function parseFile(text) {
    var m = /window\.__POSTS__\s*=\s*([\s\S]*);\s*$/.exec(text);
    if (!m) return [];
    try { return JSON.parse(m[1]); } catch (e) { return []; }
  }

  /* ---------- 拉取线上文章 ---------- */
  function loadRemote() {
    if (!token()) { say('先填 GitHub Token 再点「连接」', 'warn'); return Promise.resolve(); }
    return api('/repos/' + CFG.owner + '/' + CFG.repo).then(function (repo) {
      $('gh-state').textContent = '已连接 ' + repo.full_name + '（' + repo.default_branch + '）';
      return api('/repos/' + CFG.owner + '/' + CFG.repo + '/contents/' + CFG.path + '?ref=' + CFG.branch);
    }).then(function (file) {
      state.sha = file.sha;
      state.posts = parseFile(b64dec(file.content));
      renderList();
      say('已拉取线上 ' + state.posts.length + ' 篇文章', 'ok');
    }).catch(function (e) {
      say('拉取失败：' + esc(e.message), 'err');
    });
  }

  function renderList() {
    var box = $('gh-list');
    if (!box) return;
    var cur = q('id');
    if (!state.posts.length) { box.innerHTML = '<div class="gh-empty">线上暂无文章</div>'; return; }
    box.innerHTML = state.posts.map(function (p) {
      return '<a class="gh-item' + (p.id === cur ? ' active' : '') + '" href="edit.html?id=' +
        encodeURIComponent(p.id) + '"><span class="gh-item-title">' + esc(p.title || '无标题') +
        '</span><span class="gh-item-date">' + esc(p.date || '') + '</span></a>';
    }).join('');
  }

  /* ---------- 收集当前表单 ---------- */
  function collect() {
    var editor = $('editor');
    var title = $('f-title').value.trim();
    var tags = String($('f-tags').value).split(/[,，;；\s]+/)
      .map(function (t) { return t.trim(); })
      .filter(function (t, i, a) { return t && a.indexOf(t) === i; });
    var date = $('f-date').value || new Date().toISOString().slice(0, 10);
    var content = editor.innerHTML.trim();
    if (!title) throw new Error('标题不能为空');
    var id = q('id') || date.replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 7);
    return { id: id, title: title, tags: tags, date: date, content: content };
  }

  /* ---------- 写入仓库 ---------- */
  function commit(posts, message) {
    return api('/repos/' + CFG.owner + '/' + CFG.repo + '/contents/' + CFG.path, {
      method: 'PUT',
      body: JSON.stringify({
        message: message,
        content: b64enc(buildFile(posts)),
        sha: state.sha || undefined,
        branch: CFG.branch,
      }),
    }).then(function (res) {
      state.sha = res.content.sha;
      return res;
    });
  }

  function publish() {
    if (!token()) { say('请先填 GitHub Token 并点「连接」', 'warn'); return; }
    var post;
    try { post = collect(); } catch (e) { say(esc(e.message), 'err'); return; }

    var btn = $('btn-publish');
    btn.disabled = true; btn.textContent = '发布中…';
    say('正在同步到 GitHub…');

    // 还没拉到线上数据时先拉一次，避免手快点了发布却提交失败
    var ready = state.sha ? Promise.resolve() : loadRemote();

    ready.then(function () {
      if (!state.sha) throw new Error('拉取线上数据失败，请点「刷新」重试');
      var posts = state.posts.slice();
      var idx = -1;
      posts.forEach(function (p, i) { if (p.id === post.id) idx = i; });
      if (idx > -1) posts[idx] = post; else posts.unshift(post);
      posts.sort(function (a, b) {
        return String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id));
      });
      return commit(posts, (idx > -1 ? 'update: ' : 'post: ') + post.title).then(function () {
        state.posts = posts;
        renderList();
        say('已发布：<strong>' + esc(post.title) + '</strong><br>' +
          'GitHub Pages 约 1 分钟后生效 → ' +
          '<a href="https://' + CFG.owner + '.github.io/' + CFG.repo + '/post.html?id=' +
          encodeURIComponent(post.id) + '" target="_blank">查看这篇文章</a>', 'ok');
        if (!q('id')) {
          history.replaceState(null, '', 'edit.html?id=' + encodeURIComponent(post.id));
          renderList();
        }
      });
    })
      .catch(function (e) { say('发布失败：' + esc(e.message), 'err'); })
      .then(function () { btn.disabled = false; btn.textContent = '保存并发布到线上'; });
  }

  function remove() {
    var id = q('id');
    if (!id) { say('当前是新建状态，没有可删除的文章', 'warn'); return; }
    if (!confirm('确定删除这篇文章？删除后需要再发布一次才会在线上生效。')) return;
    var posts = state.posts.filter(function (p) { return p.id !== id; });
    if (posts.length === state.posts.length) { say('线上没找到这篇', 'warn'); return; }
    commit(posts, 'delete: ' + id)
      .then(function () { alert('已删除并提交，约 1 分钟后线上生效'); location.href = 'edit.html'; })
      .catch(function (e) { say('删除失败：' + esc(e.message), 'err'); });
  }

  /* ---------- 初始化 ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('gh-panel')) return;

    var saved = token();
    if (saved) $('gh-token').value = saved;

    $('gh-connect').addEventListener('click', function () {
      var v = $('gh-token').value.trim();
      if (!v) { say('Token 不能为空', 'warn'); return; }
      localStorage.setItem(TOKEN_KEY, v);
      say('连接中…');
      loadRemote();
    });

    $('gh-clear').addEventListener('click', function () {
      localStorage.removeItem(TOKEN_KEY);
      $('gh-token').value = '';
      $('gh-state').textContent = '未连接';
      state = { posts: [], sha: '' };
      renderList();
      say('已清除本地 Token');
    });

    $('btn-publish').addEventListener('click', publish);
    $('btn-delete').addEventListener('click', remove);
    $('gh-reload').addEventListener('click', loadRemote);

    if (saved) loadRemote(); else renderList();
  });
})();
