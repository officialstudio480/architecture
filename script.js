/*
 * 建築ノード 共通スクリプト
 *
 * サイト全体で使う処理だけをここに置いています。
 * 各ページ固有の計算は、そのページの HTML / 専用 JS にまとめます。
 */

// ========================================
// サイト情報
// ========================================
const ARCHLAB_CONTACT = {
  // 実際の X URL / メールアドレスを入れると、
  // フッターとお問い合わせページに自動反映されます。
  // XのURLはここだけ変更すれば、サイト全体に反映されます。
  x: 'https://x.com/idx_dsn_offic',
  email: 'officialstudio480@gmail.com'
};

const ARCHLAB_META = {
  version: 'v3.70',
  updated: '2026.09.05'
};

// localStorage に保存するデータの名前です。
const NODE_STORAGE = {
  favorites: 'archnode:favorites:v1',
  recent: 'archnode:recent:v1'
};

// 検索・お気に入り・最近使ったページで使う基本情報です。
const TOOL_META = {
  'scale.html': { title: '縮尺計算', category: 'SCALE', description: '実寸と図面上の寸法を相互変換' },
  'calculator.html': { title: '建築計算', category: 'CALCULATOR', description: '面積・体積・建ぺい率などを計算' },
  'law.html': { title: '法令検索', category: 'LAW', description: '建築課題で使う法令を検索' },
  'materials.html': { title: '素材検索', category: 'MATERIAL', description: '建築パース向け素材を検索' },
  'search.html': { title: 'サイト内検索', category: 'SEARCH', description: '建築ノードの情報を横断検索' },
  'about.html': { title: 'このサイトについて', category: 'ABOUT', description: '建築ノードについて' },
  'contact.html': { title: 'お問い合わせ', category: 'CONTACT', description: 'X・メールからお問い合わせ' },
  'updates.html': { title: '更新履歴', category: 'UPDATES', description: 'バージョンと変更内容' },
  'tools.html': { title: 'TOOLBOX', category: 'TOOLBOX', description: '家・部屋・DIY・建築に使える道具' },
  'plans.html': { title: '料金プラン', category: 'PLANS', description: '無料・有料プランの案内' },
  'mypage.html': { title: 'マイページ', category: 'MY NODE', description: '保存・お気に入り・履歴をまとめて確認' },
};

// ========================================
// 小さな共通関数
// ========================================

function loadList(storageKey) {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.warn('保存データを読み込めませんでした。', error);
    return [];
  }
}

function saveList(storageKey, value) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch (error) {
    console.warn('保存できませんでした。', error);
  }
}

function normalizeUrl(url) {
  try {
    const pageName = new URL(url, location.href).pathname.split('/').pop();
    return pageName || 'index.html';
  } catch {
    return url;
  }
}

function isInternalPage(url) {
  const pageName = normalizeUrl(url);
  return Boolean(TOOL_META[pageName]) || pageName === 'index.html' || pageName === '';
}

// ========================================
// 最近使ったページ
// ========================================

function trackRecent(url) {
  const pageName = normalizeUrl(url);
  if (!isInternalPage(pageName)) return;

  const recentPages = loadList(NODE_STORAGE.recent)
    .filter(item => item.url !== pageName);

  recentPages.unshift({ url: pageName, time: Date.now() });
  saveList(NODE_STORAGE.recent, recentPages.slice(0, 8));
}

// ========================================
// お気に入り
// ========================================

function getFavoriteSet() {
  return new Set(loadList(NODE_STORAGE.favorites));
}

function toggleFavorite(url) {
  const pageName = normalizeUrl(url);
  const favorites = loadList(NODE_STORAGE.favorites);
  const index = favorites.indexOf(pageName);

  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.unshift(pageName);
  }

  saveList(
    NODE_STORAGE.favorites,
    [...new Set(favorites)].slice(0, 12)
  );

  refreshFavoriteUI();
}

function createFavoriteButton(url) {
  const pageName = normalizeUrl(url);
  const button = document.createElement('button');

  button.type = 'button';
  button.className = 'node-favorite';
  button.dataset.favoriteFor = pageName;
  button.setAttribute('aria-label', 'お気に入りに追加');

  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(pageName);
  });

  return button;
}

function addFavoriteControls() {
  // 通常のツールカード
  document.querySelectorAll('a.tool-card[href]').forEach(card => {
    if (card.querySelector('.node-favorite')) return;

    card.classList.add('node-favorite-host');
    card.appendChild(createFavoriteButton(card.href));
  });

  // 検索結果カード
  document.querySelectorAll('#searchResults .card').forEach(card => {
    if (card.querySelector('.node-favorite')) return;

    const link = card.querySelector('a[href]');
    if (!link || !isInternalPage(link.href)) return;

    card.classList.add('node-favorite-host');
    card.appendChild(createFavoriteButton(link.href));
  });

  // その他の「お気に入り対象」リンク
  document.querySelectorAll('[data-favorite-link]').forEach(link => {
    if (link.querySelector('.node-favorite')) return;

    link.classList.add('node-favorite-host');
    link.appendChild(createFavoriteButton(link.href));
  });

  refreshFavoriteUI();
}

function refreshFavoriteUI() {
  const favorites = getFavoriteSet();

  document.querySelectorAll('.node-favorite').forEach(button => {
    const isFavorite = favorites.has(button.dataset.favoriteFor);
    button.textContent = isFavorite ? '★' : '☆';
    button.classList.toggle('active', isFavorite);
    button.setAttribute(
      'aria-label',
      isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'
    );
  });

  renderNodeDashboard();
}

function renderNodeDashboard() {
  const favoriteBox = document.getElementById('nodeFavorites');
  const recentBox = document.getElementById('nodeRecent');

  if (!favoriteBox || !recentBox) return;

  const favorites = loadList(NODE_STORAGE.favorites)
    .filter(url => TOOL_META[url]);
  const recentPages = loadList(NODE_STORAGE.recent)
    .filter(item => TOOL_META[item.url]);

  function renderCards(items, type) {
    if (!items.length) {
      return `<p class="node-empty">${
        type === 'favorite'
          ? '☆を押したツールがここに表示されます。'
          : '最近開いたページがここに表示されます。'
      }</p>`;
    }

    return items.slice(0, 4).map(item => {
      const pageName = type === 'favorite' ? item : item.url;
      const meta = TOOL_META[pageName];

      return `
        <a class="node-mini-card" href="${pageName}">
          <span>${meta.category}</span>
          <strong>${meta.title}</strong>
          <small>${meta.description}</small>
        </a>
      `;
    }).join('');
  }

  favoriteBox.innerHTML = renderCards(favorites, 'favorite');
  recentBox.innerHTML = renderCards(recentPages, 'recent');
}

// ========================================
// トップのクイック検索
// ========================================

function installDashboardSearch() {
  const form = document.getElementById('nodeQuickSearchForm');
  const input = document.getElementById('nodeQuickSearch');

  if (!form || !input) return;

  form.addEventListener('submit', event => {
    event.preventDefault();

    const query = input.value.trim();
    const target = query
      ? `search.html?q=${encodeURIComponent(query)}`
      : 'search.html';

    location.href = target;
  });
}

// ========================================
// 計算結果のコピー
// ========================================

