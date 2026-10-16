(() => {
  'use strict';
  const data = JSON.parse(document.getElementById('preview-data').textContent);
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const copy = (value) => JSON.parse(JSON.stringify(value));
  const mediumNames = { stage: '舞台上', voice: '声', video: '映像' };
  const contextNames = { unknown: '未確認', primary: '主な役', additional: '兼役', nested: '劇中で演じる役', narration: '語り手' };
  const key = `stage-connect-credit-review-v${data.version}-${data.revision}`;
  const all = [...data.records, data.synthetic];
  const byId = new Map(all.map((record) => [record.id, record]));
  let localStore = true;
  let drafts = {};
  let selectedId = data.featuredIds[0] ?? data.records[0]?.id ?? data.synthetic.id;
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}');
    for (const [id, draft] of Object.entries(saved.drafts ?? {})) {
      if (byId.has(id) && Array.isArray(draft.roles) && draft.roles.every((role) => typeof role.name === 'string' && Array.isArray(role.media))) drafts[id] = draft;
    }
    if (byId.has(saved.selectedId)) selectedId = saved.selectedId;
  } catch { localStore = false; }
  let mode = byId.get(selectedId)?.kind === 'synthetic' ? 'synthetic' : data.featuredIds.includes(selectedId) ? 'featured' : 'all';
  let limit = 60;
  let downloadUrl;
  const draftFor = (record) => drafts[record.id] ?? record.draft;
  const normalize = (text) => String(text ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g, '');
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify({ drafts, selectedId }));
      localStore = true;
      $('#save-status').textContent = `${Object.keys(drafts).length}件の下書き · このブラウザーに保存済み`;
    } catch {
      localStore = false;
      $('#save-status').textContent = 'ブラウザー保存を利用できません。書き出して保存してください。';
    }
  }
  function edit(mutator) {
    const record = byId.get(selectedId);
    const draft = copy(draftFor(record));
    mutator(draft);
    drafts[selectedId] = draft;
    save();
    renderDisplay();
    renderList(false);
  }
  const choices = (values, selected) => Object.entries(values).map(([value, label]) => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`).join('');
  function filtered() {
    if (mode === 'synthetic') return [data.synthetic];
    const search = normalize($('#search').value);
    const series = $('#series').value;
    let rows = data.records.filter((record) => {
      if (mode === 'featured' && !data.featuredIds.includes(record.id)) return false;
      if (mode === 'review' && !record.parsed.needsReview) return false;
      if (mode === 'annotated' && !record.parsed.annotations.length) return false;
      if (series && series !== record.series.slug) return false;
      return !search || normalize([record.actor.name, record.play.title, record.series.name, ...Object.values(record.parsed.raw)].join(' ')).includes(search);
    });
    if (mode === 'featured') rows.sort((a, b) => data.featuredIds.indexOf(a.id) - data.featuredIds.indexOf(b.id));
    return rows;
  }
  function renderList(adjustSelection = true) {
    const rows = filtered();
    if (adjustSelection && !rows.some((record) => record.id === selectedId)) selectedId = rows[0]?.id;
    $('#result-count').textContent = `${rows.length.toLocaleString()}件を表示`;
    $('#list-count').textContent = rows.length;
    $('#search').disabled = mode === 'synthetic';
    $('#series').disabled = mode === 'synthetic';
    document.querySelectorAll('[data-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    $('#records').innerHTML = rows.slice(0, limit).map((record) => `<button class="record-button ${selectedId === record.id ? 'active' : ''}" data-select="${esc(record.id)}" aria-pressed="${selectedId === record.id}">
      <span class="record-person">${esc(record.actor.name)} ${record.parsed.needsReview ? '<span class="dot" title="要確認"></span>' : ''}${drafts[record.id] ? '<small title="下書きあり">✎</small>' : ''}</span>
      <span class="record-role">${esc(record.parsed.raw.roleName || '役名の記載なし')}</span><span class="record-play">${esc(record.play.title)}</span></button>`).join('') + (rows.length > limit ? '<div class="pager"><button id="load-more" class="button secondary">さらに60件表示</button></div>' : '') || '<div class="empty-state">該当する配役はありません。</div>';
  }
  function rawField(label, value) {
    return `<div class="raw-field"><span class="field-caption">${esc(label)}</span><p class="raw-value ${value ? '' : 'empty'}">${esc(value || '記載なし')}</p></div>`;
  }
  function formField(label, name, value, className = '') {
    return `<label class="form-field ${className}">${esc(label)}<input data-field="${name}" value="${esc(value)}"></label>`;
  }
  function renderDetail() {
    const record = byId.get(selectedId);
    if (!record) { $('#detail').innerHTML = '<div class="empty-state">検索条件を変えてください。</div>'; return; }
    const draft = draftFor(record);
    const parsed = record.parsed;
    const synthetic = record.kind === 'synthetic';
    const issues = parsed.unresolved.map((note) => `<p>${esc(note.field === 'role' ? '役名欄' : 'グループ欄')}：${esc(note.text)}</p>`).join('');
    $('#detail').innerHTML = `<div class="detail-heading"><div><p class="series-name">${esc(record.series.name)}</p><h2>${esc(record.actor.name)}</h2><p class="work-title">${esc(record.play.title)}</p></div><span class="badge ${synthetic ? 'demo' : parsed.needsReview ? 'warn' : ''}">${synthetic ? '架空例・実DBと無関係' : parsed.needsReview ? '補足・取り込みの確認が必要' : '原文からの整理案'}</span></div>
      ${synthetic ? '<div class="source-banner">仕様を試すために作った架空例です。実在する俳優・作品の配役ではありません。</div>' : ''}
      <div class="comparison">
      <section class="panel"><div class="panel-title"><h3>01　登録されている原文</h3><span>変更しません</span></div><div class="panel-body">
        ${rawField('役名', parsed.raw.roleName)}${rawField('グループ', parsed.raw.castGroup)}${rawField('備考', parsed.raw.note)}
        ${issues ? `<div class="unknown-block"><strong>意味を確認したい補足</strong>${issues}<p>別の役・所属などの可能性を残しています。</p></div>` : ''}
        ${parsed.qualityFlags.length ? '<div class="unknown-block"><strong>取り込み内容の確認</strong><p>HTMLタグが混入しています。別作品の文章が含まれている可能性もあるため、役名を自動分解しません。</p></div>' : ''}
        <div class="raw-details">${synthetic ? '架空例の識別子' : '既存の配役ID'}<br>${esc(record.id)}${!synthetic ? `<br>主演：${record.starring ? '指定あり' : '指定なし'} ／ 掲載順：${esc(record.billingOrder ?? '未指定')}` : ''}</div>
      </div></section>
      <section class="panel"><div class="panel-title"><h3>02　情報を分けた整理案</h3><span>編集して試せます</span></div><div class="panel-body">
        <div id="role-fields">${draft.roles.map((role, index) => `<div class="role-card role-form"><div class="role-title-row"><label>役 ${index + 1}<input data-role-name="${index}" value="${esc(role.name)}" aria-label="役${index + 1}の名前"></label><button class="remove-role" data-remove-role="${index}" aria-label="整理案から役${index + 1}を外す">外す</button></div>
          <span class="media-title">この役の出演形態（複数選択可）</span><div class="medium-options">${Object.entries(mediumNames).map(([value, label]) => `<label><input type="checkbox" data-role-medium="${index}" value="${value}" ${role.media.includes(value) ? 'checked' : ''}>${label}</label>`).join('')}<span class="media-unknown">無選択＝未確認</span></div>
          <label>役の関係<select data-role-context="${index}">${choices(contextNames, role.context)}</select></label></div>`).join('')}</div>
        <button class="add-role" id="add-role">＋ 役を追加する</button>
        ${draft.scopeNote ? `<p class="inline-hint">${esc(draft.scopeNote)}</p>` : ''}
        <p class="section-label">所属・編成</p><div class="field-grid">${formField('所属・グループ', 'group', draft.group, 'full')}${formField('世代', 'generations', draft.generations)}${formField('チーム', 'teams', draft.teams)}</div>
        <p class="section-label">出演条件</p><span class="field-caption">参加区分（組み合わせ可）</span><div class="participation">${Object.entries(data.appearanceLabels).map(([value, label]) => `<button data-participation="${value}" aria-pressed="${draft.participation.includes(value)}">${esc(label)}</button>`).join('')}</div>
        <div class="field-grid">${formField('公演地（複数の場合は「、」区切り）', 'locations', draft.locations, 'full')}${formField('日付・期間の表記', 'schedule', draft.schedule, 'full')}
        <label class="form-field full">この条件がかかる範囲<select data-field="conditionScope">${choices({ unknown: '未確認', all: 'この出演記録の全役', ...Object.fromEntries(draft.roles.map((role, i) => [`role:${i}`, `役${i + 1}：${role.name || '名前未入力'}`])) }, draft.conditionScope)}</select></label></div><p class="inline-hint">月日だけの記載から年・時刻を補いません。</p>
      </div></section></div>
      <section class="live-preview" aria-label="整理案の表示イメージ"><p>表示イメージ · 配役の内容だけを確認するための仮表示です</p><div id="display-content"></div></section>
      <section class="review-area" aria-label="確認メモ"><label class="form-field">確認に使う出典URL<textarea data-field="sourceUrls" placeholder="公式ページなどのURLを1行ずつ">${esc(draft.sourceUrls)}</textarea></label><label class="form-field">確認メモ・足りない項目<textarea data-field="reviewNote" placeholder="この補足は別の役。声だけなのは2役目、など">${esc(draft.reviewNote)}</textarea></label></section>
      <div class="review-bottom"><label>整理案の確認 <select data-field="decision">${choices({ pending: '確認待ち', revise: '修正・追加検討が必要', suitable: 'この整理でよさそう' }, draft.decision)}</select></label><span>本番DBには反映されません</span><button id="reset-record" class="button secondary">この案を初期状態へ</button></div>`;
    renderDisplay();
  }
  function renderDisplay() {
    const record = byId.get(selectedId);
    if (!record || !$('#display-content')) return;
    const draft = draftFor(record);
    const roles = draft.roles.map((role) => `${esc(role.name || '役名未入力')}${role.media.length ? `<small>［${esc(role.media.map((value) => mediumNames[value] ?? value).join('・'))}］</small>` : ''}${role.context !== 'unknown' ? `<small>${esc(contextNames[role.context])}</small>` : ''}`).join('<br>');
    const generation = /^\d+$/u.test(draft.generations) ? `${draft.generations}代目` : draft.generations;
    const metadata = [draft.group, generation, draft.teams ? `${draft.teams}チーム` : '', ...draft.participation.map((value) => data.appearanceLabels[value]), draft.locations, draft.schedule].filter(Boolean);
    const pending = record.parsed.unresolved.map((note) => note.text);
    $('#display-content').innerHTML = `<div class="display-roles">${roles || (record.parsed.qualityFlags.length ? '取り込み内容を確認してください' : '役名の記載なし')}</div>${metadata.length ? `<div class="display-meta">${metadata.map(esc).join(' ／ ')}</div>` : ''}${draft.conditionScope.startsWith('role:') ? `<div class="display-meta">出演条件の対象：${esc(draft.roles[Number(draft.conditionScope.slice(5))]?.name ?? '役を確認')}</div>` : ''}${pending.length ? `<div class="display-pending">補足の原文（扱いを確認中）：${pending.map(esc).join(' ／ ')}</div>` : ''}${record.parsed.raw.note ? `<div class="display-meta">元の備考：${esc(record.parsed.raw.note)}</div>` : ''}`;
  }
  $('#snapshot-date').textContent = `データ取得：${new Date(data.capturedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`;
  $('#metrics').innerHTML = [[data.stats.total, '配役レコード'], [data.stats.annotated, '手書きの補足あり'], [data.stats.unresolved, '意味を確認する補足'], [data.stats.quality, '取り込み混入を確認']].map(([count, label], i) => `<div class="metric ${i > 1 ? 'warn' : ''}"><strong>${count.toLocaleString()}</strong><span>${label}</span></div>`).join('');
  const series = [...new Map(data.records.map((record) => [record.series.slug, record.series.name])).entries()].filter(([slug]) => slug).sort(([a], [b]) => a.localeCompare(b));
  $('#series').innerHTML += series.map(([slug, name]) => `<option value="${esc(slug)}">${esc(name)}</option>`).join('');
  document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => { mode = button.dataset.mode; limit = 60; renderList(); renderDetail(); }));
  for (const id of ['search', 'series']) $(`#${id}`).addEventListener(id === 'search' ? 'input' : 'change', () => { limit = 60; renderList(); renderDetail(); });
  $('#records').addEventListener('click', (event) => {
    const button = event.target.closest('[data-select]');
    if (button) { selectedId = button.dataset.select; save(); renderList(false); renderDetail(); }
    if (event.target.closest('#load-more')) { limit += 60; renderList(false); }
  });
  $('#detail').addEventListener('input', (event) => {
    const input = event.target;
    if (input.dataset.field && input.tagName !== 'SELECT') edit((draft) => { draft[input.dataset.field] = input.value; });
    if (input.dataset.roleName !== undefined) edit((draft) => { draft.roles[Number(input.dataset.roleName)].name = input.value; });
  });
  $('#detail').addEventListener('change', (event) => {
    const input = event.target;
    if (input.dataset.field && input.tagName === 'SELECT') edit((draft) => { draft[input.dataset.field] = input.value; });
    if (input.dataset.roleContext !== undefined) edit((draft) => { draft.roles[Number(input.dataset.roleContext)].context = input.value; });
    if (input.dataset.roleMedium !== undefined) edit((draft) => {
      const role = draft.roles[Number(input.dataset.roleMedium)];
      role.media = input.checked ? [...new Set([...role.media, input.value])] : role.media.filter((value) => value !== input.value);
    });
  });
  $('#detail').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.id === 'add-role') { edit((draft) => { draft.roles.push({ name: '', media: [], context: 'unknown' }); }); renderDetail(); $('#role-fields .role-card:last-child input').focus(); }
    if (button.dataset.removeRole !== undefined) {
      edit((draft) => { const index = Number(button.dataset.removeRole); draft.roles.splice(index, 1); if (draft.conditionScope.startsWith('role:')) { const target = Number(draft.conditionScope.slice(5)); draft.conditionScope = target === index ? 'unknown' : `role:${target > index ? target - 1 : target}`; } }); renderDetail();
    }
    if (button.dataset.participation) {
      const value = button.dataset.participation;
      edit((draft) => { draft.participation = draft.participation.includes(value) ? draft.participation.filter((item) => item !== value) : [...draft.participation, value]; });
      button.setAttribute('aria-pressed', String(draftFor(byId.get(selectedId)).participation.includes(value)));
    }
    if (button.id === 'reset-record' && confirm('この配役の下書きを初期の整理案に戻しますか？')) { delete drafts[selectedId]; save(); renderList(false); renderDetail(); }
  });
  $('#export').addEventListener('click', () => {
    const entries = Object.keys(drafts).length ? Object.entries(drafts) : selectedId ? [[selectedId, draftFor(byId.get(selectedId))]] : [];
    const exportRow = ([id, draft]) => { const record = byId.get(id); return { id, kind: record.kind, actor: record.actor, play: record.play, original: record.parsed.raw, unresolved: record.parsed.unresolved, qualityFlags: record.parsed.qualityFlags, draft }; };
    const result = { purpose: 'preview_draft_only', version: data.version, sourceRevision: data.revision, capturedAt: data.capturedAt, exportedAt: new Date().toISOString(), records: entries.filter(([id]) => byId.get(id).kind === 'real').map(exportRow), syntheticExamples: entries.filter(([id]) => byId.get(id).kind === 'synthetic').map(exportRow) };
    const json = JSON.stringify(result, null, 2);
    $('#export-json').value = json;
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    $('#download').href = downloadUrl;
    $('#export-dialog').showModal();
  });
  $('#close-export').addEventListener('click', () => $('#export-dialog').close());
  renderList(); renderDetail();
  $('#save-status').textContent = localStore ? `${Object.keys(drafts).length}件の下書き · このブラウザー内のみ` : 'ブラウザー保存を利用できません。書き出して保存してください。';
})();
