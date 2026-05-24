(async function () {
  renderNav("calculator");
  const data = await loadData();
  if (!data.skus.length) return;
  const stock = computeStock(data);

  const assemblableSkus = data.skus.filter(s =>
    s["類型"] === "成品" && data.bom.some(b => b["成品"] === s.SKU)
  );

  if (assemblableSkus.length === 0) {
    document.getElementById("form").innerHTML =
      '<div class="card"><div class="empty">BOM 表尚未建立任何成品組裝規格。請先到 Google Sheets「BOM」表新增資料。</div></div>';
    return;
  }

  const productOptions = assemblableSkus
    .map(s => '<option value="' + escapeHtml(s.SKU) + '">' + escapeHtml(s.SKU) + " · " + escapeHtml(s["品名"]) + "</option>")
    .join("");

  document.getElementById("form").innerHTML =
    '<div class="card">' +
      '<div class="card-title">組裝條件</div>' +
      '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:280px">' +
          '<label style="display:block;font-size:13px;color:var(--text-secondary);margin-bottom:4px">要組裝的成品</label>' +
          '<select id="f-product" style="width:100%">' + productOptions + '</select>' +
        '</div>' +
        '<div style="width:160px">' +
          '<label style="display:block;font-size:13px;color:var(--text-secondary);margin-bottom:4px">數量</label>' +
          '<input id="f-qty" type="number" min="1" value="100" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:14px;font-family:inherit" />' +
        '</div>' +
      '</div>' +
    '</div>';

  document.getElementById("f-product").addEventListener("change", render);
  document.getElementById("f-qty").addEventListener("input", render);

  render();

  function render() {
    const sku = document.getElementById("f-product").value;
    const qty = Number(document.getElementById("f-qty").value) || 0;

    if (!sku || qty <= 0) {
      document.getElementById("result").innerHTML = '<div class="card"><div class="empty">請輸入要組裝的數量</div></div>';
      return;
    }

    const product = getSku(data, sku);
    const productStock = totalStock(stock, sku);
    const bomEntries = data.bom.filter(b => b["成品"] === sku);

    const rows = bomEntries.map(b => {
      const material = getSku(data, b["原料"]);
      const perUnit = Number(b["用量"]) || 0;
      const needed = perUnit * qty;
      const current = totalStock(stock, b["原料"]);
      const shortfall = Math.max(0, needed - current);
      const sufficient = current >= needed;
      const maxAssembleable = perUnit > 0 ? Math.floor(current / perUnit) : Infinity;
      return { b, material, perUnit, needed, current, shortfall, sufficient, maxAssembleable };
    });

    const canAssemble = rows.length > 0 && rows.every(r => r.sufficient);
    const maxPossible = rows.length > 0 ? Math.min.apply(null, rows.map(r => r.maxAssembleable)) : 0;
    const shortfallCount = rows.filter(r => !r.sufficient).length;

    const summaryAccent = canAssemble ? "success" : "danger";
    const summaryPill = canAssemble ? "pill-ok" : "pill-danger";
    const summaryLabel = canAssemble ? "✓ 原料充足，可組裝" : "✗ 原料不足，無法組裝 " + qty + " 個";

    let html =
      '<div class="kpi-grid">' +
        '<div class="kpi" data-accent="brand">' +
          '<div class="kpi-label">欲組裝</div>' +
          '<div class="kpi-value">' + fmtNum(qty) + '<span style="font-size:14px;color:var(--text-secondary);font-weight:400"> ' + escapeHtml(product["單位"] || "個") + '</span></div>' +
          '<div class="kpi-sub">' + escapeHtml(product["品名"]) + "</div>" +
        "</div>" +
        '<div class="kpi" data-accent="' + summaryAccent + '">' +
          '<div class="kpi-label">組裝結果</div>' +
          '<div class="kpi-value" style="font-size:18px;padding-top:6px"><span class="pill ' + summaryPill + '">' + summaryLabel + "</span></div>" +
          '<div class="kpi-sub">' + (canAssemble ? "全部 " + rows.length + " 項原料足夠" : shortfallCount + " 項原料不足") + "</div>" +
        "</div>" +
        '<div class="kpi" data-accent="warning">' +
          '<div class="kpi-label">以目前原料最多可組</div>' +
          '<div class="kpi-value">' + fmtNum(maxPossible) + '<span style="font-size:14px;color:var(--text-secondary);font-weight:400"> 個</span></div>' +
          '<div class="kpi-sub">' + (maxPossible >= qty ? "超過需求 " + (maxPossible - qty) + " 個" : "少於需求 " + (qty - maxPossible) + " 個") + "</div>" +
        "</div>" +
        '<div class="kpi" data-accent="muted">' +
          '<div class="kpi-label">成品目前庫存</div>' +
          '<div class="kpi-value">' + fmtNum(productStock) + "</div>" +
          '<div class="kpi-sub">組裝後將變為 ' + fmtNum(productStock + qty) + "</div>" +
        "</div>" +
      "</div>";

    html +=
      '<div class="card">' +
        '<div class="card-title">原料需求明細 <span class="card-title-aside">BOM 展開 × ' + qty + " 份</span></div>" +
        '<table>' +
          '<thead><tr>' +
            '<th>原料 SKU</th><th>品名</th><th class="num">每份用量</th><th class="num">需求總量</th><th class="num">目前庫存</th><th class="num">缺口</th><th>狀態</th>' +
          '</tr></thead>' +
          '<tbody>' +
            rows.map(r => "<tr>" +
              '<td><a class="sku-link" href="detail.html?sku=' + encodeURIComponent(r.b["原料"]) + '">' + escapeHtml(r.b["原料"]) + "</a></td>" +
              "<td>" + escapeHtml(r.material ? r.material["品名"] : "(未定義)") + "</td>" +
              '<td class="num">' + fmtNum(r.perUnit) + " " + escapeHtml(r.b["單位"] || "") + "</td>" +
              '<td class="num cell-bold">' + fmtNum(r.needed) + "</td>" +
              '<td class="num ' + (r.sufficient ? "" : "cell-muted") + '">' + fmtNum(r.current) + "</td>" +
              '<td class="num" style="color:' + (r.shortfall > 0 ? "var(--danger)" : "var(--text-muted)") + '">' + (r.shortfall > 0 ? "-" + fmtNum(r.shortfall) : "—") + "</td>" +
              '<td><span class="pill ' + (r.sufficient ? "pill-ok" : "pill-danger") + '">' + (r.sufficient ? "足夠" : "不足") + "</span></td>" +
              "</tr>").join("") +
          "</tbody>" +
        "</table>" +
      "</div>";

    if (canAssemble) {
      html +=
        '<div class="card">' +
          '<div class="card-title">若要執行組裝，應登錄的交易</div>' +
          '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:10px">以下是組裝 ' + qty + " 個 " + escapeHtml(sku) + " 時應在「庫存交易」表新增的紀錄（日期、倉點請依實際狀況填入）：</div>" +
          '<table>' +
            '<thead><tr><th>類型</th><th>SKU</th><th class="num">數量</th><th>說明</th></tr></thead>' +
            '<tbody>' +
              rows.map(r => "<tr>" +
                '<td>' + pillType("組裝消耗") + "</td>" +
                '<td><strong>' + escapeHtml(r.b["原料"]) + "</strong></td>" +
                '<td class="num cell-bold">' + fmtNum(r.needed) + " " + escapeHtml(r.b["單位"] || "") + "</td>" +
                '<td class="cell-muted">從原料倉扣除</td>' +
                "</tr>").join("") +
              "<tr>" +
                '<td>' + pillType("組裝產出") + "</td>" +
                '<td><strong>' + escapeHtml(sku) + "</strong></td>" +
                '<td class="num cell-bold">' + fmtNum(qty) + " " + escapeHtml(product["單位"] || "個") + "</td>" +
                '<td class="cell-muted">入成品倉</td>' +
              "</tr>" +
            "</tbody>" +
          "</table>" +
        "</div>";
    }

    document.getElementById("result").innerHTML = html;
  }
})();