function installCopyButtons() {
  document.querySelectorAll('.result').forEach(result => {
    if (result.dataset.copyReady === '1') return;

    result.dataset.copyReady = '1';

    const row = document.createElement('div');
    row.className = 'result-actions';

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'result-copy';
    copyButton.textContent = '結果をコピー';

    copyButton.addEventListener('click', async () => {
      const text = result.innerText
        .replace(/結果をコピー|コピーしました/g, '')
        .trim();

      if (!text || text === '—' || text === 'ここに結果が表示されます。') {
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
        copyButton.textContent = 'コピーしました';
      } catch {
        copyButton.textContent = 'コピーできませんでした';
      }

      setTimeout(() => {
        copyButton.textContent = '結果をコピー';
      }, 1400);
    });

    row.appendChild(copyButton);
    result.insertAdjacentElement('afterend', row);
  });
}

// ========================================
// 入力例ボタン
// ========================================

function installPresetButtons() {
  document.querySelectorAll('.calc-form').forEach(form => {
    if (form.querySelector('.preset-example')) return;

    const inputs = [...form.querySelectorAll('input[placeholder]')]
      .filter(input => /例：/.test(input.placeholder));

    if (!inputs.length) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preset-example';
    button.textContent = '入力例を入れる';

    button.addEventListener('click', () => {
      inputs.forEach(input => {
        const match = input.placeholder.match(/例：\s*([^、]+)/);
        if (match) input.value = match[1].replace(/,/g, '');
      });
    });

    const mainButton = form.querySelector('.button');
    if (mainButton) {
      mainButton.insertAdjacentElement('beforebegin', button);
    } else {
      form.appendChild(button);
    }
  });
}

// ========================================
// ページ移動の記録
// ========================================

function installRecentTracking() {
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || !isInternalPage(link.href)) return;

    trackRecent(link.href);
  });
}

// 検索結果が後から追加されたときもお気に入りボタンを付けます。
function installSearchObserver() {
  const results = document.getElementById('searchResults');
  if (!results) return;

  const observer = new MutationObserver(() => {
    addFavoriteControls();
  });

  observer.observe(results, { childList: true });
}

// ========================================
// キーボードの「/」で検索欄へ移動
// ========================================

function installSearchShortcut() {
  function getSearchInput() {
    return document.getElementById('nodeQuickSearch')
      || document.getElementById('globalQuery')
      || document.getElementById('q');
  }

  document.addEventListener('keydown', event => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const activeTag = document.activeElement?.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;

    const input = getSearchInput();
    if (!input) return;

    event.preventDefault();
    input.focus();
    input.select?.();
  });
}

// ========================================
// 料金プランのロック表示
// ========================================

function installPremiumLocks() {
  const lockedTools = document.querySelectorAll('.locked-tool.premium-gray');
  if (!lockedTools.length) return;

  let modal = document.getElementById('premiumLockModal');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'premiumLockModal';
    modal.className = 'premium-lock-modal';
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
      <div class="premium-lock-dialog" role="dialog" aria-modal="true" aria-labelledby="premiumLockTitle">
        <div class="lock-kicker">PREMIUM</div>
        <h2 id="premiumLockTitle">この機能は有料プランで利用できます。</h2>
        <p>基本的な計算・検索機能は無料で使えます。こちらは、必要なときだけ使える拡張機能です。</p>
        <div class="premium-lock-actions">
          <button type="button" id="premiumLockClose">閉じる</button>
          <a class="primary" href="plans.html#premium-preview">料金プランを見る →</a>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    };

    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal();
    });

    modal.querySelector('#premiumLockClose').addEventListener('click', closeModal);

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeModal();
    });
  }

  lockedTools.forEach(tool => {
    tool.addEventListener('click', event => {
      event.preventDefault();
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    });
  });
}

// ========================================
// フッターの連絡先を設定
// ========================================

function installContactLinks() {
  const xLink = document.getElementById('footerXLink');
  const emailLink = document.getElementById('footerMailLink');

  if (xLink && ARCHLAB_CONTACT.x) {
    xLink.href = ARCHLAB_CONTACT.x;
    xLink.textContent = 'Xを開く';
    xLink.title = ARCHLAB_CONTACT.x;
    xLink.target = '_blank';
    xLink.rel = 'noopener noreferrer';
  }

  if (emailLink && ARCHLAB_CONTACT.email) {
    emailLink.href = `mailto:${ARCHLAB_CONTACT.email}`;
    emailLink.textContent = ARCHLAB_CONTACT.email;
  }
}

// ========================================
// 共有・印刷・表示設定
// ========================================

function installPageActions() {
  const heading = document.querySelector('.page-heading');
  if (!heading || document.querySelector('.page-actions')) return;

  const actions = document.createElement('div');
  actions.className = 'page-actions';
  actions.innerHTML = `
    <button type="button" class="page-action-button" data-page-share>このページを共有</button>
    <button type="button" class="page-action-button" data-page-print>印刷する</button>
    <button type="button" class="page-action-button" data-theme-toggle>表示を切り替える</button>
  `;
  heading.appendChild(actions);

  actions.querySelector('[data-page-share]').addEventListener('click', async () => {
    const shareData = { title: document.title, url: location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(location.href);
        actions.querySelector('[data-page-share]').textContent = 'URLをコピーしました';
        setTimeout(() => {
          actions.querySelector('[data-page-share]').textContent = 'このページを共有';
        }, 1400);
      }
    } catch {
      // キャンセル時は何もしません。
    }
  });

  actions.querySelector('[data-page-print]').addEventListener('click', () => window.print());

  actions.querySelector('[data-theme-toggle]').addEventListener('click', () => {
    document.documentElement.classList.toggle('node-dim');
    localStorage.setItem('archnode:dim', document.documentElement.classList.contains('node-dim') ? '1' : '0');
  });
}

function restoreDisplaySetting() {
  if (localStorage.getItem('archnode:dim') === '1') {
    document.documentElement.classList.add('node-dim');
  }
}

function installFavoriteManager() {
  const dashboard = document.querySelector('.node-dashboard');
  if (!dashboard || document.getElementById('clearFavoritesButton')) return;

  const favoritePanel = dashboard.querySelector('.node-dashboard-panel');
  if (!favoritePanel) return;

  const clearButton = document.createElement('button');
  clearButton.id = 'clearFavoritesButton';
  clearButton.type = 'button';
  clearButton.className = 'text-button';
  clearButton.textContent = 'お気に入りを整理';
  favoritePanel.querySelector('.node-panel-head')?.appendChild(clearButton);

  clearButton.addEventListener('click', () => {
    if (!confirm('お気に入りをすべて削除しますか？')) return;
    saveList(NODE_STORAGE.favorites, []);
    refreshFavoriteUI();
  });
}

function installToolGuide() {
  const heading = document.querySelector('.page-heading');
  if (!heading || document.querySelector('.node-use-guide')) return;

  const page = location.pathname.split('/').pop() || 'index.html';
  const guides = {
    'scale.html': ['こんなときに', '1/100の図面で3.5cmは実寸で何m？というときに。', '計算例', '3.5cm × 100 = 350cm = 3.5m'],
    'calculator.html': ['こんなときに', '面積・体積・坪・建ぺい率などをまとめて確認したいときに。', '使い方', '入力 → 計算 → 結果をコピー。'],
    'law.html': ['見る前に', '法令の入口として使い、最終判断は最新の法令・条例・行政窓口で確認してください。', '探し方', '目的に近い項目を選ぶか、キーワードで検索。'],
    'materials.html': ['こんなときに', '建築パースや資料づくりで、素材の方向性を探したいときに。', '探し方', '素材名や色、質感などの言葉で探します。']
  };

  const guide = guides[page];
  if (!guide) return;

  const box = document.createElement('section');
  box.className = 'node-use-guide';
  box.innerHTML = `<div><span class="section-label">QUICK GUIDE</span><h2>${guide[0]}</h2><p>${guide[1]}</p></div><div><span class="section-label">${guide[2]}</span><p>${guide[3]}</p></div>`;
  heading.insertAdjacentElement('afterend', box);
}

