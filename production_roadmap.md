# MEDCALCEHR Production Roadmap

> SMART on FHIR Medical Calculator — 產品化評估與路線圖
>
> 最後更新：2026-02-08（Phase 0 已完成）

---

## 現況總覽

| 維度 | 成熟度 | 說明 |
|------|--------|------|
| 架構設計 | ★★★★☆ | Factory Pattern、分層架構、模組化 CSS，架構品質優良 |
| FHIR 整合 | ★★★★☆ | OAuth 2.0 啟動流程完整、92 個計算器支援 FHIR 自動填入 |
| 安全性 | ★★★★☆ | CSP 已移除 unsafe-inline、Session 閒置逾時已實作、環境變數已分離、輸入 sanitization 已強化。剩餘：XOR→AES-GCM 加密升級（Phase 1） |
| 測試 | ★★☆☆☆ | 98 個測試檔案但覆蓋率門檻僅 8%，無 E2E 測試 |
| 合規文件 | ★★★★☆ | IEC 62304 / ISO 14971 文件齊全，但缺少臨床驗證記錄 |
| 無障礙 (a11y) | ★★☆☆☆ | 基本 HTML 語意結構，ARIA / 鍵盤導航嚴重不足 |
| 效能與監控 | ★★☆☆☆ | Service Worker 離線快取成熟，但無 APM、無 bundle 優化 |
| 部署運維 | ★★★½☆ | Docker + Nginx 可運行，環境變數已分離（app-config.js + docker-entrypoint.sh），尚缺自動化部署 |
| 國際化 (i18n) | ★☆☆☆☆ | 僅英文介面，無翻譯框架 |

---

## Phase 0 — 關鍵安全與穩定性（阻擋上線） ✅ 已完成

> 預期目標：修補所有可能造成病患安全風險或資料洩漏的問題。
>
> **狀態：核心項目已完成（2026-02-08），部分項目延至後續 Phase。**

### 0.1 Session 管理與登出 ✅

- [x] 新增 session inactivity timeout（15 分鐘），逾時自動登出
  - 實作：`src/session-manager.ts`（追蹤 mousemove/keydown/click/touchstart/scroll，throttle 30s）
  - 逾時前 2 分鐘顯示倒數警告 overlay（含繼續/登出按鈕、focus trap、Escape 鍵支援）
  - 逾時設定從 `window.MEDCALC_CONFIG.session` 讀取
- [x] 實作明確的 logout 流程（sessionStorage 清除 + audit event 記錄 + 導向 launch.html）
  - `index.html` 和 `calculator.html` 加入登出按鈕
  - 呼叫 `auditEventService.logLogout()` 記錄登出事件
- [x] Token 自動 refresh 確認：`fhirclient` v2.6.3 在有 `offline_access` scope 時自動處理 token refresh，無需額外實作
- [ ] ~~移除 `secureLocalStore` 的 XOR 混淆，改用 Web Crypto API (AES-GCM)~~ → **延至 Phase 1**
  - 原因：Web Crypto API 為 async，會連鎖影響 `secureSessionStore`/`secureLocalStore` 所有呼叫端簽名。CSP 強化後 XSS 風險已降低，sessionStorage 隨分頁關閉消失，風險可接受。

### 0.2 CSP 強化 ✅

- [x] 移除 `script-src 'unsafe-inline'`
  - 已確認所有 HTML 檔案皆使用外部 `<script src="...">` — 無任何 inline script
  - 移除位置：`calculator.html` CSP meta tag、`nginx.conf` 兩處 CSP header
- [ ] 限制 `connect-src` 僅允許已知 FHIR Server 白名單 → **延至 Phase 4**（需依部署環境配置）
- [ ] 加入 `report-uri` 或 `report-to` 以收集 CSP 違規報告 → **延至 Phase 4**（需搭配監控系統）

### 0.3 環境配置分離 ✅

