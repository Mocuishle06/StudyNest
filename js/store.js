/* StudyNest 数据层
 * 设计原则：本地优先。
 *   1. 任何写操作先同步落 localStorage —— 界面立即响应，断网也能用；
 *   2. 之后防抖推送到云端，失败只降级不阻塞；
 *   3. 云不可用时整个应用照常工作，等于内置了演示兜底。
 * 因此业务代码只需调用 Store.load() / Store.save(data)，不关心数据存在哪。
 */
(function (global) {
  'use strict';

  var KEY = 'studynest-mvp-v1';
  var DEFAULT_SYNC_MS = 900;

  var adapter = null;      // 云端适配器，未登录时为 null
  var pushTimer = null;
  var status = 'local';    // local | idle | syncing | synced | error
  var listeners = [];

  function defaults() {
    return { tasks: [], resources: [], focusMinutes: 0, coins: 0, sessions: 0, updatedAt: null };
  }

  function isRecord(x) {
    return !!x && typeof x === 'object' && typeof x.id === 'string';
  }

  function num(v, fallback) {
    return Number.isFinite(v) ? v : fallback;
  }

  /* 把任意来源的数据整形成可信结构，脏数据不会污染界面 */
  function normalize(raw) {
    var out = defaults();
    if (!raw || typeof raw !== 'object') return out;
    if (Array.isArray(raw.tasks)) out.tasks = raw.tasks.filter(isRecord);
    if (Array.isArray(raw.resources)) out.resources = raw.resources.filter(isRecord);
    out.focusMinutes = num(raw.focusMinutes, 0);
    out.coins = num(raw.coins, 0);
    out.sessions = num(raw.sessions, 0);
    out.updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : null;
    return out;
  }

  function load() {
    var raw = null;
    try {
      raw = JSON.parse(global.localStorage.getItem(KEY) || 'null');
    } catch (e) {
      raw = null; // 数据损坏时静默重置，避免整站白屏
    }
    return normalize(raw);
  }

  function writeLocal(data) {
    try {
      global.localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      // 隐私模式或配额满时写入会抛错，此时仅退回内存态
      console.warn('[StudyNest] 本地写入失败：', e);
      return false;
    }
  }

  function setStatus(next) {
    if (next === status) return;
    status = next;
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](next); } catch (e) { /* 监听器异常不影响主流程 */ }
    }
  }

  function save(data) {
    data.updatedAt = new Date().toISOString();
    writeLocal(data);
    schedulePush(data);
    return data;
  }

  function schedulePush(data) {
    if (!adapter) { setStatus('local'); return; }
    if (pushTimer) global.clearTimeout(pushTimer);
    setStatus('syncing');
    var cfg = global.STUDYNEST_CONFIG || {};
    pushTimer = global.setTimeout(function () {
      pushTimer = null;
      adapter.push(data).then(function () {
        setStatus('synced');
      }).catch(function (err) {
        setStatus('error');
        console.warn('[StudyNest] 云同步失败，已保留本地数据：', err);
      });
    }, cfg.syncDebounceMs || DEFAULT_SYNC_MS);
  }

  /* 登录或启动时对齐两边数据。
   * 云端为空 → 把本地数据当作首次迁移推上去（老用户数据不丢）；
   * 两边都有 → 按 updatedAt 取较新的一份（整份覆盖，规则简单可预期）。
   */
  function reconcile() {
    if (!adapter) return Promise.resolve({ ok: false, reason: 'no-adapter' });
    setStatus('syncing');
    return adapter.pull().then(function (remoteRaw) {
      var local = load();
      var remote = remoteRaw ? normalize(remoteRaw) : null;

      if (!remote) {
        return adapter.push(local).then(function () {
          setStatus('synced');
          return { ok: true, action: 'migrated' };
        });
      }

      var lt = local.updatedAt ? Date.parse(local.updatedAt) : 0;
      var rt = remote.updatedAt ? Date.parse(remote.updatedAt) : 0;

      if (rt > lt) {
        writeLocal(remote);
        setStatus('synced');
        return { ok: true, action: 'adopted-remote' };
      }

      return adapter.push(local).then(function () {
        setStatus('synced');
        return { ok: true, action: 'pushed-local' };
      });
    }).catch(function (err) {
      setStatus('error');
      console.warn('[StudyNest] 云端对齐失败，已退回本地模式：', err);
      return { ok: false, reason: 'error', error: err };
    });
  }

  function attach(a) {
    adapter = a;
    setStatus(a ? 'idle' : 'local');
  }

  global.Store = {
    KEY: KEY,
    load: load,
    save: save,
    normalize: normalize,
    attach: attach,
    reconcile: reconcile,
    status: function () { return status; },
    onStatus: function (fn) {
      listeners.push(fn);
      fn(status);
      return function () {
        var i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    }
  };
})(window);
