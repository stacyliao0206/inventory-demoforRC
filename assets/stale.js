(async function () {
  renderNav("stale");
  const data = await loadData();
  if (!data.skus.length) return;
  const stock = computeStock(data);

  const items = data.skus.map(s => {
    const total = totalStock(stock, s.SKU);
    const last = lastMovedDate(data, s.SKU);
    const monthsAgo = last ? monthsSince(last) : null;
    return Object.assign({}, s, { total, last, monthsAgo });
  });

  const discontinued = items.filter(i => i["狀態"] === "汰除中" && i.total > 0);
  const stale = items.filter(i =>
    i["狀態"] === "活躍" && i.monthsAgo !== null && i.monthsAgo >= CONFIG.staleMonths && i.total > 0
  );
  const lowTurnover = items.filter(i => {
    if (i["狀態"] !== "活躍") return false;
    if (i.monthsAgo === null) return false;
    const safety = Number(i["安全庫存"]) || 0;
    return i.monthsAgo >= 6 && i.monthsAgo < CONFIG.staleMonths && safety > 0 && i.total > safety * 2;
  });

  let html =
    '<div class="page-title">呆滯品管理</div>' +
    '<div class="page-subtitle">需要主管決議處置（捐贈 / 清倉 / 銷毀 / 減印）的品項</div>';

  html += section("停產 / 汰除中", "已決議不再使用，應盡快處置", discontinued, "捐贈、折扣清倉或銷毀");
  html += section("呆滯品", "大於 " + CONFIG.staleMonths + " 個月未異動", stale, "主管月會決議處置");
  html += section("低週轉過量", "6–12 個月未動 且 庫存 > 安全庫存 2 倍", lowTurnover, "考慮下次減少再印量");

  document.getElementById("main").innerHTML = html;

  function section(title, subtitle, list, actionLabel) {
    if (list.length === 0) {
      return '<div class="card">' +
        '<div class="card-title">' + escapeHtml(title) + ' <span class="card-title-aside">' + escapeHtml(subtitle) + "</span></div>" +
        '<div class="empty">無此類品項</div>' +
      "</div>";
    }
    return '<div class="card">' +
      '<div class="card-title">' + escapeHtml(title) +
        ' <span class="card-title-aside">' + list.length + " 項 · " + escapeHtml(subtitle) + "</span></div>" +
      '<table>' +
        '<thead><tr><th>SKU</th><th>品名</th><th>用途</th><th class="num">庫存</th><th>上次異動</th><th>建議動作</th></tr></thead>' +
        '<tbody>' + list.map(i => "<tr>" +
          '<td><a class="sku-link" href="detail.html?sku=' + encodeURIComponent(i.SKU) + '">' + escapeHtml(i.SKU) + "</a></td>" +
          "<td>" + escapeHtml(i["品名"]) + "</td>" +
          "<td>" + pillPurpose(i["用途"]) + "</td>" +
          '<td class="num cell-bold">' + fmtNum(i.total) + "</td>" +
          '<td class="cell-muted">' + (i.last ? fmtDate(i.last) + "（" + i.monthsAgo + " 個月前）" : "無紀錄") + "</td>" +
          "<td>" + escapeHtml(actionLabel) + "</td>" +
          "</tr>").join("") + "</tbody>" +
      "</table>" +
    "</div>";
  }
})();