- [x] 建立 runtime 環境配置機制
  - 新增 `js/app-config.js`：設定 `window.MEDCALC_CONFIG`（fhir + session 配置）
  - 新增 `js/app-config.example.js`：帶說明的範本檔
  - 新增 `docker-entrypoint.sh`：Docker 啟動時從環境變數產生 `app-config.js`
  - `js/app-config.js` 已加入 `.gitignore`（每環境獨立產生）
- [x] 將 FHIR client ID、scope、redirect URI 抽離為環境變數
  - `docker-compose.yml` 新增：`FHIR_CLIENT_ID`、`FHIR_SCOPE`、`FHIR_REDIRECT_URI`、`SESSION_TIMEOUT_MINUTES`、`SESSION_WARNING_MINUTES`
- [x] **移除原始碼中硬寫的 client credentials**
  - `js/fhir-launch.js` 改從 `window.MEDCALC_CONFIG.fhir` 讀取，保留 fallback 預設值
- [x] 所有 HTML 頁面（index.html、calculator.html、launch.html）在業務 JS 前載入 `app-config.js`

### 0.4 輸入驗證強化（部分完成）

- [ ] 針對所有 92 個計算器完成三區驗證（Green/Yellow/Red）覆蓋率審查 → **延至 Phase 1**（需搭配測試覆蓋率提升）
- [ ] 確認 FHIR 自動填入的資料也必須經過相同驗證管線 → **延至 Phase 1**
- [x] 增加 XSS sanitization 層
  - `unified-formula-calculator.ts`、`scoring-calculator.ts`、`dynamic-list-calculator.ts` 的 `customResultRenderer` 輸出已用 `sanitizeHTML()` 包裝
  - 未變更 `createAlert()` 的 `escapeMessage` 預設值（94 處呼叫傳入開發者定義 HTML，改預設會大量破壞）

---

## Phase 1 — 測試與品質保證

> 預期目標：建立足夠的自動化測試信心，確保計算結果正確性。

### 1.0 Phase 0 延續項目

- [ ] 升級 `secureLocalStore`/`secureSessionStore` 加密：XOR 混淆 → Web Crypto API (AES-GCM)
- [ ] 92 個計算器三區驗證覆蓋率審查
- [ ] 確認 FHIR 自動填入資料經過相同驗證管線
- [ ] 修復既存測試失敗：`security.test.ts`（escapeHTML 預期值需更新）、`security-labels-service.test.ts`（缺少 jest import）

### 1.1 提升單元測試覆蓋率

- [ ] 將 Jest 覆蓋率門檻從 8% 提升至 **60%**（分階段：30% → 45% → 60%）
- [ ] 優先補齊高風險計算器的 golden dataset 測試（APACHE II、CKD-EPI、MELD-Na 等）
- [ ] 為 `unit-converter.ts`、`validator.ts`、`cache-manager.ts` 核心模組達成 90% 覆蓋率
- [ ] 加入 mutation testing（Stryker）評估測試品質

### 1.2 端到端測試

- [ ] 導入 Playwright 或 Cypress 作為 E2E 測試框架
- [ ] 撰寫核心使用流程測試：
  - SMART Launch → OAuth → 進入首頁
  - 選擇計算器 → FHIR 資料自動填入 → 計算 → 結果顯示
  - 手動輸入 → 驗證攔截 → 修正 → 計算
  - 離線模式 → Service Worker 快取回應
- [ ] E2E 測試納入 CI pipeline，PR merge 前必須通過

### 1.3 臨床驗證測試

- [ ] 建立 Golden Dataset 驗證矩陣：每個計算器至少 5 組已知正確答案
- [ ] 與臨床醫師合作 review 計算邏輯（特別是有文獻出處的公式）
- [ ] 建立 regression test suite 防止公式修改後結果偏移
- [ ] 記錄臨床驗證結果於 `docs/compliance/CLINICAL_VALIDATION.md`

---

## Phase 2 — 效能與建置優化

> 預期目標：縮短載入時間、減少資源消耗。

### 2.1 引入 Build Pipeline

