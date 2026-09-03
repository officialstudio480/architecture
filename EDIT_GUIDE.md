# ARCHI SUPPORT 編集ガイド

このサイトは「後から自分でHTML/CSSを編集しやすい」ことを優先しています。

## ファイルの役割

- `index.html` → トップページ
- `style.css` → 全ページ共通のデザイン
- `script.js` → 共通JavaScript（主にスマホのメニュー）
- `scale.html` → 縮尺計算
- `calculator.html` → 建築計算
- `law.html` → 法令検索
- `materials.html` → 素材検索
- `about.html` → ABOUT・運営情報

## デザインを変える

基本的には `style.css` を編集します。

ファイルの上部にある

```css
:root {
  --background: #f5f6f8;
  --white: #ffffff;
  --text: #222222;
  --sub-text: #6b7280;
  --accent: #3b6ff5;
}
```

を変更すると、サイト全体の色をまとめて変更できます。

## ABOUTを編集する

`about.html` の

`【ここに〜を入力】`

となっている部分を自分の文章に変更してください。

## 法令・素材のデータを増やす

`law.html` / `materials.html` のJavaScript内にある `data` の配列へ項目を追加します。

将来的にデータ量が増えたら、JSONやデータベースへ分離するのがおすすめです。

## 注意

法令検索は現在「学習用の検索入口」です。
実際の設計・申請用途にする場合は、最新の法令本文・政令・省令・告示・条例等を確認できる仕組みに発展させてください。
