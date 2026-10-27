/* StudyNest 运行时配置
 * 注意：publishableKey 是腾讯云 CloudBase 的「可暴露密钥」，专供浏览器端使用，
 *      可以写进前端代码；而 SecretId / SecretKey 绝对不能出现在这里。
 */
window.STUDYNEST_CONFIG = {
  // 腾讯云开发 CloudBase 环境 ID
  envId: 'studynest-d8gsd3i8w1e29ee2d',

  // 环境所在地域：ap-shanghai(默认) / ap-guangzhou / ap-singapore
  region: 'ap-shanghai',

  // 数据面网关基地址
  // 2026-10-27 实测定案：用 api.tcloudbasegateway.com（官方 HTTP API 域名）。
  // tcb-api.tencentcloudapi.com 那套服务验签异常（工单 202610270578），不要改回去。
  apiBase: 'https://studynest-d8gsd3i8w1e29ee2d.api.tcloudbasegateway.com',

  // 线上域名（需加入控制台安全域名白名单，代码里不需要使用，仅作记录）
  // https://zingy-horse-d32ee4.netlify.app

  // Publishable Key（keyType = publish_key）
  // 这是设计上可公开的客户端密钥：payload 中 role=anon、is_system_admin=false，
  // 即使泄露也只能以匿名身份访问本环境，不具备管理员权限。
  // 2026-10-27 00:29 第三次换发（keyId V7LHEQNfTsCgOao3yyNX6g；旧 key IGx3nAe 已删除）。
  // 注意：即使新签发的 key，header kid 仍是 92ca2624-...（平台签发/验签服务不同步），
  // 仍报 INVALID_ACCESS_TOKEN——已提工单 202610270578，等平台修复。
  publishableKey: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjkyY2EyNjI0LWViZDYtNDQ2Yi04ZDYyLTU1ZGE3NzgyNjRmNSJ9.eyJpc3MiOiJodHRwczovL3N0dWR5bmVzdC1kOGdzZDNpOHcxZTI5ZWUyZC5hcC1zaGFuZ2hhaS50Y2ItYXBpLnRlbmNlbnRjbG91ZGFwaS5jb20iLCJzdWIiOiJhbm9uIiwiYXVkIjoic3R1ZHluZXN0LWQ4Z3NkM2k4dzFlMjllZTJkIiwiZXhwIjo0MDk2NzE1MzcyLCJpYXQiOjE3OTMwMzIxNzIsIm5vbmNlIjoiVjdMSEVRTmZUc0NnT2FvM3l5Tlg2ZyIsImF0X2hhc2giOiJWN0xIRVFOZlRzQ2dPYW8zeXlOWDZnIiwibmFtZSI6IkFub255bW91cyIsInNjb3BlIjoiYW5vbnltb3VzIiwicHJvamVjdF9pZCI6InN0dWR5bmVzdC1kOGdzZDNpOHcxZTI5ZWUyZCIsIm1ldGEiOnsicGxhdGZvcm0iOiJQdWJsaXNoYWJsZUtleSJ9LCJyb2xlIjoiYW5vbiIsImlzX2Fub255bW91cyI6dHJ1ZSwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiYW5vbnltb3VzIiwicHJvdmlkZXJzIjpbImFub255bW91cyJdfSwidXNlcl9tZXRhZGF0YSI6eyJuYW1lIjoiQW5vbnltb3VzIn0sInVzZXJfdHlwZSI6IiIsImNsaWVudF90eXBlIjoiY2xpZW50X3VzZXIiLCJpc19zeXN0ZW1fYWRtaW4iOmZhbHNlfQ.hSHT7ngELjuT2GIjJ2-eygYWRGmNgqtK3dJ57Id1938XpxeNbSFDb77t7MScZqfPQrp489OS5r99xCtsSvMlkN8HSf41RPhoo7_aIr16kvzirhZ-XL6baT6ltNs9pminPvIDZZ6UWLYWFKeRddYzzGQaQM5HG0YTpI1zyduhzHM0TYPWZZ-jBlx1yawjvz8kdqimLLtjBVOkFeAoTv8wpytN3cQbkI0x5939I6teO4BCELOD9T6MhuU0FinLVACKWCMErOPHsXhM0pnkEZllDdQQhAkljxj5mutStEnrMk7IuM-XettQO-oPJRQQYFU05j8eZA02bZL4ZV8w4tvJ9w',

  // 云端开关
  // 2026-10-27 13:55 端到端全通（发码→验码→注册→登录→PG 表读写全部 2xx），正式开启。
  cloudEnabled: true,

  // 数据表名（PG 模式；原集合名沿用，一用户一行，整份状态存 data jsonb）
  collection: 'studynest_state',

  // 写入本地后延迟多久推送到云端（毫秒），避免连续勾选产生大量请求
  syncDebounceMs: 900
};
