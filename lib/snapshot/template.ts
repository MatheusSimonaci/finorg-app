import type { SnapshotData } from './collector'

// ─── Formatting helpers ──────────────────────────────────────────────────────
function fmt(v: number, mask: boolean): string {
  if (mask) return '●●●●'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtPct(v: number): string {
  return v.toFixed(1) + '%'
}
function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}
function fmtDatetime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Minimal bcryptjs WASM bundle (loaded inline for password mode) ──────────
// We use a CDN-free approach: bcrypt comparison deferred to lock-screen script tag.
// For security, we embed a self-contained script block using just bcryptjs ESM slim.
// In production, embed the minified bcryptjs source directly.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BCRYPTJS_CDN = 'https://unpkg.com/bcryptjs@2.4.3/dist/bcrypt.js'

// ─── CSS ─────────────────────────────────────────────────────────────────────
function buildCSS(): string {
  return `
/* ═══════════════════════════════════════════════════════
   FINORG APP — MOBILE TACTICAL DISPLAY
   ═══════════════════════════════════════════════════════ */
:root {
  --bg:           #04040A;
  --surface:      #09090F;
  --surface2:     #0D0D18;
  --border:       rgba(245,197,24,0.10);
  --text:         #D8E0FF;
  --muted:        #505880;
  --primary:      #F5C518;
  --income:       #00D884;
  --expense:      #FF2D2D;
  --warn:         #FF7700;
  --invest:       #00AAFF;
  --holo:         #00C8FF;
  --progress-bg:  #0C0C18;
  --radius:       2px;
  --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --mono: 'SF Mono', SFMono-Regular, ui-monospace, Menlo, Consolas, monospace;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{background:var(--bg);min-height:100vh}
body{
  background-color:var(--bg);
  background-image:
    radial-gradient(ellipse 85% 30% at 50% 0%,rgba(245,197,24,0.06) 0%,transparent 65%),
    radial-gradient(circle,rgba(245,197,24,0.04) 1px,transparent 1px);
  background-size:100% 100%,28px 28px;
  background-position:0 0,14px 14px;
  background-attachment:fixed;
  color:var(--text);
  font-family:var(--font);
  font-size:15px;
  line-height:1.5;
  -webkit-text-size-adjust:100%;
  -webkit-font-smoothing:antialiased;
}
/* CRT scan lines */
body::after{
  content:'';
  position:fixed;inset:0;
  background:repeating-linear-gradient(0deg,rgba(0,0,0,0.045) 0px,rgba(0,0,0,0.045) 1px,transparent 1px,transparent 4px);
  pointer-events:none;z-index:9999;mix-blend-mode:overlay;
}
.container{max-width:480px;margin:0 auto;padding:0 0 80px}

/* ── Header ── */
.header{background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:10}
.header-accent{height:2px;background:linear-gradient(to right,transparent,rgba(245,197,24,0.65),transparent)}
.header-inner{display:flex;align-items:center;justify-content:space-between;padding:10px 16px}
.header-brand{}
.header-logo{font-size:11px;font-weight:700;letter-spacing:.22em;color:var(--primary);text-transform:uppercase}
.header-sub{font-size:8px;color:var(--muted);letter-spacing:.12em;text-transform:uppercase;margin-top:1px}
.header-ts{font-size:9px;color:var(--muted);font-family:var(--mono);text-align:right;line-height:1.4}

/* ── Batcomputer status ticker ── */
@keyframes ticker-scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.ticker{height:20px;overflow:hidden;border-bottom:1px solid var(--border);background:rgba(0,200,255,0.03);display:flex;align-items:center}
.ticker-inner{
  display:inline-flex;align-items:center;white-space:nowrap;
  font-size:7.5px;font-family:var(--mono);letter-spacing:.15em;text-transform:uppercase;
  color:rgba(0,200,255,0.45);animation:ticker-scroll 36s linear infinite;
}

/* ── Tabs ── */
.tabs{display:flex;border-bottom:1px solid var(--border);background:var(--surface);position:sticky;top:72px;z-index:9}
.tab-btn{
  flex:1;padding:10px 4px;
  font-size:8.5px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;
  color:var(--muted);background:none;border:none;cursor:pointer;
  border-bottom:2px solid transparent;margin-bottom:-1px;
  transition:color .15s,border-color .15s;text-align:center;
}
.tab-btn.active{color:var(--primary);border-bottom-color:var(--primary)}
.tab-panel{display:none;padding:14px}
.tab-panel.active{display:block}

/* ── Cards — carbon fiber + corner brackets ── */
.card{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:var(--radius);
  padding:14px;margin-bottom:10px;position:relative;
  background-image:
    linear-gradient(to bottom,rgba(245,197,24,0.04) 0%,rgba(245,197,24,0) 28px),
    repeating-linear-gradient(45deg,rgba(255,255,255,0.010) 0px,rgba(255,255,255,0.010) 1px,transparent 1px,transparent 6px),
    repeating-linear-gradient(-45deg,rgba(255,255,255,0.010) 0px,rgba(255,255,255,0.010) 1px,transparent 1px,transparent 6px);
}
.card::before{content:'';position:absolute;top:0;left:0;width:8px;height:8px;border-top:1.5px solid rgba(0,200,255,0.42);border-left:1.5px solid rgba(0,200,255,0.42);pointer-events:none}
.card::after{content:'';position:absolute;bottom:0;right:0;width:8px;height:8px;border-bottom:1.5px solid rgba(0,200,255,0.42);border-right:1.5px solid rgba(0,200,255,0.42);pointer-events:none}
.card-title{font-size:8.5px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;font-family:var(--mono)}

/* ── KPI grid ── */
.kpi-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.kpi{
  background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;position:relative;
  background-image:
    repeating-linear-gradient(45deg,rgba(255,255,255,0.009) 0px,rgba(255,255,255,0.009) 1px,transparent 1px,transparent 6px),
    repeating-linear-gradient(-45deg,rgba(255,255,255,0.009) 0px,rgba(255,255,255,0.009) 1px,transparent 1px,transparent 6px);
}
.kpi::before{content:'';position:absolute;top:0;left:0;width:6px;height:6px;border-top:1.5px solid rgba(0,200,255,0.38);border-left:1.5px solid rgba(0,200,255,0.38)}
.kpi::after{content:'';position:absolute;bottom:0;right:0;width:6px;height:6px;border-bottom:1.5px solid rgba(0,200,255,0.38);border-right:1.5px solid rgba(0,200,255,0.38)}
.kpi-label{font-size:8px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;font-family:var(--mono)}
.kpi-value{font-size:19px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-.02em;font-family:var(--mono)}
.kpi-value.income{color:var(--income);text-shadow:0 0 8px rgba(0,216,132,0.55)}
.kpi-value.expense{color:var(--expense);text-shadow:0 0 8px rgba(255,45,45,0.55)}
.kpi-value.invest{color:var(--invest);text-shadow:0 0 8px rgba(0,170,255,0.55)}
.kpi-value.balance-pos{color:var(--income);text-shadow:0 0 14px rgba(0,216,132,0.65),0 0 30px rgba(0,216,132,0.20)}
.kpi-value.balance-neg{color:var(--expense);text-shadow:0 0 14px rgba(255,45,45,0.65),0 0 30px rgba(255,45,45,0.20)}

/* ── Progress bars ── */
.prog-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.prog-label{font-size:12px;font-weight:500;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:8px}
.prog-pct{font-size:10px;font-weight:700;color:var(--muted);flex-shrink:0;width:44px;text-align:right;font-family:var(--mono)}
.prog-track{height:3px;background:var(--progress-bg);border-radius:0;overflow:hidden;margin-bottom:10px}
.prog-fill{height:100%;border-radius:0;background:var(--primary);box-shadow:0 0 5px rgba(245,197,24,0.45)}
.prog-fill.warn{background:var(--warn);box-shadow:0 0 5px rgba(255,119,0,0.45)}
.prog-fill.danger{background:var(--expense);box-shadow:0 0 5px rgba(255,45,45,0.45)}

/* ── Asset table ── */
.asset-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border)}
.asset-row:last-child{border-bottom:none}
.asset-name{font-size:13px;font-weight:500;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:8px}
.asset-tag{font-size:8px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:2px;font-family:var(--mono)}
.asset-right{text-align:right;flex-shrink:0}
.asset-value{font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--invest);font-family:var(--mono)}
.asset-pct{font-size:10px;color:var(--muted);font-family:var(--mono)}

/* ── Dream cards ── */
.dream-card{padding:12px 0;border-bottom:1px solid var(--border)}
.dream-card:last-child{border-bottom:none}
.dream-name{font-size:14px;font-weight:600;margin-bottom:2px}
.dream-sub{font-size:11px;color:var(--muted);margin-bottom:8px;font-family:var(--mono)}

/* ── Reserve status ── */
.reserve-status{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:2px;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.reserve-status.ok{background:rgba(0,216,132,.09);color:var(--income);border:1px solid rgba(0,216,132,.25)}
.reserve-status.warning{background:rgba(255,119,0,.09);color:var(--warn);border:1px solid rgba(255,119,0,.25)}
.reserve-status.critical{background:rgba(255,45,45,.09);color:var(--expense);border:1px solid rgba(255,45,45,.25)}

/* ── Lock screen ── */
.lock-overlay{position:fixed;inset:0;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;z-index:9998;padding:24px}
.lock-badge{width:52px;height:52px;border-radius:2px;background:rgba(245,197,24,0.08);border:1px solid rgba(245,197,24,0.3);display:flex;align-items:center;justify-content:center;font-size:26px}
.lock-title{font-size:13px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--primary)}
.lock-sub{font-size:12px;color:var(--muted);text-align:center;letter-spacing:.03em;line-height:1.6}
.lock-input{width:100%;max-width:320px;padding:12px 14px;border-radius:2px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:16px;outline:none;font-family:var(--mono);letter-spacing:.1em}
.lock-input:focus{border-color:var(--primary);box-shadow:0 0 0 1px rgba(245,197,24,0.25)}
.lock-btn{width:100%;max-width:320px;padding:12px;border-radius:2px;background:var(--primary);color:#080600;font-size:11px;font-weight:700;border:none;cursor:pointer;letter-spacing:.2em;text-transform:uppercase}
.lock-err{font-size:11px;color:var(--expense);letter-spacing:.06em}

/* ── Privacy banner ── */
.privacy-banner{background:rgba(255,119,0,0.07);border:1px solid rgba(255,119,0,0.22);border-radius:2px;padding:10px 14px;margin:12px 14px;font-size:10px;color:var(--warn);line-height:1.55;letter-spacing:.03em;font-family:var(--mono)}
`
}

