// Copyright (c) 2026, The MoneroUSD Protocol
// SPDX-License-Identifier: Apache-2.0
//
// This file is an original work of the MoneroUSD Protocol, a post-quantum GHOSTDAG block-DAG
// zero-knowledge confidential-value protocol. It is NOT part of the Monero Project. Licensed under
// the Apache License, Version 2.0; see the LICENSE and NOTICE files at the repository root.

// pages/usernames.js — confidential username market (#77/#78/#80/#81).
//
// MoneroUSD usernames are TRADEABLE handles whose ownership lives in an
// indexed-Merkle-tree (IMT) of HIDING commitments:
//
//     uname_cm = Poseidon2( DS_USERNAME || name || owner_pk )
//
// Only the IMT *root* is on chain. The (name ↔ owner) mapping is never
// derivable from chain data — registering, transferring, or owning a
// handle leaks nothing about WHICH name or WHO owns it. That is the whole
// point vs a classical public name registry (e.g. ENS / the old Ion
// attestation registry), where handle→owner is world-readable.
//
// This page is therefore deliberately metadata-thin: it can prove that
// the market EXISTS and is live (claimed-name count, the threaded root,
// the post-quantum ZK consensus rule), but it CANNOT — and must not be
// able to — list names or owners. Showing it couldn't is the privacy
// audit (#82) made visible.
//
// Data source: the daemon's own /get_pq_username_tree handler, reached
// through the SAME decentralization-respecting multi-RPC failover as the
// other PQ reads — no single-operator indexer, no trust root.