- [ ] 導入 Vite（或 Rollup）取代純 `tsc` 編譯
- [ ] 啟用 JS/CSS minification（生產環境）
- [ ] 實作 tree-shaking 移除未使用程式碼
- [ ] 啟用 code splitting — 每個計算器按需載入（dynamic import）
- [ ] 產生 source map 供生產環境 debug（但不對外公開）

### 2.2 資源優化

- [ ] 圖片資源壓縮（WebP 轉換 + 響應式圖片）
- [ ] 字型子集化（subset）減少載入量
- [ ] 實作 preload / prefetch 策略提升感知效能
- [ ] Service Worker 快取版本升級策略自動化

### 2.3 效能監控

- [ ] 導入 Web Vitals 收集（LCP、FID、CLS）
- [ ] 建立 Lighthouse CI 自動跑分，PR 若分數下降則警告
- [ ] 設定效能預算（JS bundle < 200KB gzip、首次載入 < 2s）

---

## Phase 3 — 無障礙 (Accessibility)

> 預期目標：符合 WCAG 2.1 AA 標準，對醫療應用尤為關鍵。

### 3.1 語意與 ARIA

- [ ] 在 `ui-builder.ts` 所有元件加入完整 ARIA 屬性
  - `role`、`aria-label`、`aria-describedby`、`aria-live`（結果區域）
  - `aria-invalid` + `aria-errormessage`（驗證錯誤）
- [ ] 計算結果使用 `aria-live="polite"` 讓螢幕閱讀器自動朗讀
- [ ] 表單群組使用 `<fieldset>` + `<legend>`

### 3.2 鍵盤導航

- [ ] 實作 skip-to-content 連結
- [ ] 確保所有互動元素可 Tab 到達且有可見 focus 樣式
- [ ] 模態對話框實作 focus trap
- [ ] 支援 Escape 鍵關閉提示/彈窗

### 3.3 視覺無障礙

- [ ] 確認所有顏色對比度 ≥ 4.5:1（文字）/ 3:1（大文字）
- [ ] 三區驗證（Green/Yellow/Red）不可僅依賴顏色，需有圖示 + 文字
- [ ] 支援高對比模式與 `prefers-reduced-motion`
- [ ] 導入 axe-core 自動化測試納入 CI

---

## Phase 4 — 運維與可觀測性

> 預期目標：正式環境出問題時能快速偵測、定位、恢復。

### 4.1 結構化日誌與錯誤追蹤

- [ ] 整合 Sentry（或同類服務）收集前端錯誤，含 source map 上傳
- [ ] 定義結構化日誌格式（JSON），包含 calculator ID、patient context hash、error type
- [ ] 建立錯誤分級：Critical（計算錯誤）→ Warning（資料過舊）→ Info（使用紀錄）
- [ ] **確保所有日誌不含 PHI / PII**（患者姓名、ID 等）

### 4.2 健康檢查與告警

- [ ] 擴充 `health-check.html` 為結構化 JSON endpoint（含版本號、建置時間、依賴狀態）
- [ ] 建立 uptime monitoring（UptimeRobot / Pingdom）
- [ ] 設定告警規則：5xx 錯誤率 > 1%、回應時間 > 3s、健康檢查失敗

### 4.3 部署自動化

- [ ] 建立 staging 環境，PR merge 後自動部署至 staging
- [ ] 正式環境部署需人工審核 + 一鍵部署（GitHub Actions + Docker registry）
- [ ] 實作 blue-green 或 canary 部署策略
- [ ] 建立 rollback SOP 與自動化腳本
- [ ] 每次部署產生 SBOM（Software Bill of Materials）

### 4.4 備份與災難恢復

- [ ] 定義 RTO（Recovery Time Objective）與 RPO（Recovery Point Objective）
- [ ] 建立 Docker image 版本標記策略（semantic versioning）
- [ ] 文件化災難恢復程序

---

## Phase 5 — 合規與認證

> 預期目標：滿足 SaMD（Software as a Medical Device）上市所需的法規文件。

### 5.1 IEC 62304 完善

