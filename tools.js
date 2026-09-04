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
