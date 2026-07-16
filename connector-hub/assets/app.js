/* ============================================================
   app.js — Connector Hub shell
   Four views over one inventory. One delegated listener.
============================================================ */
'use strict';

const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const { WF, CATS, C, CAPS, ISSUES } = window.HUB;

let __t;
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(__t); __t = setTimeout(() => t.classList.remove('on'), 2400);
}

const S = { view:'grid', wf:'all', q:'' };

const STATUS_LABEL = { connected:'Connected', attention:'Needs attention', blocked:'Blocked',
  available:'Available', completed:'Completed', declined:'Declined', skipped:'Skipped' };

const wfTag = w => `<span class="wf" style="background:${WF[w].c}">${w}</span>`;
const stPill = s => `<span class="st ${s}"><i></i>${STATUS_LABEL[s]}</span>`;

/* ---------- filtering ---------- */
function visible(c){
  if (S.wf !== 'all' && !c.wf.includes(S.wf)) return false;
  if (!S.q) return true;
  const hay = (c.name + ' ' + c.cap + ' ' + c.desc + ' ' + (c.alts||[]).join(' ')).toLowerCase();
  return hay.includes(S.q);
}

/* ---------- stats ---------- */
function renderStats(){
  const conn = C.filter(c => c.status === 'connected' || c.status === 'completed').length;
  const att  = C.filter(c => c.status === 'attention').length;
  const blk  = C.filter(c => c.status === 'blocked').length;
  const wired = C.filter(c => c.readiness === 'wired').length;
  const covered = CAPS.filter(c => c.active).length;
  $('#stats').innerHTML = `
    <div class="s"><div class="k">Connected</div><div class="v">${conn}<small>/ ${C.length}</small></div><div class="d">across 7 workflows</div></div>
    <div class="s"><div class="k">Capabilities covered</div><div class="v">${covered}<small>/ ${CAPS.length}</small></div><div class="d">one provider per capability</div></div>
    <div class="s"><div class="k">Needs attention</div><div class="v warn">${att}</div><div class="d">DBA · Instagram · CRM mismatch</div></div>
    <div class="s"><div class="k">Blocked</div><div class="v stop">${blk}</div><div class="d">waiting on another workflow</div></div>
    <div class="s"><div class="k">Actually wired</div><div class="v">${wired}<small>/ ${C.length}</small></div><div class="d">port + adapter, not a mock</div></div>`;
}

/* ---------- view: grid by category ---------- */
function card(c){
  const multi = c.wf.length > 1 ? ' multi' : '';
  const dim = (c.status === 'skipped' || c.status === 'declined') ? ' dim' : '';
  return `<button class="c${dim}" data-c="${c.id}">
    <div class="top">
      <span class="logo" style="background:${c.lc}">${c.logo}</span>
      <h3>${c.name}</h3>
    </div>
    <div class="cap">${c.cap}</div>
    <p>${c.desc}</p>
    <div class="bot">
      ${stPill(c.status)}
      <span class="${multi ? 'wf multi' : ''}" style="display:inline-flex;gap:3px">${c.wf.map(wfTag).join('')}</span>
      <span class="rd ${c.readiness}">${c.readiness}</span>
    </div>
  </button>`;
}

function renderGrid(){
  const html = CATS.map(cat => {
    const items = C.filter(c => c.cat === cat.id && visible(c));
    if (!items.length) return '';
    return `<section class="sec">
      <div class="sech"><span class="n">${cat.n}</span><h2>${cat.name}</h2><span class="d">${cat.d}</span></div>
      <div class="grid">${items.map(card).join('')}</div>
    </section>`;
  }).join('');
  $('#body').innerHTML = html || `<div class="empty">Nothing matches that filter.</div>`;
}

/* ---------- view: by workflow ---------- */
function renderByWorkflow(){
  const html = Object.keys(WF).map(w => {
    const items = C.filter(c => c.wf.includes(w) && visible(c));
    if (!items.length) return '';
    const sk = WF[w].skipped ? ' <span style="color:var(--faint);font-weight:400">· workflow skipped today</span>' : '';
    return `<section class="sec">
      <div class="sech"><span class="n">${w}</span><h2>${WF[w].name}${sk}</h2>
        <span class="d">${items.length} connector${items.length>1?'s':''}</span></div>
      <div class="grid">${items.map(card).join('')}</div>
    </section>`;
  }).join('');
  $('#body').innerHTML = html || `<div class="empty">Nothing matches that filter.</div>`;
}

