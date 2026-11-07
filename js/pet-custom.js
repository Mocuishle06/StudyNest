/* StudyNest 自定义宠物
 * 让用户上传自己画的 4 张图（日常 / 学习中 / 休息中 / 庆祝）替换内置小猫。
 *
 * 约定
 *  - 存 localStorage('studynest-pet-custom')，只在本机生效；图片体积大，不进云端同步。
 *  - 与 assets.js 的分工：assets.js 管内置素材；本文件优先级更高，
 *    用 .pet-wrap[data-custom="1"] 与 .pet-img[data-builtin] 互斥，保证不叠图。
 *  - 只传一张也能用：没上传的状态自动复用已上传的图，不会出现「空房间」。
 *  - 上传时自动压到最长边 480px 以内、单张 ≤ 600KB，超了再降尺寸重试。
 */
(function () {
  'use strict';

  var KEY = 'studynest-pet-custom';
  var MAX_SIDE = 480;              // 最长边上限（像素）
  var MAX_BYTES = 600 * 1024;      // 单张 dataURL 字符数上限
  var MAX_FILE = 12 * 1024 * 1024; // 原文件上限，超过先让用户自己压

  var MODES = [
    { k: 'idle', n: '日常', d: '不学习的时候' },
    { k: 'studying', n: '学习中', d: '专注计时中' },
    { k: 'resting', n: '休息中', d: '休息计时中' },
    { k: 'celebrate', n: '庆祝', d: '完成一轮专注' }
  ];

  var store = read();
  var tipTimer = null;

  /* ---------------- 存储 ---------------- */

  function read() {
    var o = {};
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || '{}');
      MODES.forEach(function (m) {
        var v = raw && raw[m.k];
        if (typeof v === 'string' && v.indexOf('data:image/') === 0) o[m.k] = v;
      });
    } catch (e) { /* 坏数据当作没有 */ }
    return o;
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
      return true;
    } catch (e) {
      return false;              // 配额满
    }
  }

  function hasAny() {
    for (var i = 0; i < MODES.length; i++) if (store[MODES[i].k]) return true;
    return false;
  }

  /* 某状态该显示哪张图：没传就用第一张有的 */
  function srcFor(mode) {
    if (store[mode]) return store[mode];
    for (var i = 0; i < MODES.length; i++) {
      if (store[MODES[i].k]) return store[MODES[i].k];
    }
    return '';
  }

  function usedBytes() {
    var n = 0;
    try {
      for (var k in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, k)) {
          n += (localStorage[k] || '').length + k.length;
        }
      }
    } catch (e) { /* ignore */ }
    return n * 2;               // UTF-16，粗略按 2 字节/字符估
  }

  /* ---------------- 应用到房间 ---------------- */

  function apply() {
    var any = hasAny();
    document.querySelectorAll('.pet-wrap').forEach(function (w) {
      // 清掉上一轮插入的自定义图
      w.querySelectorAll('.pet-img[data-custom]').forEach(function (n) { n.remove(); });

      if (!any) {
        delete w.dataset.custom;
        var sv = w.querySelector('.pet-svg');
        if (sv) sv.style.display = '';
        return;
      }

      // 有自定义：内置 SVG 与内置 PNG 全部让位
      w.dataset.custom = '1';
      var svg = w.querySelector('.pet-svg');
      if (svg) svg.style.display = 'none';
      w.querySelectorAll('.pet-img[data-builtin]').forEach(function (n) { n.remove(); });

      MODES.forEach(function (m) {
        var src = srcFor(m.k);
        if (!src) return;
        var im = document.createElement('img');
        im.className = 'pet-img';
        im.dataset.mode = m.k;
        im.dataset.custom = '1';
        im.src = src;
        im.alt = '我的宠物（' + m.n + '）';
        im.draggable = false;
        w.appendChild(im);
      });
    });

    // 全清空了就把内置素材挂回来
    if (!any && window.PetAssets && typeof window.PetAssets.mount === 'function') {
      window.PetAssets.mount();
    }
  }

  /* ---------------- 图片处理 ---------------- */

  function shrink(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type || '')) {
        reject(new Error('请选择图片文件（PNG / JPG）'));
        return;
      }
      var fr = new FileReader();
      fr.onerror = function () { reject(new Error('文件读取失败，换一张试试')); };
      fr.onload = function () {
        var im = new Image();
        im.onerror = function () { reject(new Error('这张图打不开，可能已损坏')); };
        im.onload = function () {
          var w = im.naturalWidth || im.width;
          var h = im.naturalHeight || im.height;
          if (!w || !h) { reject(new Error('图片尺寸异常')); return; }

          var isPng = /png/i.test(file.type) || /^data:image\/png/.test(fr.result);
          var fmt = isPng ? 'image/png' : 'image/jpeg';
          var side = Math.min(MAX_SIDE, Math.max(w, h));
          var tries = 0;

          (function attempt() {
            var scale = Math.min(1, side / Math.max(w, h));
            var cw = Math.max(1, Math.round(w * scale));
            var ch = Math.max(1, Math.round(h * scale));
            var out;

            if (scale === 1 && fr.result.length <= MAX_BYTES) {
              out = fr.result;                    // 小图直接原样用，不重新编码
            } else {
              var c = document.createElement('canvas');
              c.width = cw;
              c.height = ch;
              var cx = c.getContext('2d');
              if (cx.imageSmoothingEnabled !== undefined) cx.imageSmoothingEnabled = true;
              if ('imageSmoothingQuality' in cx) cx.imageSmoothingQuality = 'high';
              cx.drawImage(im, 0, 0, cw, ch);
              out = c.toDataURL(fmt, 0.92);
            }

            if (out.length <= MAX_BYTES || side <= 160 || tries >= 4) {
              resolve(out);
              return;
            }
            side = Math.round(side * 0.75);
            tries++;
            attempt();
          })();
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  /* ---------------- 弹窗 ---------------- */

  function tip(msg) {
    var el = document.getElementById('petTip');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('on', !!msg);
    if (tipTimer) clearTimeout(tipTimer);
    if (msg) tipTimer = setTimeout(function () { el.classList.remove('on'); }, 3200);
  }

  function fmtSize(n) {
    return n >= 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + ' MB'
      : Math.max(1, Math.round(n / 1024)) + ' KB';
  }

  function renderSlots() {
    var wrap = document.getElementById('petSlots');
    if (!wrap) return;
    wrap.textContent = '';

    MODES.forEach(function (m) {
      var src = store[m.k];
      var box = document.createElement('div');
      box.className = 'pms' + (src ? ' has' : '');

      var pv = document.createElement('div');
      pv.className = 'pms-prev';
      if (src) {
        var im = document.createElement('img');
        im.src = src;
        im.alt = m.n;
        pv.appendChild(im);
      } else {
        var ph = document.createElement('span');
        ph.className = 'pms-empty';
        ph.textContent = '＋';
        pv.appendChild(ph);
      }

      var name = document.createElement('div');
      name.className = 'pms-name';
      name.textContent = m.n;
      var sub = document.createElement('small');
      sub.textContent = m.d;
      name.appendChild(sub);

      var acts = document.createElement('div');
      acts.className = 'pms-acts';

      var label = document.createElement('label');
      label.className = 'pms-btn';
      label.textContent = src ? '换一张' : '上传';
      var inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/png,image/jpeg,image/webp';
      inp.hidden = true;
      inp.addEventListener('change', function () {
        var f = inp.files && inp.files[0];
        inp.value = '';
        if (!f) return;
        if (f.size > MAX_FILE) {
          tip('这张图有 ' + fmtSize(f.size) + '，太大了（上限 12MB），先压缩一下再传');
          return;
        }
        tip('正在处理…');
        shrink(f).then(function (url) {
          var bak = store[m.k];
          var bakHad = Object.prototype.hasOwnProperty.call(store, m.k);
          store[m.k] = url;
          if (!persist()) {
            if (bakHad) store[m.k] = bak; else delete store[m.k];
            tip('浏览器存储空间不够了，换一张小一点的图，或先删掉别的槽位');
            return;
          }
          apply();
          renderSlots();
          tip('已换成你画的「' + m.n + '」形象');
        }).catch(function (e) {
          tip((e && e.message) || '处理失败，换一张试试');
        });
      });
      label.appendChild(inp);

      acts.appendChild(label);

      if (src) {
        var del = document.createElement('button');
        del.type = 'button';
        del.className = 'pms-del';
        del.textContent = '删除';
        del.addEventListener('click', function () {
          delete store[m.k];
          persist();
          apply();
          renderSlots();
          tip('已删除「' + m.n + '」');
        });
        acts.appendChild(del);
      }

      box.appendChild(pv);
      box.appendChild(name);
      box.appendChild(acts);
      wrap.appendChild(box);
    });

    var meter = document.getElementById('petSize');
    if (meter) {
      var n = usedBytes();
      meter.textContent = hasAny()
        ? '本机已存 ' + fmtSize(n) + '（约 5MB 上限）'
        : '还没上传，当前是内置小猫';
    }
    var reset = document.getElementById('petReset');
    if (reset) reset.disabled = !hasAny();
  }

  function open() {
    var m = document.getElementById('petModal');
    if (!m) return;
    renderSlots();
    tip('');
    m.classList.add('on');
    m.setAttribute('aria-hidden', 'false');
    document.body.classList.add('pm-lock');
  }

  function close() {
    var m = document.getElementById('petModal');
    if (!m) return;
    m.classList.remove('on');
    m.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('pm-lock');
  }

  /* ---------------- 启动 ---------------- */

  /* 全部清空 → 回到内置小猫 */
  function clearAll() {
    store = {};
    try { localStorage.removeItem(KEY); } catch (e) {}
    apply();
    renderSlots();
  }

  function boot() {
    document.querySelectorAll('.pet-open').forEach(function (b) {
      b.addEventListener('click', open);
    });
    var m = document.getElementById('petModal');
    if (m) {
      m.addEventListener('click', function (e) { if (e.target === m) close(); });
      var x = document.getElementById('petClose');
      if (x) x.addEventListener('click', close);
      var r = document.getElementById('petReset');
      if (r) {
        r.addEventListener('click', function () {
          clearAll();
          tip('已恢复内置小猫');
        });
      }
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && m && m.classList.contains('on')) close();
    });
    apply();
  }

  // 对外：供测试与其它模块调用
  window.PetCustom = {
    apply: apply,
    has: hasAny,
    get: function (k) { return store[k] || ''; },
    count: function () { return MODES.filter(function (m) { return !!store[m.k]; }).length; },
    /* 直接写入某状态的图（测试 / 未来批量导入用），不经过压缩 */
    set: function (k, url) {
      if (!k) return false;
      if (url) store[k] = url; else delete store[k];
      var saved = persist();
      apply();
      renderSlots();
      return saved;
    },
    clear: clearAll,
    open: open,
    close: close,
    _shrink: shrink,
    MODES: MODES
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
