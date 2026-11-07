/* StudyNest 场景系统：手绘背景 + 窗景合成
 *
 * 背景图（bg1/bg2/bg3.jpg）自带沙发/书架/窗框，激活后：
 *   - 覆盖内置 CSS 房间（.wall/.floor/.sofa/.window/.lamp 隐藏）
 *   - 每张背景带一份「窗框玻璃区域」配置，view 风景图不透明满铺塞进去
 *     （不透明 = 完全盖住背景里原来的风景，视觉上等于把旧风景抠掉了）
 *   - 猫的座位按背景调整，且区分内置猫 / 用户自定义宠物（petC，通常更小更靠中间）
 * 窗景（view-spring/winter/autumn.jpg）：不透明水彩块，边缘无白底。
 *
 * 切换按钮（.room-tools）始终显示——包括内置房间模式，否则切到内置后没法切回来。
 * 内置模式下窗景按钮调用 assets.js 的 window.WinCycle 切旧四季窗景。
 * 状态存 localStorage：studynest-bg（auto/bg1..3）、studynest-view（auto/spring/..）。
 */
(function () {
  'use strict';

  var KEY_BG = 'studynest-bg';
  var KEY_VIEW = 'studynest-view';

  /* view/pet 坐标为相对 .room 的百分比（left/top/width/height/bottom）
   * view = 窗框玻璃区域（实测自 1280 宽背景图，微扩 0.3% 盖住玻璃边缘，防止旧风景露边）
   * pet  = 内置猫座位；petC = 自定义宠物座位（用户图常比内置猫大，缩小居中防悬空） */
  var BGS = [
    { id: 'bg1', name: '绿植书房', src: 'assets/room/bg1.jpg',
      view: { left: 39.8, top: 25.9, width: 22.2, height: 32.2 },
      pet:  { left: 30, width: 35, bottom: 22 },
      petC: { left: 31, width: 32, bottom: 22 } },
    { id: 'bg2', name: '暖木书吧', src: 'assets/room/bg2.jpg',
      view: { left: 43.7, top: 22.4, width: 12.3, height: 28.2 },   // 玻璃区实测 x562-720 y203-455（含内窗台）
      pet:  { left: 29, width: 37, bottom: 24 },
      petC: { left: 30.5, width: 33, bottom: 23 } },
    { id: 'bg3', name: '古典书房', src: 'assets/room/bg3.jpg',
      view: { left: 39.2, top: 22.6, width: 23.0, height: 33.2 },   // 玻璃区实测 x505-800 y205-500（右缘到窗帘前）
      pet:  { left: 24.5, width: 26, bottom: 22 },
      petC: { left: 26, width: 23, bottom: 21.5 } }
  ];

  var VIEWS = [
    { id: 'spring', name: '春·绿荫', src: 'assets/room/view-spring.jpg' },
    { id: 'autumn', name: '秋·金叶', src: 'assets/room/view-autumn.jpg' },
    { id: 'winter', name: '冬·落雪', src: 'assets/room/view-winter.jpg' }
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
      var pb = document.createElement('button');
      pb.type = 'button';
      pb.className = 'rt-pet';
      bb.addEventListener('click', function () {
        var ids = ['auto'].concat(BGS.map(function (b) { return b.id; }));
        bgMode = ids[(ids.indexOf(bgMode) + 1) % ids.length];
        try { localStorage.setItem(KEY_BG, bgMode); } catch (e) {}
        apply();
      });
      vb.addEventListener('click', function () {
        if (bgMode === 'auto') {            // 内置房间：窗景交给旧四季机制（窗上小按钮同款）
          if (window.WinCycle) window.WinCycle();
          return;
        }
        var ids = ['auto'].concat(VIEWS.map(function (v) { return v.id; }));
        viewMode = ids[(ids.indexOf(viewMode) + 1) % ids.length];
        try { localStorage.setItem(KEY_VIEW, viewMode); } catch (e) {}
        apply();
      });
      pb.addEventListener('click', function () {
        if (window.PetAssets && window.PetAssets.cycle) window.PetAssets.cycle();
      });
      tools.appendChild(bb);
      tools.appendChild(vb);
      tools.appendChild(pb);
      room.appendChild(tools);
    }
    var t = label();
    var bt = tools.querySelector('.rt-bg');
    var vt = tools.querySelector('.rt-view');
    var pt = tools.querySelector('.rt-pet');
    if (bt && bt.textContent !== t.bg) bt.textContent = t.bg;
    if (vt && vt.textContent !== t.view) vt.textContent = t.view;
    if (pt) {
      var pl = window.PetAssets && window.PetAssets.label ? window.PetAssets.label() : '🐾 小猫';
      if (pt.textContent !== pl) pt.textContent = pl;
    }
  }

  /* 猫座位：按背景微调；用户上传了自定义宠物时用 petC（更小更靠座面中间） */
  function placePet(room, bg) {
    var pet = room.querySelector('.pet-wrap');
    if (!pet) return;
    if (!bg) {                            // 内置房间：恢复 CSS 默认
      pet.style.left = ''; pet.style.width = ''; pet.style.bottom = '';
      return;
    }
    var custom = window.PetCustom && window.PetCustom.count && window.PetCustom.count() > 0;
    var c = (custom && bg.petC) ? bg.petC : bg.pet;
    pet.style.left = c.left + '%';
    pet.style.width = c.width + '%';
    pet.style.bottom = c.bottom + '%';
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

    placePet(room, bg);
    ensureTools(room);
  }

  function apply() {
    var bg = findBg();
    document.querySelectorAll('.room').forEach(function (room) {
      if (bg) {
        mountScene(room, bg);
      } else {
        delete room.dataset.scene;
        ['bg-img', 'bg-view'].forEach(function (cls) {
          var n = room.querySelector('.' + cls);
          if (n) n.remove();
        });
        placePet(room, null);
      }
      ensureTools(room);                  // 内置模式也保留按钮，否则切不回来
    });
  }

  /* 自定义宠物上传/删除后重新落座 */
  document.addEventListener('petcustom:change', function () { apply(); });

  /* 供全屏模式克隆房间后重建按钮（cloneNode 不带事件，拆掉重建才有点击） */
  function bind(container) {
    if (!container) return;
    container.querySelectorAll('.room').forEach(function (room) {
      var t = room.querySelector('.room-tools');
      if (t) t.remove();
      ensureTools(room);
    });
  }

  /* 切宠物套后刷新按钮文字 */
  document.addEventListener('petset:change', function () {
    var pl = window.PetAssets && window.PetAssets.label ? window.PetAssets.label() : '🐾 小猫';
    document.querySelectorAll('.room-tools .rt-pet').forEach(function (b) {
      if (b.textContent !== pl) b.textContent = pl;
    });
  });

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
