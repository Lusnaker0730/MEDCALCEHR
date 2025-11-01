# SMART on FHIR 啟動指南

本指南說明如何使用 Docker 環境透過 SMART on FHIR 啟動 CGMH EHRCALC 應用程式。

## 前置準備

### 1. 重建 Docker 容器以包含 launch.html

```bash
# 停止現有容器
cd MEDCALCEHR
docker-compose down

# 重新建置映像檔（包含 launch.html）
docker-compose build --no-cache

# 啟動容器
docker-compose up -d

# 查看日誌確認正常運行
docker-compose logs -f
```

**Windows PowerShell:**
```powershell
cd MEDCALCEHR
.\start-docker.ps1
```

### 2. 確認應用程式可訪問

- 本地訪問：http://localhost:8080
- 網路訪問：http://YOUR_IP:8080

**重要**：SMART on FHIR 需要應用程式可從外部訪問（EHR 需要重定向到您的應用程式）。

## 啟動方式

### 方式一：從 SMART Health IT 沙盒啟動（推薦用於測試）

這是最簡單的測試方式，使用 SMART Health IT 提供的公開沙盒環境。

#### 步驟：

1. **訪問 SMART Launcher**
   - 前往：https://launch.smarthealthit.org/

2. **配置啟動參數**
   ```
   App Launch URL: http://localhost:8080/launch.html
   或
   App Launch URL: http://YOUR_IP:8080/launch.html
   
   FHIR Version: R4 (FHIR 4.0.1)
   
   Patient: 選擇任一測試病患（例如：Elden718 Halvorson124）
   
   Provider: 選擇任一醫療提供者
   
   Scope: 
   ✓ openid fhirUser
   ✓ launch/patient
   ✓ patient/Patient.read
   ✓ patient/Observation.read
   ✓ online_access
   ```

3. **點擊 "Launch App!"**
   - 系統會將您重定向到 `launch.html`
   - `launch.html` 會觸發 OAuth2 認證流程
   - 認證成功後會重定向到 `index.html` 並載入病患資料

#### 常見問題：

**問題：點擊 Launch 後出現 404 錯誤**
- **原因**：Docker 容器沒有包含 `launch.html`
- **解決**：重新建置 Docker 映像（見上方步驟 1）

**問題：顯示 "FHIR client not ready"**
- **原因**：OAuth2 認證流程未完成
- **解決**：
  1. 清除瀏覽器 sessionStorage
  2. 確認 URL 包含 `state` 參數
  3. 檢查瀏覽器控制台的錯誤訊息

**問題：無法從外部訪問 localhost**
- **原因**：localhost 只能從本機訪問
- **解決**：
  - 使用您的電腦 IP 位址（如 `http://192.168.1.100:8080/launch.html`）
  - 或使用 ngrok 建立公開 URL（見下方）

### 方式二：使用 ngrok 建立公開 URL（建議）

如果您想從外部網路測試，可以使用 ngrok：

```bash
# 安裝 ngrok (訪問 https://ngrok.com/)

# 建立公開 URL
ngrok http 8080
```

ngrok 會顯示類似以下的 URL：
```
Forwarding: https://abc123.ngrok.io -> http://localhost:8080
```

然後在 SMART Launcher 中使用：
```
App Launch URL: https://abc123.ngrok.io/launch.html
```

### 方式三：從真實 EHR 系統啟動（生產環境）

在生產環境中，您需要在 EHR 系統中註冊您的應用程式。

#### Epic EHR 範例：

1. **在 Epic App Orchard 註冊應用程式**
   - 訪問：https://apporchard.epic.com/
   - 註冊您的應用程式
   - 獲取 `client_id`

2. **更新 launch.html 設定**
   ```javascript
   FHIR.oauth2.authorize({
       client_id: 'YOUR_EPIC_CLIENT_ID',  // 從 Epic 獲得
       scope: 'launch/patient patient/Patient.read patient/Observation.read',
       redirect_uri: 'https://yourdomain.com/index.html'
   });
   ```

3. **在 Epic 中設定重定向 URI**
   - Launch URI: `https://yourdomain.com/launch.html`
   - Redirect URI: `https://yourdomain.com/index.html`

#### Cerner EHR 範例：

1. **在 Cerner Code Console 註冊**
   - 訪問：https://code-console.cerner.com/
   
2. **獲取憑證並更新設定**

## 檢查清單

啟動前確認：

- [ ] Docker 容器正在運行（`docker ps` 顯示 medcalcehr-app）
- [ ] 可以訪問 http://localhost:8080/index.html
- [ ] 可以訪問 http://localhost:8080/launch.html（不應該是 404）
- [ ] 瀏覽器控制台沒有 CSP 或 CORS 錯誤
- [ ] 使用正確的 FHIR 版本（R4）

## 認證流程說明

```
EHR → launch.html (帶 iss 和 launch 參數)
     ↓
launch.html 呼叫 FHIR.oauth2.authorize()
     ↓
重定向到 EHR 的授權端點
     ↓
用戶登入/授權（在測試環境中自動完成）
     ↓
重定向回 index.html (帶 code 和 state 參數)
     ↓
index.html 載入 FHIR client
     ↓
FHIR.oauth2.ready() 初始化完成
     ↓
載入病患資料並顯示
```

## 除錯技巧

### 查看 Docker 日誌
```bash
docker-compose logs -f medcalcehr
```

### 檢查檔案是否在容器中
```bash
docker exec -it medcalcehr-app ls -la /usr/share/nginx/html/
```

應該看到 `launch.html` 在列表中。

### 瀏覽器開發者工具

1. **Network 標籤**：查看 HTTP 請求和響應
2. **Console 標籤**：查看 JavaScript 錯誤
3. **Application → Session Storage**：查看 SMART_KEY

### 測試 URL

- 首頁：http://localhost:8080/
- 啟動頁面：http://localhost:8080/launch.html
- 計算器頁面：http://localhost:8080/calculator.html?name=bmi-bsa

## 安全性注意事項

1. **生產環境必須使用 HTTPS**
   - SMART on FHIR 要求在生產環境使用 HTTPS
   - 測試環境（localhost）可以使用 HTTP

2. **更新 CSP 標頭**
   - 如果連接到不同的 FHIR 伺服器，需要更新 `nginx.conf` 中的 CSP 設定

3. **保護 client_secret**
   - 如果使用機密客戶端（confidential client），不要在前端程式碼中暴露 secret
   - 考慮使用後端代理處理 OAuth2 令牌交換

## 常用測試環境

### SMART Health IT
- Launcher: https://launch.smarthealthit.org/
- 文件: https://docs.smarthealthit.org/

### Epic Sandbox
- App Orchard: https://apporchard.epic.com/
- 文件: https://fhir.epic.com/

### Cerner Sandbox
- Code Console: https://code-console.cerner.com/
- 文件: https://fhir.cerner.com/

## 支援

如遇問題，檢查：
1. Docker 容器日誌
2. 瀏覽器開發者控制台
3. FHIR 客戶端錯誤訊息
4. 網路連線和防火牆設定

