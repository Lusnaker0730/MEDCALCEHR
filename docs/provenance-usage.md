# Provenance 資料溯源服務使用指南

本文件說明如何在 MedCalc EHR 應用程式中使用 FHIR Provenance 服務進行資料溯源追蹤，遵循 TW Core IG (台灣核心實作指引) 規範。

## 概述

Provenance 服務提供符合 FHIR 標準的資料溯源功能，用於追蹤：
- 誰創建/修改了資料 (Agent)
- 何時創建/修改 (Recorded/Occurred)
- 使用什麼應用程式 (Device/Application)
- 資料來源 (Entity - Source)
- 數位簽章 (Signature) - 不可否認性
- 資料流向 (本院產生、病患上傳、跨院交換)

## 基本使用

### 1. 匯入服務

```typescript
import { provenanceService } from './provenance-service.js';
```

### 2. 設定情境

```typescript
// 設定執業者情境
provenanceService.setPractitioner(
    'practitioner-123',      // ID
    'Dr. Smith',             // 姓名
    'Organization/org-1'     // 所屬機構 (選填)
);

// 設定病患情境
provenanceService.setPatientContext('patient-456', 'John Doe');
```

### 3. 記錄資料創建

```typescript
await provenanceService.recordDataCreation(
    'Observation/obs-123',           // 目標資源參照
    'Blood Glucose Measurement',     // 顯示名稱
    'internal',                      // 資料來源類型
    'Routine lab work'               // 原因 (選填)
);
```

### 4. 記錄資料更新

```typescript
await provenanceService.recordDataUpdate(
    'Observation/obs-123',           // 目標資源
    'Updated Blood Glucose',         // 顯示名稱
    'Observation/obs-122',           // 前一版本參照 (選填)
    'Correction of measurement'      // 原因 (選填)
);
```

### 5. 記錄醫療計算

```typescript
await provenanceService.recordCalculation({
    calculatorId: 'ckd-epi',
    calculatorName: 'CKD-EPI eGFR Calculator',
    inputs: { creatinine: 1.2, age: 65, gender: 'male' },
    outputs: { egfr: 58.5, stage: 'G3a' },
    timestamp: new Date(),
    patientId: 'patient-456',
    practitionerId: 'practitioner-123'
});
```

### 6. 記錄資料衍生 (Derivation)

```typescript
await provenanceService.recordDerivation(
    'Observation/egfr-result',       // 目標 (計算結果)
    'Calculated eGFR',               // 顯示名稱
    [                                // 來源資料
        { reference: 'Observation/creatinine', display: 'Serum Creatinine' },
        { reference: 'Patient/patient-456', display: 'Patient Demographics' }
    ],
    'eGFR calculated using CKD-EPI formula'
);
```

## 資料來源類型

| 類型 | 說明 | 使用場景 |
|-----|------|---------|
| `internal` | 本院產生 | 院內檢驗、診斷 |
| `patient-upload` | 病患上傳 | PHR、自我量測數據 |
| `cross-hospital` | 跨院交換 | 電子病歷交換、轉診 |
| `external-system` | 外部系統 | 第三方整合 |
| `manual-entry` | 人工輸入 | 手動鍵入資料 |
| `device` | 設備產生 | 醫療儀器自動上傳 |
| `calculated` | 計算衍生 | 醫療計算器結果 |

## 跨院交換記錄

```typescript
await provenanceService.recordCrossHospitalExchange(
    'Observation/ext-123',           // 目標資源
    'External Lab Result',           // 顯示名稱
    {                                // 來源機構
        id: 'org-external',
        name: '台北榮民總醫院'
    },
    'Patient referral data'          // 原因 (選填)
);
```

## 病患上傳資料記錄

```typescript
await provenanceService.recordPatientUpload(
    'DocumentReference/doc-123',     // 目標資源
    'Patient Uploaded Document',     // 顯示名稱
    'patient-456',                   // 病患 ID
    'John Doe',                      // 病患姓名
    'Self-reported medication list'  // 原因 (選填)
);
```

## 數位簽章

### 記錄帶簽章的資料

```typescript
const signatureData = 'base64EncodedSignature...'; // HCA 卡簽章

await provenanceService.recordWithSignature(
    'DiagnosticReport/report-123',
    'Signed Diagnostic Report',
    'VERIFY',                        // 活動類型
    signatureData,
    'authorship'                     // 簽章類型
);
```

### 簽章類型

| 類型 | 說明 |
|-----|------|
| `authorship` | 作者簽章 |
| `witness` | 見證簽章 |
| `verification` | 驗證簽章 |
| `validation` | 確認簽章 |
| `consent` | 同意簽章 |

## 資料系譜報告

