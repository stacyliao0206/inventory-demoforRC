# 教材庫存管理儀表板 — 示範版本 (DEMO)

這是給主管 / 高層 / 外部訪客體驗的**示範版本**。所有資料都是預設的虛擬範例，與公司真實庫存無關。

正式版位於：https://github.com/stacyliao0206/inventory

## 與正式版的差異

| 項目 | 正式版 | 示範版 |
|---|---|---|
| 資料來源 | Google Sheets（即時） | 本地 CSV（固定） |
| useLiveData | true | false |
| 頂部黃色提醒條 | 無 | **有** |
| Nav 顯示 | 教材庫存管理 | 教材庫存管理 · DEMO |
| 部署 repo | inventory | inventory-demo |

## 本地預覽

```bash
cd C:/Users/User/inventory-demo
npx serve . -p 3001
```

瀏覽器打開 http://localhost:3001 即可預覽。

## 部署到 GitHub Pages（給主管的網址）

### Step 1：建立新的 repo

1. 登入 GitHub stacyliao0206 帳號
2. 右上「+」→「New repository」
3. **Repository name**：`inventory-demo`
4. 設為 **Public**
5. 不勾選任何預設檔案
6. 點「Create repository」

### Step 2：上傳整個 inventory-demo 資料夾

1. 打開 https://github.com/stacyliao0206/inventory-demo/upload/main
2. 開啟檔案總管到 `C:\Users\User\inventory-demo`
3. **Ctrl + A 全選**所有檔案和資料夾
4. 拖到瀏覽器上傳
5. Commit message：`Initial demo upload`
6. 點 **Commit changes**

### Step 3：啟用 GitHub Pages

1. Settings → Pages
2. Source: Deploy from a branch
3. Branch: main / (root)
4. Save
5. 等 1-3 分鐘

### Step 4：分享網址

完成後網址會是：

**https://stacyliao0206.github.io/inventory-demo/**

這個網址可以直接分享給主管，他點開就能看到帶黃色「示範環境」橫條的網站，所有功能可體驗，但**讀的是虛擬資料**，跟正式版完全隔離。

## 維護注意事項

- 示範版的資料若要更新（例如新增更多 demo SKU），直接編輯 `data/*.csv` 後重新上傳
- 正式版和示範版**互不影響**，您可以放心給主管體驗
- 如果以後要更新功能（如改網站介面），記得：
  1. 在正式版改完並驗證 OK
  2. 同步把改動複製到示範版（手動或寫腳本）
  3. 兩個 repo 都要更新
