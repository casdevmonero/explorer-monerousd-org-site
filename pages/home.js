// Copyright (c) 2026, The MoneroUSD Protocol
// SPDX-License-Identifier: Apache-2.0
//
// This file is an original work of the MoneroUSD Protocol, a post-quantum GHOSTDAG block-DAG
// zero-knowledge confidential-value protocol. It is NOT part of the Monero Project. Licensed under
// the Apache License, Version 2.0; see the LICENSE and NOTICE files at the repository root.

// pages/home.js — Phantom-style hero + live network stats +
// recent blocks + pager (Older/Newer).
//
// The hero stat tiles surface chain-derived facts only (height,
// difficulty, hashrate, pool tx count). No address-balance lookups
// — that would violate the privacy stance.
//
// "Older blocks" button bug fix (was broken in legacy explorer):
// the pager now has an explicit `data-older-top` attribute that
// stores the next page's top height, and an event handler bound
// every render (not relying on a one-shot global hashchange).

import { timeAgo } from '../lib/data-source.js';
import { VERIFIED_TOKENS, VERIFIED_ORGS } from '../lib/registries.js';
import { sanitizeHtml } from '../lib/helpers.js';

const RECENT_BLOCK_PAGE_SIZE = 12;

function fmtH(n) {
  if (n == null || isNaN(n)) return '—';
  n = Number(n);
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' GH/s';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' MH/s';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + ' KH/s';
  return n.toFixed(0) + ' H/s';
}
function fmtD(n) {
  if (n == null) return '—';
  n = Number(n);
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' G';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + ' K';
  return n.toFixed(0);
}

function heroHTML(info) {
  // HONEST PUBLIC-DA metrics only (user 2026-08-25: the ledger must be honest). Every figure is a
  // param-derived or consensus-public fact — height (blue score), PoUW proof-rate, the cover
  // CAPACITY and SHAPE named as the constants they are (never dressed as measured throughput or a
  // per-block tx count), and the DAG width. Identical whether the chain is idle or saturated.
  const height  = Number(info?.height || 0);
  const proving = info?.proving_power;
  const tps     = info?.tps;
  const txpb    = info?.tx_per_block != null ? info.tx_per_block : 256;
  const width   = info?.dag_width;
  return `
    <header class="hero" aria-labelledby="hero-heading">
      <canvas id="hero-dag" class="hero-dag-canvas" aria-hidden="true"></canvas>
      <span class="hero-eyebrow">MoneroUSD chain · post-quantum · privacy-first</span>
      <h1 id="hero-heading">Sovereign block explorer</h1>
      <p>Every proof verified. Every identity concealed. Search tokens, NFTs, contracts, organizations
         and sovereign sites — chain-anchored, no operator can lie.
         <a href="#/privacy">What's concealed →</a></p>
      <div class="hero-cta-row">
        <a class="hero-cta hero-cta-primary" href="#/tokens">Browse tokens</a>
        <a class="hero-cta hero-cta-ghost" href="#/privacy">Privacy model</a>
      </div>
      <div class="hero-pills">
        <span class="hero-pill"><span class="hero-pill-dot"></span>Hidden amounts &amp; parties</span>
        <span class="hero-pill"><span class="hero-pill-dot"></span>ML-KEM · ML-DSA · WHIR</span>
        <span class="hero-pill"><span class="hero-pill-dot"></span>GHOSTDAG block-DAG</span>
        <span class="hero-pill"><span class="hero-pill-dot"></span>Zero metadata leaks</span>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-label">Block height</div>
          <div class="hero-stat-value">${height.toLocaleString('en-US')}</div>
          <div class="hero-stat-sub">GHOSTDAG blue score</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-label">Total proving power</div>
          <div class="hero-stat-value">${fmtH(proving)}</div>
          <div class="hero-stat-sub">PoUW proof-rate</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-label">Cover capacity</div>
          <div class="hero-stat-value">${fmtD(tps)}</div>
          <div class="hero-stat-sub">slots/s · constant</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-label">Cover shape</div>
          <div class="hero-stat-value">${txpb}</div>
          <div class="hero-stat-sub">slots/block · volume concealed</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-label">DAG width</div>
          <div class="hero-stat-value">${width != null ? width : '—'}</div>
          <div class="hero-stat-sub">parallel blocks</div>
        </div>
      </div>
    </header>
  `;
}