/* ---------- view: capability map ---------- */
function renderCaps(){
  const rows = CAPS.map(c => {
    const provider = c.active
      ? (c.active === 'partial' ? '<span style="color:var(--warn)">partial</span>' : `<b>${c.active}</b>`)
      : (c.readiness === 'missing'
          ? '<span style="color:var(--stop)">no provider — nothing built</span>'
          : '<span style="color:var(--faint)">not connected</span>');
    const alts = C.filter(x => x.cap === c.cap && x.alts && x.alts.length)
      .flatMap(x => x.alts).slice(0,3).join(' · ');
    const rd = c.readiness === 'wired' ? '<span class="rd wired">wired</span>'
      : c.readiness === 'scaffolded' ? '<span class="rd scaffolded">scaffolded</span>'
      : c.readiness === 'missing' ? '<span class="rd" style="color:var(--stop)">missing</span>'
      : '<span class="rd">planned</span>';
    return `<tr>
      <td><b>${c.cap}</b></td>
      <td>${provider}${alts ? `<div class="alts">alt: ${alts}</div>` : ''}</td>
      <td><span style="display:inline-flex;gap:3px">${c.wf.map(wfTag).join('')}</span></td>
      <td>${rd}</td></tr>`;
  }).join('');
  $('#body').innerHTML = `
    <section class="sec">
      <div class="sech"><span class="n">MAP</span><h2>One capability, one active provider</h2>
        <span class="d">mirrors <span class="mono">ports/</span> + <span class="mono">adapters/</span></span></div>
      <p style="font-size:12.5px;color:var(--muted);margin:0 0 14px;max-width:660px">
        The repo already models an integration as <span class="mono">{ provider, capability, status }</span>.
        A capability should have exactly one active provider — that is what an adapter <em>is</em>.
        Alternatives are what you could swap to without touching a workflow.</p>
      <table><thead><tr><th style="width:20%">Capability</th><th style="width:38%">Active provider</th>
        <th style="width:24%">Used by</th><th>Readiness</th></tr></thead>
        <tbody>${rows}</tbody></table>
    </section>`;
}

/* ---------- view: health & gaps ---------- */
function renderIssues(){
  const sevLabel = { hi:'Critical', md:'Medium', lo:'Note' };
  $('#body').innerHTML = `
    <section class="sec">
      <div class="sech"><span class="n">GAPS</span><h2>What this hub reveals</h2>
        <span class="d">${ISSUES.length} findings</span></div>
      <p style="font-size:12.5px;color:var(--muted);margin:0 0 16px;max-width:660px">
        A connector hub is the first screen where cross-workflow assumptions become visible.
        These are the ones that only show up when you put all seven workflows on one page.</p>
      ${ISSUES.map(i => `<div class="issue ${i.sev}">
        <h4><span class="sev">${sevLabel[i.sev]}</span>${i.t}</h4><p>${i.b}</p></div>`).join('')}
    </section>`;
}