// ========================================
// ページ読み込み後に共通処理を開始
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // フッターのバージョン・更新日
  document.querySelectorAll('[data-site-version]').forEach(element => {
    element.textContent = ARCHLAB_META.version;
  });

  document.querySelectorAll('[data-site-updated]').forEach(element => {
    element.textContent = ARCHLAB_META.updated;
  });

  installContactLinks();
  restoreDisplaySetting();
  installPageActions();
  installFavoriteManager();
  installToolGuide();
  installDashboardSearch();
  installSearchShortcut();
  installCopyButtons();
  installPresetButtons();
  installRecentTracking();
  installPremiumLocks();
  addFavoriteControls();
  renderNodeDashboard();
  installSearchObserver();
});

// ========================================
// v3.17 追加機能
// ========================================

const NODE_STORAGE_V2 = {
  saved: 'archnode:saved-calculations:v1',
  shortcuts: 'archnode:shortcuts:v1'
};

function currentPageName() {
  return location.pathname.split('/').pop() || 'index.html';
}

function getPageTitle() {
  return document.title.split('｜')[0].trim();
}

// --- 計算内容の保存 ---
function saveCurrentInputs() {
  const inputs = [...document.querySelectorAll('input, select, textarea')]
    .filter(el => el.id && !['file','button','submit'].includes(el.type));
  const values = {};
  inputs.forEach(el => { values[el.id] = el.value; });
  if (!Object.keys(values).length) {
    alert('保存できる入力項目がありません。');
    return;
  }

  const saved = loadList(NODE_STORAGE_V2.saved);
  saved.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    page: currentPageName(),
    title: getPageTitle(),
    values,
    savedAt: new Date().toISOString()
  });
  saveList(NODE_STORAGE_V2.saved, saved.slice(0, 20));
  showToast('計算内容を保存しました');
}

function restoreSavedCalculation(item) {
  if (!item || item.page !== currentPageName()) return;
  Object.entries(item.values || {}).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
  showToast('保存した入力を戻しました。必要ならもう一度「計算」してください。');
}

function showToast(message) {
  let toast = document.getElementById('nodeToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'nodeToast';
    toast.className = 'node-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
}

// --- ツール比較 ---
function installToolCompare() {
  const buttons = document.querySelectorAll('[data-compare-tool]');
  if (!buttons.length) return;
  const selected = new Set();
  const panel = document.createElement('div');
  panel.className = 'compare-bar';
  panel.innerHTML = '<span>比較：</span><strong>0</strong><button type="button">比較する</button><button type="button" class="secondary">解除</button>';
  document.body.appendChild(panel);
  const count = panel.querySelector('strong');

  const refresh = () => {
    count.textContent = selected.size;
    panel.classList.toggle('is-visible', selected.size > 0);
    buttons.forEach(btn => btn.classList.toggle('is-selected', selected.has(btn.dataset.compareTool)));
  };
  buttons.forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.compareTool;
    if (selected.has(id)) selected.delete(id); else if (selected.size < 3) selected.add(id);
    refresh();
  }));
  panel.querySelector('button:not(.secondary)').addEventListener('click', () => {
    if (selected.size < 2) { showToast('2つ以上選んでください'); return; }
    const names = [...selected].join(' vs ');
    showToast(`比較: ${names}`);
  });
  panel.querySelector('.secondary').addEventListener('click', () => { selected.clear(); refresh(); });
}

// --- 単位の軽い補助 ---
function installUnitHints() {
  document.querySelectorAll('input[type="number"]').forEach(input => {
    if (!input.placeholder || input.dataset.unitHintReady === '1') return;
    input.dataset.unitHintReady = '1';
    input.addEventListener('blur', () => {
      const v = Number(input.value);
      if (!Number.isFinite(v) || v <= 0) return;
      const label = input.closest('div')?.querySelector('label')?.textContent || '';
      const hint = label.includes('mm') && v >= 1000 ? `約 ${(v/1000).toFixed(2)}m` : (label.includes('m') && !label.includes('mm') && v >= 100 ? `単位を確認してください（${v}m？）` : '');
      if (!hint) return;
      let el = input.parentElement.querySelector('.unit-hint');
      if (!el) { el=document.createElement('small'); el.className='unit-hint'; input.insertAdjacentElement('afterend',el); }
      el.textContent = hint;
    });
  });
}

// --- 結果の根拠・式を残す ---
function installCalculationNotes() {
  document.querySelectorAll('.result').forEach(result => {
    if (result.dataset.noteReady === '1') return;
    result.dataset.noteReady = '1';
    const note = document.createElement('details');
    note.className = 'calculation-note';
    note.innerHTML = '<summary>計算の考え方</summary><p>入力値からサイト内の式で計算しています。法令・安全性・施工条件を含む正式な設計判断ではありません。</p>';
    result.insertAdjacentElement('afterend', note);
  });
}

// --- マイページ用パネル ---
function installMyPageSummary() {
  const box = document.getElementById('savedCalculations');
  if (!box) return;
  const saved = loadList(NODE_STORAGE_V2.saved);
  if (!saved.length) {
    box.innerHTML = '<p class="node-empty">保存した計算はまだありません。</p>';
    return;
  }
  box.innerHTML = saved.slice(0,10).map(item => `<article class="saved-card"><div><span>${item.title}</span><small>${new Date(item.savedAt).toLocaleString('ja-JP')}</small></div><button type="button" data-restore="${item.id}">開く</button></article>`).join('');
  box.querySelectorAll('[data-restore]').forEach(btn => btn.addEventListener('click', () => {
    const item = saved.find(x => x.id === btn.dataset.restore);
    if (!item) return;
    location.href = `${item.page}?restore=${encodeURIComponent(item.id)}`;
  }));
}

// --- 履歴検索・保存の共通ボタン ---
function installSaveCurrentButton() {
  if (!document.querySelector('.page-heading')) return;
  if (document.querySelector('[data-save-current]')) return;
  const action = document.createElement('button');
  action.type='button';
  action.className='page-action-button';
  action.dataset.saveCurrent='1';
  action.textContent='入力を保存';
  action.addEventListener('click', saveCurrentInputs);
  const actions = document.querySelector('.page-actions');
  if (actions) actions.appendChild(action);
}

function restoreFromUrl() {
  const id = new URLSearchParams(location.search).get('restore');
  if (!id) return;
  const item = loadList(NODE_STORAGE_V2.saved).find(x => x.id === id);
  if (item) restoreSavedCalculation(item);
}