function quickRowsHTML() {
  const tokens   = VERIFIED_TOKENS.length;
  const orgs     = VERIFIED_ORGS.length;
  return `
    <section class="card interactive rv">
      <div class="card-header">
        <h2>Browse on-chain entities</h2>
      </div>
      <div class="entity-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))">
        <a class="entity-card" href="#/tokens">
          <div class="entity-head">
            <div class="entity-logo">T</div>
            <div><div class="entity-title">Tokens</div><div class="entity-sub">${tokens + ' verified'}</div></div>
          </div>
          <p class="entity-body">USDm and protocol-issued assets — auto-curated registry plus the live indexer feed.</p>
        </a>
        <a class="entity-card" href="#/validators">
          <div class="entity-head">
            <div class="entity-logo">B</div>
            <div><div class="entity-title">Bridge</div><div class="entity-sub">native swaps</div></div>
          </div>
          <p class="entity-body">Native cross-chain swaps — BTC, XMR, ETH, ZEC, SOL direct to USDm. No wrapped tokens, like THORChain.</p>
        </a>
        <a class="entity-card" href="#/nfts">
          <div class="entity-head">
            <div class="entity-logo">N</div>
            <div><div class="entity-title">NFT collections</div><div class="entity-sub">browse</div></div>
          </div>
          <p class="entity-body">Privacy-preserving NFTs minted on chain — collection metadata, mint events, transfers.</p>
        </a>
        <a class="entity-card" href="#/contracts">
          <div class="entity-head">
            <div class="entity-logo">C</div>
            <div><div class="entity-title">Dark Contracts</div><div class="entity-sub">DSOL bytecode</div></div>
          </div>
          <p class="entity-body">All DC_DEPLOY contracts — codeHash, ABI, recent calls. Bytecode is public; argv encrypted.</p>
        </a>
        <a class="entity-card" href="#/orgs">
          <div class="entity-head">
            <div class="entity-logo">O</div>
            <div><div class="entity-title">Organizations</div><div class="entity-sub">${orgs + ' verified'}</div></div>
          </div>
          <p class="entity-body">Verified organizations and their full footprint: tokens, contracts, sites, contributions.</p>
        </a>
        <a class="entity-card" href="#/sites">
          <div class="entity-head">
            <div class="entity-logo">S</div>
            <div><div class="entity-title">Sovereign sites</div><div class="entity-sub">SITE_PUBLISH</div></div>
          </div>
          <p class="entity-body">Chain-anchored static sites — every publish strengthens the reserve.</p>
        </a>
        <a class="entity-card" href="#/validators">
          <div class="entity-head">
            <div class="entity-logo">V</div>
            <div><div class="entity-title">Validators</div><div class="entity-sub">bonded set</div></div>
          </div>
          <p class="entity-body">Bonded validators backing the FROST bridge — bond size, slash log, signal record.</p>
        </a>
        <a class="entity-card" href="#/privacy">
          <div class="entity-head">
            <div class="entity-logo">P</div>
            <div><div class="entity-title">Privacy primer</div><div class="entity-sub">what's concealed?</div></div>
          </div>
          <p class="entity-body">Side-by-side: what's CONCEALED on MoneroUSD vs what's PUBLIC. Built for trust.</p>
        </a>
      </div>
    </section>
  `;
}

