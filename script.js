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
  x: '',
  email: 'officialstudio480@gmail.com'
};

const ARCHLAB_META = {
  version: 'v3.31',
  updated: '2026.09.04'
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
  'mypage.html': { title: 'マイページ', category: 'MY NODE', description: '保存・お気に入り・履歴をまとめて確認' }
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
    xLink.textContent = ARCHLAB_CONTACT.x
      .replace(/^https?:\/\/(www\.)?/, '')
      .replace(/\/$/, '');
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
// スマートフォン用メニュー
// ========================================
function installMobileMenu() {
  const menuButton = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  if (!menuButton || !mainNav || menuButton.dataset.menuReady === '1') return;

  menuButton.dataset.menuReady = '1';

  const setMenuState = (isOpen) => {
    mainNav.classList.toggle('open', isOpen);
    menuButton.classList.toggle('is-open', isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('menu-open', isOpen);
  };

  // ハンバーガーをタップして開閉
  menuButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuState(!mainNav.classList.contains('open'));
  });

  // メニュー内の通常リンクを押したら閉じる
  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuState(false));
  });

  // メニュー外をクリック・タップしたら閉じる
  document.addEventListener('click', (event) => {
    if (!mainNav.classList.contains('open')) return;
    if (mainNav.contains(event.target) || menuButton.contains(event.target)) return;
    setMenuState(false);
  });

  // Escでも閉じる
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenuState(false);
  });

  // 画面幅がPCへ戻ったら状態をリセット
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) setMenuState(false);
  });
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
  installMobileMenu();
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
  installCompareButtons();
});