function installHistorySearch() {
  const input = document.getElementById('historySearchInput');
  const box = document.getElementById('historySearchResults');
  if (!input || !box) return;
  const recent = loadList(NODE_STORAGE.recent);
  const saved = loadList(NODE_STORAGE_V2.saved);
  function render() {
    const q = input.value.trim().toLowerCase();
    const rows = [...recent.map(x => ({title: TOOL_META[x.url]?.title || x.url, url:x.url, time:x.time})), ...saved.map(x => ({title:x.title,url:x.page,time:x.savedAt}))]
      .filter(x => !q || x.title.toLowerCase().includes(q) || x.url.toLowerCase().includes(q));
    box.innerHTML = rows.slice(0,20).map(x => `<a class="history-row" href="${x.url}"><strong>${x.title}</strong><small>${new Date(x.time).toLocaleString('ja-JP')}</small></a>`).join('') || '<p class="node-empty">見つかりませんでした。</p>';
  }
  input.addEventListener('input', render); render();
}

// --- CSV / JSONの簡易ダウンロード ---
function installExportButtons() {
  document.querySelectorAll('[data-export-values]').forEach(btn => {
    btn.addEventListener('click', () => {
      const data = {};
      document.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => { if (el.value) data[el.id] = el.value; });
      const csv = Object.entries(data).map(([k,v]) => `${JSON.stringify(k)},${JSON.stringify(v)}`).join('\n');
      const blob = new Blob([`項目,値\n${csv}`], {type:'text/csv;charset=utf-8'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${currentPageName().replace('.html','')}-data.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  });
}

// --- フィードバック導線 ---
function installFeedbackLink() {
  document.querySelectorAll('[data-feedback]').forEach(link => {
    link.addEventListener('click', () => {
      const subject = encodeURIComponent('建築ノード フィードバック');
      const body = encodeURIComponent('改善してほしいところ：\n\n欲しい機能：\n\n利用したページ：' + currentPageName());
      if (ARCHLAB_CONTACT.email) link.href = `mailto:${ARCHLAB_CONTACT.email}?subject=${subject}&body=${body}`;
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  installToolCompare();
  installUnitHints();
  installCalculationNotes();
  installSaveCurrentButton();
  installMyPageSummary();
  restoreFromUrl();
  installHistorySearch();
  installExportButtons();
  installFeedbackLink();
});

// v3.17b: 保存した入力をURLから戻す + 結果画像 + 比較UIの補完
function encodeState(values) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(values)))); } catch { return ''; }
}
function decodeState(value) {
  try { return JSON.parse(decodeURIComponent(escape(atob(value)))); } catch { return null; }
}
function getCurrentInputState() {
  const values = {};
  document.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
    if (el.type !== 'file') values[el.id] = el.value;
  });
  return values;
}
function restoreInputStateFromUrl() {
  const raw = new URLSearchParams(location.search).get('state');
  if (!raw) return;
  const values = decodeState(raw);
  if (!values) return;
  Object.entries(values).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
}
function makeShareUrl() {
  const url = new URL(location.href);
  const state = encodeState(getCurrentInputState());
  if (state) url.searchParams.set('state', state);
  return url.toString();
}
function installEnhancedShare() {
  const button = document.querySelector('[data-page-share]');
  if (!button || button.dataset.enhanced === '1') return;
  button.dataset.enhanced = '1';
  button.addEventListener('click', async () => {
    const url = makeShareUrl();
    try {
      if (navigator.share) await navigator.share({ title: document.title, url });
      else {
        await navigator.clipboard.writeText(url);
        button.textContent = '入力付きURLをコピーしました';
        setTimeout(() => button.textContent = 'このページを共有', 1600);
      }
    } catch {}
  });
}
function installResultImageButtons() {
  document.querySelectorAll('.result').forEach(result => {
    if (result.dataset.imageReady === '1') return;
    result.dataset.imageReady = '1';
    const btn = document.createElement('button');
    btn.type='button'; btn.className='result-copy'; btn.textContent='結果を画像で保存';
    btn.addEventListener('click', () => {
      const text = result.innerText.trim();
      if (!text || text === '—') return;
      const canvas=document.createElement('canvas'); canvas.width=1200; canvas.height=520;
      const ctx=canvas.getContext('2d');
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='#111'; ctx.font='700 30px Arial'; ctx.fillText('建築ノード / 結果',50,70);
      ctx.font='22px Arial';
      String(text).split(/\n/).slice(0,10).forEach((line,i)=>ctx.fillText(line.replace(/<[^>]+>/g,''),50,130+i*34));
      const a=document.createElement('a'); a.href=canvas.toDataURL('image/png'); a.download='architect-node-result.png'; a.click();
    });
    const actions=result.parentElement.querySelector('.result-actions');
    (actions||result).appendChild(btn);
  });
}
function installCompareButtons() {
  const cards=[...document.querySelectorAll('.feature-tool')].filter(c => !c.classList.contains('premium-locked-item'));
  cards.forEach((card,i)=>{
    if(card.querySelector('[data-compare-toggle]')) return;
    const title=card.querySelector('h2,h3')?.textContent.trim() || `ツール${i+1}`;
    const btn=document.createElement('button'); btn.type='button'; btn.className='compare-toggle'; btn.dataset.compareToggle=title; btn.textContent='比較に追加';
    btn.addEventListener('click',()=>{
      const current=new Set(JSON.parse(localStorage.getItem('archnode:compare:v1')||'[]'));
      if(current.has(title)) current.delete(title); else if(current.size<3) current.add(title); else { showToast('比較は3つまでです'); return; }
      localStorage.setItem('archnode:compare:v1',JSON.stringify([...current]));
      btn.classList.toggle('is-selected',current.has(title)); btn.textContent=current.has(title)?'比較から外す':'比較に追加';
      refreshCompareDock();
    });
    card.insertBefore(btn, card.firstChild?.nextSibling || card.firstChild);
  });
  refreshCompareDock();
}
function refreshCompareDock(){
  const selected=JSON.parse(localStorage.getItem('archnode:compare:v1')||'[]');
  let dock=document.getElementById('nodeCompareDock');
  if(!dock){dock=document.createElement('div');dock.id='nodeCompareDock';dock.className='compare-dock';document.body.appendChild(dock);}
  dock.innerHTML=selected.length?`<span>比較中 ${selected.length}</span><span class="compare-dock-names">${selected.map(x=>x.replace(/</g,'&lt;')).join(' / ')}</span><button type="button" id="clearCompare">解除</button>`:'';
  if(dock.innerHTML) dock.querySelector('#clearCompare').onclick=()=>{localStorage.removeItem('archnode:compare:v1');installCompareButtons();refreshCompareDock();};
}

// Restore and enhance page action share after the first common installer runs.
document.addEventListener('DOMContentLoaded', () => {
  restoreInputStateFromUrl();
  installEnhancedShare();
  installResultImageButtons();
});


// v3.44: ページトップへ戻る
(function installBackToTop(){
  const button = document.getElementById('backToTop');
  if (!button) return;
  const update = () => button.classList.toggle('is-visible', window.scrollY > 420);
  window.addEventListener('scroll', update, { passive:true });
  update();
  button.addEventListener('click', () => {
    window.scrollTo({ top:0, behavior:'smooth' });
  });
})();

/* ============================================================
   ここから下は、以前別ファイルだったページ専用コードです。
   ------------------------------------------------------------
   初心者の方は、通常ここを編集する必要はありません。
   いまは script.js にまとめてありますが、元コードは
   legacy/ フォルダにも保存してあります。
   ============================================================ */

/* ------------------------------
   calculator.js の内容
   ------------------------------ */
/*
 * 建築ノード 建築計算用スクリプト
 *
 * calculator.html の計算処理をここにまとめています。
 * HTML側の id と同じ名前を使っているので、どの入力を読んでいるか追いやすくしています。
 */

