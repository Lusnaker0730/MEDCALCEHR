# TW Core IG 對齊 Roadmap

> 基於 TW Core IG v1.0.0 與本專案 `src/fhir-codes.ts` 的差異分析
> 建立日期：2026-02-11

---

## 高優先 (P0) — FHIR 合規性必要修改

這些項目直接影響 FHIR resource 是否能通過 TW Core IG validation。

### H1: ICD-10 Code System URL 台灣化

- **現況：** 專案 `ICD10_CODES` 只存 code 值（如 `I10`），未指定 code system URL
- **TW Core 要求：** `Condition.code.coding.system` 必須使用台灣健保署版本 URL
  - `https://twcore.mohw.gov.tw/ig/twcore/CodeSystem/icd-10-cm-2023-tw`（主要）
  - 另支援 2021、2014、ICD-9-CM 2001 版本
- **修改範圍：**
  - `src/fhir-codes.ts` — 新增 `ICD10_SYSTEM_URLS` 常數，定義各版本 code system URL
  - 所有產出 FHIR Condition resource 的模組 — 確保 `coding.system` 使用正確 URL
- **驗證方式：** 產出的 FHIR resource 可通過 TW Core Condition profile validation

### H2: 補充 TW Core Vital Signs 缺少的 LOINC Codes

- **現況：** 缺少 TW Core `vital-signs-tw` ValueSet 中的 3 個 codes
- **需新增：**
  - `85353-1` — Vital signs, weight, height, head circumference, oxygen saturation and BMI panel
  - `8478-0` — Mean blood pressure（BP component）
  - `3151-8` — Inhaled oxygen flow rate（Pulse oximetry component，單位 L/min）
- **修改範圍：** `src/fhir-codes.ts` LOINC_CODES 區段
- **驗證方式：** 單元測試確認 code 存在且可查詢

### H3: 補充 Average Blood Pressure Profile Codes

- **現況：** 完全缺少 TW Core v1.0.0 新增的平均血壓 Profile codes
- **需新增：**
  - `96607-7` — Average blood pressure panel
  - `96608-5` — Average systolic blood pressure
  - `96609-3` — Average diastolic blood pressure
- **修改範圍：** `src/fhir-codes.ts` LOINC_CODES 區段
- **驗證方式：** 單元測試確認 code 存在且可查詢

### H4: 修正複合 Code 值格式

- **現況：** 部分 LOINC code 使用逗號分隔多值，不符合 FHIR 標準（一個 coding 只能有一個 code）
  - `BP_PANEL: '85354-9,55284-4'`
  - `TEMPERATURE: '8310-5,8331-1'`
  - `URINE_SODIUM: '2828-2,2955-3'`
- **TW Core 標準：**
  - BP Panel → 只用 `85354-9`
  - Temperature → 只用 `8310-5`
- **修改方式：**
  - 主要 code 保留 TW Core 指定值
  - 替代 code 拆為獨立 key（如 `BP_PANEL_ALT`、`TEMPERATURE_ORAL`）
- **修改範圍：** `src/fhir-codes.ts` + 所有引用這些 code 的計算器模組
- **風險：** 需確認現有計算器中 `.split(',')` 的查詢邏輯不會受影響
- **驗證方式：** 全部 golden dataset 測試通過 + 單元測試

---

## 中優先 (P1) — 功能完整性強化

這些項目擴展對 TW Core Profile 的覆蓋範圍，但不影響現有功能的合規性。

### M1: 補充兒科相關 LOINC Codes

- **現況：** 缺少 TW Core vital-signs-tw ValueSet 中的兒科百分位 codes
- **需新增：**
  - `8289-1` — Head circumference percentile
  - `59576-9` — BMI percentile per age and sex
  - `77606-2` — Weight-for-length per age and sex
- **修改範圍：** `src/fhir-codes.ts` LOINC_CODES 區段
- **應用場景：** 若專案新增兒科計算器（生長曲線等）

### M2: 補充 ECG Profile Code

- **現況：** 缺少 TW Core v1.0.0 新增的 ECG Profile code
- **需新增：**
  - `11524-6` — EKG Study（主要 observation code）
  - 12 lead codes（`urn:oid:2.16.840.1.113883.6.24` 系統，codes 131329-131340）
- **修改範圍：** `src/fhir-codes.ts` 新增 ECG 區段
- **應用場景：** QTc 計算器已有 QT_INTERVAL code，ECG profile 可補充完整性