function blocksTableHTML(blocks) {
  if (!blocks.length) return '<div class="empty">No blocks loaded yet.</div>';
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Height</th>
            <th>Time</th>
            <th>Block ID</th>
            <th class="num">Cover</th>
            <th class="num">Difficulty</th>
          </tr>
        </thead>
        <tbody>
          ${blocks.map(b => {
            const h      = b.block_header || b;
            const height = Number(h.height ?? 0);
            const ts     = Number(h.timestamp || 0);
            const diff   = h.difficulty == null ? null : Number(h.difficulty);
            const realId = h.real_id || null;
            const idCell = realId
              ? `<span class="mono" title="${realId}">${realId.slice(0, 16)}…</span>`
              : `<span class="muted" title="beyond this node's O(1) retention — the DA keeps the record; this node keeps no per-block history">—</span>`;
            return `<tr>
              <td><a href="#/block/${encodeURIComponent(height)}">${height.toLocaleString('en-US')}</a></td>
              <td>${ts ? timeAgo(ts) : '<span class="muted">—</span>'}</td>
              <td>${idCell}</td>
              <td class="num">256</td>
              <td class="num">${diff == null ? '<span class="muted">—</span>' : fmtD(diff)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function pagerHTML(currentTop, tip) {
  const tipTop       = Math.max(0, tip - 1);
  const newerDisabled = currentTop >= tipTop;
  const older        = currentTop - RECENT_BLOCK_PAGE_SIZE;
  const olderDisabled = older < 0;
  const newerTop     = Math.min(tipTop, currentTop + RECENT_BLOCK_PAGE_SIZE);
  const bottom = Math.max(0, currentTop - RECENT_BLOCK_PAGE_SIZE + 1);
  return `
    <div class="pager">
      <button class="btn btn-ghost btn-sm" id="newer-btn"
              data-newer-top="${newerTop}" ${newerDisabled ? 'disabled' : ''}>
        ← Newer
      </button>
      <span class="pager-info">Blocks ${bottom.toLocaleString('en-US')} – ${currentTop.toLocaleString('en-US')}</span>
      <button class="btn btn-primary btn-sm" id="older-btn"
              data-older-top="${older}" ${olderDisabled ? 'disabled' : ''}>
        Older →
      </button>
    </div>
  `;
}

export async function renderHome(ctx) {
  const { ds, view } = ctx;

  // Phase 1 — hero, then recent blocks right below it, then entity grid, activity, DAG showcase.
  view.innerHTML = heroHTML({}) + `
    <section class="card rv">
      <div class="card-header">
        <h2>Recent blocks</h2>
        <div class="card-action" id="blocks-action">Loading…</div>
      </div>
      <div id="blocks-body"><div class="loading">Loading recent blocks…</div></div>
    </section>
  ` + quickRowsHTML() + `
    <section class="card rv">
      <div class="card-header">
        <h2>Activity</h2>
        <div class="card-action" id="txs-action">Loading…</div>
      </div>
      <div id="txs-body"><div class="loading">…</div></div>
    </section>
    <section class="dag-showcase rv">
      <h2>Live DAG visualization</h2>
      <p class="muted">Watch blocks arrive on the GHOSTDAG block-DAG in real time.
         Every block's proof is verified — every identity concealed.</p>
      <a class="dag-showcase-cta" href="#" id="dag-view-toggle">Open live DAG view</a>
    </section>
  `;

  // Wire DAG showcase CTA to open the live DAG overlay (injected by dag-view.js).
  const dagToggle = view.querySelector('#dag-view-toggle');
  if (dagToggle) {
    dagToggle.addEventListener('click', e => {
      e.preventDefault();
      const dagBtn = view.querySelector('.ev-seg button[data-ev="dag"]');
      if (dagBtn) dagBtn.click();
    });
  }

  // Wire a Refresh-on-click on the Updated header — users on slow
  // connections want a manual retry button.
  view.addEventListener('click', e => {
    if (e.target.closest('#txs-action')) {
      e.preventDefault();
      paintActivityCard(ctx);
    }
    if (e.target.closest('#blocks-action')) {
      e.preventDefault();
      (async () => {
        const newInfo = await ds.callDaemon('get_info').catch(() => null);
        const newTip = Number(newInfo?.height || 0);
        const top = Math.max(0, newTip - 1);
        const fresh = await fetchRecentBlocks(ds, top, RECENT_BLOCK_PAGE_SIZE);
        paintBlocks(ctx, fresh, top, newTip);
        paintActivityCard(ctx);
      })();
    }
  });

  // Phase 2 — fetch get_info + paint real hero.
  let info = {};
  try { info = await ds.callDaemon('get_info'); } catch (_) {}
  const heroNode = view.querySelector('.hero');
  if (heroNode) heroNode.outerHTML = sanitizeHtml(heroHTML(info));

  const tip = Number(info?.height || 0);
  const initialTop = Math.max(0, tip - 1);

  // Phase 3 — fetch the visible-window blocks (table).
  const blocks = await fetchRecentBlocks(ds, initialTop, RECENT_BLOCK_PAGE_SIZE);
  paintBlocks(ctx, blocks, initialTop, tip);

  // Phase 4 — the activity card. There is deliberately NO transaction list to populate: every
  // block carries the identical 256-slot cover shape and the chain refuses which-item questions,
  // so an honest explorer states that instead of walking blocks for tx hashes.
  paintActivityCard(ctx);
}

// Fetches N recent blocks starting at `top` (descending), then joins each header with its REAL
// block id from the node's recent-DAG feed (blue_score is the height coordinate). A height past
// the node's O(1) retention keeps no id and renders an honest dash — never an invented hash.
async function fetchRecentBlocks(ds, top, count) {
  // ONE honest source: the node's own /dag_recent feed (same-origin proxied by the sovereign
  // serve), which carries the REAL block ids, timestamps and blue scores. The per-height RPC
  // lane is unreachable from the wallet embed (cross-origin), and past the O(1) retention span
  // the daemon has no per-block history anyway — rows the feed does not cover render the honest
  // dash rather than a synthesized header.
  let byScore = new Map();
  try {
    const dag = await ds.dagRecent();
    for (const d of dag) if (!byScore.has(d.blue_score)) byScore.set(d.blue_score, d);
  } catch (_) { /* feed unreachable — every row renders the honest dash */ }
  const out = [];
  for (let h = top; h > top - count && h >= 0; h--) {
    const d = byScore.get(h);
    if (d) {
      out.push({ block_header: { height: h, timestamp: Number(d.ts || 0), real_id: d.id } });
      continue;
    }
    try {
      const b = await ds.getBlockByHeight(h);
      const hh = b.block_header || b;
      if (Number(hh.height ?? -1) === h) { out.push(b); continue; }
    } catch (_) { /* fall through to the honest dash row */ }
    out.push({ block_header: { height: h, timestamp: 0 } });
  }
  return out;
}

// Paints the blocks-table + pager into #blocks-body, then wires
// Older/Newer click handlers (re-bound on every render so the
// pager keeps working after every page advance — this was the
// "Older blocks button broken" bug in the legacy explorer).
function paintBlocks(ctx, blocks, top, tip) {
  const { ds, view } = ctx;
  const blocksBody = view.querySelector('#blocks-body');
  const action     = view.querySelector('#blocks-action');
  if (action) action.textContent = `Updated ${new Date().toLocaleTimeString()}`;
  if (!blocksBody) return;
  blocksBody.innerHTML = sanitizeHtml(blocksTableHTML(blocks) + pagerHTML(top, tip));

  const older = blocksBody.querySelector('#older-btn');
  const newer = blocksBody.querySelector('#newer-btn');
  if (older && !older.disabled) {
    older.addEventListener('click', async () => {
      const next = Number(older.dataset.olderTop);
      if (!Number.isFinite(next) || next < 0) return;
      blocksBody.innerHTML = '<div class="loading">Loading…</div>';
      const win = await fetchRecentBlocks(ds, next, RECENT_BLOCK_PAGE_SIZE);
      paintBlocks(ctx, win, next, tip);
    });
  }
  if (newer && !newer.disabled) {
    newer.addEventListener('click', async () => {
      const next = Number(newer.dataset.newerTop);
      if (!Number.isFinite(next)) return;
      blocksBody.innerHTML = '<div class="loading">Loading…</div>';
      const win = await fetchRecentBlocks(ds, next, RECENT_BLOCK_PAGE_SIZE);
      paintBlocks(ctx, win, next, tip);
    });
  }
}

// The activity card — the honest replacement for a "recent transactions" list. This chain
// cover-pads every block to the identical 256-slot shape and answers no which-item question, so
// there is no tx list an explorer could truthfully show; walking blocks for tx hashes (the old
// deep-lookback here) was asking the chain to leak the exact metadata it exists to conceal.
function paintActivityCard(ctx) {
  const { view } = ctx;
  const body = view.querySelector('#txs-body');
  const action = view.querySelector('#txs-action');
  if (action) action.textContent = 'by construction';
  if (!body) return;
  body.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-title">Concealed by design</div>
      <p class="muted">Every block carries the identical 256-slot cover shape — which slots are
      real, their amounts, senders and receivers never appear on the ledger. What you can verify
      is public: block structure, proof validity, and the chain's commitments.
      <a href="#/privacy">How the privacy model works →</a></p>
    </div>`;
}