const $=id=>document.getElementById(id);
const n=id=>Number($(id).value);
const fmt=x=>Number.isFinite(x)?x.toLocaleString('ja-JP',{maximumFractionDigits:3}):'—';
const valid=(...v)=>v.every(x=>Number.isFinite(x)&&x>=0);
function calcArea(){const w=n('areaW'),d=n('areaD');if(!valid(w,d)||w===0||d===0){$('areaResult').textContent='幅と奥行を入力してください。';return;}$('areaResult').innerHTML=`<span class="big">${fmt(w*d)} m²</span><br>＝ ${fmt(w*d*10000)} cm²`}
function calcVolume(){const w=n('volW'),d=n('volD'),h=n('volH');if(!valid(w,d,h)||w===0||d===0||h===0){$('volResult').textContent='幅・奥行・高さを入力してください。';return;}const v=w*d*h;$('volResult').innerHTML=`<span class="big">${fmt(v)} m³</span><br>＝ ${fmt(v*1000)} L`}
function calcTsubo(){const a=n('areaTsubo');if(!Number.isFinite(a)||a<0){$('tsuboResult').textContent='面積を入力してください。';return;}$('tsuboResult').innerHTML=`<span class="big">約 ${fmt(a/3.305785)} 坪</span><br>1坪 ≒ 3.305785 m²`}
function calcRates(){const s=n('siteArea'),b=n('buildingArea'),t=n('totalArea'),bl=n('buildingLimit'),fl=n('floorLimit');if(!valid(s,b,t)||s<=0||b<0||t<0){$('ratesResult').textContent='敷地・建築・延べ面積を正しく入力してください。';return;}const c=b/s*100,v=t/s*100;let msg=`<span class="big">建ぺい率 ${fmt(c)} %</span><br><span class="big">容積率 ${fmt(v)} %</span>`;if(b>s||t<s)msg+=`<br><span class="warn">入力値の関係を確認してください。建築面積が敷地面積を超えていないか、延べ面積が敷地面積より極端に小さくなっていないか確認します。</span>`;if(Number.isFinite(bl)&&bl>0)msg+=`<br>指定建ぺい率 ${fmt(bl)} % → <span class="${c<=bl?'ok':'warn'}">${c<=bl?'上限以内':'上限超過'}</span>`;if(Number.isFinite(fl)&&fl>0)msg+=`<br>指定容積率 ${fmt(fl)} % → <span class="${v<=fl?'ok':'warn'}">${v<=fl?'上限以内':'上限超過'}</span>`;$('ratesResult').innerHTML=msg}
function calcStair(){const h=n('floorHeight'),target=n('riserInput'),t=n('treadInput');if(!valid(h,target,t)||h<=0||target<=0||t<=0){$('stairResult').textContent='階高・目標蹴上・踏面を正しく入力してください。';return;}const standards={other:{riser:220,tread:210,width:750,label:'一般（上記以外）'},housing:{riser:230,tread:150,width:750,label:'住宅の住戸内'},large:{riser:200,tread:240,width:1200,label:'多数の者が利用・大規模用途等'},school:{riser:180,tread:260,width:1400,label:'学校・劇場・集会場等'},elementary:{riser:160,tread:260,width:1400,label:'小学校の児童用'}};const st=standards[$('stairType').value];const steps=Math.max(1,Math.round(h/target));const r=h/steps;const treadCount=Math.max(steps-1,0);const run=treadCount*t;const comfort=2*r+t;const slope=r/t;const riserOK=r<=st.riser;const treadOK=t>=st.tread;const comfortOK=comfort>=550&&comfort<=650;let status=`<br>2R+T：${fmt(comfort)} mm → <span class="${comfortOK?'ok':'warn'}">${comfortOK?'550〜650mmの範囲':'範囲外'}</span>`;$('stairResult').innerHTML=`段数：<span class="big">${steps} 段</span><br>実際の蹴上：${fmt(r)} mm → <span class="${riserOK?'ok':'warn'}">${riserOK?'代表基準以内':'代表基準超過'}</span><br>踏面：${fmt(t)} mm → <span class="${treadOK?'ok':'warn'}">${treadOK?'代表基準以上':'代表基準未満'}</span><br>踏面数（直階段の簡易計算）：${treadCount} 段<br>水平距離：約 ${fmt(run)} mm<br>勾配：${fmt(slope)}（蹴上÷踏面）${status}<br><span class="hint">選択区分の代表値：蹴上 ${st.riser}mm以下・踏面 ${st.tread}mm以上・幅 ${st.width}mm以上。幅は未入力なので判定していません。用途の適用条件や踊場等は別途確認してください。</span>`}
function calcDaylight(){const w=n('windowArea'),f=n('floorArea'),target=n('daylightTarget');if(!valid(w,f,target)||f<=0){$('daylightResult').textContent='開口面積・床面積を正しく入力してください。';return;}const ratio=w/f*100,need=f*target/100,ok=ratio>=target;const targetLabel=target<11?'1/10（10%）':'1/7（約14.29%）';$('daylightResult').innerHTML=`開口面積比：<span class="big">${fmt(ratio)} %</span><br>比較基準：${targetLabel}<br>必要な開口面積：${fmt(need)} m²<br><span class="${ok?'ok':'warn'}">${ok?'選択した比率以上です。':'選択した比率未満です。'}</span>`}
function calcShadow(){const h=n('shadowHeight'),a=n('solarAltitude');if(!Number.isFinite(h)||h<=0||!Number.isFinite(a)||a<=0||a>=90){$('shadowResult').textContent='建物高さと0〜90°の太陽高度を入力してください。';return;}const len=h/Math.tan(a*Math.PI/180);$('shadowResult').innerHTML=`影の長さ：<span class="big">約 ${fmt(len)} m</span>`}
const dimensions=[
['廊下','計画幅','動線','用途・避難・バリアフリー条件で決定','固定値ではなく、用途・人数・避難経路・バリアフリー条件から有効幅を決めます。','廊下 通路 動線'],
['階段','蹴上・踏面・幅','階段','代表値：75 / 120 / 140cmなど用途別に確認','建築基準法施行令23条などで階段の種類に応じた基準があります。用途を先に決めてから確認します。','階段 蹴上 踏面 幅'],
['ドア','有効開口・扉軌跡','建具','有効開口幅＋扉の開閉範囲','家具搬入・避難・車いす利用を考え、開き戸の回転半径や引き戸の通行上有効な幅も図面で確認します。','ドア 扉 建具 開口'],
['駐車場','車室・通路・切り返し','車','車種に合わせて設定','車幅だけで決めず、乗降・前面道路・切り返し・壁との離隔まで含めて計画します。','駐車場 車 車室'],
['バリアフリー','有効幅・回転・段差','動線','用途・条例・経路条件で確認','移動等円滑化経路などの対象では、廊下・出入口・段差・手すり等に具体的な基準があります。用途と適用法令を確認します。','バリアフリー 車いす 回転'],
['天井高さ','仕上げ面からの高さ','室内','構造・設備・用途から決定','梁せい、設備、照明、換気、建具との干渉を確認し、必要な天井ふところも検討します。','天井 高さ 梁 設備'],
['柱スパン','柱間の距離','構造','用途・構造形式から設定','構造安全性だけでなく、梁せい、設備、部屋の使い方、駐車計画とのバランスで決めます。','スパン 柱 構造'],
['家具搬入','通過寸法・曲がり角','車','最大寸法＋経路の余裕','入口だけでなく、廊下・扉・階段・エレベーター・曲がり角を連続して確認します。','家具 搬入 廊下'],
['洗面・トイレ','設備寸法・動作範囲','水回り','設備＋人の動き＋扉の開閉','便器・洗面器の寸法だけでなく、立ち座り・介助・扉の軌跡を重ねて計画します。','トイレ 洗面 水回り']
];
let dimensionFilter='all';
function renderDimensions(){const q=$('dimensionQuery').value.trim().toLowerCase();const hits=dimensions.filter(x=>{const text=(x[0]+' '+x[1]+' '+x[2]+' '+x[3]+' '+x[4]+' '+x[5]).toLowerCase();const matchesQuery=!q||text.includes(q);const matchesFilter=dimensionFilter==='all'||x[2]===dimensionFilter||x[5].includes(dimensionFilter);return matchesQuery&&matchesFilter});$('dimensionResult').innerHTML=hits.map(x=>`<article class="dimension-card"><div class="dimension-card-top"><span class="dimension-category">${x[2]}</span><span class="dimension-arrow">↗</span></div><h3>${x[0]}</h3><div class="dimension-value"><span>${x[1]}</span><strong>${x[3]}</strong></div><p>${x[4]}</p><details><summary>考え方を見る</summary><div class="detail-text">${x[4]}</div></details></article>`).join('')||'<div class="dimension-empty">該当する項目がありません。キーワードや分類を変えてください。</div>'}
function searchDimensions(){renderDimensions()}
function filterDimensions(filter,button){dimensionFilter=filter;document.querySelectorAll('.dimension-filter').forEach(b=>b.classList.remove('active'));button.classList.add('active');renderDimensions()}

