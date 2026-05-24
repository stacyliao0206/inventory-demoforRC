(async function () {
  renderNav("items");
  const data = await loadData();
  if (!data.skus.length) return;
  const stock = computeStock(data);

  const rows = data.skus.map(s => {
    const total = totalStock(stock, s.SKU);
    const status = stockStatus(total, s["安全庫存"]);
    const perWh = {};
    data.warehouses.forEach(w => perWh[w["代碼"]] = (stock[s.SKU] && stock[s.SKU][w["代碼"]]) || 0);
    return Object.assign({}, s, { total, status, perWh });
  });

  const filter = { q: "", type: "", grade: "", purpose: "", warehouse: "", status: "" };

  const whOptions = data.warehouses.map(w =>
    '<option value="' + escapeHtml(w["代碼"]) + '">' + escapeHtml(w["倉點名稱"]) + "</option>"
  ).join("");

  document.getElementById("filters").innerHTML =
    '<div class="filter-bar">' +
      '<input class="search" id="f-search" placeholder="搜尋 SKU 或品名..." />' +
      '<select id="f-type">' +
        '<option value="">全部類型</option>' +
        '<option value="成品">成品</option>' +
        '<option value="元件">元件</option>' +
        '<option value="通用材料">通用材料</option>' +
      '</select>' +
      '<select id="f-grade">' +
        '<option value="">全部年級</option>' +
        '<option value="國小">國小</option>' +
        '<option value="國中">國中</option>' +
      '</select>' +
      '<select id="f-purpose">' +
        '<option value="">全部用途</option>' +
        '<option value="探索包">探索包 (A)</option>' +
        '<option value="小專題">小專題 (B)</option>' +
        '<option value="思考課">思考課 (C)</option>' +
        '<option value="題本書籍">題本書籍 (D)</option>' +
        '<option value="行政文具">行政文具 (F)</option>' +
        '<option value="文創禮品">文創禮品 (G)</option>' +
        '<option value="行銷文宣">行銷文宣 (M)</option>' +
        '<option value="教具材料">教具材料 (R)</option>' +
        '<option value="其它">其它 (E)</option>' +
      '</select>' +
      '<select id="f-warehouse">' +
        '<option value="">全部倉點</option>' +
        whOptions +
      '</select>' +
      '<select id="f-status">' +
        '<option value="">全部狀態</option>' +
        '<option value="活躍">活躍</option>' +
        '<option value="汰除中">汰除中</option>' +
      '</select>' +
    '</div>';

  document.getElementById("f-search").addEventListener("input", e => { filter.q = e.target.value; render(); });
  document.getElementById("f-type").addEventListener("change", e => { filter.type = e.target.value; render(); });
  document.getElementById("f-grade").addEventListener("change", e => { filter.grade = e.target.value; render(); });
  document.getElementById("f-purpose").addEventListener("change", e => { filter.purpose = e.target.value; render(); });
  document.getElementById("f-warehouse").addEventListener("change", e => { filter.warehouse = e.target.value; render(); });
  document.getElementById("f-status").addEventListener("change", e => { filter.status = e.target.value; render(); });

  render();

  function render() {
    const q = filter.q.trim().toLowerCase();
    const filtered = rows.filter(r => {
      if (q && !(r.SKU.toLowerCase().includes(q) || (r["品名"] || "").toLowerCase().includes(q))) return false;
      if (filter.type && r["類型"] !== filter.type) return false;
      if (filter.grade && r["年級"] !== filter.grade) return false;
      if (filter.purpose && r["用途"] !== filter.purpose) return false;
      if (filter.warehouse && !(r.perWh[filter.warehouse] > 0)) return false;
      if (filter.status && r["狀態"] !== filter.status) return false;
      return true;
    });

    const whCols = data.warehouses.map(w => '<th class="num">' + whDot(w["代碼"]) + escapeHtml(w["倉點名稱"]) + "</th>").join("");

    document.getElementById("results").innerHTML =
      '<div class="card">' +
        '<div class="card-title">' + filtered.length + " / " + rows.length + ' 個品項</div>' +
        '<table>' +
          '<thead><tr>' +
            '<th>SKU</th><th>品名</th><th>類型</th><th>年級</th><th>用途</th>' + whCols +
            '<th class="num">總計</th><th class="num">安全庫存</th><th>狀態</th>' +
          '</tr></thead>' +
          '<tbody>' +
            filtered.map(r => "<tr>" +
              '<td><a class="sku-link" href="detail.html?sku=' + encodeURIComponent(r.SKU) + '">' + escapeHtml(r.SKU) + "</a></td>" +
              "<td>" + escapeHtml(r["品名"]) + "</td>" +
              "<td>" + pillSkuType(r["類型"]) + "</td>" +
              "<td>" + pillGrade(r["年級"]) + "</td>" +
              "<td>" + pillPurpose(r["用途"]) + "</td>" +
              data.warehouses.map(w => '<td class="num ' + (r.perWh[w["代碼"]] === 0 ? "cell-muted" : "") + '">' + fmtNum(r.perWh[w["代碼"]]) + "</td>").join("") +
              '<td class="num cell-bold">' + fmtNum(r.total) + "</td>" +
              '<td class="num cell-muted">' + fmtNum(r["安全庫存"]) + "</td>" +
              '<td><span class="pill ' + r.status.pill + '">' + r.status.label + "</span></td>" +
              "</tr>").join("") +
          "</tbody>" +
        "</table>" +
      "</div>";
  }
})();