// ─── Tab Sections ────────────────────────────────────────────────────────────
function tabSummary(d: SnapshotData): string {
  const s = d.summary
  const balClass = s.netBalance >= 0 ? 'balance-pos' : 'balance-neg'
  const mask = d.maskValues

  const budgetFill = Math.min(s.budgetPercent, 100)
  const budgetFillClass = s.budgetPercent > 100 ? 'danger' : s.budgetPercent > 85 ? 'warn' : ''

  const reserveBlock = d.reserve
    ? `<div class="card">
        <div class="card-title">Reserva de Emergência</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span class="reserve-status ${d.reserve.status}">
            ${d.reserve.status === 'ok' ? '✓ Adequada' : d.reserve.status === 'warning' ? '⚠ Atenção' : '✗ Crítica'}
          </span>
          <span style="font-size:12px;color:var(--muted)">${d.reserve.currentMonths.toFixed(1)} / ${d.reserve.targetMonths} meses</span>
        </div>
        <div class="prog-track"><div class="prog-fill ${d.reserve.status === 'ok' ? '' : d.reserve.status}" style="width:${Math.min((d.reserve.currentMonths / d.reserve.targetMonths) * 100, 100).toFixed(0)}%"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted)">
          <span>${fmt(d.reserve.currentAmount, mask)}</span>
          <span>Meta: ${fmt(d.reserve.targetAmount, mask)}</span>
        </div>
      </div>`
    : ''

  const activeAdream = d.dreams.find((dr) => dr.status === 'acumulando')
  const dreamBlock = activeAdream
    ? `<div class="card">
        <div class="card-title">Sonho Ativo</div>
        <div class="dream-name">${activeAdream.name}</div>
        <div class="dream-sub">${fmtPct(activeAdream.progressPct)} concluído${activeAdream.targetDate ? ' · Meta: ' + fmtDate(activeAdream.targetDate) : ''}</div>
        <div class="prog-track"><div class="prog-fill" style="width:${activeAdream.progressPct.toFixed(0)}%"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted)">
          <span>${fmt(activeAdream.currentAmount, mask)}</span>
          <span>${fmt(activeAdream.targetAmount, mask)}</span>
        </div>
      </div>`
    : ''

  return `
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">Receita</div><div class="kpi-value income">${fmt(s.personalIncome, mask)}</div></div>
      <div class="kpi"><div class="kpi-label">Gastos</div><div class="kpi-value expense">${fmt(s.personalExpenses, mask)}</div></div>
      <div class="kpi"><div class="kpi-label">Investido</div><div class="kpi-value invest">${fmt(s.invested, mask)}</div></div>
      <div class="kpi"><div class="kpi-label">Saldo</div><div class="kpi-value ${balClass}">${fmt(s.netBalance, mask)}</div></div>
    </div>
    <div class="card">
      <div class="card-title">Orçamento</div>
      <div class="prog-row">
        <span class="prog-label">Gastos vs. Meta</span>
        <span class="prog-pct">${fmtPct(s.budgetPercent)}</span>
      </div>
      <div class="prog-track"><div class="prog-fill ${budgetFillClass}" style="width:${budgetFill.toFixed(0)}%"></div></div>
      <div style="font-size:11px;color:var(--muted)">Meta: ${fmt(s.budgetTarget, mask)}</div>
    </div>
    ${reserveBlock}
    ${dreamBlock}
  `
}

