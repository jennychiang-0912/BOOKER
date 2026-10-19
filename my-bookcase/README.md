# 我的書櫃

一個薄荷綠、文青風的個人書櫃網站。純 HTML／CSS／JavaScript，沒有框架、不需要建置，直接放上 GitHub Pages 就能用。

## 功能

- 四層書架：正在讀、即將閱讀、願望書單、讀完的書
- 拖曳書本換書架（手機長按後拖曳）
- 讀完時提示評星等（1–5 顆星），可順手寫心得
- 書本詳情：分類、ISBN、我的評分、筆記欄（可直接編輯，自動儲存）
- 搜尋書名或作者
- 每日任務（讀 5 頁）與每日打卡、連續打卡天數
- 願望書單、讀完的書可依 HyRead 分類篩選
- 「看全部」清單頁，可依書單順序、最近加入、書名、星等排序
- 輸入 ISBN 自動查書名、作者與封面
- 沒有封面時自動上網找（Google Books、Open Library），找不到就顯示空白書封
- 復原（Ctrl／⌘ + Z 或提示列上的「復原」）
- 匯出／匯入備份（JSON）

## 專案結構

```
my-bookcase/
├── index.html                    網頁結構
├── css/
│   └── style.css                 全部樣式（薄荷綠主題、深色模式、手機版）
├── js/
│   ├── data.js                   內建書單、分類對照（不含私人筆記）
│   └── main.js                   所有互動功能
├── assets/
│   └── icons/
│       ├── favicon.svg           瀏覽器分頁圖示
│       └── apple-touch-icon.png  iPhone 加到主畫面的圖示
├── .nojekyll                     告訴 GitHub Pages 不要用 Jekyll 處理
├── .gitignore                    擋掉私人備份與筆記檔
└── README.md
```

書封、插圖都是用 CSS／SVG 畫的，所以沒有 `assets/images/` 資料夾。

## 資料存在哪裡

- 沒有資料庫、沒有後端、沒有 API 金鑰。
- 所有書單、打卡、星等、筆記都存在**你自己瀏覽器的 localStorage**。
- 換一台電腦、換瀏覽器、或清除網站資料，資料就不會跟著走，請定期用頁尾的「匯出備份」存一份。
- 本機打開的檔案和 GitHub Pages 上的網站是不同網址，資料**不互通**，要用匯出／匯入搬過去。

## 私人讀書筆記

從 Notion 日記抓出來的讀書筆記**沒有**放在這個專案裡，因為公開的 Repository 誰都看得到。
筆記另存在 `我的書櫃-日記筆記.json`，請放在 Repository 以外的地方。網站上線後：

1. 打開網站，捲到最下面
2. 按「匯入備份」，選 `我的書櫃-日記筆記.json`
3. 筆記與星等會合併進現有書架（重複匯入不會重複）

筆記只會存在你的瀏覽器裡，別人打開你的網站看到的是他自己的空書櫃加上內建書單。

## 在本機執行

不需要安裝任何套件。任選一種：

- **最簡單**：直接雙擊 `index.html` 用瀏覽器打開。
- **比較接近上線狀態**（建議）：在這個資料夾開終端機執行
  ```
  python3 -m http.server 8000
  ```
  然後打開 http://localhost:8000
  （Windows 若沒有 `python3`，改用 `python -m http.server 8000`；也可以用 VS Code 的 Live Server 擴充功能。）

## 上傳到 GitHub

### 方法 A：用網頁上傳（不用指令）

1. 登入 GitHub，右上角「＋」→「New repository」
2. Repository name 填 `my-bookcase`，選 **Public**，不要勾 Add a README（這裡已經有了），按「Create repository」
3. 在新 Repository 頁面點「uploading an existing file」
4. 把 `my-bookcase` 資料夾**裡面的所有東西**（`index.html`、`css`、`js`、`assets`、`README.md`、`.nojekyll`、`.gitignore`）拖進去
   - Mac 的 Finder 預設看不到 `.` 開頭的檔案，按 ⌘ + Shift + . 就會顯示
5. 按「Commit changes」

### 方法 B：用 Git 指令

```
cd my-bookcase
git init
git add .
git commit -m "我的書櫃 第一版"
git branch -M main
git remote add origin https://github.com/你的帳號/my-bookcase.git
git push -u origin main
```

## 用 GitHub Pages 部署

1. 到 Repository 的「Settings」→ 左側「Pages」
2. 「Build and deployment」的 Source 選「Deploy from a branch」
3. Branch 選 `main`，資料夾選 `/ (root)`，按「Save」
4. 等 1–2 分鐘，重新整理那一頁，上方會出現網址：
   `https://你的帳號.github.io/my-bookcase/`

所有路徑都是相對路徑，Repository 改成別的名字也能直接運作，不用改設定。

之後要更新網站，只要把改過的檔案重新上傳（或 `git push`），GitHub Pages 會自動重新部署。

## 部署後測試清單

- [ ] 網址打得開，背景是薄荷米白色，字體是粗體的思源黑體
- [ ] 瀏覽器分頁有書本小圖示
- [ ] 首頁看得到四層書架與「今日任務」
- [ ] 按「＋ 添一本」新增一本書，出現在選的書架上
- [ ] 願望書單輸入手邊任一本書背面 978 開頭的 ISBN，會帶出書名與封面
- [ ] 書架上的書在幾秒到幾分鐘內陸續出現封面
- [ ] 搜尋框打書名，書架會篩選
- [ ] 點每日任務的圓圈打勾，再點一次可以取消
- [ ] 打卡後連續天數 +1，再點一次可以取消
- [ ] 把一本書拖到「讀完的書」，跳出評星視窗；評分後打開書本詳情看得到星星
- [ ] 書本詳情的筆記欄打字，關掉再打開內容還在
- [ ] 按 Ctrl／⌘ + Z 或提示列「復原」可以還原上一步
- [ ] 讀完的書「看全部」→ 排序選「依星等」
- [ ] 願望書單、讀完的書的分類標籤可以篩選
- [ ] 匯入 `我的書櫃-日記筆記.json`，提示「已匯入 220 則讀書筆記」
- [ ] 按「匯出備份」可以下載 JSON
- [ ] 重新整理頁面，資料都還在
- [ ] 用手機打開：選單收進右上角漢堡鍵、長按書本可拖曳、彈出視窗從下方滑出

## GitHub Pages 的限制

- 只能放靜態檔案，沒有伺服器、沒有資料庫。資料只存在每個人自己的瀏覽器。
- 不能跨裝置同步。要同步得另外接後端（例如 Firebase、Supabase），那就需要金鑰與帳號設定，不在這個版本裡。
- 免費帳號的 GitHub Pages 需要 Public Repository，原始碼與 `js/data.js` 裡的書單任何人都看得到。
- 封面查詢用的是 Google Books 與 Open Library 的公開 API，不需要金鑰；若某天被限流，封面會晚一點出現或顯示空白書封，不影響其他功能。
- 字體從 Google Fonts 載入；離線時會改用系統字體。