```typescript
// 取得資源的完整資料系譜
const report = provenanceService.generateLineageReport('Observation/obs-123');

console.log(report);
// {
//   target: 'Observation/obs-123',
//   records: [...],           // 所有相關的 Provenance 記錄
//   sources: [...],           // 所有來源資源
//   agents: [...],            // 所有參與者
//   activities: [...],        // 所有活動類型
//   timeline: [               // 時間軸
//     { date: '2024-01-15T10:00:00Z', activity: 'Create', agent: 'Dr. Smith' },
//     { date: '2024-01-16T14:30:00Z', activity: 'Update', agent: 'Dr. Chen' }
//   ]
// }
```

## 在計算器中整合

### 範例：CKD-EPI eGFR 計算器

```typescript
// src/calculators/ckd-epi/index.ts
import { fhirDataService } from '../../fhir-data-service.js';

export async function initialize(client, patient, container) {
    // ... 計算器初始化 ...

    const calculateButton = container.querySelector('#calculate-btn');
    calculateButton?.addEventListener('click', async () => {
        // 取得輸入值
        const creatinine = parseFloat(container.querySelector('#creatinine').value);
        const age = fhirDataService.getPatientAge();
        const gender = fhirDataService.getPatientGender();

        // 執行計算
        const egfr = calculateCKDEPI(creatinine, age, gender);
        const stage = getStage(egfr);

        // 顯示結果
        container.querySelector('#result').textContent = `eGFR: ${egfr.toFixed(1)} mL/min/1.73m² (${stage})`;

        // 記錄計算 Provenance (自動追蹤資料來源)
        await fhirDataService.recordCalculationProvenance(
            'ckd-epi',
            'CKD-EPI eGFR Calculator',
            { creatinine, age, gender },
            { egfr: egfr.toFixed(1), stage },
            ['Observation/creatinine-123']  // 使用的 FHIR Observation
        );
    });
}
```

## 活動類型對照表

| 活動 | Code | 說明 |
|-----|------|------|
| `CREATE` | CREATE | 資源創建 |
| `UPDATE` | UPDATE | 資源更新 |
| `DELETE` | DELETE | 資源刪除 |
| `EXECUTE` | EXECUTE | 執行運算 |
| `VERIFY` | VERIFY | 驗證資料 |
| `TRANSFORM` | TRANSFORM | 資料轉換 |
| `COMPOSE` | COMPOSE | 資料組合 |
| `DERIVATION` | DERIVE | 資料衍生 |

## 代理人角色對照表

| 角色 | 說明 |
|-----|------|
| `author` | 內容作者 |
| `performer` | 執行者 |
| `verifier` | 驗證者 |
| `attester` | 證明者 |
| `informant` | 資訊提供者 |
| `custodian` | 資料保管者 |
| `assembler` | 組裝者 |
| `composer` | 組成者 |

## 離線支援

Provenance 服務支援離線模式：
- 當網路不可用時，記錄會儲存在 localStorage
- 網路恢復時，會自動嘗試上傳待處理的記錄
- 可設定最大本地儲存記錄數量 (預設 500 筆)

```typescript
// 取得待處理記錄數量
const pendingCount = provenanceService.getPendingRecordCount();

// 手動清除本地記錄
provenanceService.clearLocalRecords();

// 手動上傳待處理記錄
await provenanceService.flushPendingRecords();

// 匯出為 FHIR Bundle
const bundle = provenanceService.exportRecordsAsBundle();
```

## 符合的規範

- **TW Core IG** - 台灣核心實作指引 Provenance Profile
- **FHIR Provenance** Resource (R4/R5)
- **HL7 v3 DataOperation** 活動代碼
- **ISO-ASTM E1762-95** 數位簽章標準
- **台灣電子病歷製作及管理辦法** - 稽核溯源要求

## 與 AuditEvent 的區別

| 特性 | AuditEvent | Provenance |
|-----|-----------|------------|
| 目的 | 記錄「誰做了什麼」| 記錄「資料從哪來」|
| 焦點 | 安全稽核 | 資料品質與信任 |
| 時機 | 即時記錄所有操作 | 資源創建/修改時 |
| 保留期限 | 法規要求 (7年) | 隨資源生命週期 |
| 連結方式 | 獨立記錄 | target 指向資源 |

## 最佳實踐

1. **每次創建/修改資料時記錄 Provenance**
2. **清楚標示資料來源類型**（本院/跨院/病患）
3. **對重要醫療決策附加數位簽章**
4. **記錄計算的輸入來源**（哪些 Observation 被使用）
5. **使用 generateLineageReport 進行資料追溯**

## 進階設定

```typescript
import { createProvenanceService } from './provenance-service.js';

const customService = createProvenanceService({
    fhirServerUrl: 'https://fhir-server.example.com',
    applicationId: 'my-ehr-app',
    applicationName: 'My EHR Application',
    applicationVersion: '2.0.0',
    organizationRef: 'Organization/org-123',
    organizationName: '台北醫學大學附設醫院',
    locationRef: 'Location/loc-456',
    locationName: '內科病房',
    enableLocalStorage: true,
    maxLocalRecords: 1000,
    enableDebugLogging: true
});
```
