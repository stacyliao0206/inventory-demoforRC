(async function () {
  renderNav("dashboard");
  const data = await loadData();
  if (!data.skus.length) return;
  const stock = computeStock(data);
  renderDashboard(data, stock);
})();

function renderDashboard(data, stock) {
  const activeSkus = data.skus.filter(s => s["狀態"] === "活躍");
  const alerts = activeSkus.filter(s => stockStatus(totalStock(stock, s.SKU), s["安全庫存"]).level === "danger");
  const warns = activeSkus.filter(s => stockStatus(totalStock(stock, s.SKU), s["安全庫存"]).level === "warn");
  const staleCount = data.skus.filter(s => {
    if (s["狀態"] === "汰除中") return true;
    const last = lastMovedDate(data, s.SKU);
    return last && monthsSince(last) >= CONFIG.staleMonths;
  }).length;
  const camp = nextCamp();
  const daysToCamp = camp ? daysBetween(new Date(), camp.dateObj) : null;

  document.getElementById("page-subtitle").textContent =
    "目前有 " + activeSkus.length + " 個活躍品項，跨 " + data.warehouses.length + " 個倉點";

  let html = "";

  html +=
    '<div class="kpi-grid">' +
      kpiCard("活躍品項", activeSkus.length, "總品項 " + data.skus.length, null, "brand") +
      kpiCard("低於安全庫存", alerts.length, warns.length + " 個接近下限", "var(--danger)", "danger") +
      kpiCard("呆滯/停產", staleCount, "建議季度檢視", "var(--text-secondary)", "muted") +
      kpiCard(
        camp ? camp.name : "下次營期",
        (daysToCamp !== null ? daysToCamp : "—") + '<span style="font-size:14px;color:var(--text-secondary);font-weight:400"> 天</span>',
        camp ? "預估 " + fmtNum(camp.students) + " 人" : "無排程",
        null,
        "success"
      ) +
    "</div>";

  const lowList = alerts.concat(warns).slice(0, 10);
  html +=
    '<div class="card">' +
      '<div class="card-title">庫存警示 <span class="card-title-aside">' + (alerts.length + warns.length) + " 項需關注</span></div>" +
      (lowList.length === 0
        ? '<div class="empty">目前沒有警示品項</div>'
        : '<table>' +
            '<thead><tr><th>SKU</th><th>品名</th><th>年級</th><th>用途</th><th class="num">現貨</th><th class="num">安全庫存</th><th class="num">差距</th><th>狀態</th></tr></thead>' +
            '<tbody>' + lowList.map(s => {
              const total = totalStock(stock, s.SKU);
              const status = stockStatus(total, s["安全庫存"]);
              const diff = total - Number(s["安全庫存"]);
              return "<tr>" +
                '<td><a class="sku-link" href="detail.html?sku=' + encodeURIComponent(s.SKU) + '">' + escapeHtml(s.SKU) + "</a></td>" +
                "<td>" + escapeHtml(s["品名"]) + "</td>" +
                "<td>" + pillGrade(s["年級"]) + "</td>" +
                "<td>" + pillPurpose(s["用途"]) + "</td>" +
                '<td class="num cell-bold">' + fmtNum(total) + "</td>" +
                '<td class="num cell-muted">' + fmtNum(s["安全庫存"]) + "</td>" +
                '<td class="num" style="color:' + (diff < 0 ? "var(--danger)" : "var(--warning)") + '">' + (diff > 0 ? "+" : "") + fmtNum(diff) + "</td>" +
                '<td><span class="pill ' + status.pill + '">' + status.label + "</span></td>" +
                "</tr>";
            }).join("") + "</tbody>" +
          "</table>") +
    "</div>";

  html +=
    '<div class="card">' +
      '<div class="card-title">倉點分佈 <span class="card-title-aside">各倉儲目前總量</span></div>' +
      '<table>' +
        '<thead><tr><th>倉點</th><th>角色</th><th class="num">活躍品項數</th><th class="num">總庫存</th></tr></thead>' +
        '<tbody>' + data.warehouses.map(w => {
          const skuCount = data.skus.filter(s => (stock[s.SKU] && stock[s.SKU][w["代碼"]]) > 0).length;
          const total = data.skus.reduce((sum, s) => sum + ((stock[s.SKU] && stock[s.SKU][w["代碼"]]) || 0), 0);
          return "<tr>" +
            '<td class="cell-bold">' + whDot(w["代碼"]) + escapeHtml(w["倉點名稱"]) + "</td>" +
            '<td class="cell-muted">' + escapeHtml(w["角色"]) + "</td>" +
            '<td class="num">' + skuCount + "</td>" +
            '<td class="num cell-bold">' + fmtNum(total) + "</td>" +
            "</tr>";
        }).join("") + "</tbody>" +
      "</table>" +
    "</div>";

  const recent = data.transactions.slice().sort((a, b) => (b["日期"] || "").localeCompare(a["日期"] || "")).slice(0, 10);
  html +=
    '<div class="card">' +
      '<div class="card-title">近期交易 <span class="card-title-aside">最新 10 筆</span></div>' +
      '<table>' +
        '<thead><tr><th>日期</th><th>SKU</th><th>類型</th><th>從</th><th>至</th><th class="num">數量</th><th>事件</th></tr></thead>' +
        '<tbody>' + recent.map(t => {
          const from = getWarehouse(data, t["來源倉"]);
          const to = getWarehouse(data, t["目的倉"]);
          return "<tr>" +
            '<td class="cell-muted">' + escapeHtml(t["日期"]) + "</td>" +
            '<td><a class="sku-link" href="detail.html?sku=' + encodeURIComponent(t.SKU) + '">' + escapeHtml(t.SKU) + "</a></td>" +
            "<td>" + pillType(t["類型"]) + "</td>" +
            '<td class="cell-muted">' + (from ? whDot(from["代碼"]) + escapeHtml(from["倉點名稱"]) : "—") + "</td>" +
            '<td class="cell-muted">' + (to ? whDot(to["代碼"]) + escapeHtml(to["倉點名稱"]) : "—") + "</td>" +
            '<td class="num">' + fmtNum(t["數量"]) + "</td>" +
            '<td class="cell-muted">' + escapeHtml(t["對應事件"] || "") + "</td>" +
            "</tr>";
        }).join("") + "</tbody>" +
      "</table>" +
    "</div>";

  document.getElementById("main").innerHTML = html;
}

function kpiCard(label, value, sub, color, accent) {
  const colorStyle = color ? ' style="color:' + color + '"' : "";
  const accentAttr = accent ? ' data-accent="' + accent + '"' : "";
  return '<div class="kpi"' + accentAttr + ">" +
    '<div class="kpi-label">' + escapeHtml(label) + "</div>" +
    '<div class="kpi-value"' + colorStyle + ">" + value + "</div>" +
    '<div class="kpi-sub">' + escapeHtml(sub || "") + "</div>" +
  "</div>";
}
