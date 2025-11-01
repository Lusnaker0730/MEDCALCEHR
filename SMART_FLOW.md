# SMART on FHIR 認證流程說明

## 📊 完整認證流程圖

```
┌─────────────────────────────────────────────────────────────────┐
│                    SMART on FHIR 認證流程                        │
└─────────────────────────────────────────────────────────────────┘

步驟 1: 從 EHR 或 SMART Launcher 啟動
┌──────────────────┐
│  EHR / Launcher  │
│                  │
│ 點擊啟動應用程式  │
└────────┬─────────┘
         │
         │ 重定向到 launch.html
         │ 帶參數: ?iss=...&launch=...
         ▼
┌──────────────────────────────────────────────────────┐
│  launch.html                                         │
│  http://localhost:8080/launch.html?iss=...&launch=...│
│                                                       │
│  載入 FHIR Client 庫                                  │
│  執行: FHIR.oauth2.authorize({                        │
│    client_id: 'my-app',                              │
│    scope: 'launch/patient patient/*.read',           │
│    redirect_uri: './index.html'                      │
│  })                                                  │
└────────┬─────────────────────────────────────────────┘
         │
         │ 觸發 OAuth2 授權請求
         ▼
┌──────────────────┐
│  EHR 授權伺服器   │
│                  │
│  用戶登入/授權    │
│  (測試環境自動)   │
└────────┬─────────┘
         │
         │ 授權成功
         │ 重定向回 index.html
         │ 帶參數: ?code=...&state=...
         ▼
┌──────────────────────────────────────────────────────┐
│  index.html                                          │
│  http://localhost:8080/index.html?code=...&state=... │
│                                                       │
│  檢測到 state 參數 → 跳過重定向邏輯                   │
│  載入 FHIR Client 庫                                  │
│  執行: FHIR.oauth2.ready()                           │
└────────┬─────────────────────────────────────────────┘
         │
         │ 交換授權碼獲取存取令牌
         │ 初始化 FHIR 客戶端
         ▼
┌──────────────────────────────────────────────────────┐
│  FHIR 客戶端就緒                                      │
│                                                       │
│  ✓ 已取得存取令牌                                     │
│  ✓ 已取得病患上下文 (patient.id)                      │
│  ✓ 可以存取 FHIR API                                 │
└────────┬─────────────────────────────────────────────┘
         │
         │ 呼叫 displayPatientInfo(client, div)
         ▼
┌──────────────────────────────────────────────────────┐
│  API 請求: GET /Patient/{id}                          │
│  → 取得病患基本資料 (姓名、生日、性別)                 │
│                                                       │
│  API 請求: GET /Observation?patient={id}&code=...     │
│  → 取得實驗室數據 (需要時)                            │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│  顯示病患資訊                                         │
│  ┌────────────────────────────────────────────────┐ │
│  │ 👤 病患資訊                                     │ │
│  │ 姓名: John Doe                                 │ │
│  │ 出生日期: 1980-01-01 (年齡: 45)                │ │
│  │ 性別: Male                                     │ │
│  └────────────────────────────────────────────────┘ │
│                                                       │
│  ✓ 可以使用所有計算器                                 │
│  ✓ 計算器可以自動填入病患數據                          │
│  ✓ 可以查詢實驗室數據                                 │
└───────────────────────────────────────────────────────┘
```

## 🔑 關鍵檔案說明

### 1. launch.html
**目的**：啟動 OAuth2 認證流程

**何時使用**：
- 從 EHR 系統啟動應用程式時
- 首次訪問需要病患上下文時

**做什麼**：
```javascript
FHIR.oauth2.authorize({
    client_id: 'my-app',           // 應用程式 ID
    iss: 'FHIR伺服器URL',          // 從 URL 參數取得
    scope: '權限列表',              // 請求的權限
    redirect_uri: './index.html'   // 認證後返回的頁面
});
```

### 2. index.html
**目的**：應用程式主頁面，顯示計算器列表

**認證檢查邏輯**：
```javascript
// 如果沒有 OAuth state 且沒有已存在的 session，重定向到 launch
if (!/state=/.test(location.search) && !sessionStorage.getItem('SMART_KEY')) {
    window.location.href = 'launch.html';
}
```