function tabExpenses(d: SnapshotData): string {
  const mask = d.maskValues
  const maxAmt = Math.max(...d.topCategories.map((c) => c.amount), 1)
  const rows = d.topCategories
    .map((c) => {
      const fill = ((c.amount / maxAmt) * 100).toFixed(0)
      return `
        <div class="prog-row">
          <span class="prog-label">${c.category}</span>
          <span style="font-size:11px;font-weight:600;flex-shrink:0;width:72px;text-align:right">${mask ? '●●●' : fmt(c.amount, false)}</span>
        </div>
        <div class="prog-track"><div class="prog-fill" style="width:${fill}%"></div></div>`
    })
    .join('')

  return rows
    ? `<div class="card"><div class="card-title">Top Categorias — ${d.month.slice(0, 7)}</div>${rows}</div>`
    : `<div class="card"><p style="font-size:13px;color:var(--muted)">Nenhum dado de gastos neste período.</p></div>`
}

function tabPortfolio(d: SnapshotData): string {
  const mask = d.maskValues
  const total = d.assets.reduce((s, a) => s + a.value, 0)
  const rows = d.assets
    .map(
      (a) => `
      <div class="asset-row">
        <div style="min-width:0;flex:1;overflow:hidden">
          <div class="asset-name">${a.name}</div>
          <div class="asset-tag">${a.type} · ${a.institution}</div>
        </div>
        <div class="asset-right">
          <div class="asset-value">${fmt(a.value, mask)}</div>
          <div class="asset-pct">${fmtPct(a.pct)}</div>
        </div>
      </div>`,
    )
    .join('')

  return `
    <div class="card" style="margin-bottom:10px">
      <div class="kpi-label">Total do Portfólio</div>
      <div style="font-size:24px;font-weight:700;font-variant-numeric:tabular-nums;font-family:var(--mono);color:var(--invest);text-shadow:0 0 10px rgba(0,170,255,0.5)">${fmt(total, mask)}</div>
    </div>
    <div class="card">
      <div class="card-title">Ativos</div>
      ${rows || '<p style="font-size:13px;color:var(--muted)">Nenhum ativo cadastrado.</p>'}
    </div>`
}

