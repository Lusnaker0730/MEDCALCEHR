 Sprint 1：🔴 關鍵阻擋項（Item 1-3）

 Step 1.1 — SOUP 清單自動生成

 - 建立 scripts/generate-soup-list.ts
   - 讀取 package.json 的 dependencies + devDependencies（共 32 套件）
   - 讀取 node_modules/<pkg>/package.json 取得實際版本、授權、描述
   - 內建風險分類 map（fhirclient=Medium, @sentry/browser=Low, devDeps=Low）
   - 輸出覆寫 docs/compliance/SOUP_LIST.md
 - 修改 package.json 新增 script："generate:soup": "npx ts-node scripts/generate-soup-list.ts"
 - 同時解決 Item 12（SOUP 版本同步）

 Step 1.2 — Traceability Matrix 自動生成

 - 建立 scripts/generate-traceability-matrix.ts
   - 掃描 src/__tests__/golden-datasets/*.json（83 個）取得 calculatorId/Name/Type/cases
   - 交叉對照 src/calculators/*/index.ts 的 config 和 src/calculators/index.ts 的 metadata
   - 追蹤鏈：SRS 需求 → 實作檔案 → 測試檔案 → Golden Dataset
   - 輸出覆寫 docs/compliance/TRACEABILITY_MATRIX.md（92 個計算器全覆蓋）
 - 修改 package.json 新增 script

 Step 1.3 — 擴展 Risk Management（FMEA）

 - 修改 docs/compliance/RISK_MANAGEMENT.md
   - 現有 5 項（僅 APACHE II）→ 擴展至 15+ 項
   - 新增按風險類別而非按計算器的 FMEA（院內使用不需 92 個獨立 FMEA）
   - 新增類別：Scoring 預設值風險、單位轉換錯誤、缺少驗證的輸入欄位、雙語解讀不一致、Lazy Loading 失敗、FHIR LOINC     
 對應錯誤、Session 超時、XSS via URL 參數、i18n 翻譯不一致

 Step 1.4 — 擴展 SRS 至系統層級

 - 修改 docs/compliance/SRS.md
   - 保留 APACHE II 作為範例
   - 新增 12+ 個系統層級需求（REQ-SYS-001~012）：92 計算器支援、SMART on FHIR OAuth2、三區驗證、Session 超時、PHI      
 去識別化、FHIR 自動填入、Provenance 追蹤、RWD、WCAG 2.1 AA、繁中 UI、離線降級

 Step 1.5 — ARCHITECTURE.md 新增安全架構章節

 - 修改 docs/ARCHITECTURE.md
   - 新增 Section 5: Security Architecture（認證授權、輸入消毒、CSP、資料保護、傳輸安全）

 Step 1.6 — 建立 QMS Lite

 - 建立 docs/compliance/QMS_LITE.md
   - 變更管理（PR-based + CI 通過）、版本控制策略、Release 流程、Bug 回報流程、臨床審查流程、教育訓練記錄模板

 Step 1.7 — 建立使用性測試 Checklist

 - 建立 docs/compliance/USABILITY_TESTING.md
   - 5 個代表性任務 × 5 個代表性使用者
   - 成功標準、記錄模板（完成時間、錯誤數、滿意度）

 Step 2.1 — Nginx 反向代理信任配置

 - 修改 nginx.conf
   - 新增 set_real_ip_from 信任私有網段（10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16）
   - 新增 real_ip_header X-Forwarded-For + real_ip_recursive on
   - 新增 HTTP→HTTPS 重導：if ($http_x_forwarded_proto = "http") { return 301 https://... }
   - 補充 proxy trust 文件註解

 Step 2.2 — TLS 架構文件

 - 建立 docs/tls-architecture.md
   - 架構圖：Client → ALB (TLS) → Nginx (HTTP:80)
   - 憑證管理責任歸屬、HSTS 說明、CSP 清單

 Step 3.1 — 驗證覆蓋率審計

 - 建立 scripts/audit-validation-coverage.ts
   - 掃描所有 src/calculators/*/index.ts 中 type: 'number' 的欄位
   - 檢查是否有 validationType 或 min/max
   - 32 個 Scoring calculator 用 radio/checkbox 天然受限，標記為已驗證
   - 輸出報告 docs/compliance/VALIDATION_AUDIT.md

 Step 3.2 — 補齊缺失的驗證規則

 - 修改 src/validator.ts — 新增缺失的 ValidationRule 條目
 - 修改 缺少 validationType 的計算器 index.ts 檔案（預計 ~9 個）

 Step 3.3 — 文件化 FHIR 自動填入驗證路徑

 - 在 VALIDATION_AUDIT.md 中記錄：FHIR 資料經由 unified-formula-calculator.ts 的 getValidationRuleForInput()
 走相同驗證管線（已確認）

 ---
 Sprint 2：🟡 i18n 繁體中文（Item 4）

 Step 4.1 — i18n 核心模組

 - 建立 src/i18n/index.ts — t() 函數、setLocale()、getLocale()
   - Key-based JSON 查找，支援參數插值 t('key', { min: 0, max: 150 })
   - 預設語系 zh-TW，fallback 顯示 key 本身
   - localStorage.MEDCALC_LOCALE 持久化
 - 建立 src/i18n/types.ts — TypeScript 型別定義

 Step 4.2 — 翻譯檔

 - 建立 src/i18n/locales/en.json — 英文字串（約 500+ keys）
 - 建立 src/i18n/locales/zh-TW.json — 繁體中文翻譯
 - 分組：app（導航 UI）、category（14 個分類）、validation（驗證訊息）、calculator.*（每個計算器的
 title/description/interpretation）、ui（通用 UI 元素）

 Step 4.3 — 整合 HTML 頁面

 - 修改 index.html — data-i18n 屬性、語言切換按鈕
 - 修改 calculator.html — data-i18n 屬性
 - 修改 src/main.ts — 初始化 i18n、分類名稱翻譯
 - 修改 src/ui-builder.ts — 通用 UI 標籤翻譯

 Step 4.4 — 語言切換元件

 - 建立 src/language-toggle.ts — 仿 theme-toggle 模式
 - 按鈕位置：主題切換旁、顯示 "EN / 中文"
 - 切換時重新載入 locale、hydrate data-i18n 元素

 Step 4.5 — 計算器翻譯

 - i18n 範圍界定：
   - ✅ 翻譯：UI chrome（按鈕、導航、篩選、分類、錯誤訊息）
   - ✅ 雙語：Interpretation 結果（如 "過輕 (Underweight)"，BMI 已有此模式）
   - ❌ 保留英文：臨床選項標籤（如 SOFA: "<400 (+1)"）、公式參考、LOINC codes
 - 修改 92 個 calculator index.ts 的 title/description 使用 i18n key

 Step 4.6 — i18n 測試

 - 建立 src/__tests__/i18n.test.ts — t() 函數、插值、missing key fallback
 - 修改 E2E 測試驗證語言切換

 ---
 Sprint 3：🟡 監控/部署/DR（Item 5-7）

 Step 5.1 — Lighthouse CI 整合

 - 修改 .github/workflows/ci.yml — 新增 lighthouse job
   - npm run build → lhci autorun（使用現有 .lighthouserc.json）

 Step 5.2 — 效能預算

 - 修改 .lighthouserc.json — 新增 SEO assertion、確認現有閾值

 Step 5.3 — 監控告警文件

 - 建立 docs/monitoring-alerts.md — Sentry 告警規則、Uptime 監控設定指南

 Step 6.1 — Docker Registry 推送

 - 修改 .github/workflows/ci.yml docker-build job
   - 新增 GHCR login + push（ghcr.io/${{ github.repository }}:${{ github.sha }} + :latest）

 Step 6.2 — 部署策略文件

 - 建立 docs/deployment-sop.md（或修改現有）
   - Blue-Green 部署流程、Health check 驗證、Rollback 觸發條件、Smoke test

 Step 7.1 — DR 文件強化

 - 修改 docs/disaster-recovery.md
   - Docker image 保留策略（保留最近 5 版）
   - DNS failover 程序
   - 季度 DR 演練排程

 ---
 Sprint 4：🟢 次要項目（Item 8-11）

 Step 8.1 — EHR Write-back 設計

 - 建立 src/fhir-write-service.ts
   - 計算結果 → FHIR Observation.create
   - 附加 Provenance resource（使用現有 provenance-service.ts）
   - Feature flag 控制：window.MEDCALC_CONFIG.enableWriteBack

 Step 9.1 — 提升測試覆蓋率至 65%+

 - 新增測試：calculator-page.ts、main.ts、fhir-data-service.ts
 - 補齊 9 個缺少 golden dataset 的計算器

 Step 9.2 — 多瀏覽器 E2E

 - 修改 .github/workflows/ci.yml — 啟用 Firefox + WebKit

 Step 10.1 — 資源優化

 - 圖片轉 WebP、CSP 收窄（部署時確定 FHIR server domain）

 Step 11.1 — 無障礙補強

 - 修改 CSS — 新增 @media (prefers-reduced-motion: reduce) 停用動畫
 - 建立 css/themes/high-contrast.css（或 @media (prefers-contrast: high)）
 - Lighthouse CI 自動偵測對比度問題

 ---
 驗證方式

 1. SOUP/Traceability 腳本：npm run generate:soup && npm run generate:traceability → 檢查生成的 .md 文件
 2. 驗證審計：npm run audit:validation → 確認所有數值欄位有驗證
 3. i18n：手動切換語言 → 確認 UI 顯示繁中；npm test 通過 i18n 測試
 4. Nginx：docker compose up → 透過 curl -H "X-Forwarded-Proto: http" 測試重導
 5. CI：Push 後確認 Lighthouse CI job 通過
 6. 全局：npm test（3408+ tests pass）、npm run build（Vite build 成功）、npx playwright test（E2E pass）

 關鍵檔案清單

 ┌─────────────────────────────────────────┬───────────────────────────────────────────┐
 │                  檔案                   │                   操作                    │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ scripts/generate-soup-list.ts           │ 新建                                      │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ scripts/generate-traceability-matrix.ts │ 新建                                      │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ scripts/audit-validation-coverage.ts    │ 新建                                      │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ docs/compliance/SOUP_LIST.md            │ 覆寫（自動生成）                          │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ docs/compliance/TRACEABILITY_MATRIX.md  │ 覆寫（自動生成）                          │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ docs/compliance/RISK_MANAGEMENT.md      │ 擴展                                      │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ docs/compliance/SRS.md                  │ 擴展                                      │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ docs/compliance/QMS_LITE.md             │ 新建                                      │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ docs/compliance/USABILITY_TESTING.md    │ 新建                                      │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ docs/ARCHITECTURE.md                    │ 新增安全章節                              │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ docs/tls-architecture.md                │ 新建                                      │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ docs/monitoring-alerts.md               │ 新建                                      │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ docs/deployment-sop.md                  │ 新建或修改                                │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ docs/disaster-recovery.md               │ 強化                                      │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ docs/compliance/VALIDATION_AUDIT.md     │ 新建（自動生成）                          │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ nginx.conf                              │ 修改（proxy trust + redirect）            │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ src/validator.ts                        │ 補齊規則                                  │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ src/i18n/index.ts                       │ 新建                                      │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ src/i18n/types.ts                       │ 新建                                      │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ src/i18n/locales/en.json                │ 新建                                      │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ src/i18n/locales/zh-TW.json             │ 新建                                      │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ src/language-toggle.ts                  │ 新建                                      │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ src/fhir-write-service.ts               │ 新建                                      │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ index.html                              │ 修改（i18n + 語言切換）                   │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ calculator.html                         │ 修改（i18n）                              │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ src/main.ts                             │ 修改（i18n 初始化）                       │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ src/ui-builder.ts                       │ 修改（i18n 標籤）                         │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ src/calculators/*/index.ts              │ 修改（i18n keys, ~92 個）                 │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ .github/workflows/ci.yml                │ 修改（Lighthouse + GHCR + multi-browser） │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ .lighthouserc.json                      │ 修改（SEO assertion）                     │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ package.json                            │ 新增 scripts                              │
 ├─────────────────────────────────────────┼───────────────────────────────────────────┤
 │ css/_base.css 或相關                    │ 修改（prefers-reduced-motion）            │
 └─────────────────────────────────────────┴───────────────────────────────────────────┘