**初始化 FHIR 客戶端**：
```javascript
FHIR.oauth2.ready()
    .then(client => {
        // 客戶端就緒，可以存取 FHIR API
        displayPatientInfo(client, patientInfoDiv);
    })
    .catch(error => {
        // 認證失敗，使用快取或顯示錯誤
        console.log('FHIR client not ready');
    });
```

### 3. calculator.html
**目的**：顯示單個計算器

**行為**：
- 同樣嘗試初始化 FHIR 客戶端
- 如果成功，可以自動填入病患數據
- 如果失敗，仍可手動輸入使用

## 🔄 URL 參數說明

### 啟動時 (launch.html)
```
http://localhost:8080/launch.html?iss=FHIR_SERVER&launch=LAUNCH_TOKEN
```
- `iss`: FHIR 伺服器的基礎 URL
- `launch`: EHR 提供的啟動令牌（包含病患上下文）

### 認證後 (index.html)
```
http://localhost:8080/index.html?code=AUTH_CODE&state=STATE_TOKEN
```
- `code`: 授權碼（用於交換存取令牌）
- `state`: 狀態令牌（防止 CSRF 攻擊）

## 💾 Session Storage

FHIR 客戶端使用 sessionStorage 儲存：
```javascript
{
    'SMART_KEY': {
        serverUrl: 'FHIR伺服器URL',
        tokenResponse: {
            access_token: '存取令牌',
            patient: '病患ID',
            expires_in: 3600
        }
    },
    'patientData': '病患資料的 JSON 字串'
}
```

**檢查方式**：
1. 開啟開發者工具 (F12)
2. Application → Session Storage → http://localhost:8080
3. 查看 `SMART_KEY` 和 `patientData`

## 🧪 測試場景

### 場景 1: 正常啟動（有 SMART 認證）
```
1. SMART Launcher → launch.html?iss=...&launch=...
2. OAuth2 認證
3. index.html?code=...&state=...
4. 客戶端初始化成功
5. 顯示病患資訊 ✓
```

### 場景 2: 直接訪問（無認證）
```
1. 直接訪問 index.html
2. 檢查沒有 state 參數
3. 檢查沒有 SMART_KEY
4. 自動重定向到 launch.html
5. 使用預設 iss 啟動認證
```

### 場景 3: 已有 Session
```
1. 訪問 index.html
2. 檢查到 sessionStorage 有 SMART_KEY
3. 不重定向，直接初始化
4. 使用快取的病患資料 ✓
```

### 場景 4: 離線模式
```
1. 直接訪問 calculator.html?name=bmi-bsa
2. FHIR 客戶端初始化失敗
3. 顯示 "FHIR client not ready"
4. 仍可手動輸入使用計算器 ✓
```

## 🐛 常見錯誤診斷

### "FHIR client not ready"
**原因**：
- 沒有經過 OAuth2 認證流程
- Session 已過期
- 認證失敗

**解決**：
1. 清除 sessionStorage
2. 重新從 SMART Launcher 啟動

### "404 Not Found" (訪問 launch.html)
**原因**：
- Docker 容器不包含 launch.html

**解決**：
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### "Failed to initialize SMART on FHIR client"
**原因**：
- 網路連線問題
- FHIR 伺服器無法訪問
- client_id 不正確

**解決**：
1. 檢查網路連線
2. 確認 FHIR 伺服器 URL 正確
3. 檢查瀏覽器控制台的詳細錯誤訊息

### "No patient data available"
**原因**：
- 認證成功但沒有病患上下文
- 啟動時沒有選擇病患

**解決**：
1. 在 SMART Launcher 中選擇病患
2. 確保 scope 包含 `launch/patient`

## 📚 延伸閱讀

- [SMART App Launch 規範](http://hl7.org/fhir/smart-app-launch/)
- [FHIR Client JavaScript 文件](https://github.com/smart-on-fhir/client-js)
- [OAuth 2.0 授權碼流程](https://oauth.net/2/grant-types/authorization-code/)

---

**提示**：使用 http://localhost:8080/health-check.html 可以自動檢查系統狀態！

