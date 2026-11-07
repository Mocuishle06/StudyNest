/* StudyNest 场景系统：手绘背景 + 窗景合成
 *
 * 背景图（bg1/bg2/bg3.jpg）自带沙发/书架/窗框，激活后：
 *   - 覆盖内置 CSS 房间（.wall/.floor/.sofa/.window/.lamp 隐藏，.bowl/.yarn 保留）
 *   - 每张背景带一份「窗框玻璃区域」配置，view 风景图精确塞进去（百分比定位，随房间缩放）
 *   - 猫的座位也按背景调整（三张背景的沙发位置不同）
 * 窗景（view-spring/winter/autumn.jpg）：白底 = 过曝天空，与木窗框自然衔接。
 *
 * 切换按钮在房间右上角（.room-tools），仅背景模式显示；内置房间沿用旧四季窗景。
 * 状态存 localStorage：studynest-bg（auto/bg1..3）、studynest-view（auto/spring/..）。
 */
(function () {
  'use strict';

  var KEY_BG = 'studynest-bg';
  var KEY_VIEW = 'studynest-view';

  /* view/pet 坐标为相对 .room 的百分比（left/top/width/height/bottom） */
  var BGS = [
    { id: 'bg1', name: '绿植书房', src: 'assets/room/bg1.jpg',
      view: { left: 39.6, top: 25.8, width: 19.6, height: 31.7 },
      pet:  { left: 29, width: 36, bottom: 21 } },
    { id: 'bg2', name: '暖木书吧', src: 'assets/room/bg2.jpg',
      view: { left: 42.4, top: 21.2, width: 12.2, height: 30.5 },
      pet:  { left: 27, width: 38, bottom: 24 } },
    { id: 'bg3', name: '古典书房', src: 'assets/room/bg3.jpg',
      view: { left: 41.9, top: 21.2, width: 17.9, height: 30.8 },
      pet:  { left: 24, width: 28, bottom: 26 } }
  ];

  var VIEWS = [
    { id: 'spring', name: '春·绿荫', src: 'assets/room/view-spring.png' },
    { id: 'autumn', name: '秋·金叶', src: 'assets/room/view-autumn.png' },
    { id: 'winter', name: '冬·落雪', src: 'assets/room/view-winter.png' }
  ];

  function pref(key, list) {
    try {
      var v = localStorage.getItem(key);
      if (v && (v === 'auto' || list.some(function (x) { return x.id === v; }))) return v;
    } catch (e) {}
    return 'auto';
  }

  function autoView() {
    var m = new Date().getMonth() + 1;
    if (m >= 3 && m <= 8) return 'spring';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
  }

  var bgMode = (function () {          // 首次访问默认用第一张背景；'auto' 表示内置手绘房间
    try {
      var v = localStorage.getItem(KEY_BG);
      if (v && (v === 'auto' || BGS.some(function (b) { return b.id === v; }))) return v;
    } catch (e) {}
    return BGS[0].id;
  })();
  var viewMode = pref(KEY_VIEW, VIEWS);

  function findBg() {
    return bgMode === 'auto' ? null : BGS.filter(function (b) { return b.id === bgMode; })[0] || null;
  }
  function findView() {
    var id = viewMode === 'auto' ? autoView() : viewMode;
    return VIEWS.filter(function (v) { return v.id === id; })[0] || VIEWS[0];
  }

  function label() {
    var b = findBg(), v = findView();
    return {
      bg: '🖼 ' + (b ? b.name : '内置房间'),
      view: '🪟 ' + (viewMode === 'auto' ? '自动' : v.name.replace(/^[^·]+·/, ''))
    };
  }

  /* ---------------- 渲染 ---------------- */

  function ensureTools(room) {
    var tools = room.querySelector('.room-tools');
    if (!tools) {
      tools = document.createElement('div');
      tools.className = 'room-tools';
      var bb = document.createElement('button');
      bb.type = 'button';
      bb.className = 'rt-bg';
      var vb = document.createElement('button');
      vb.type = 'button';
      vb.className = 'rt-view';
      bb.addEventListener('click', function () {
        var ids = ['auto'].concat(BGS.map(function (b) { return b.id; }));
        bgMode = ids[(ids.indexOf(bgMode) + 1) % ids.length];
        try { localStorage.setItem(KEY_BG, bgMode); } catch (e) {}
        apply();
      });
      vb.addEventListener('click', function () {
        // 仅背景模式可达（按钮随 .room-tools 只在背景模式渲染）；
        // 内置房间的四季切换用窗上的小按钮（assets.js 的 win-switcher）。
        var ids = ['auto'].concat(VIEWS.map(function (v) { return v.id; }));
        viewMode = ids[(ids.indexOf(viewMode) + 1) % ids.length];
        try { localStorage.setItem(KEY_VIEW, viewMode); } catch (e) {}
        apply();
      });
      tools.appendChild(bb);
      tools.appendChild(vb);
      room.appendChild(tools);
    }
    var t = label();
    var bt = tools.querySelector('.rt-bg');
    var vt = tools.querySelector('.rt-view');
    if (bt && bt.textContent !== t.bg) bt.textContent = t.bg;
    if (vt && vt.textContent !== t.view) vt.textContent = t.view;
  }

  function mountScene(room, bg) {
    room.dataset.scene = bg.id;

    var bgImg = room.querySelector('.bg-img');
    if (!bgImg) {
      bgImg = document.createElement('img');
      bgImg.className = 'bg-img';
      bgImg.alt = '房间背景';
      bgImg.draggable = false;
      room.insertBefore(bgImg, room.firstChild);
    }
    if (bgImg.dataset.scene !== bg.id) {
      bgImg.src = bg.src;
      bgImg.dataset.scene = bg.id;
    }

    var view = room.querySelector('.bg-view');
    if (!view) {
      view = document.createElement('div');
      view.className = 'bg-view';
      var im = document.createElement('img');
      im.alt = '窗外风景';
      im.draggable = false;
      view.appendChild(im);
      var pet = room.querySelector('.pet-wrap');
      if (pet) room.insertBefore(view, pet);
      else room.appendChild(view);
    }
    var vb = findBg().view;
    view.style.left = vb.left + '%';
    view.style.top = vb.top + '%';
    view.style.width = vb.width + '%';
    view.style.height = vb.height + '%';

    var vi = view.querySelector('img');
    var v = findView();
    if (vi.dataset.view !== v.id) {
      vi.src = v.src;
      vi.dataset.view = v.id;
    }

    ensureTools(room);
  }

  function apply() {
    var bg = findBg();
    document.querySelectorAll('.room').forEach(function (room) {
      if (bg) mountScene(room, bg);
      else {
        delete room.dataset.scene;
        ['bg-img', 'bg-view', 'room-tools'].forEach(function (cls) {
          var n = room.querySelector('.' + cls);
          if (n) n.remove();
        });
      }
    });
  }

  /* 供全屏模式克隆房间后重新绑定按钮（cloneNode 不带事件） */
  function bind(container) {
    if (!container) return;
    container.querySelectorAll('.room').forEach(ensureTools);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }

  window.ROOM_SCENES = {
    apply: apply,
    bind: bind,
    get bg() { return bgMode; },
    get view() { return viewMode; },
    set bg(v) { bgMode = v; try { localStorage.setItem(KEY_BG, v); } catch (e) {} apply(); },
    set view(v) { viewMode = v; try { localStorage.setItem(KEY_VIEW, v); } catch (e) {} apply(); },
    BGS: BGS,
    VIEWS: VIEWS
  };
})();
