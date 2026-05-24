(async function () {
  renderNav("items");
  const params = new URLSearchParams(location.search);
  const sku = params.get("sku");
  const data = await loadData();
  if (!data.skus.length) return;

  if (!sku) {
    document.getElementById("main").innerHTML = '<div class="empty">請從品項清單選擇一個 SKU</div>';
    return;
  }

  const item = getSku(data, sku);
  if (!item) {
    document.getElementById("main").innerHTML = '<div class="empty">找不到 SKU：' + escapeHtml(sku) + "</div>";
    return;
  }

  const stock = computeStock(data);
  const total = totalStock(stock, sku);
  const safety = Number(item["安全庫存"]) || 0;
  const status = stockStatus(total, safety);
  const fillPct = safety > 0 ? Math.min(100, total / safety * 100) : 100;
  const txs = data.transactions.filter(t => t.SKU === sku).sort((a, b) => (b["日期"] || "").localeCompare(a["日期"] || ""));

  let html =
    '<a class="back-link" href="items.html">← 返回品項清單</a>' +
    '<div class="page-title">' + escapeHtml(item["品名"]) + "</div>" +
    '<div class="page-subtitle" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
      '<span>SKU ' + escapeHtml(item.SKU) + "</span>" +
      '<span>·</span>' +
      pillSkuType(item["類型"]) +
      pillGrade(item["年級"]) +
      pillPurpose(item["用途"]) +
      '<span>·</span>' +
      '<span>' + escapeHtml(item["狀態"]) + "</span>" +
    "</div>";

  const perBox = Number(item["每箱數量"]) || 0;

  const statusAccent = status.level === "danger" ? "danger" : status.level === "warn" ? "warning" : status.level === "ok" ? "success" : "muted";
  html +=
    '<div class="kpi-grid">' +
      '<div class="kpi" data-accent="brand">' +
        '<div class="kpi-label">目前總庫存</div>' +
        '<div class="kpi-value">' + fmtNum(total) + '<span style="font-size:14px;color:var(--text-secondary);font-weight:400"> ' + escapeHtml(item["單位"]) + '</span></div>' +
        '<div class="kpi-sub">' + (perBox > 0 ? "約 " + Math.floor(total / perBox) + " 箱" : "") + "</div>" +
      "</div>" +
      '<div class="kpi" data-accent="warning">' +
        '<div class="kpi-label">安全庫存</div>' +
        '<div class="kpi-value">' + fmtNum(safety) + "</div>" +
        '<div class="progress"><div class="progress-fill ' +
          (status.level === "danger" ? "danger" : status.level === "warn" ? "warn" : "") +
          '" style="width: ' + fillPct + '%"></div></div>' +
      "</div>" +
      '<div class="kpi" data-accent="' + statusAccent + '">' +
        '<div class="kpi-label">狀態</div>' +
        '<div class="kpi-value" style="font-size:20px;padding-top:6px"><span class="pill ' + status.pill + '">' + status.label + "</span></div>" +
        '<div class="kpi-sub">' + (safety === 0 ? "未設定門檻" : (total - safety >= 0 ? "高於 " + fmtNum(total - safety) : "缺口 " + fmtNum(safety - total))) + "</div>" +
      "</div>" +
      '<div class="kpi" data-accent="muted">' +
        '<div class="kpi-label">交易筆數</div>' +
        '<div class="kpi-value">' + txs.length + "</div>" +
        '<div class="kpi-sub">' + (txs.length ? "上次異動 " + escapeHtml(txs[0]["日期"]) : "尚無紀錄") + "</div>" +
      "</div>" +
    "</div>";

  if (item["類型"] === "成品") {
    const bomEntries = (data.bom || []).filter(b => b["成品"] === sku);
    if (bomEntries.length > 0) {
      html +=
        '<div class="card">' +
          '<div class="card-title">組裝 BOM <span class="card-title-aside">組 1 個 ' + escapeHtml(sku) + " 需要以下原料</span></div>" +
          '<table>' +
            '<thead><tr><th>原料 SKU</th><th>品名</th><th class="num">每份用量</th><th class="num">原料現貨</th><th class="num">可組裝</th></tr></thead>' +
            '<tbody>' + bomEntries.map(b => {
              const mat = getSku(data, b["原料"]);
              const perUnit = Number(b["用量"]) || 0;
              const current = totalStock(stock, b["原料"]);
              const maxCanMake = perUnit > 0 ? Math.floor(current / perUnit) : 0;
              return "<tr>" +
                '<td><a class="sku-link" href="detail.html?sku=' + encodeURIComponent(b["原料"]) + '">' + escapeHtml(b["原料"]) + "</a></td>" +
                "<td>" + escapeHtml(mat ? mat["品名"] : "(未定義)") + "</td>" +
                '<td class="num">' + fmtNum(perUnit) + " " + escapeHtml(b["單位"] || "") + "</td>" +
                '<td class="num cell-bold">' + fmtNum(current) + "</td>" +
                '<td class="num cell-muted">' + fmtNum(maxCanMake) + " 個</td>" +
                "</tr>";
            }).join("") + "</tbody>" +
          "</table>" +
        "</div>";
    }
  }

  if (item["類型"] === "原料") {
    const usedInEntries = (data.bom || []).filter(b => b["原料"] === sku);
    if (usedInEntries.length > 0) {
      html +=
        '<div class="card">' +
          '<div class="card-title">用於下列成品 <span class="card-title-aside">' + usedInEntries.length + " 個成品使用此原料</span></div>" +
          '<table>' +
            '<thead><tr><th>成品 SKU</th><th>品名</th><th class="num">每份用量</th><th>備註</th></tr></thead>' +
            '<tbody>' + usedInEntries.map(b => {
              const prod = getSku(data, b["成品"]);
              return "<tr>" +
                '<td><a class="sku-link" href="detail.html?sku=' + encodeURIComponent(b["成品"]) + '">' + escapeHtml(b["成品"]) + "</a></td>" +
                "<td>" + escapeHtml(prod ? prod["品名"] : "(未定義)") + "</td>" +
                '<td class="num">' + fmtNum(b["用量"]) + " " + escapeHtml(b["單位"] || "") + "</td>" +
                '<td class="cell-muted">' + escapeHtml(b["備註"] || "") + "</td>" +
                "</tr>";
            }).join("") + "</tbody>" +
          "</table>" +
        "</div>";
    }
  }

  html +=
    '<div class="card">' +
      '<div class="card-title">四倉分佈</div>' +
      '<table>' +
        '<thead><tr><th>倉點</th><th>角色</th><th class="num">現貨</th><th class="num">佔比</th></tr></thead>' +
        '<tbody>' + data.warehouses.map(w => {
          const q = (stock[sku] && stock[sku][w["代碼"]]) || 0;
          const pct = total > 0 ? (q / total * 100).toFixed(1) : "0.0";
          return "<tr>" +
            '<td class="cell-bold">' + whDot(w["代碼"]) + escapeHtml(w["倉點名稱"]) + "</td>" +
            '<td class="cell-muted">' + escapeHtml(w["角色"]) + "</td>" +
            '<td class="num ' + (q === 0 ? "cell-muted" : "cell-bold") + '">' + fmtNum(q) + "</td>" +
            '<td class="num cell-muted">' + pct + "%</td>" +
            "</tr>";
        }).join("") + "</tbody>" +
      "</table>" +
    "</div>";

  html +=
    '<div class="card">' +
      '<div class="card-title">交易紀錄 <span class="card-title-aside">新到舊</span></div>' +
      (txs.length === 0
        ? '<div class="empty">尚無交易紀錄</div>'
        : '<table>' +
            '<thead><tr><th>日期</th><th>類型</th><th>從</th><th>至</th><th class="num">數量</th><th>事件</th><th>登錄人</th><th>備註</th></tr></thead>' +
            '<tbody>' + txs.map(t => {
              const from = getWarehouse(data, t["來源倉"]);
              const to = getWarehouse(data, t["目的倉"]);
              return "<tr>" +
                '<td class="cell-muted">' + escapeHtml(t["日期"]) + "</td>" +
                "<td>" + pillType(t["類型"]) + "</td>" +
                '<td class="cell-muted">' + (from ? whDot(from["代碼"]) + escapeHtml(from["倉點名稱"]) : "—") + "</td>" +
                '<td class="cell-muted">' + (to ? whDot(to["代碼"]) + escapeHtml(to["倉點名稱"]) : "—") + "</td>" +
                '<td class="num cell-bold">' + fmtNum(t["數量"]) + "</td>" +
                '<td class="cell-muted">' + escapeHtml(t["對應事件"] || "") + "</td>" +
                '<td class="cell-muted">' + escapeHtml(t["登錄人"] || "") + "</td>" +
                '<td class="cell-muted">' + escapeHtml(t["備註"] || "") + "</td>" +
                "</tr>";
            }).join("") + "</tbody>" +
          "</table>") +
    "</div>";

  document.getElementById("main").innerHTML = html;
})();
