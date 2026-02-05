# AuditEvent 稽核服務使用指南

本文件說明如何在 MedCalc EHR 應用程式中使用 AuditEvent 稽核服務，遵循 IHE BALP (Basic Audit Log Patterns) 規範。

## 概述

AuditEvent 服務提供符合 FHIR 標準的稽核日誌功能，用於追蹤：
- 使用者登入/登出
- 病患資料存取
- FHIR 資源讀取
- 醫療計算執行
- 資料匯出
- 安全事件警示

## 基本使用

### 1. 匯入服務

```typescript
import { auditEventService } from './audit-event-service.js';
```

### 2. 設定使用者情境

```typescript
// 設定執業者 (登入時自動執行)
auditEventService.setPractitioner('practitioner-123', 'Dr. Smith', 'Physician');

// 設定病患情境
auditEventService.setPatientContext('patient-456', 'John Doe');
```

### 3. 記錄登入事件

```typescript
// 登入成功
await auditEventService.logLogin('practitioner-123', 'Dr. Smith', true);

// 登入失敗
await auditEventService.logLogin('practitioner-123', 'Dr. Smith', false);
```

### 4. 記錄病患資料存取

```typescript
await auditEventService.logPatientAccess(
    'patient-456',     // 病患 ID
    'John Doe',        // 病患姓名
    'Observation',     // 資源類型 (選填)
    'obs-789'          // 資源 ID (選填)
);
```

### 5. 記錄 FHIR 資源讀取

```typescript
await auditEventService.logResourceRead(
    'Observation',           // 資源類型
    'obs-789',              // 資源 ID
    'code=2160-0'           // 查詢參數 (選填)
);
```

### 6. 記錄醫療計算

```typescript
await auditEventService.logCalculation(
    'bmi-calc',              // 計算器 ID
    'BMI Calculator',        // 計算器名稱
    {                        // 輸入值
        weight: 70,
        height: 175
    },
    {                        // 結果
        bmi: 22.9,
        category: 'Normal'
    },
    true                     // 是否成功
);
```

### 7. 記錄資料匯出

```typescript
await auditEventService.logDataExport(
    'PDF',                           // 匯出類型
    ['Patient', 'Observation'],      // 包含的資源類型
    10                               // 記錄數量
);
```

### 8. 記錄安全警示

```typescript
await auditEventService.logSecurityAlert(
    'UNAUTHORIZED_ACCESS',           // 警示類型
    '嘗試存取未授權的資源',           // 描述
    'high'                           // 嚴重程度: 'low' | 'medium' | 'high' | 'critical'
);
```

## 進階使用

### 自訂稽核事件

```typescript
const event = auditEventService.createAuditEvent({
    eventType: 'patient-record-access',
    action: 'R',           // C=Create, R=Read, U=Update, D=Delete, E=Execute
    outcome: '0',          // 0=成功, 4=小問題, 8=嚴重問題, 12=重大問題
    outcomeDescription: '病歷讀取成功',
    purposeOfUse: 'TREAT', // 目的：治療
    agents: [
        {
            type: 'practitioner',
            id: 'practitioner-123',
            name: 'Dr. Smith',
            role: 'Physician',
            requestor: true
        }
    ],
    entities: [
        {
            type: 'patient',
            what: 'Patient/patient-456',
            name: 'John Doe',
            securityLabel: ['N']  // N=Normal, R=Restricted, V=Very Restricted
        }
    ],
    additionalInfo: {
        department: 'Cardiology',
        reason: 'Annual checkup'
    }
});

await auditEventService.recordEvent(event);
```

### 匯出稽核記錄

```typescript
// 匯出為 JSON
const json = auditEventService.exportEventsAsJson();

// 匯出為 FHIR Bundle
const bundle = auditEventService.exportEventsAsBundle();
```

### 設定 FHIR 伺服器

```typescript
import { createAuditEventService } from './audit-event-service.js';

const customAuditService = createAuditEventService({
    fhirServerUrl: 'https://fhir-server.example.com',
    applicationId: 'my-app',
    applicationName: 'My Healthcare App',
    applicationVersion: '2.0.0',
    siteId: 'hospital-abc',
    enableLocalStorage: true,
    maxLocalEvents: 500,
    enableDebugLogging: true
});
```

## 在計算器中整合

### 範例：BMI 計算器

```typescript
// src/calculators/bmi-bsa/index.ts
import { auditEventService } from '../../audit-event-service.js';

export function initialize(client, patient, container) {
    const calculateButton = container.querySelector('#calculate-btn');

    calculateButton?.addEventListener('click', async () => {
        const weight = parseFloat(container.querySelector('#weight').value);
        const height = parseFloat(container.querySelector('#height').value);

        const bmi = weight / ((height / 100) ** 2);
        const category = getBMICategory(bmi);

        // 顯示結果
        container.querySelector('#result').textContent = `BMI: ${bmi.toFixed(1)} (${category})`;

        // 記錄稽核事件
        await auditEventService.logCalculation(
            'bmi-bsa',
            'BMI/BSA Calculator',
            { weight, height },
            { bmi: bmi.toFixed(1), category },
            true
        );
    });
}
```

## 離線支援

稽核服務支援離線模式：
- 當網路不可用時，事件會儲存在 localStorage
- 網路恢復時，會自動嘗試上傳待處理的事件
- 可設定最大本地儲存事件數量 (預設 1000 筆)

```typescript
// 取得待處理事件數量
const pendingCount = auditEventService.getPendingEventCount();

// 手動清除本地事件
auditEventService.clearLocalEvents();

// 手動上傳待處理事件
await auditEventService.flushPendingEvents();
```

## 安全注意事項

1. **敏感資料過濾**：服務會自動過濾敏感欄位（如 SSN、密碼等）
2. **最小權限原則**：僅記錄必要的資訊
3. **保留期限**：稽核記錄應依法規保留足夠時間（建議 7 年）
4. **完整性保護**：建議將稽核記錄傳送至集中式 SIEM 系統

## 符合的規範

- **IHE BALP** (Basic Audit Log Patterns)
- **FHIR AuditEvent** Resource (R4/R5)
- **DICOM** Audit Event Codes
- **HL7 Confidentiality Codes**
- **台灣電子病歷製作及管理辦法**

## 稽核事件類型對照表

| 事件類型 | DCM/FHIR Code | 說明 |
|---------|---------------|------|
| `rest` | rest | RESTful 操作 |
| `login` | 110122 | 使用者登入 |
| `logout` | 110123 | 使用者登出 |
| `patient-record-access` | 110110 | 病患記錄存取 |
| `data-export` | 110106 | 資料匯出 |
| `calculation` | CALCULATE | 醫療計算 |
| `consent-decision` | 110142 | 同意書相關 |
| `security-alert` | 110113 | 安全警示 |

## 結果碼對照表

| 代碼 | 說明 |
|-----|------|
| `0` | 成功 (Success) |
| `4` | 小問題 (Minor Failure) |
| `8` | 嚴重問題 (Serious Failure) |
| `12` | 重大問題 (Major Failure) |
