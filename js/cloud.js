/* StudyNest 云端接入层（腾讯云开发 CloudBase · PG + 网关 REST 版）
 *
 * 2026-10-26 重写。背景：环境是 PostgreSQL 模式（RuntimeBackends.nosql = false），
 * 没有文档型数据库实例，2.x SDK 的 app.database() 用不了；3.x SDK 又没有 UMD 全量包，
 * 无构建项目最省事的路径是直接 fetch 数据面网关。
 *
 * 接入要点（2026-10-27 已端到端实测全通，字段为真实响应）：
 *   基地址   https://<envId>.api.tcloudbasegateway.com   （官方 HTTP API 域名）
 *   认证     POST /auth/v1/verification            {email}                          发验证码 → verification_id
 *            POST /auth/v1/verification/verify     {verification_id, verification_code} → verification_token
 *            POST /auth/v1/signup                  {email, verification_token}      注册（新用户，直接返回 token）
 *            POST /auth/v1/signin                  {verification_token}             验证码登录（老用户）
 *            POST /auth/v1/signin                  {username|email, password}       密码登录
 *            POST /auth/v1/token                   {grant_type:'refresh_token', refresh_token}
 *   数据     GET/POST /v1/rdb/rest/<table>   PostgREST 风格，upsert 用 on_conflict
 *   头       Authorization: Bearer <未登录用 publishableKey，登录后用 access_token>
 *
 * 注意：token 响应不带 user 对象，只有 sub；applySession 里用 sub 兜底构造 user。
 *
 * 与旧版的行为契约保持不变：
 *   - Store.attach(adapter) + Store.reconcile()，云端失败只降级不阻塞
 *   - CloudSync.sendEmailCode / registerWithEmail / signIn / signOut 对 auth-ui 的接口不变
 *   - 取不到有效 uid 一律不启用同步（沿用旧版的三重校验教训）
 */
