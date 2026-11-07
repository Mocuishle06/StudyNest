/* 手绘素材加载器（零风险回退）：
 * 探测 assets/pet/*.png 与 assets/room/*.png，加载成功就替换页面内置图形；
 * 文件不存在则什么都不做，内置矢量版原样保留，页面绝不报错。
 * 替换只认文件名，与 manifest.json 约定一致。
 *
 * 窗景有两套机制：
 * 1) 自动：按「月份 / 季节」切换（优先级从高到低）
 *      assets/room/window-<两位月份>.png   例：window-11.png（11 月专用）
 *      assets/room/window-<季节英文>.png   例：window-winter.png
 *      assets/room/window.png              默认窗景（始终兜底）
 * 2) 手动：窗户右下角有小按钮，点击在 自动/春/夏/秋/冬 之间循环，
 *    选择存 localStorage（studynest-window），优先级高于自动。
 * 只要把对应文件丢进 assets/room/ 就自动生效，无需改代码。 */
(function () {
  var PET = ['idle', 'studying', 'resting', 'celebrate'];
  var ROOM = ['wall', 'floor', 'window', 'sofa', 'bowl', 'yarn', 'lamp'];

  function probe(src) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () { resolve(src); };
      im.onerror = function () { resolve(null); };
      im.src = src;
    });
  }

  /* 依次尝试候选路径，返回第一个存在的 */
  function probeFirst(list, i) {
    i = i || 0;
    if (i >= list.length) return Promise.resolve(null);
    return probe(list[i]).then(function (s) { return s || probeFirst(list, i + 1); });
  }

  function season(d) {
    var m = d.getMonth() + 1;
    if (m >= 3 && m <= 5) return 'spring';
    if (m >= 6 && m <= 8) return 'summer';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
  }

  /* 某件素材的候选路径（只有 window 支持按月份/季节换装） */
  function candidates(name) {
    var list = [];
    if (name === 'window') {
      var d = new Date();
      list.push('assets/room/window-' + ('0' + (d.getMonth() + 1)).slice(-2) + '.png');
      list.push('assets/room/window-' + season(d) + '.png');
    }
    list.push('assets/room/' + name + '.png');
    return list;
  }

  /* ---- 宠物：隐藏内置 SVG，按状态插入 4 张图（切状态由 CSS data-mode 控制）----
   * 用户上传了自定义宠物时（.pet-wrap[data-custom]）跳过，避免与自定义图叠在一起；
   * 删除自定义后由 pet-custom.js 回调 PetAssets.mount() 重新挂回来。 */
  var petSrc = [];               // [[mode, src], ...] 已探测到的内置图

  function mountPets() {
    if (!petSrc.length) return;
    document.querySelectorAll('.pet-wrap').forEach(function (w) {
      w.querySelectorAll('.pet-img[data-builtin]').forEach(function (n) { n.remove(); });
      if (w.dataset.custom) return;
      var svg = w.querySelector('.pet-svg');
      if (svg) svg.style.display = 'none';
      petSrc.forEach(function (r) {
        var im = document.createElement('img');
        im.className = 'pet-img';
        im.dataset.mode = r[0];
        im.dataset.builtin = '1';
        im.src = r[1];
        im.alt = '学习伙伴';
        im.draggable = false;
        w.appendChild(im);
      });
    });
  }

  window.PetAssets = { mount: mountPets, src: {} };

  Promise.all(PET.map(function (m) {
    return probe('assets/pet/' + m + '.png').then(function (s) { return [m, s]; });
  })).then(function (rows) {
    petSrc = rows.filter(function (r) { return r[1]; });
    if (!petSrc.length) return;
    petSrc.forEach(function (r) { window.PetAssets.src[r[0]] = r[1]; });
    mountPets();
  });

  /* ---- 房间物件：对应 div 换成图片（保留原位置/动画）----
   * window 单独处理：支持手动切换季节。 */
  var WIN_SEASONS = ['spring', 'summer', 'autumn', 'winter'];
  var WIN_KEY = 'studynest-window';
  var winMode = null;         // 'auto' 或季节名
  var winSrc = {};            // 季节名 → 已探测到的路径

  function mountWindow(src) {
    document.querySelectorAll('.room .window').forEach(function (d) {
      if (d.dataset.imgDone) {                // 已挂载：只换图
        var im = d.querySelector('.obj-img');
        if (im) im.src = src;
        return;
      }
      d.dataset.imgDone = '1';
      d.classList.add('img-replaced');
      d.textContent = '';
      var im = document.createElement('img');
      im.className = 'obj-img';
      im.src = src;
      im.alt = '窗景';
      im.draggable = false;
      d.appendChild(im);
      var btn = document.createElement('button');
      btn.className = 'win-switcher';
      btn.type = 'button';
      btn.title = '切换窗景';
      btn.addEventListener('click', function () { cycleWin(); });
      d.appendChild(btn);
    });
  }

  /* 循环切换四季（窗上小按钮与场景系统的窗景按钮共用） */
  function cycleWin() {
    var order = ['auto'].concat(WIN_SEASONS.filter(function (s) { return winSrc[s]; }));
    var i = order.indexOf(winMode);
    winMode = order[(i + 1) % order.length];
    try { localStorage.setItem(WIN_KEY, winMode); } catch (e) {}
    applyWindow();
  }
  window.WinCycle = cycleWin;

  function applyWindow() {
    var src;
    if (winMode && winMode !== 'auto' && winSrc[winMode]) src = winSrc[winMode];
    else {
      var d = new Date();
      src = winSrc[('0' + (d.getMonth() + 1)).slice(-2)]   // 当月专属
         || winSrc[season(d)]                               // 当季
         || winSrc._base;                                   // 基础版兜底
    }
    if (src) {
      mountWindow(src);
      document.querySelectorAll('.room .win-switcher').forEach(function (b) {
        b.textContent = winMode === 'auto' ? '自动'
          : { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }[winMode];
      });
    }
  }

  /* 探测：基础版 + 四季 + 当月专属 */
  ROOM.forEach(function (name) {
    if (name === 'window') {
      try { winMode = localStorage.getItem(WIN_KEY) || 'auto'; } catch (e) { winMode = 'auto'; }
      var d = new Date();
      var probes = ['window'].concat(WIN_SEASONS.map(function (s) { return 'window-' + s; }))
        .concat(['window-' + ('0' + (d.getMonth() + 1)).slice(-2)]);
      Promise.all(probes.map(function (n) {
        return probe('assets/room/' + n + '.png').then(function (s) { return [n, s]; });
      })).then(function (rows) {
        rows.forEach(function (r) {
          if (!r[1]) return;
          var n = r[0].replace('window-', '').replace('window', '_base');
          winSrc[n] = r[1];
        });
        applyWindow();
      });
      return;
    }
    probeFirst(candidates(name)).then(function (src) {
      if (!src) return;
      document.querySelectorAll('.room .' + name).forEach(function (d) {
        if (d.dataset.imgDone) return;
        d.dataset.imgDone = '1';
        d.classList.add('img-replaced');
        d.textContent = '';               // 清掉 💡🪴📚 等 emoji
        var im = document.createElement('img');
        im.className = 'obj-img';
        im.src = src;
        im.alt = '';
        im.draggable = false;
        d.appendChild(im);
      });
    });
  });
})();