export async function renderUsernames(ctx) {
  const { view, ds, H } = ctx;
  const esc = (s) => (H && H.escapeHtml ? H.escapeHtml(String(s ?? '')) : String(s ?? ''));

  view.innerHTML = '<div class="loading">Loading the username market…</div>';

  // Live IMT state (fail-soft: a wedged/unreachable daemon must not wedge
  // the page — no-halts. We render the explainer either way and just show
  // "—" for the live figures).
  let tree = null;
  try { tree = await ds.getPqUsernameTreeSafe(); } catch (_) { tree = null; }

  const live    = !!(tree && (tree.status === undefined || tree.status === 'OK'));
  const count   = live && tree.count  != null ? Number(tree.count)  : null;
  const depth   = live && tree.depth  != null ? Number(tree.depth)  : 32;
  const rootHex = live && tree.root_hex       ? String(tree.root_hex)       : '';
  const emptyHex= live && tree.empty_root_hex ? String(tree.empty_root_hex) : '';
  // An IMT that still equals its empty root has had zero registrations.
  const isEmpty = rootHex && emptyHex && rootHex === emptyHex;
  const claimed = count == null ? null : count;            // # of uname_cm leaves
  const capacity = `2^${depth}`;                          // sparse-IMT slot capacity

  const fmtRoot = (h) => h ? `${h.slice(0, 10)}…${h.slice(-8)}` : '—';
  const fmtNum  = (n) => n == null ? '—' : (H && H.fmtInt ? H.fmtInt(n) : n.toLocaleString());

  view.innerHTML = `
    <header class="hero" style="padding:30px 32px">
      <span class="hero-eyebrow">Username market</span>
      <h1 style="font-size:1.7rem">Confidential, tradeable @handles</h1>
      <p>A username on MoneroUSD is a <strong>tradeable</strong> handle — but unlike every
        classical name registry, the mapping from <code>@name</code> to its owner is
        <strong>never on chain</strong>. Ownership lives in an indexed-Merkle-tree of
        <em>hiding</em> commitments; the chain holds only the tree's root. Registering,
        transferring, or holding a handle reveals nothing about which name it is or who
        owns it. This page can show the market is <strong>live</strong> — it cannot show
        you the names, because nobody can.</p>
    </header>

    <section class="stat-grid">
      <div class="stat-tile">
        <div class="stat-tile-label">Names claimed</div>
        <div class="stat-tile-value">${claimed == null ? '—' : fmtNum(claimed)}</div>
        <div class="stat-tile-sub">${isEmpty ? 'market open — none yet' : 'hiding uname_cm leaves'}</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-label">IMT depth</div>
        <div class="stat-tile-value">${esc(depth)}</div>
        <div class="stat-tile-sub">capacity ${esc(capacity)} handles</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-label">Threaded root</div>
        <div class="stat-tile-value mono" style="font-size:0.95rem" title="${esc(rootHex)}">${esc(fmtRoot(rootHex))}</div>
        <div class="stat-tile-sub">current username-IMT root</div>
      </div>
      <div class="stat-tile">
        <div class="stat-tile-label">Consensus</div>
        <div class="stat-tile-value" style="font-size:1.0rem">PQ&nbsp;ZK&nbsp;STARK</div>
        <div class="stat-tile-sub">post-quantum, ≤1.8&nbsp;MB proof</div>
      </div>
    </section>

    <section class="card">
      <div class="card-header"><h2>Market status</h2>
        <span class="badge ${live ? 'badge-success' : 'badge-warning'}">${live ? 'live' : 'daemon unreachable'}</span>
      </div>
      <div class="kv-table">
        <dt>State</dt>
        <dd>${live
            ? (isEmpty
                ? 'Open — the username-IMT is at its empty root (no handle registered yet). First-claim-wins.'
                : `${esc(fmtNum(claimed))} handle${claimed === 1 ? '' : 's'} registered. Each is a hiding commitment — ordering, names, and owners stay concealed.`)
            : 'The proof-bearing daemon did not answer (it may be syncing or under load). The market rule is enforced on chain regardless; refresh shortly.'}</dd>
        <dt>Current root</dt>
        <dd class="mono copyable" title="${esc(rootHex)}">${esc(rootHex || '—')}</dd>
        <dt>Empty root</dt>
        <dd class="mono" title="${esc(emptyHex)}">${esc(emptyHex ? emptyHex.slice(0, 18) + '…' : '—')}</dd>
        <dt>Tree</dt>
        <dd>Indexed Merkle tree (depth ${esc(depth)}), threaded root-to-root on every
            registration and transfer. Append-only by construction — <strong>no growth on any
            axis</strong>: per-block work is O(1) and the on-chain footprint is one constant root,
            never a per-name list.</dd>
      </div>
    </section>

    <section class="card">
      <div class="card-header"><h2>What's concealed — and what's public</h2></div>
      <div class="privacy-grid">
        <div class="privacy-col">
          <h3><span class="privacy-pill concealed">concealed</span></h3>
          <ul class="privacy-list">
            <li><strong>The name</strong> — cleartext <code>@handle</code> is a witness only;
              the chain sees the hiding commitment <code>uname_cm = Poseidon2(DS_USERNAME‖name‖owner_pk)</code>,
              never the name.</li>
            <li><strong>The owner</strong> — the owner's PQ public key stays inside the proof.
              No <code>name → owner</code> or <code>owner → names</code> mapping exists on chain.</li>
            <li><strong>Who is buying / selling</strong> — a transfer proves the old owner
              authorized it (a fresh nullifier from their spend secret) without revealing either party.</li>
            <li><strong>Registration order / linkage</strong> — leaves are opaque commitments;
              you cannot tell two handles apart, link a transfer to a registration, or build a "rich list".</li>
          </ul>
        </div>
        <div class="privacy-col">
          <h3><span class="privacy-pill public">public</span></h3>
          <ul class="privacy-list">
            <li><strong>That the market is live</strong> — the threaded IMT root and the
              count of claimed commitments are public (this page).</li>
            <li><strong>Each registration / transfer carrier</strong> — a value-less
              <code>DOMAIN_PQ_USERNAME</code> / <code>DOMAIN_PQ_USERNAME_TRANSFER</code> tx is on chain,
              exposing only <code>root_old → root_new</code>, the hiding <code>uname_cm</code>, and (for a transfer)
              an anti-replay nullifier.</li>
            <li><strong>The ZK consensus rule</strong> — every carrier is re-verified at block-add;
              a stale root, a replayed nullifier, or a tampered proof is rejected (fail-closed on the
              bad item only, never the chain's progress).</li>
            <li><strong>Soundness</strong> — first-claim-wins (register proves the name is unclaimed),
              and a transfer needs <em>both-party authorization</em> in one atomic proof.</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card-header"><h2>How it works</h2></div>
      <div class="kv-table">
        <dt>Register</dt>
        <dd>A wallet builds a value-less <code>DOMAIN_PQ_USERNAME</code> carrier that proves the
            name is unclaimed and inserts <code>uname_cm</code> into the username-IMT
            (<code>root_old → root_new</code>). The name and owner key stay witness.</dd>
        <dt>Transfer / trade</dt>
        <dd>A single <code>DOMAIN_PQ_USERNAME_TRANSFER</code> proof shows membership of the current
            <code>(name, old&nbsp;owner)</code> leaf, the old owner's authorization (a fresh nullifier),
            and the insert of the new <code>(name, new&nbsp;owner)</code> leaf — an <strong>atomic
            rebind</strong> with no race-prone revoke/re-register window.</dd>
        <dt>Pay by @handle</dt>
        <dd>Sending to <code>@handle</code> resolves to the recipient's current stealth address
            at send time over an onion-routed lookup; the daemon never learns which handle you paid.</dd>
        <dt>Proof size</dt>
        <dd>Each carrier is decider-compressed to a constant <strong>≤1.8&nbsp;MB</strong> post-quantum
            ZK proof — verify-once-discard, no chain bloat.</dd>
      </div>
      <p style="margin-top:14px;color:var(--text-secondary);font-size:13px">
        Claim a handle from the wallet's Send/Receive screen — <code>register_username</code> builds the
        carrier, the daemon dry-run-validates it, and your wallet relays it. Ownership is the on-chain
        note, not any server.</p>
    </section>

    <p style="margin:18px 0 0;color:var(--text-muted);font-size:12px">
      Source: <code class="mono">/get_pq_username_tree</code> on the proof-bearing daemon
      (decentralized multi-RPC failover). The leaves are hiding commitments — the explorer
      receives them but can extract no name or owner from them.
    </p>
  `;

  // Wire copy-to-clipboard on the root (matches the rest of the explorer's .copyable affordance).
  if (H && typeof H.wireCopyables === 'function') {
    try { H.wireCopyables(view); } catch (_) { /* non-fatal */ }
  }
}