const terms={
'スパン':'柱・壁などの支点間の距離。構造計画でよく使います。','梁':'床や屋根などからの荷重を支える横架材。','GL':'Ground Level。地盤面の基準を示す記号として使われます。','FL':'Floor Level。床の高さ・仕上げ面の基準を示す記号として使われます。','SL':'Slab Level。スラブの高さを示す記号として使われます。','RC':'Reinforced Concrete。鉄筋コンクリート造。','S造':'Steel。鉄骨造。','SRC造':'Steel Reinforced Concrete。鉄骨鉄筋コンクリート造。','耐力壁':'地震・風などの水平力に抵抗するための壁。','矩計図':'建物の断面、高さ、納まりなどを詳しく示す図面。','建ぺい率':'敷地面積に対する建築面積の割合。','容積率':'敷地面積に対する延べ面積の割合。','PS':'パイプスペース。給排水などの配管スペース。','EPS':'電気設備などの配線・配管スペースとして使われる区画。'};
function searchTerms(){const q=$('termQuery').value.trim().toLowerCase();const hits=Object.entries(terms).filter(([k,v])=>(k+' '+v).toLowerCase().includes(q));$('termResult').innerHTML=hits.map(([k,v])=>`<div class="term-item"><strong>${k}</strong>${v}</div>`).join('')||'<div class="term-item">該当する用語がありません。</div>'}
function convertUnit(){const v=n('unitValue');if(!Number.isFinite(v)){ $('unitResult').textContent='数値を入力してください。';return;}const m=$('unitMode').value;const map={'mm-cm':[v/10,'cm'],'cm-mm':[v*10,'mm'],'cm-m':[v/100,'m'],'m-cm':[v*100,'cm'],'m-mm':[v*1000,'mm'],'mm-m':[v/1000,'m'],'m2-tsubo':[v/3.305785,'坪'],'tsubo-m2':[v*3.305785,'m²'],'m3-l':[v*1000,'L'],'l-m3':[v/1000,'m³']};const r=map[m];$('unitResult').innerHTML=`<span class="big">${fmt(r[0])} ${r[1]}</span>`}
if(document.getElementById('dimensionQuery')){searchDimensions();searchTerms();}
['areaW','areaD'].forEach(id=>$(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')calcArea()}));
['volW','volD','volH'].forEach(id=>$(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')calcVolume()}));
['siteArea','buildingArea','totalArea','buildingLimit','floorLimit'].forEach(id=>$(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')calcRates()}));

/* ------------------------------
   scale.js の内容
   ------------------------------ */
/*
 * 建築ノード 縮尺計算
 *
 * 実寸と図面上の寸法を、選択した縮尺から相互変換します。
 */
document.addEventListener('DOMContentLoaded', () => {
  const calcButton = document.getElementById('calc');
  const valueInput = document.getElementById('value');
  const scaleInput = document.getElementById('scale');
  const modeInput = document.getElementById('mode');
  const result = document.getElementById('result');

  if (!calcButton || !valueInput || !scaleInput || !modeInput || !result) return;

  function calculateScale() {
    const value = Number(valueInput.value);
    const scale = Number(scaleInput.value);

    if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(scale) || scale <= 0) {
      result.textContent = '長さを入力してください。';
      return;
    }

    const converted = modeInput.value === 'realToDrawing' ? value / scale : value * scale;
    result.textContent = `結果：${converted.toLocaleString('ja-JP', { maximumFractionDigits: 3 })} mm`;
  }

  calcButton.addEventListener('click', calculateScale);
  [valueInput, scaleInput, modeInput].forEach(input => {
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') calculateScale();
    });
  });
});

/* ------------------------------
   tools.js の内容
   ------------------------------ */
/*
 * 建築ノード TOOLBOX 用スクリプト
 *
 * ここでは、TOOLBOX の
 *  1. 目的別絞り込み
 *  2. 各ミニ計算
 *  3. 図面画像の簡易寸法換算
 * をまとめています。
 *
 * HTML側の id と同じ名前を使っているので、
 * 入力欄を変えたいときは tools.html を探してください。
 */

// ==============================
// 小さな共通関数
// ==============================
const get = (id) => document.getElementById(id);
const number = (id) => Number(get(id)?.value);

function setResult(id, html) {
  const target = get(id);
  if (target) target.innerHTML = html;
}

function setText(id, text) {
  const target = get(id);
  if (target) target.textContent = text;
}

function validPositive(...values) {
  return values.every((value) => Number.isFinite(value) && value > 0);
}

function validNonNegative(...values) {
  return values.every((value) => Number.isFinite(value) && value >= 0);
}

// ==============================
// 1. 目的別フィルター
// ==============================
function getToolPurpose(item) {
  return (item.dataset.purpose || '')
    .split(/\s+/)
    .filter(Boolean);
}

function setupPurposeFilter() {
  const buttons = [...document.querySelectorAll('.purpose-tab')];
  const items = [...document.querySelectorAll('.feature-tool[data-purpose], .premium-locked-item[data-purpose]')];
  const sections = [...document.querySelectorAll('.node-tool-category')];
  const countBox = get('toolboxFilterCount');

  function applyFilter(purpose, updateUrl = true) {
    let visibleCount = 0;

    items.forEach((item) => {
      const visible = purpose === 'all' || getToolPurpose(item).includes(purpose);
      item.classList.toggle('purpose-filter-hidden', !visible);
      item.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (visible) visibleCount += 1;
    });

    sections.forEach((section) => {
      const sectionItems = [...section.querySelectorAll('[data-purpose]')]
        .filter((item) => !item.classList.contains('purpose-tab'));
      if (!sectionItems.length) return;
      const hasVisible = sectionItems.some(
        (item) => !item.classList.contains('purpose-filter-hidden')
      );
      section.classList.toggle('purpose-section-hidden', !hasVisible);
    });

    buttons.forEach((button) => {
      const active = button.dataset.purpose === purpose;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    if (countBox) {
      countBox.textContent = `${visibleCount}個の道具`;
    }

    if (updateUrl) {
      const url = new URL(window.location.href);
      if (purpose === 'all') url.searchParams.delete('purpose');
      else url.searchParams.set('purpose', purpose);
      history.replaceState(null, '', url);
    }
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      applyFilter(button.dataset.purpose || 'all');
    });
  });

  const initial = new URLSearchParams(window.location.search).get('purpose');
  const allowed = ['home', 'room', 'diy', 'arch'];
  applyFilter(allowed.includes(initial) ? initial : 'all', false);
}

// ==============================
// 2. ミニ計算
// ==============================
function calcRoomSize() {
  const w = number('roomW');
  const d = number('roomD');
  if (!validPositive(w, d)) return setText('roomResult', '幅と奥行を入力してください。');
  const area = w * d;
  setResult('roomResult', `<strong>${area.toFixed(2)} m²</strong><br>約 ${(area / 1.62).toFixed(1)} 畳 / 約 ${(area / 3.305785).toFixed(1)} 坪`);
}

function calcHomePlanning() {
  const site = number('homeSite');
  const buildingRate = number('homeB');
  const floorRate = number('homeF');
  const floors = number('homeFloors');
  if (!validPositive(site, buildingRate, floorRate, floors)) {
    return setText('homeResult', '敷地・率・階数を入力してください。');
  }
  const buildingArea = site * buildingRate / 100;
  const totalArea = site * floorRate / 100;
  setResult('homeResult', `建築面積の上限目安：<strong>${buildingArea.toFixed(2)} m²</strong><br>延べ面積の上限目安：<strong>${totalArea.toFixed(2)} m²</strong><br>1階あたり平均：${(totalArea / floors).toFixed(2)} m²`);
}

function calcMaterialQuantity() {
  const w = number('matW');
  const d = number('matD');
  const waste = number('matWaste');
  const unit = number('matUnit');
  if (!validPositive(w, d, unit) || !validNonNegative(waste)) {
    return setText('matResult', '幅・長さ・1単位の面積を正しく入力してください。');
  }
  const area = w * d;
  const total = area * (1 + waste / 100);
  const units = Math.ceil(total / unit);
  setResult('matResult', `必要面積：<strong>${total.toFixed(2)} m²</strong><br>必要数量：<strong>${units} 単位</strong><br><small>余裕 ${waste}% を含む目安</small>`);
}

function calcSlope() {
  const rise = number('slopeRise');
  const run = number('slopeRun');
  if (!validPositive(rise, run)) return setText('slopeResult', '高さと水平距離を入力してください。');
  const ratio = rise / run;
  const degrees = Math.atan2(rise, run) * 180 / Math.PI;
  setResult('slopeResult', `勾配：<strong>${(ratio * 100).toFixed(2)}%</strong><br>角度：<strong>${degrees.toFixed(2)}°</strong><br>比：1 : ${(run / rise).toFixed(2)}`);
}

function calcSun() {
  const h = number('sunH');
  const a = number('sunA');
  if (!validPositive(h, a) || a >= 90) return setText('sunResult', '建物高さと太陽高度を正しく入力してください。');
  const shadow = h / Math.tan(a * Math.PI / 180);
  setResult('sunResult', `影の長さ：<strong>約 ${shadow.toFixed(2)} m</strong>`);
}

function compareDimensions() {
  const a = number('dimA');
  const b = number('dimB');
  if (!validPositive(a, b)) return setText('dimCompareResult', '2つの寸法を入力してください。');
  const diff = Math.abs(a - b);
  const ratio = Math.max(a, b) / Math.min(a, b);
  setResult('dimCompareResult', `差：<strong>${diff.toFixed(0)} mm</strong><br>比率：約 <strong>${ratio.toFixed(2)} 倍</strong>`);
}

function calcCost() {
  const area = number('costArea');
  const unit = number('costUnit');
  const waste = number('costWaste');
  if (!validPositive(area, unit) || !validNonNegative(waste)) return setText('costResult', '面積と単価を入力してください。');
  const total = area * unit * (1 + waste / 100);
  setResult('costResult', `概算：<strong>${Math.round(total).toLocaleString('ja-JP')} 円</strong><br><small>予備率 ${waste}% を含む目安</small>`);
}

function calculateImageMeasure() {
  const known = number('measureKnown');
  const pixels = number('measurePixels');
  const target = number('measureTarget');
  if (!validPositive(known, pixels, target)) return setText('measureResult', '基準寸法・基準px・測定pxを入力してください。');
  const mmPerPx = known / pixels;
  const result = target * mmPerPx;
  setResult('measureResult', `測定寸法：<strong>約 ${result.toFixed(1)} mm</strong><br>1px ≒ ${mmPerPx.toFixed(3)} mm`);
}

function calcSound() {
  const db = number('soundDb');
  const distance = number('soundDistance');
  if (!validPositive(db, distance)) return setText('soundResult', '音源の大きさと距離を入力してください。');
  const estimate = db - 20 * Math.log10(distance);
  setResult('soundResult', `距離による目安：<strong>${estimate.toFixed(1)} dB</strong><br><small>反射・壁・建物条件を含まない簡易計算</small>`);
}

function calcLight() {
  const area = number('lightArea');
  const lux = number('lightLux');
  if (!validPositive(area, lux)) return setText('lightResult', '部屋の面積と目安照度を入力してください。');
  setResult('lightResult', `必要光束の目安：<strong>${Math.round(area * lux).toLocaleString('ja-JP')} lm</strong>`);
}

function calcOutlets() {
  const devices = number('outletDevices');
  const reserve = number('outletReserve');
  if (!validNonNegative(devices, reserve)) return setText('outletResult', '機器数と予備口数を入力してください。');
  setResult('outletResult', `必要口数の目安：<strong>${Math.ceil(devices + reserve)} 口</strong><br><small>同時使用や家電仕様も確認してください。</small>`);
}

function calcStorage() {
  const people = number('storagePeople');
  const perPerson = number('storagePer');
  if (!validPositive(people, perPerson)) return setText('storageResult', '人数と1人あたり収納量を入力してください。');
  setResult('storageResult', `収納量の目安：<strong>${(people * perPerson).toFixed(1)} m³</strong>`);
}

function calcCarry() {
  const item = number('carryItem');
  const route = number('carryRoute');
  if (!validPositive(item, route)) return setText('carryResult', '家具・家電の寸法と通路寸法を入力してください。');
  setResult('carryResult', item <= route ? '<strong>通過できる可能性があります。</strong><br><small>回転・分解・有効開口も確認してください。</small>' : '<strong>そのままでは厳しい可能性があります。</strong><br><small>向き・回転・分解も確認してください。</small>');
}

function calcOpening() {
  const wall = number('openWall');
  const opening = number('openWidth');
  if (!validPositive(wall) || !validNonNegative(opening) || opening > wall) return setText('openResult', '壁幅と開口幅を正しく入力してください。');
  setResult('openResult', `開口率：<strong>${(opening / wall * 100).toFixed(1)}%</strong><br><small>構造安全性を判定する機能ではありません。</small>`);
}

function calcParking() {
  const width = number('parkW');
  const length = number('parkL');
  if (!validPositive(width, length)) return setText('parkResult', '車幅と車長を入力してください。');
  setResult('parkResult', `目安スペース：<strong>${(width + 700).toFixed(0)} × ${(length + 1000).toFixed(0)} mm</strong><br><small>乗降・周辺条件で変わります。</small>`);
}

function calcGarden() {
  const a = number('gardenWA') * number('gardenDA');
  const b = number('gardenWB') * number('gardenDB');
  if (a <= 0) return setText('gardenResult', 'A区画の幅と奥行を入力してください。');
  setResult('gardenResult', `合計面積：<strong>${(a + Math.max(0, b)).toFixed(2)} m²</strong>`);
}

function calcMiniStair() {
  const height = number('stairH');
  const steps = number('stairN');
  const tread = number('stairT');
  if (!validPositive(height, steps, tread)) return setText('stairResult', '階高・段数・踏面を入力してください。');
  const riser = height / Math.round(steps);
  const run = tread * (Math.round(steps) - 1);
  setResult('stairResult', `蹴上げ：約 <strong>${riser.toFixed(0)} mm</strong><br>水平投影：約 <strong>${run.toFixed(0)} mm</strong><br>勾配：約 <strong>${(riser / tread * 100).toFixed(1)}%</strong>`);
}

function calcLevel() {
  const rise = number('levelRise');
  const run = number('levelRun');
  if (!validNonNegative(rise) || !validPositive(run)) return setText('levelResult', '高低差と距離を入力してください。');
  const percent = rise / run * 100;
  const angle = Math.atan2(rise, run) * 180 / Math.PI;
  setResult('levelResult', `勾配：<strong>${percent.toFixed(2)}%</strong><br>角度：約 <strong>${angle.toFixed(2)}°</strong>`);
}

function calcSun2() {
  const height = number('sun2H');
  const altitude = number('sun2A');
  const time = get('sun2Time')?.value || '';
  if (!validPositive(height, altitude) || altitude >= 90) return setText('sun2Result', '建物高さと太陽高度を入力してください。');
  const shadow = height / Math.tan(altitude * Math.PI / 180);
  setResult('sun2Result', `${time ? `<strong>${time}</strong> の目安：<br>` : ''}影の長さ：<strong>${shadow.toFixed(2)} m</strong>`);
}

function calcFeel() {
  const mm = number('feelMm');
  const base = number('feelBase');
  if (!validPositive(mm, base)) return setText('feelResult', '寸法と基準を入力してください。');
  setResult('feelResult', `約 <strong>${(mm / 1000).toFixed(2)} m</strong><br>基準の <strong>${(mm / base).toFixed(1)} 倍</strong>`);
}

function calcAzimuth() {
  const raw = number('azimuth');
  if (!Number.isFinite(raw)) return setText('azimuthResult', '角度を入力してください。');
  const angle = ((raw % 360) + 360) % 360;
  const directions = ['北', '北東', '東', '南東', '南', '南西', '西', '北西'];
  const direction = directions[Math.round(angle / 45) % 8];
  setResult('azimuthResult', `方位：<strong>${direction}</strong><br>角度：${angle.toFixed(0)}°`);
}

// ==============================
// 3. 画像プレビュー
// ==============================
function setupImagePreview() {
  const input = get('measureImage');
  const preview = get('measurePreview');
  if (!input || !preview) return;

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    preview.src = url;
    preview.hidden = false;
    preview.onload = () => URL.revokeObjectURL(url);
  });
}

