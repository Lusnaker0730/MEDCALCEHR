# 🛡️ MedCalcEHR 資安掃描報告

**日期**: 2025-11-21
**掃描工具**: npm audit, 靜態代碼分析 (SAST), 手動配置審查

## 1. 依賴套件安全性 (Dependency Audit)

### 掃描結果
初始掃描發現 2 個漏洞：
- `glob`: High severity (Command Injection)
- `js-yaml`: Moderate severity (Prototype Pollution)

### 修復狀態
✅ **已修復**。執行了 `npm audit fix`，目前無已知漏洞。

## 2. 靜態代碼分析 (Static Analysis)

### 跨站腳本攻擊 (XSS) 風險
- **發現**: 專案中大量使用了 `innerHTML` 用於動態渲染計算器結果。
- **風險評估**: 
  - 大部分 `innerHTML` 用於插入靜態模板或數字計算結果，風險較低。
  - 少數地方 (如 `abg-analyzer`, `ttkg`) 插入了動態生成的字符串。
- **建議**: 
  - 在將 FHIR 獲取的純文本數據（如患者姓名、觀察備註）插入 HTML 之前，務必進行轉義。
  - 考慮使用 `textContent` 替代 `innerHTML` 當不需要渲染 HTML 標籤時。

### 敏感信息泄露
- **掃描結果**: 未發現硬編碼的 API Key、密碼或 Token。
- **狀態**: ✅ 安全。

### 不安全通信 (HTTP vs HTTPS)
- **掃描結果**: 未發現代碼中發起不安全的 `http://` 外部請求。
- **狀態**: ✅ 安全。

## 3. 基礎設施配置 (Nginx)

### 掃描結果
`nginx.conf` 配置了多項安全措施：
- ✅ `X-Frame-Options: SAMEORIGIN` (防止點擊劫持)
- ✅ `X-Content-Type-Options: nosniff` (防止 MIME 類型嗅探)
- ✅ `Content-Security-Policy` (限制資源加載來源)
- ✅ 禁止訪問隱藏文件 (`/\.`)

### 優化措施
- ✅ 添加了 `server_tokens off;` 以隱藏 Nginx 版本號，減少被針對特定版本攻擊的風險。

## 4. 綜合建議

1. **持續監控依賴**: 定期運行 `npm audit` 以確保依賴項安全。
2. **CSP 優化**: 目前 CSP 允許 `'unsafe-inline'`，這在現代 Web 應用中很常見但略有風險。如果未來進行大規模重構，建議移除內聯腳本和樣式，改為外部文件。
3. **FHIR 數據清理**: 雖然目前主要處理數值數據，但若未來展示患者備註或非結構化文本，必須實施 HTML 轉義機制。