### M3: 補充 Smoking Status 完整 Code Set

- **現況：** 只有 `72166-2`（Tobacco smoking status）
- **TW Core 額外要求：**
  - LOINC `11367-0` — History of Tobacco use
  - SNOMED `401201003` — Cigarette pack-years
  - SNOMED `782516008` — Calculated pack years
  - Value codes: SNOMED `365980008` 子代（吸菸狀態結果值）
- **修改範圍：** `src/fhir-codes.ts` LOINC_CODES + SNOMED_CODES

### M4: 新增 TW Core Code System URL Registry

- **現況：** 專案只儲存 code 值，未管理各 code system 的 URL
- **TW Core 使用的 Code System URLs：**
  ```
  http://loinc.org
  http://snomed.info/sct
  https://twcore.mohw.gov.tw/ig/twcore/CodeSystem/icd-10-cm-2023-tw
  https://twcore.mohw.gov.tw/ig/twcore/CodeSystem/icd-10-cm-2021-tw
  https://twcore.mohw.gov.tw/ig/twcore/CodeSystem/icd-10-cm-2014-tw
  https://twcore.mohw.gov.tw/ig/twcore/CodeSystem/icd-9-cm-2001-tw
  http://www.nlm.nih.gov/research/umls/rxnorm
  http://terminology.hl7.org/CodeSystem/observation-category
  ```
- **修改方式：** 在 `fhir-codes.ts` 新增 `CODE_SYSTEM_URLS` 常數
- **目的：** FHIR resource 產出時可正確填入 `coding.system`

---

## 低優先 (P2) — 台灣健保特有碼擴充

這些項目屬於台灣在地化擴充，需與健保系統對接時才需要。

### L1: 台灣健保藥品代碼 (NHI Medication Codes)

- **TW Core 支援：** `medication-nhi-tw` ValueSet
- **Code System URL：** `https://twcore.mohw.gov.tw/ig/twcore/CodeSystem/medication-nhi-tw`
- **範圍：** 數千筆健保藥品代碼
- **建議：** 不內建完整碼表，改為查詢 terminology server 或載入外部 JSON

### L2: 台灣 FDA 藥品代碼

- **TW Core 支援：** `medication-fda-tw` ValueSet
- **Code System URL：** `https://twcore.mohw.gov.tw/ig/twcore/CodeSystem/medication-fda-tw`
- **範圍：** FDA 核准藥品 + 醫療器材
- **建議：** 同 L1，不內建完整碼表

### L3: 台灣健保檢驗代碼 (NHI Laboratory Codes)

- **TW Core 支援：** `laboratory-category-tw` + `medical-service-payment-tw`
- **範圍：** 800+ 健保檢驗給付代碼（01076B ~ 30526B）
- **建議：** 需要時以外部資料檔載入

### L4: ATC 藥物分類代碼

- **TW Core 支援：** `medcation-atc-tw` ValueSet
- **Code System URL：** `https://twcore.mohw.gov.tw/ig/twcore/CodeSystem/medcation-atc-tw`
- **範圍：** WHO ATC 分類
- **建議：** 需要時再加入

### L5: 台灣健保中藥代碼

- **TW Core 支援：** `nhi-medication-ch-herb-tw` ValueSet
- **範圍：** 健保中藥品項
- **建議：** 除非專案需支援中醫處方，否則可暫緩

---

## 實施注意事項

### 向下相容性
- H4（修正複合 code）影響範圍最大，需搜尋所有使用 `.split(',')` 或 `.includes()` 查詢 code 的模組
- 其餘高優先項目為新增或修改常數，低風險

### 測試策略
- H1~H4 完成後需跑完整 golden dataset（416 test cases）確認無 regression
- 新增 codes 需補充對應的單元測試
- 可考慮新增 TW Core profile validation 測試（使用 twcore package 的 StructureDefinition）

### 依賴關係
- H4 應在 H2、H3 之前完成（先修正格式，再新增 codes）
- M4（Code System URL Registry）應在 H1 之後或同時進行
- P2 所有項目彼此獨立，可按需實施

---

## 時程建議

| 階段 | 項目 | 預估影響檔案數 |
|------|------|--------------|
| Phase A | H4 → H2 → H3 → H1 + M4 | ~3-5 files |
| Phase B | M1 → M2 → M3 | ~1-2 files |
| Phase C | L1 ~ L5（按需） | 新增外部資料檔 |