// ==============================
// 4. ボタンとEnterキーを登録
// ==============================
function setupToolEvents() {
  const actions = {
    roomCalcBtn: calcRoomSize,
    homeCalcBtn: calcHomePlanning,
    matCalcBtn: calcMaterialQuantity,
    slopeCalcBtn: calcSlope,
    sunCalcBtn: calcSun,
    dimCompareBtn: compareDimensions,
    costCalcBtn: calcCost,
    measureCalcBtn: calculateImageMeasure,
    soundCalcBtn: calcSound,
    lightCalcBtn: calcLight,
    outletCalcBtn: calcOutlets,
    storageCalcBtn: calcStorage,
    carryCalcBtn: calcCarry,
    openCalcBtn: calcOpening,
    parkCalcBtn: calcParking,
    gardenCalcBtn: calcGarden,
    stairCalcBtn: calcMiniStair,
    levelCalcBtn: calcLevel,
    sun2CalcBtn: calcSun2,
    feelCalcBtn: calcFeel,
    azimuthCalcBtn: calcAzimuth
  };

  Object.entries(actions).forEach(([id, handler]) => {
    const button = get(id);
    if (!button) return;
    button.addEventListener('click', handler);

    const scope = button.closest('.mini-calc, .dimension-compare, .image-measure') || button.parentElement;
    scope?.querySelectorAll('input').forEach((input) => {
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          handler();
        }
      });
    });
  });
}