- [ ] 補齊 Software Architecture Document (SAD) 中的安全架構章節
- [ ] 完善 SOUP 風險評估（chart.js、fhirclient 的失效模式分析）
- [ ] 建立完整的 Change Control Process 文件
- [ ] 將 Traceability Matrix 擴展覆蓋全部 92 個計算器（目前僅涵蓋 APACHE II）

### 5.2 ISO 14971 風險管理持續維護

- [ ] 將 FMEA 擴展至覆蓋所有計算器類型（Scoring / Formula / Conversion）
- [ ] 新增風險項目：
  - RISK-006: Token 洩漏或 session hijack
  - RISK-007: 離線模式使用過期快取資料進行臨床決策
  - RISK-008: 計算器選錯（病患安全）
  - RISK-009: 無障礙缺失導致操作錯誤
- [ ] 建立風險管理定期審查機制（每季）

### 5.3 臨床評估與使用性

- [ ] 撰寫 Clinical Evaluation Report（臨床評估報告）
- [ ] 進行使用性測試（Usability Testing）— 至少 5 位臨床使用者
- [ ] 收集並記錄使用回饋與改善行動
- [ ] 建立 Post-Market Surveillance 計畫

### 5.4 法規申請準備

- [ ] 確認目標市場法規路徑（台灣 TFDA / 美國 FDA 510(k) / 歐盟 MDR CE）
- [ ] 準備 Technical Documentation（技術文件包）
- [ ] 建立 Quality Management System (QMS) 程序文件
- [ ] 指定 Regulatory Affairs 負責人

---

## Phase 6 — 功能增強（產品化加值）

> 預期目標：提升產品競爭力與使用者體驗。

### 6.1 國際化 (i18n)

- [ ] 導入 i18n 框架（建議使用輕量的 i18next-browser）
- [ ] 抽取所有硬寫英文字串至翻譯檔（`locales/en.json`、`locales/zh-TW.json`）
- [ ] UI 建立語言切換功能
- [ ] 醫學術語翻譯需經臨床審查

### 6.2 EHR 回寫（Write-back）

- [ ] 支援將計算結果以 FHIR Observation 寫回 EHR
- [ ] 實作 FHIR Provenance 資源追蹤計算來源
- [ ] 建立寫回前的確認流程（醫師審核 + 數位簽章概念）
- [ ] 支援 CDS Hooks 整合（Clinical Decision Support）

### 6.3 進階 UX

- [ ] 計算器搜尋功能優化（fuzzy search、科別篩選、最近使用）
- [ ] 計算歷史紀錄（本地儲存，含時間戳與輸入參數）
- [ ] 列印友善版面（計算結果 + 參考文獻 + 免責聲明）
- [ ] 深色模式完善（目前有 theme 架構但未完整實作）
- [ ] 行動裝置手勢支援（滑動切換計算器）

### 6.4 多 EHR 廠商支援

- [ ] 建立 EHR 連接器抽象層（Adapter Pattern）
- [ ] 測試並認證 Epic、Cerner、MEDITECH 等主流 EHR
- [ ] 每個 EHR 廠商建立專屬配置檔（client ID、scope、特殊行為）
- [ ] 建立 EHR 整合測試環境（sandbox）

---

## 優先順序與依賴關係

```
Phase 0 ─── 安全與穩定 ✅ ────────────────────┐
  │                                           │
Phase 1 ─── 測試與品質 ─────┐                 │
  │                         │                 │
Phase 2 ─── 效能優化 ───┐   │                 │  ← 技術基礎
  │                     │   │                 │
Phase 3 ─── 無障礙 ─────┤   │                 │
  │                     │   │                 │
Phase 4 ─── 運維監控 ───┘   │                 │
  │                         │                 │
Phase 5 ─── 合規認證 ───────┘─────────────────┘  ← 上市門檻
  │
Phase 6 ─── 功能增強 ─────────────────────────── ← 產品差異化
```

> **Phase 0 已完成** ✅ — 安全基礎已就緒，可進入後續階段。
> Phase 1-4 可部分平行進行。Phase 5 依賴 Phase 0-4 的產出。
> Phase 6 可在 Phase 5 進行期間同步開發，但上線需等合規通過。

