// 最小诊断函数：零依赖，仅验证 EdgeOne 函数层是否正常
export function onRequestGet() {
  return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
