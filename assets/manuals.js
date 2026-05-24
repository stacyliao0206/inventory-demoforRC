(function () {
  renderNav("manuals");

  const docs = [
    {
      file: "docs/SOP.html",
      title: "倉儲管理 SOP",
      tag: "日常作業",
      tagClass: "pill-ok",
      description: "5 套標準作業流程：入庫驗收、加工領料出庫、營隊出貨、週期盤點、汰除與再版決策。所有例行倉儲作業都在這份。",
      audience: "倉儲助理 · 主管",
      updated: "v1.0 · 2026-04"
    },
    {
      file: "docs/期初盤點作業手冊.html",
      title: "期初盤點作業手冊",
      tag: "一次性",
      tagClass: "pill-warn",
      description: "3 週逐日步驟指南，含紙本盤點表模板與 Q&A。適用 5 月系統啟動前的四倉全面盤點。",
      audience: "倉儲助理",
      updated: "v1.0 · 2026-04"
    },
    {
      file: "docs/BOM作業SOP.html",
      title: "BOM 組裝作業 SOP",
      tag: "組裝",
      tagClass: "pill-sku-finished",
      description: "原料組裝成教材（如探索包）的登錄流程。包含 BOM 表建立、組裝當日操作、常見狀況處理。",
      audience: "倉儲助理",
      updated: "v1.0 · 2026-04"
    },
    {
      file: "docs/SKU編碼規則SOP.html",
      title: "SKU 編碼規則 SOP",
      tag: "編碼",
      tagClass: "pill-purpose-thinking",
      description: "9 大類別、三類型編碼標準。新增任何品項前必讀，避免重複編碼或分類錯誤。",
      audience: "編碼負責人 · 主管",
      updated: "v1.0 · 2026-04"
    }
  ];

  const html =
    '<div class="doc-grid">' +
    docs.map(d =>
      '<div class="doc-card">' +
        '<div class="doc-card-header">' +
          '<div class="doc-title">' + escapeHtml(d.title) + "</div>" +
          '<span class="pill ' + d.tagClass + '">' + escapeHtml(d.tag) + "</span>" +
        "</div>" +
        '<div class="doc-desc">' + escapeHtml(d.description) + "</div>" +
        '<div class="doc-meta">適用對象：' + escapeHtml(d.audience) + " · " + escapeHtml(d.updated) + "</div>" +
        '<div class="doc-actions">' +
          '<a class="btn btn-primary" href="' + d.file + '" target="_blank">線上閱讀</a>' +
          '<a class="btn btn-secondary" href="' + d.file + '" target="_blank">列印為 PDF</a>' +
        "</div>" +
      "</div>"
    ).join("") +
    "</div>" +
    '<div class="card" style="margin-top:20px">' +
      '<div class="card-title">使用提示</div>' +
      '<ul style="margin-left:20px;color:var(--text-secondary);line-height:1.8">' +
        '<li><strong>線上閱讀</strong>：在新分頁打開文件，適合邊做事邊查</li>' +
        '<li><strong>列印為 PDF</strong>：打開文件後點右上角黑色按鈕，列印視窗「目的地」選「另存為 PDF」</li>' +
        '<li>這些文件是 A4 排版設計的，列印出來後可放在倉儲辦公桌備查</li>' +
        '<li>內容如需修改，請聯繫主管；不要在文件上直接塗改</li>' +
      "</ul>" +
    "</div>";

  document.getElementById("main").innerHTML = html;
})();
