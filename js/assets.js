/* 手绘素材加载器（零风险回退）：
 * 探测 assets/pet/*.png 与 assets/room/*.png，加载成功就替换页面内置图形；
 * 文件不存在则什么都不做，内置矢量版原样保留，页面绝不报错。
 * 替换只认文件名，与 manifest.json 约定一致。 */
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
    probe('assets/room/' + name + '.png').then(function (src) {
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
