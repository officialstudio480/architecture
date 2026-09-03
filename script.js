
// ========================================
// Google検索
// ========================================
// キーワードをGoogle検索に渡します。
// 例：openGoogleSearch("建築基準法 採光")
function openGoogleSearch(keyword) {
  const query = encodeURIComponent(keyword);
  window.open("https://www.google.com/search?q=" + query, "_blank");
}