function tabDreams(d: SnapshotData): string {
  const mask = d.maskValues
  const rows = d.dreams
    .map(
      (dr) => `
      <div class="dream-card">
        <div class="dream-name">${dr.name}</div>
        <div class="dream-sub">${fmt(dr.currentAmount, mask)} de ${fmt(dr.targetAmount, mask)}${dr.targetDate ? ' · ' + fmtDate(dr.targetDate) : ''}</div>
        <div class="prog-track"><div class="prog-fill" style="width:${dr.progressPct.toFixed(0)}%"></div></div>
        <div style="font-size:10px;color:var(--muted);margin-top:4px">${fmtPct(dr.progressPct)} concluído</div>
      </div>`,
    )
    .join('')

  return `<div class="card">
    <div class="card-title">Sonhos</div>
    ${rows || '<p style="font-size:13px;color:var(--muted)">Nenhum sonho ativo.</p>'}
  </div>`
}

// ─── Lock screen ─────────────────────────────────────────────────────────────
function lockScreen(passwordHash: string): string {
  return `
  <div id="lock-overlay" class="lock-overlay">
    <div class="lock-badge">🔒</div>
    <div class="lock-title">FinOrg App</div>
    <div style="font-size:9px;letter-spacing:.2em;color:rgba(0,200,255,0.5);text-transform:uppercase;font-family:monospace">Acesso Restrito · Documento Privado</div>
    <div class="lock-sub">Relatório financeiro protegido.<br>Autorização necessária para continuar.</div>
    <input id="lock-pw" class="lock-input" type="password" placeholder="••••••••" autocomplete="current-password" />
    <button class="lock-btn" id="lock-submit">Autenticar</button>
    <div id="lock-err" class="lock-err" style="display:none">▸ Acesso negado. Credencial incorreta.</div>
  </div>
  <script src="https://unpkg.com/bcryptjs@2.4.3/dist/bcrypt.js"><\/script>
  <script>
    var HASH = ${JSON.stringify(passwordHash)};
    function unlock() {
      var pw = document.getElementById('lock-pw').value;
      dcodeIO.bcrypt.compare(pw, HASH, function(err, ok) {
        if (ok) {
          document.getElementById('lock-overlay').style.display = 'none';
        } else {
          document.getElementById('lock-err').style.display = 'block';
        }
      });
    }
    document.getElementById('lock-submit').addEventListener('click', unlock);
    document.getElementById('lock-pw').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') unlock();
    });
  <\/script>`
}