(function (global) {
  'use strict';

  var CFG = global.STUDYNEST_CONFIG || {};
  var SESSION_KEY = 'studynest-session-v1';
  var REFRESH_AHEAD_MS = 120 * 1000;   // 提前两分钟刷新 access_token

  var session = null;                  // {access_token, refresh_token, expires_at, user}
  var refreshTimer = null;
  var bootPromise = null;

  function log() {
    var args = [].slice.call(arguments);
    console.log.apply(console, ['[StudyNest 云端]'].concat(args));
  }

  /* ---------- 基础请求 ---------- */

  function apiBase() {
    return String(CFG.apiBase || '').replace(/\/+$/, '');
  }

  function bearerFor(scope) {
    if (scope === 'publish' || !session) return CFG.publishableKey || '';
    return session.access_token || CFG.publishableKey || '';
  }

  /* 统一请求：返回 {status, data}；网络失败直接 reject。
   * data 是解析后的 JSON（空 body 时为 null），HTTP 错误不在这里抛。 */
  function request(method, path, body, scope, extraHeaders) {
    var headers = { 'Content-Type': 'application/json' };
    var token = bearerFor(scope);
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (extraHeaders) {
      for (var k in extraHeaders) {
        if (Object.prototype.hasOwnProperty.call(extraHeaders, k)) headers[k] = extraHeaders[k];
      }
    }
    return global.fetch(apiBase() + path, {
      method: method,
      headers: headers,
      body: body == null ? undefined : JSON.stringify(body)
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        if (text) {
          try { data = JSON.parse(text); } catch (e) { data = text; }
        }
        return { status: res.status, data: data };
      });
    });
  }

  /* 网关的报错形态不统一，统一抽出人话 */
  function errText(e) {
    if (!e) return '未知错误';
    if (typeof e === 'string') return e;
    var msg = e.error_description || e.message || e.error_message || e.error || e.msg || e.detail;
    if (msg) return String(msg);
    try { return JSON.stringify(e).slice(0, 200); } catch (x) { return String(e); }
  }

  function wrapError(e) {
    var err = new Error(errText(e));
    err.raw = e;
    return err;
  }

  function httpError(r) {
    var e = new Error(errText(r && r.data) || ('HTTP ' + (r && r.status)));
    e.status = r && r.status;
    e.code = r && r.data && (r.data.code || r.data.error_code);
    e.raw = r && r.data;
    return e;
  }

  /* ---------- 会话 ---------- */

  function sessionValid(s) {
    return !!(s && typeof s.access_token === 'string' && s.access_token &&
              s.user && typeof s.user.id === 'string' && s.user.id);
  }

  function readSession() {
    try {
      var raw = global.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      return sessionValid(s) ? s : null;   // 沿用旧版教训：缺 uid 的会话一律不认
    } catch (e) {
      return null;
    }
  }

  function writeSession(s) {
    session = s;
    try {
      if (s) global.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      else global.localStorage.removeItem(SESSION_KEY);
    } catch (e) { /* 隐私模式写不进就算了，本次会话内仍可用 */ }
  }

  function applySession(r) {
    var d = r && r.data;
    if (!r || r.status >= 400 || !d || !d.access_token) {
      throw httpError(r || { status: 0 });
    }
    var uid = (d.user && (d.user.id || d.user.uid || d.user.user_id)) ||
              (typeof d.sub === 'string' && d.sub) || extractUid(d.access_token);
    var s = {
      access_token: d.access_token,
      refresh_token: d.refresh_token || null,
      expires_at: Date.now() + (Number(d.expires_in) > 0 ? Number(d.expires_in) * 1000 : 3600 * 1000),
      user: (d.user && pickUser(d.user)) || (uid ? { id: uid } : null)
    };
    if (!sessionValid(s)) throw new Error('登录响应里没有可用的用户信息');
    writeSession(s);
    scheduleAutoRefresh();
    return s;
  }

  function scheduleAutoRefresh() {
    if (refreshTimer) { global.clearTimeout(refreshTimer); refreshTimer = null; }
    if (!session || !session.refresh_token) return;
    var wait = session.expires_at - Date.now() - REFRESH_AHEAD_MS;
    if (wait < 0) wait = 0;
    refreshTimer = global.setTimeout(function () {
      refreshTimer = null;
      refreshSession().catch(function (e) {
        console.warn('[StudyNest 云端] 会话刷新失败，等待下次操作再试：', e);
      });
    }, wait);
  }

  function refreshSession() {
    if (!session || !session.refresh_token) {
      return Promise.reject(new Error('没有可用的 refresh_token'));
    }
    return request('POST', '/auth/v1/token',
      { grant_type: 'refresh_token', refresh_token: session.refresh_token }, 'publish')
      .then(function (r) {
        var s = applySession(r);
        log('会话已刷新');
        return s;
      }).catch(function (e) {
        // 刷新失败说明会话彻底过期，清掉让用户重新登录
        writeSession(null);
        throw wrapError(e);
      });
  }

  /* ---------- 用户 ---------- */

  function pickUser(u) {
    if (!u || typeof u !== 'object') return null;
    var uid = u.id || u.uid || u.user_id;
    if (typeof uid === 'string' && uid) return u;
    return null;
  }

  function currentUser() {
    if (!session) return Promise.resolve(null);
    // 本地会话还新鲜就直接用；快过期顺手刷一次
    if (session.expires_at - Date.now() > REFRESH_AHEAD_MS || !session.refresh_token) {
      return Promise.resolve(pickUser(session.user));
    }
    return refreshSession().then(function (s) { return pickUser(s.user); })
      .catch(function () { return null; });
  }

  /* 登录成功后挂载适配器并对齐数据 */
  function activate(u) {
    var real = pickUser(u);
    if (!real) {
      console.warn('[StudyNest 云端] 未取得有效用户 ID，本次不启用云端同步，继续使用本地存储');
      return Promise.resolve({ ok: false, reason: 'no-uid' });
    }
    Store.attach(adapterFor(real.id));
    return Store.reconcile().then(function (result) {
      log('数据对齐结果：', result.action || result.reason);
      // 采用云端版本后刷新一次，让内存中的界面状态跟上
      if (result.action === 'adopted-remote') global.location.reload();
      return result;
    });
  }

  /* ---------- 数据适配器（PG 表，一用户一行） ---------- */

  function tablePath() {
    return '/v1/rdb/rest/' + encodeURIComponent(CFG.collection || 'studynest_state');
  }

  function adapterFor(uid) {
    return {
      /* 拉取当前用户整份状态；行不存在 / 网络失败都返回 null，走本地 */
      pull: function () {
        var q = '?select=data&user_id=eq.' + encodeURIComponent(uid);
        return request('GET', tablePath() + q, null, 'user')
          .then(function (r) {
            if (r.status >= 400) {
              console.warn('[StudyNest 云端] 拉取失败 HTTP ' + r.status, r.data);
              return null;
            }
            var rows = Array.isArray(r.data) ? r.data : [];
            var row = rows[0];
            return row && row.data ? row.data : null;
          })
          .catch(function (e) {
            console.warn('[StudyNest 云端] 拉取异常，退回本地：', e);
            return null;
          });
      },
      /* 整份覆盖写入：upsert 到自己那一行（RLS 限定 user_id = auth.uid()） */
      push: function (data) {
        var payload = {
          user_id: uid,
          data: data,
          updated_at: new Date().toISOString()
        };
        return request('POST', tablePath() + '?on_conflict=user_id', payload, 'user', {
          Prefer: 'resolution=merge-duplicates,return=minimal'
        }).then(function (r) {
          if (r.status >= 400) throw httpError(r);
          return true;
        });
      }
    };
  }

  /* ---------- 启动：只恢复既有会话，不自动建号 ---------- */

  function boot() {
    if (bootPromise) return bootPromise;
    bootPromise = doBoot();
    return bootPromise;
  }

  function doBoot() {
    if (!CFG.cloudEnabled) {
      log('未启用（cloudEnabled=false），运行于纯本地模式');
      return Promise.resolve({ ok: false, reason: 'disabled' });
    }
    if (!CFG.publishableKey || !apiBase()) {
      log('缺少 publishableKey 或 apiBase，运行于纯本地模式');
      return Promise.resolve({ ok: false, reason: 'no-config' });
    }

    session = readSession();
    if (!session) {
      log('尚无登录会话，等待用户登录');
      return Promise.resolve({ ok: false, reason: 'no-session' });
    }

    var ready = (session.expires_at - Date.now() > REFRESH_AHEAD_MS) || !session.refresh_token
      ? Promise.resolve(session)
      : refreshSession();

    return ready.then(function (s) {
      return activate(s.user).then(function (r) {
        return { ok: true, user: s.user, reconcile: r };
      });
    }).catch(function (err) {
      console.warn('[StudyNest 云端] 启动失败，退回本地模式：', err);
      return { ok: false, reason: 'error', error: err };
    });
  }

  /* ---------- 邮箱验证码 ---------- */

  var VID_KEY = 'studynest-verification-id';
  var pendingVid = null;   // 发码返回的 verification_id，验码时要用

  function rememberVid(vid) {
    pendingVid = vid || null;
    try {
      if (vid) global.sessionStorage.setItem(VID_KEY, vid);
      else global.sessionStorage.removeItem(VID_KEY);
    } catch (e) { /* 存不进就只靠内存，页面不刷新就没事 */ }
  }

  function currentVid() {
    if (pendingVid) return pendingVid;
    try { pendingVid = global.sessionStorage.getItem(VID_KEY); } catch (e) { /* 忽略 */ }
    return pendingVid;
  }

  /* 发送验证码 → 返回 {verificationId, isUser}（auth-ui 依赖这个形状） */
  function sendEmailCode(email) {
    return request('POST', '/auth/v1/verification', { email: email }, 'publish')
      .then(function (r) {
        if (r.status >= 400) throw httpError(r);
        var vid = r.data && r.data.verification_id;
        if (!vid) throw new Error('发码响应里没有 verification_id');
        rememberVid(vid);
        return { verificationId: vid, isUser: false };
      });
  }

  /* 验码 → 拿 verification_token → 注册（新用户）/ 登录（老用户）。
   * 注册失败且像是「用户已存在」时，退回验证码登录再试一次。 */
  function registerWithEmail(opts) {
    var vid = currentVid();
    if (!vid) return Promise.reject(new Error('请先获取验证码'));
    return request('POST', '/auth/v1/verification/verify',
        { verification_id: vid, verification_code: String(opts.code) }, 'publish')
      .then(function (r) {
        if (r.status >= 400) throw httpError(r);
        var vtoken = r.data && r.data.verification_token;
        if (!vtoken) throw new Error('验码响应里没有 verification_token');
        rememberVid(null);
        return vtoken;
      })
      .then(function (vtoken) {
        // 注册时一并提交用户名密码（官方 signup 支持），之后就能用密码登录
        var body = { email: opts.email, verification_token: vtoken };
        if (opts.username) body.username = opts.username;
        if (opts.password) body.password = opts.password;
        return request('POST', '/auth/v1/signup', body, 'publish')
          .then(function (r) {
            if (r.status < 400) return applySession(r);
            var low = errText(r.data).toLowerCase();
            // 只有云端明确说「账号已存在」才回退到验证码登录（老用户场景）
            if (!/already|exist|已注册|已存在/.test(low)) throw httpError(r);
            log('signup 报账号已存在，回退验证码登录');
            return request('POST', '/auth/v1/signin',
              { verification_token: vtoken }, 'publish')
              .then(function (r2) {
                if (r2.status < 400) return applySession(r2);
                // 缓存不一致（既说已存在又说不存在）：明确告诉用户是平台缓存问题
                var e = httpError(r2.status < r.status ? r : r2);
                if (/not\s*exist/i.test(errText(e.raw))) {
                  e = new Error('云平台缓存暂时不一致（一会儿说邮箱已存在，一会儿说账号不存在）。这是平台侧的临时状态，请等 1–2 分钟后再点一次「注册并登录」。');
                }
                throw e;
              });
          });
      })
      .then(function (s) {
        var u = pickUser(s.user) || { id: extractUid(s.access_token) };
        return activate(u).then(function (r) {
          return { ok: true, user: u, reconcile: r };
        });
      });
  }

  /* 从 JWT payload 里兜底掏 uid（user 字段缺失时用） */
  function extractUid(jwt) {
    try {
      var part = String(jwt).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      var json = JSON.parse(decodeURIComponent(escape(global.atob(part))));
      return json.sub || '';
    } catch (e) {
      return '';
    }
  }

  function escape(s) {
    return global.escape ? global.escape(s) : s;
  }

  /* ---------- 登录 / 退出 ---------- */

  function signIn(account, password) {
    // v1 网关的 signin 只认 username 字段（邮箱也放这里），password 必填
    return request('POST', '/auth/v1/signin',
      { username: String(account), password: password }, 'publish')
      .then(function (r) {
        var s = applySession(r);
        return activate(s.user).then(function (rec) {
          return { ok: true, user: s.user, reconcile: rec };
        });
      });
  }

  function signOut() {
    Store.attach(null);
    var done = session
      ? request('POST', '/auth/v1/logout', null, 'user').catch(function () { /* 尽力而为 */ })
      : Promise.resolve();
    return done.then(function () {
      writeSession(null);
      session = null;
    });
  }

  /* ---------- 对外接口（auth-ui 依赖这些名字，别乱动） ---------- */

  global.CloudSync = {
    boot: boot,
    ready: boot,
    enabled: function () {
      return !!(CFG.cloudEnabled && CFG.publishableKey && apiBase());
    },
    sendEmailCode: sendEmailCode,
    registerWithEmail: registerWithEmail,
    signIn: signIn,
    signOut: signOut,
    /* 语义 = 「云端已配置可用」（旧版是 SDK 加载成功即 true），
     * 不能要求已有会话，否则未登录时登录弹层根本打不开 */
    isReady: function () { return !!(CFG.cloudEnabled && CFG.publishableKey && apiBase()); },
    currentUser: currentUser,
    user: function () {
      return (session && pickUser(session.user)) || null;
    }
  };
})(window);
