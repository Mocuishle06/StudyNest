/* 手绘素材加载器（零风险回退）：
 * 探测 assets/pet/*.png 与 assets/room/*.png，加载成功就替换页面内置图形；
 * 文件不存在则什么都不做，内置矢量版原样保留，页面绝不报错。
 * 替换只认文件名，与 manifest.json 约定一致。
 *
 * 窗景按「月份 / 季节」自动切换（优先级从高到低）：
 *   assets/room/window-<两位月份>.png   例：window-11.png（11 月专用）
 *   assets/room/window-<季节英文>.png   例：window-winter.png
 *   assets/room/window.png              默认窗景（始终兜底）
 * 只要把对应文件丢进 assets/room/ 就自动生效，无需改代码。 */
(function () {
  var PET = ['idle', 'studying', 'resting', 'celebrate'];
  var ROOM = ['window', 'shelf', 'desk', 'lamp', 'plant', 'rug', 'sun'];

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

  /* ---- 宠物：隐藏内置 SVG，按状态插入 4 张图（切状态由 CSS data-mode 控制）---- */
  Promise.all(PET.map(function (m) {
    return probe('assets/pet/' + m + '.png').then(function (s) { return [m, s]; });
  })).then(function (rows) {
    var ok = rows.filter(function (r) { return r[1]; });
    if (!ok.length) return;
    document.querySelectorAll('.pet-wrap').forEach(function (w) {
      var svg = w.querySelector('.pet-svg');
      if (svg) svg.style.display = 'none';
      ok.forEach(function (r) {
        var im = document.createElement('img');
        im.className = 'pet-img';
        im.dataset.mode = r[0];
        im.src = r[1];
        im.alt = '学习伙伴';
        im.draggable = false;
        w.appendChild(im);
      });
    });
  });

  /* ---- 房间物件：对应 div 换成图片（保留原位置/动画）---- */
  ROOM.forEach(function (name) {
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