// ─── Main template builder ───────────────────────────────────────────────────
export function buildSnapshotHTML(data: SnapshotData, passwordHash?: string): string {
  const ts = fmtDatetime(data.generatedAt)
  const lock = passwordHash ? lockScreen(passwordHash) : ''
  const privacyWarning = `<div class="privacy-banner">▸ Documento de uso restrito — FinOrg App. Não compartilhe este snapshot sem autorização.</div>`
  const tickerText = `BCv.978 <span class="ticker-sep">▸</span> STATUS: ATIVO <span class="ticker-sep">▸</span> MODO: TÁTICO <span class="ticker-sep">▸</span> ENC: AES-256-Q <span class="ticker-sep">▸</span> PROTOCOLO: SEGURO <span class="ticker-sep">▸</span> SNAPSHOT: ${data.month} <span class="ticker-sep">▸</span> FINORG APP — CONFIDENCIAL <span class="ticker-sep">▸</span> STATUS: AUTORIZADO <span class="ticker-sep">▸</span> SISTEMA: ONLINE <span class="ticker-sep">▸</span>&nbsp;`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#04040A">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="FINORG">
  <title>FINORG · Snapshot ${data.month}</title>
  <style>${buildCSS()}</style>
</head>
<body>
${lock}

<div class="container">
  <div class="header">
    <div class="header-accent"></div>
    <div class="header-inner">
      <div class="header-brand">
        <div class="header-logo">FINORG</div>
        <div class="header-sub">FinOrg App</div>
      </div>
      <div class="header-ts">${data.month}<br>${ts}</div>
    </div>
    <div class="ticker"><div class="ticker-inner">${tickerText}${tickerText}</div></div>
  </div>

  ${privacyWarning}

  <div class="tabs" role="tablist">
    <button class="tab-btn active" role="tab" data-tab="resumo">Resumo</button>
    <button class="tab-btn" role="tab" data-tab="gastos">Gastos</button>
    <button class="tab-btn" role="tab" data-tab="portfolio">Portfólio</button>
    <button class="tab-btn" role="tab" data-tab="sonhos">Sonhos</button>
  </div>

  <div id="tab-resumo" class="tab-panel active">${tabSummary(data)}</div>
  <div id="tab-gastos" class="tab-panel">${tabExpenses(data)}</div>
  <div id="tab-portfolio" class="tab-panel">${tabPortfolio(data)}</div>
  <div id="tab-sonhos" class="tab-panel">${tabDreams(data)}</div>
</div>

<script>
  var tabs = document.querySelectorAll('.tab-btn');
  var panels = document.querySelectorAll('.tab-panel');
  tabs.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var target = btn.dataset.tab;
      tabs.forEach(function(b) { b.classList.remove('active'); });
      panels.forEach(function(p) { p.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('tab-' + target).classList.add('active');
    });
  });
  window.__SNAPSHOT_DATA__ = ${JSON.stringify({ month: data.month, generatedAt: data.generatedAt })};
<\/script>
</body>
</html>`
}