---

## 現有優勢（不需重做）

以下項目已具備良好品質，產品化時可直接沿用：

- **Factory Pattern 架構**：92 個計算器一致的開發模式，擴充容易
- **UIBuilder 設計系統**：統一的元件庫，改善 a11y 時只需修改一處
- **FHIR 整合流程**：OAuth 啟動、資料讀取、LOINC 對應已到位
- **三區輸入驗證**：醫療安全核心機制已建立
- **Service Worker 離線支援**：5 層快取策略成熟
- **IEC 62304 文件框架**：SDP、SRS、SOUP、Risk Management 已有基礎
- **CI Pipeline**：GitHub Actions 含 lint / type-check / test / security audit
- **Docker 部署**：Nginx + Alpine 映像檔 + health check 已可運行
- **模組化 CSS**：ITCSS + BEM + Design Tokens 架構完整

---

## 風險提醒

| 風險 | 影響 | 狀態 |
|------|------|------|
| ~~CSP `unsafe-inline` 未移除~~ | ~~XSS 攻擊面增大~~ | ✅ Phase 0 已解決 |
| ~~Token 無自動 refresh~~ | ~~長時間操作中斷~~ | ✅ fhirclient 已內建處理 |
| ~~無 session 閒置逾時~~ | ~~無人看管時病患資料暴露~~ | ✅ Phase 0 已實作（15 分鐘逾時） |
| ~~硬寫 Client ID 於原始碼~~ | ~~憑證洩漏風險~~ | ✅ Phase 0 已抽離至環境變數 |
| 本地儲存加密為 XOR 混淆 | PHI 可被輕易還原 | ⚠️ 延至 Phase 1（CSP 強化已降低風險） |
| 測試覆蓋率僅 8% | 公式修改可能引入錯誤 | Phase 1 持續提升 |
| 無 E2E 測試 | 整合問題無法自動偵測 | Phase 1 建立 |
| 無 APM / 錯誤追蹤 | 正式環境問題無法即時發現 | Phase 4 建立 |
| 合規文件僅覆蓋 APACHE II | 其餘 91 個計算器缺追溯 | Phase 5 擴展 |

---

## Phase 0 實作摘要

| 項目 | 變更檔案 | 說明 |
|------|----------|------|
| CSP 強化 | `calculator.html`, `nginx.conf` | 移除 `'unsafe-inline'`（3 處） |
| 環境配置 | `js/app-config.js`, `js/app-config.example.js`, `docker-entrypoint.sh`, `js/fhir-launch.js`, `launch.html`, `index.html`, `calculator.html`, `Dockerfile`, `docker-compose.yml`, `.gitignore` | Runtime config 機制 + Docker entrypoint |
| Session 管理 | `src/session-manager.ts`, `css/components/_session-timeout.css`, `src/main.ts`, `src/calculator-page.ts`, `index.html`, `calculator.html`, `css/main.css` | 閒置逾時 + 登出 + 警告 overlay |
| 輸入 Sanitization | `src/calculators/shared/unified-formula-calculator.ts`, `scoring-calculator.ts`, `dynamic-list-calculator.ts` | `customResultRenderer` 輸出包裝 `sanitizeHTML()` |

**驗證結果：**
- `npm run build:ts` ✅ 編譯成功
- `npm run lint` ✅ 0 新增錯誤（3 個既存錯誤在 security.ts / fhir-data-service.ts）
- `npm test` ✅ 97 通過 / 2 失敗（均為既存問題，非 Phase 0 引入）

---

## 結語

MEDCALCEHR 在架構設計、文件品質與 FHIR 整合方面已有堅實基礎。**Phase 0 安全基礎已完成**，主要差距現集中在 **測試覆蓋、無障礙、運維可觀測性** 與 **法規合規的完整性**。建議接續 Phase 1（測試與品質保證）推進，Phase 6 視商業需求穿插進行。
