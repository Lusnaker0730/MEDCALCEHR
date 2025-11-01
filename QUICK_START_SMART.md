# SMART on FHIR 快速啟動指南

## 🚀 5 分鐘快速設定

### 步驟 1：重建 Docker 容器

```powershell
# 執行重建腳本（Windows）
cd MEDCALCEHR
.\rebuild-docker.ps1
```

**或手動執行：**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 步驟 2：驗證安裝

訪問健康檢查頁面：
```
http://localhost:8080/health-check.html
```

所有檢查項目應顯示 ✅

### 步驟 3：測試 SMART 啟動

1. **開啟 SMART Launcher**
   ```
   https://launch.smarthealthit.org/
   ```

2. **配置啟動參數**
   ```
   App Launch URL:  http://localhost:8080/launch.html
   FHIR Version:    R4 (FHIR 4.0.1)
   ```

3. **選擇測試病患**
   - 任選一位病患（例如：Elden718 Halvorson124）
   - 保持預設 scope 設定

4. **點擊 "Launch App!"**

5. **成功！**
   - 應該會看到病患資訊顯示在頁面上方
   - 可以開始使用計算器

---

## 🔧 故障排除

### 問題：點擊 Launch 後顯示 404

**原因**：Docker 容器沒有包含 `launch.html`

**解決**：
```powershell
.\rebuild-docker.ps1
```

### 問題：顯示 "FHIR client not ready"

**原因**：OAuth2 認證流程未完成

**解決**：
1. 清除瀏覽器 sessionStorage（F12 → Application → Session Storage → Clear）
2. 重新從 SMART Launcher 啟動
3. 確認 URL 包含 `state` 和 `code` 參數

### 問題：無法從外部訪問 localhost

**原因**：localhost 只能從本機訪問

**解決方案 A - 使用 IP 位址**：
```powershell
# 查看您的 IP（Windows）
ipconfig

# 然後使用 IP 而不是 localhost
App Launch URL: http://192.168.1.100:8080/launch.html
```

**解決方案 B - 使用 ngrok**：
```bash
# 安裝 ngrok: https://ngrok.com/
ngrok http 8080

# 使用 ngrok 提供的 URL
App Launch URL: https://abc123.ngrok.io/launch.html
```

---

## 📋 檢查清單

在聯繫支援前，請確認：

- [ ] Docker Desktop 正在運行
- [ ] 執行 `docker ps` 看到 `medcalcehr-app` 容器
- [ ] 可以訪問 http://localhost:8080/
- [ ] 可以訪問 http://localhost:8080/launch.html（不是 404）
- [ ] 健康檢查全部通過：http://localhost:8080/health-check.html
- [ ] 瀏覽器控制台沒有錯誤（F12 → Console）
- [ ] 網路標籤顯示請求成功（F12 → Network）

---

## 🌐 SMART Launcher 設定參考

### 最小化設定（適合快速測試）

```yaml
App Launch URL: http://localhost:8080/launch.html
FHIR Version: R4
Patient: 任選
Scope: 保持預設
```

### 完整設定（適合開發）

```yaml
App Launch URL: http://localhost:8080/launch.html
FHIR Version: R4 (FHIR 4.0.1)
Launch Type: Provider EHR Launch
Patient: Elden718 Halvorson124 (或任選)
Provider: Dr. Physician
Scopes:
  ✓ openid fhirUser
  ✓ launch/patient
  ✓ patient/Patient.read
  ✓ patient/Observation.read
  ✓ patient/Condition.read
  ✓ patient/MedicationRequest.read
  ✓ online_access
```

---

## 🔗 有用的連結

### 應用程式
- 首頁：http://localhost:8080/
- 啟動頁：http://localhost:8080/launch.html
- 健康檢查：http://localhost:8080/health-check.html
- 測試計算器：http://localhost:8080/calculator.html?name=bmi-bsa

### SMART on FHIR 資源
- SMART Launcher：https://launch.smarthealthit.org/
- SMART 文件：https://docs.smarthealthit.org/
- FHIR Client 文件：https://github.com/smart-on-fhir/client-js

### EHR 沙盒環境
- Epic App Orchard：https://apporchard.epic.com/
- Cerner Code Console：https://code-console.cerner.com/

---

## 💡 提示

### 開發模式
開發時可以直接訪問 `index.html` 而不透過 SMART 啟動：
```
http://localhost:8080/index.html
```
這會顯示 "FHIR client not ready" 但仍可使用所有計算器。

### 本地測試病患資料
開發時可以手動在 sessionStorage 中設定測試資料：
```javascript
// 在瀏覽器控制台執行
sessionStorage.setItem('patientData', JSON.stringify({
    name: [{ given: ['Test'], family: 'Patient' }],
    birthDate: '1980-01-01',
    gender: 'male'
}));
location.reload();
```

### 查看 Docker 日誌
```bash
docker-compose logs -f
```

### 進入容器檢查檔案
```bash
docker exec -it medcalcehr-app sh
ls -la /usr/share/nginx/html/
```

---

## 📞 需要更多幫助？

- 詳細指南：[SMART_LAUNCH_GUIDE.md](SMART_LAUNCH_GUIDE.md)
- Docker 文件：[README_DOCKER.md](README_DOCKER.md)
- 專案 README：[README.md](README.md)

---

**最後更新**：2025-11-01
**版本**：1.0.0