/* ---------- modal ---------- */
function openC(id){
  const c = C.find(x => x.id === id); if (!c) return;
  $('#mLogo').textContent = c.logo;
  $('#mLogo').style.background = c.lc;
  $('#mName').textContent = c.name;
  $('#mSub').innerHTML = `${c.cap} · ${STATUS_LABEL[c.status]} · <span class="mono">${c.readiness}</span>`;

  const own = { yours:'Yours — registered / authorised in your name', onbehalf:'We act on your behalf',
    managed:'Managed by StartupKit' }[c.own];

  $('#mBody').innerHTML =
    (c.attention ? `<div class="p ${c.status === 'blocked' ? 'stopp' : 'warnp'}">${c.attention}</div>` : '') +
    `<p style="font-size:13px;color:var(--ink2);margin:${c.attention ? '14px' : '0'} 0 18px;line-height:1.65">${c.desc}</p>

    <h5 class="eh">Connection</h5>
    <table class="kv"><tbody>
      <tr><td>Status</td><td>${stPill(c.status)}</td></tr>
      <tr><td>Capability</td><td><b>${c.cap}</b></td></tr>
      <tr><td>Ownership</td><td>${own}</td></tr>
      <tr><td>Data direction</td><td>${c.dir}</td></tr>
      <tr><td>Cost</td><td>${c.cost}</td></tr>
      <tr><td>Readiness</td><td><span class="rd ${c.readiness}" style="margin:0">${c.readiness}</span>
        ${c.readiness === 'wired' ? ' — Protocol + adapter exist'
          : c.readiness === 'scaffolded' ? ' — adapter exists, port is a TODO stub'
          : ' — named in a mock, not implemented'}</td></tr>
      ${c.alts && c.alts.length ? `<tr><td>Alternatives</td><td>${c.alts.join(' · ')}</td></tr>` : ''}
    </tbody></table>

    <h5 class="eh sp">Used by ${c.wf.length} workflow${c.wf.length>1?'s':''}</h5>
    <ul class="uses">${c.uses.map(u => `<li>${wfTag(u.wf)}
      <span class="step">${u.step}</span><span class="what">${u.what}</span></li>`).join('')}</ul>

    <h5 class="eh sp">Scopes requested</h5>
    <div class="scopes">${c.scopes.map(s => `<span>${s}</span>`).join('')}</div>

    <h5 class="eh sp">If you disconnect it</h5>
    <div class="p">${c.breaks}</div>

    ${c.note ? `<h5 class="eh sp">Worth knowing</h5><div class="p">${c.note}</div>` : ''}

    <h5 class="eh sp">Where this comes from</h5>
    <div class="p" style="font-size:11.5px;color:var(--muted)"><span class="mono">${c.src}</span></div>`;

  const connected = c.status === 'connected' || c.status === 'completed';
  $('#mFoot').innerHTML = connected
    ? `<button class="b p" data-toast="Opening ${c.name} settings">Manage</button>
       <button class="b" data-toast="Opens ${c.name} in a new tab">Open ↗</button>
       <button class="b danger" data-toast="Disconnect ${c.name}? ${c.wf.length} workflow(s) depend on it">Disconnect</button>
       <span class="hint">${c.own === 'yours' ? 'Your account. Revoke from their settings any time.' : ''}</span>`
    : c.status === 'blocked'
    ? `<button class="b p" disabled>Blocked</button>
       <button class="b" data-toast="Jumping to the workflow that unblocks this">See what’s blocking it</button>
       <span class="hint">Waiting on another workflow.</span>`
    : `<button class="b p" data-toast="${c.name} OAuth opens — your login, your data">Connect ${c.name}</button>
       <button class="b" data-toast="Comparing ${(c.alts||[]).join(', ') || 'alternatives'}">Compare alternatives</button>
       <span class="hint">Connect, don’t manage.</span>`;

  $('#ov').classList.add('on');
  document.body.style.overflow = 'hidden';
  $('#mBody').scrollTop = 0;
}
function closeC(){ $('#ov').classList.remove('on'); document.body.style.overflow = ''; }

/* ---------- render ---------- */
function render(){
  $$('#views button').forEach(b => b.classList.toggle('on', b.dataset.view === S.view));
  $$('#wfChips button').forEach(b => b.classList.toggle('on', b.dataset.wfc === S.wf));
  $('#wfChips').style.display = (S.view === 'caps' || S.view === 'issues') ? 'none' : 'flex';
  $('#searchWrap').style.display = (S.view === 'issues') ? 'none' : 'flex';
  renderStats();
  if (S.view === 'grid') renderGrid();
  else if (S.view === 'wf') renderByWorkflow();
  else if (S.view === 'caps') renderCaps();
  else renderIssues();
}

function boot(){
  $('#views').innerHTML = [
    ['grid','By function',`<em>${CATS.length}</em>`],
    ['wf','By workflow',`<em>7</em>`],
    ['caps','Capability map',`<em>${CAPS.length}</em>`],
    ['issues','Health & gaps',`<em>${ISSUES.length}</em>`]
  ].map(v => `<button data-view="${v[0]}">${v[1]} ${v[2]}</button>`).join('');

  $('#wfChips').innerHTML = `<button class="chip" data-wfc="all">All workflows</button>` +
    Object.keys(WF).map(w => `<button class="chip" data-wfc="${w}">
      <span class="d" style="background:${WF[w].c}"></span>${w}</button>`).join('');

  render();
}

/* ---------- one delegated listener ---------- */
document.addEventListener('click', e => {
  const t = e.target;

  const v = t.closest('[data-view]');
  if (v){ S.view = v.dataset.view; render(); return; }

  const w = t.closest('[data-wfc]');
  if (w){ S.wf = w.dataset.wfc; render(); return; }

  const c = t.closest('[data-c]');
  if (c){ openC(c.dataset.c); return; }

  const row = t.closest('tbody tr');
  if (row && row.dataset.cap){ return; }

  if (t.closest('#mClose') || t === $('#ov')){ closeC(); return; }

  const ts = t.closest('[data-toast]');
  if (ts) toast(ts.dataset.toast);
});

$('#q').addEventListener('input', function(){ S.q = this.value.trim().toLowerCase(); render(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeC(); });

boot();