// ==============================
// 5. 起動
// ==============================
document.addEventListener('DOMContentLoaded', () => {
  setupPurposeFilter();
  setupToolEvents();
  setupImagePreview();
});


// ==============================
// 6. TOOLBOXページの共通操作
// ==============================
document.addEventListener('DOMContentLoaded', () => {
  // スマートフォン用メニュー
  const menuButton = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  if (menuButton && mainNav) {
    menuButton.addEventListener('click', () => {
      const open = mainNav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
  }

  // TOOLBOXだけ script.js を読み込まなくても連絡先を表示できるようにする
  const email = 'officialstudio480@gmail.com';
  const emailLink = document.getElementById('footerMailLink');
  if (emailLink) {
    emailLink.href = `mailto:${email}`;
    emailLink.textContent = email;
  }
});

// ========================================
// 利用人数表示
// - 初期値は約100人として表示
// - 1ブラウザにつき初回だけカウンターを1増やす
// - 実際のカウント取得ができたら、その値に100を足して表示
// ========================================
(function setupUsageCount(){
  const COUNTER_KEY = 'archnode-live-people-v1';
  const SEEN_KEY = 'archnode-live-counted-v1';
  const DISPLAY_OFFSET = 100;

  function render(value){
    const el = document.getElementById('usageCount');
    if (!el || !Number.isFinite(value)) return;
    const rounded = Math.max(100, Math.round(value / 10) * 10);
    el.textContent = `約${rounded}`;
  }

  async function loadCount(){
    const base = 'https://countapi.mileshilliard.com/api/v1';
    try {
      let url = `${base}/get/${encodeURIComponent(COUNTER_KEY)}`;
      if (!localStorage.getItem(SEEN_KEY)) {
        const resHit = await fetch(`${base}/hit/${encodeURIComponent(COUNTER_KEY)}`, { cache: 'no-store' });
        if (resHit.ok) {
          localStorage.setItem(SEEN_KEY, '1');
          const dataHit = await resHit.json();
          render(Number(dataHit.value) + DISPLAY_OFFSET);
          return;
        }
      }
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('count fetch failed');
      const data = await res.json();
      render(Number(data.value) + DISPLAY_OFFSET);
    } catch (error) {
      render(DISPLAY_OFFSET);
      console.warn('[建築ノード] 利用人数の取得に失敗しました。初期値を表示します。', error);
    }
  }

  document.addEventListener('DOMContentLoaded', loadCount);
})();
