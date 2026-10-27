/* StudyNest 账号界面
 * 只在云端已配置（cloudEnabled + publishableKey）时挂载，纯本地模式下一根 DOM 都不插入。
 * 依赖：config.js → store.js → cloud.js，本文件必须在它们之后加载。
 *
 * 两个入口：
 *   登录 —— 用户名（或邮箱）+ 密码
 *   注册 —— 邮箱收验证码 → 同时设定用户名和密码（CloudBase 不接受纯用户名注册，
 *           必须用邮箱/手机任一方式先注册，才能在注册时绑定用户名）
 */
(function (global) {
  'use strict';

  var doc = global.document;
  var chip = null;
  var mask = null;
  var card = null;
  var refs = {};
  var mode = 'login';
  var busyFlag = false;
  var syncText = '';
  var verifyState = { id: null, email: '', timer: 0, left: 0 };

  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function errText(e) {
    if (!e) return '未知错误';
    if (typeof e === 'string') return e;
    var msg = e.error_description || e.message || e.error_message || e.error || e.msg;
    if (msg) return msg;
    try { return JSON.stringify(e).slice(0, 160); } catch (x) { return '未知错误'; }
  }

  function friendly(e) {
    var raw = errText(e);
    var low = raw.toLowerCase();
    if (/invalid_access_token|signing key|access token verify/.test(low)) {
      return '云开发拒绝了这把 Publishable Key（服务端找不到对应的签名密钥）。多半是密钥被重新生成过，或环境还没配好认证。可以在控制台「API Key 配置」里确认密钥仍然有效，或重新生成一份发我。';
    }
    if (/未开启|not\s*enabled|4045/.test(low)) {
      return '控制台里「邮箱验证码」还没开启：身份认证 → 登录方式 → 邮箱验证码 → 配置发件邮箱 → 选「开启邮件代发」，1 分钟即可。';
    }
    if (/验证码.*(错误|失效|过期)|invalid.*code|expired/.test(low + raw)) {
      return '验证码不对或已过期，重新发一次试试。';
    }
    if (/not\s*exist/.test(low + raw)) {
      return '云端暂时找不到这个账号（可能刚删除或平台缓存未更新），等十几秒再试一次。';
    }
    if (/already|exist|已注册|已存在/.test(low + raw)) {
      return '这个邮箱或用户名已经被用了，直接登录，或换一个。';
    }
    if (/email|邮箱/.test(low) && /invalid|格式|format/.test(low)) {
      return '邮箱格式看起来不对，检查一下。';
    }
    if (/password|密码/.test(low + raw)) {
      return '密码不符合平台要求：8–32 位，需同时包含字母和数字（可能还需要大写字母或符号，试试加上）。原始信息：' + raw;
    }
    if (/不正确|incorrect|invalid_username|凭据|credential/.test(low + raw)) {
      return '用户名（或邮箱）与密码不匹配，注意大小写。原始信息：' + raw;
    }
    if (/invalid|格式|format/.test(low + raw)) {
      return '有字段没通过校验（' + raw + '）';
    }
    return raw;
  }

  /* ---------- 顶栏 ---------- */

  function paintChip() {
    if (!chip) return;
    var u = global.CloudSync.user && global.CloudSync.user();
    if (u) {
      var name = u.username || u.nickName || u.name || '已登录';
      chip.textContent = '☁️ ' + name + (syncText ? ' · ' + syncText : '');
      chip.setAttribute('data-state', 'in');
      chip.title = '已登录，点击查看账号';
    } else {
      chip.textContent = '☁️ 未登录 · 点此登录';
      chip.setAttribute('data-state', 'out');
      chip.title = '登录后学习记录会同步到云端，换设备也能接着用';
    }
  }

  function paintFooter() {
    var foot = doc.querySelector('.foot');
    if (!foot) return;
    var u = global.CloudSync.user && global.CloudSync.user();
    foot.textContent = u
      ? 'StudyNest v0.2 · 治愈系手绘房间 · 已连接云端 · 支持跨设备同步'
      : 'StudyNest v0.2 · 治愈系手绘房间 · 本地浏览器存储 · 未登录（不跨设备）';
  }

  function watchStore() {
    if (!global.Store || !global.Store.onStatus) return;
    global.Store.onStatus(function (s) {
      syncText = s === 'syncing' ? '同步中' : s === 'synced' ? '已同步'
        : s === 'error' ? '同步失败' : s === 'idle' ? '' : '仅本地';
      paintChip();
    });
  }

  /* ---------- 构建 ---------- */

  function field(labelText, input) {
    var f = el('label', 'auth-field');
    f.appendChild(el('span', null, labelText));
    f.appendChild(input);
    return f;
  }

  function input(opts) {
    var n = el('input');
    n.type = opts.type || 'text';
    if (opts.id) n.id = opts.id;
    if (opts.placeholder) n.placeholder = opts.placeholder;
    if (opts.autocomplete) n.autocomplete = opts.autocomplete;
    if (opts.inputmode) n.setAttribute('inputmode', opts.inputmode);
    if (opts.maxlength) n.setAttribute('maxlength', String(opts.maxlength));
    return n;
  }

  function build() {
    if (mask) return refs;

    mask = el('div', 'auth-mask');
    mask.setAttribute('hidden', '');

    card = el('div', 'auth-card');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');

    var close = el('button', 'auth-x', '×');
    close.setAttribute('aria-label', '关闭');
    close.addEventListener('click', hide);
    card.appendChild(close);

    card.appendChild(el('h2', 'auth-title', '登录 StudyNest'));
    card.appendChild(el('p', 'auth-sub',
      '登录后，任务、资料和专注记录会存到云端，换设备也能接着用。'));

    /* 页签 */
    var tabs = el('div', 'auth-tabs');
    var tabLogin = el('button', 'auth-tab active', '登录');
    var tabReg = el('button', 'auth-tab', '注册');
    tabLogin.type = 'button';
    tabReg.type = 'button';
    tabLogin.addEventListener('click', function () { setMode('login'); });
    tabReg.addEventListener('click', function () { setMode('register'); });
    tabs.appendChild(tabLogin);
    tabs.appendChild(tabReg);
    card.appendChild(tabs);

    var errBox = el('p', 'auth-err');
    errBox.setAttribute('hidden', '');

    /* —— 登录表单 —— */
    var loginForm = el('form', 'auth-form auth-form-login');
    loginForm.setAttribute('novalidate', '');
    var liUser = input({ id: 'authUser', autocomplete: 'username', placeholder: '用户名或邮箱' });
    var liPass = input({ id: 'authPass', type: 'password', autocomplete: 'current-password', placeholder: '密码' });
    loginForm.appendChild(field('账号', liUser));
    loginForm.appendChild(field('密码', liPass));
    loginForm.appendChild(el('p', 'auth-hint',
      '注册时设置过用户名和密码的账号可直接登录；老账号（没设过密码）请到「注册」页签收一次邮箱验证码，会直接登录。'));
    var liSubmit = el('button', 'primary auth-submit', '登录');
    liSubmit.type = 'submit';
    loginForm.appendChild(liSubmit);
    loginForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      doLogin(liUser, liPass);
    });
    card.appendChild(loginForm);

    /* —— 注册表单 —— */
    var regForm = el('form', 'auth-form auth-form-reg');
    regForm.setAttribute('novalidate', '');
    regForm.setAttribute('hidden', '');

    var reEmail = input({ id: 'authEmail', type: 'email', autocomplete: 'email', placeholder: 'you@example.com' });
    regForm.appendChild(field('邮箱', reEmail));

    var codeField = el('div', 'auth-field');
    codeField.appendChild(el('span', null, '邮箱验证码'));
    var codeRow = el('div', 'auth-coderow');
    var reCode = input({ id: 'authCode', inputmode: 'numeric', maxlength: 6, placeholder: '6 位数字' });
    var sendBtn = el('button', 'auth-send', '发送验证码');
    sendBtn.type = 'button';
    sendBtn.addEventListener('click', function () { doSendCode(reEmail, sendBtn); });
    codeRow.appendChild(reCode);
    codeRow.appendChild(sendBtn);
    codeField.appendChild(codeRow);
    regForm.appendChild(codeField);

    var reUser = input({ id: 'authRegUser', autocomplete: 'username', placeholder: '登录用的用户名，4–20 位' });
    var rePass = input({ id: 'authRegPass', type: 'password', autocomplete: 'new-password', placeholder: '至少 8 位，含字母和数字' });
    var userField = field('用户名', reUser);
    userField.appendChild(el('small', 'auth-hint', '6–25 位，小写字母开头，只能含小写字母、数字、_ 和 -（大写会自动转小写）'));
    regForm.appendChild(userField);
    var passField = field('密码', rePass);
    passField.appendChild(el('small', 'auth-hint', '8–32 位，需同时包含字母和数字。设置后换设备可直接用用户名密码登录'));
    regForm.appendChild(passField);

    var reSubmit = el('button', 'primary auth-submit', '注册并登录');
    reSubmit.type = 'submit';
    regForm.appendChild(reSubmit);
    regForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      doRegister(reEmail, reCode, reUser, rePass);
    });
    card.appendChild(regForm);

    card.appendChild(errBox);

    /* 帮助 */
    var helpTitle = el('button', 'auth-link', '为什么注册要填邮箱？');
    helpTitle.type = 'button';
    var helpBody = el('div', 'auth-help-body');
    helpBody.setAttribute('hidden', '');
    helpBody.appendChild(el('p', null,
      '云开发不支持用「用户名 + 密码」直接注册（官方为防止批量刷号），必须先用邮箱或手机号注册一次，注册时才能一并绑定用户名。'));
    var ol = el('ol');
    ol.appendChild(el('li', null, '填邮箱 → 发送验证码（邮件由云开发代发，不需要你自己配邮件服务器）'));
    ol.appendChild(el('li', null, '把收到的 6 位码填进来，同时定好用户名和密码'));
    ol.appendChild(el('li', null, '以后换任何设备，都用「用户名 + 密码」登录，不用再收邮件'));
    helpBody.appendChild(ol);
    helpTitle.addEventListener('click', function () {
      if (helpBody.hasAttribute('hidden')) helpBody.removeAttribute('hidden');
      else helpBody.setAttribute('hidden', '');
    });
    card.appendChild(helpTitle);
    card.appendChild(helpBody);

    /* 已登录面板 */
    var account = el('div', 'auth-account');
    account.setAttribute('hidden', '');
    var who = el('p', 'auth-who');
    account.appendChild(who);
    var out = el('button', 'auth-logout', '退出登录');
    out.type = 'button';
    out.addEventListener('click', function () {
      out.disabled = true;
      out.textContent = '正在退出…';
      global.CloudSync.signOut().then(function () { global.location.reload(); })
        .catch(function (e) {
          out.disabled = false;
          out.textContent = '退出登录';
          who.textContent = '退出失败：' + errText(e);
        });
    });
    account.appendChild(out);
    card.appendChild(account);

    var guest = el('button', 'auth-link auth-guest', '先不登录，继续本地使用');
    guest.type = 'button';
    guest.addEventListener('click', hide);
    card.appendChild(guest);

    mask.appendChild(card);
    mask.addEventListener('click', function (ev) { if (ev.target === mask) hide(); });
    doc.body.appendChild(mask);

    doc.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !mask.hasAttribute('hidden')) hide();
    });

    refs = {
      title: card.querySelector('.auth-title'),
      sub: card.querySelector('.auth-sub'),
      tabs: tabs,
      tabLogin: tabLogin,
      tabReg: tabReg,
      errBox: errBox,
      loginForm: loginForm,
      liUser: liUser,
      liPass: liPass,
      liSubmit: liSubmit,
      regForm: regForm,
      reEmail: reEmail,
      reCode: reCode,
      reUser: reUser,
      rePass: rePass,
      reSubmit: reSubmit,
      sendBtn: sendBtn,
      help: helpBody,
      helpTitle: helpTitle,
      account: account,
      who: who,
      guest: guest
    };
    return refs;
  }

  /* ---------- 状态切换 ---------- */

  function clearErr() {
    if (!refs.errBox) return;
    refs.errBox.textContent = '';
    refs.errBox.setAttribute('hidden', '');
  }

  function showErr(msg) {
    if (!refs.errBox) return;
    refs.errBox.textContent = msg;
    refs.errBox.removeAttribute('hidden');
  }

  function setBusy(on, which, label) {
    busyFlag = on;
    var btn = which === 'reg' ? refs.reSubmit : refs.liSubmit;
    btn.disabled = on;
    if (which === 'reg') btn.textContent = on ? (label || '处理中…') : '注册并登录';
    else btn.textContent = on ? (label || '处理中…') : '登录';
  }

  function setMode(next) {
    mode = next;
    build();
    var isReg = next === 'register';
    refs.tabLogin.classList.toggle('active', !isReg);
    refs.tabReg.classList.toggle('active', isReg);
    refs.title.textContent = isReg ? '注册 StudyNest 账号' : '登录 StudyNest';
    refs.sub.textContent = isReg
      ? '注册需要一个邮箱收验证码；用户名和密码自己定，以后换设备都用它们登录。'
      : '登录后，任务、资料和专注记录会存到云端，换设备也能接着用。';
    if (isReg) {
      refs.loginForm.setAttribute('hidden', '');
      refs.regForm.removeAttribute('hidden');
    } else {
      refs.regForm.setAttribute('hidden', '');
      refs.loginForm.removeAttribute('hidden');
    }
    refs.helpTitle.removeAttribute('hidden');
    refs.account.setAttribute('hidden', '');
    refs.guest.removeAttribute('hidden');
    clearErr();
    try { (isReg ? refs.reEmail : refs.liUser).focus(); } catch (e) { /* 环境不支持时忽略 */ }
  }

  function showAccount() {
    build();
    var u = global.CloudSync.user();
    refs.title.textContent = '账号';
    refs.sub.textContent = '已连接云端，数据会自动同步。';
    refs.loginForm.setAttribute('hidden', '');
    refs.regForm.setAttribute('hidden', '');
    refs.tabs.setAttribute('hidden', '');
    refs.helpTitle.setAttribute('hidden', '');
    refs.help.setAttribute('hidden', '');
    refs.guest.setAttribute('hidden', '');
    refs.account.removeAttribute('hidden');
    var name = u ? (u.username || u.nickName || '已登录') : '已登录';
    refs.who.textContent = '当前账号：' + name + (syncText ? '　状态：' + syncText : '');
  }

  function show() {
    build();
    refs.tabs.removeAttribute('hidden');
    if (global.CloudSync.user && global.CloudSync.user()) showAccount();
    else setMode('login');
    mask.removeAttribute('hidden');
  }

  function hide() {
    if (mask) mask.setAttribute('hidden', '');
    stopCountdown();
  }

  /* ---------- 倒计时 ---------- */

  function stopCountdown() {
    if (verifyState.timer) {
      global.clearInterval(verifyState.timer);
      verifyState.timer = 0;
    }
    verifyState.left = 0;
  }

  function startCountdown() {
    stopCountdown();
    verifyState.left = 60;
    refs.sendBtn.disabled = true;
    refs.sendBtn.textContent = verifyState.left + 's 后重发';
    verifyState.timer = global.setInterval(function () {
      verifyState.left -= 1;
      if (verifyState.left <= 0) {
        stopCountdown();
        refs.sendBtn.disabled = false;
        refs.sendBtn.textContent = '重新发送';
      } else {
        refs.sendBtn.textContent = verifyState.left + 's 后重发';
      }
    }, 1000);
  }

  /* ---------- 动作 ---------- */

  function doSendCode(emailInput, sendBtn) {
    clearErr();
    var email = (emailInput.value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showErr('先填一个正确的邮箱地址');
      return;
    }
    sendBtn.disabled = true;
    sendBtn.textContent = '发送中…';
    global.CloudSync.sendEmailCode(email).then(function (info) {
      verifyState.id = info.verificationId;
      verifyState.email = email;
      if (info.isUser) {
        showErr('这个邮箱之前已经注册过，用验证码登录或直接用用户名登录即可。');
      } else {
        showErr('验证码已发送，查收邮件（可能在垃圾箱）。');
      }
      startCountdown();
    }).catch(function (e) {
      console.warn('[StudyNest 账号] 发送验证码失败：', e && (e.raw || e));
      showErr(friendly(e));
      sendBtn.disabled = false;
      sendBtn.textContent = '发送验证码';
    });
  }

  function doLogin(userInput, passInput) {
    if (busyFlag) return;
    clearErr();
    var u = (userInput.value || '').trim();
    var p = passInput.value || '';
    if (!u) { showErr('请填写用户名或邮箱'); return; }
    if (!p) { showErr('请填写密码'); return; }

    setBusy(true, 'login', '登录中…');
    global.CloudSync.signIn(u, p).then(function () {
      passInput.value = '';
      paintChip();
      paintFooter();
      hide();
      toast('登录成功，正在同步');
    }).catch(function (e) {
      console.warn('[StudyNest 账号] 登录失败：', e && (e.raw || e));
      showErr(friendly(e));
    }).then(function () {
      setBusy(false, 'login');
    });
  }

  function doRegister(emailInput, codeInput, userInput, passInput) {
    if (busyFlag) return;
    clearErr();
    var email = (emailInput.value || '').trim();
    var code = (codeInput.value || '').trim();
    var username = (userInput.value || '').trim().toLowerCase();   // 平台只收小写，自动转换
    userInput.value = username;
    var password = passInput.value || '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showErr('邮箱格式不对'); return; }
    if (!verifyState.id || verifyState.email !== email) { showErr('先点「发送验证码」，再填收到的 6 位数字'); return; }
    if (!/^\d{6}$/.test(code)) { showErr('验证码是 6 位数字'); return; }
    if (!/^[a-z][0-9a-z_-]{5,24}$/.test(username)) {
      showErr('用户名 6–25 位，必须小写字母开头，只能含小写字母、数字、_ 和 -');
      return;
    }
    if (password.length < 8 || password.length > 32 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      showErr('密码 8–32 位，且同时包含字母和数字');
      return;
    }

    setBusy(true, 'reg', '注册中…');
    global.CloudSync.registerWithEmail({
      email: email,
      code: code,
      verificationId: verifyState.id,
      username: username,
      password: password
    }).then(function () {
      passInput.value = '';
      stopCountdown();
      paintChip();
      paintFooter();
      hide();
      toast('注册成功，已登录并开始同步');
    }).catch(function (e) {
      console.warn('[StudyNest 账号] 注册失败：', e && (e.raw || e));
      showErr(friendly(e));
    }).then(function () {
      setBusy(false, 'reg');
    });
  }

  /* ---------- 轻提示 ---------- */

  function toast(text) {
    var t = el('div', 'auth-toast', text);
    doc.body.appendChild(t);
    global.setTimeout(function () { t.classList.add('out'); }, 2200);
    global.setTimeout(function () {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, 2800);
  }

  /* ---------- 挂载 ---------- */

  function mount() {
    var head = doc.querySelector('.head');
    if (!head) return;

    chip = el('button', 'auth-chip', '☁️ 未登录 · 点此登录');
    chip.type = 'button';
    chip.addEventListener('click', function () {
      if (!global.CloudSync.isReady()) {
        toast('云端还没就绪，先按本地模式用着');
        return;
      }
      show();
    });

    var today = doc.getElementById('today');
    if (today && today.parentNode === head) head.insertBefore(chip, today);
    else head.appendChild(chip);

    watchStore();
    paintChip();
    paintFooter();

    global.CloudSync.ready().then(function (r) {
      paintChip();
      paintFooter();
      if (r && r.ok) toast('已恢复登录状态');
    }).catch(function () { paintChip(); });
  }

  function start() {
    if (!global.CloudSync || !global.CloudSync.enabled || !global.CloudSync.enabled()) return;
    mount();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
  else start();
})(window);
