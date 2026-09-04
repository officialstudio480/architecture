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
