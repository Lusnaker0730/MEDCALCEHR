# Terminology Check: fhir-codes-reference.md vs TW Core IG v1.0.0

比對來源：
- 參考文件：[`text/fhir-codes-reference.md`](file:///d:/CGHCALC/MEDCALCEHR/text/fhir-codes-reference.md)
- TW Core 套件：`D:\CQL\TWCOREDATA\package` (tw.gov.mohw.twcore v1.0.0)

---

## 一、LOINC Codes 比對

**總計 ~124 個 LOINC codes**

| 狀態 | 數量 | 說明 |
|:---|:---:|:---|
| 明確列於 TW Core | **24** | Vital signs, 小兒、Pulse Ox、平均血壓、吸菸狀態 |
| 未明確列出但隱含有效 | **~100** | 透過 filter-based ValueSet（Lab class / Clinical class）涵蓋 |
| 需注意 | 4 | 見下方 |

### 明確收錄的 LOINC（與 TW Core profile 直接對應）

- **Vital Signs**: 85353-1, 8480-6, 8462-4, 85354-9, 8478-0, 8867-4, 9279-1, 8310-5, 2708-6, 8302-2, 9843-4, 29463-7, 39156-5
- **Pulse Oximetry**: 59408-5, 3151-8, 3150-0
- **Average BP**: 96607-7, 96608-5, 96609-3
- **Pediatric**: 59576-9, 77606-2, 8289-1
- **Smoking**: 72166-2, 11367-0

### TW Core 未明確收錄但需注意的差異

| Code | 參考文件說明 | TW Core 狀態 |
|:---:|:---|:---|
| **55284-4** | BP panel (alternative) | TW Core 僅列 85354-9，未列此代碼 |=>20260223 刪除此代碼by Lu
| **8331-1** | 口溫 | TW Core 僅列 8310-5（通用體溫） |=>20260223 刪除此代碼by Lu
| **8306-3, 8308-9** | 臥式/站立身高 | TW Core 僅列 8302-2（通用身高） |=>20260223 刪除此代碼by Lu
| **3141-9** | 實測體重 | TW Core 僅列 29463-7（通用體重） |=>20260223 刪除此代碼by Lu
| **11524-6** | ECG study | 未出現在任何 TW Core 資源中 |=>20260223 刪除此代碼by Lu

### Display Name 差異（可接受，非錯誤）

| Code | 參考文件 | TW Core |
|:---:|:---|:---|
| 85353-1 | Vital signs panel | Vital signs, weight, height, head circumference, oxygen saturation and BMI panel |
| 72166-2 | Smoking status | Tobacco smoking status |
| 39156-5 | Body mass index | Body mass index (BMI) [Ratio] |

### 隱含有效的 LOINC Codes（透過 filter-based ValueSet）

TW Core 的 `ValueSet-loinc-observation-code` 使用 `CLASSTYPE = "Laboratory class"` 篩選，涵蓋整個 LOINC 實驗室分類。`ValueSet-loinc-survey-codes` 涵蓋 `Clinical class` 和 `Surveys`。以下類別的 codes 皆隱含有效：

- Hematology（6 codes）: 718-7, 4544-3, 6690-2, 777-3, 26515-7, 26478-8
- Chemistry（15 codes）: 2951-2, 2823-3, 2075-0, 1963-8, 2028-9, 3094-0, 6299-8, 2160-0, 2345-7, 17861-6, 2601-3, 2777-1, 1751-7, 20448-7, 2339-0
- Liver Function（8 codes）: 1975-2, 1968-7, 1920-8, 1742-6, 6768-6, 2324-2, 2885-2, 6301-6
- Lipids（4 codes）: 2093-3, 2085-9, 2089-1, 2571-8
- Renal（8 codes）: 33914-3, 2829-0, 2695-6, 2697-2, 2828-2, 2955-3, 2161-8, 3095-7
- Inflammatory（3 codes）: 1988-5, 4537-7, 33959-8
- Cardiac Markers（7 codes）: 10839-9, 6598-7, 30239-8, 15056-5, 32195-5, 30934-4, 33762-6
- Coagulation（5 codes）: 5902-2, 14979-9, 34714-6, 3255-7, 48065-7
- ABG（7 codes）: 2744-1, 2019-8, 2703-7, 50984-4, 1960-4, 1925-7, 2524-7
- Cardiac Measurements（5 codes）: 8633-1, 10230-1, 18043-0, 27164-3, 8414-5
- Other Lab（16 codes）: 4548-4, 3016-3, 3053-6, 2143-6, 3084-1, 1798-8, 3040-3, 2532-0, 630-4, 49765-1, 2276-4, 1989-3, 664-3, 26485-3, 3137-7, 751-8
- Clinical Assessments（9 codes）: 9269-2, 9267-6, 9270-0, 9268-4, 72514-3, 9272-6, 9274-2, 882-1, 10331-7
- 不確定隱含有效: 11368-0（ASA Physical Status）=>20260223刪除此代碼by Lu

---

## 二、SNOMED CT Codes 比對

**總計 86 個 SNOMED codes**

| 狀態 | 數量 |
|:---|:---:|
| 隱含有效（透過 `is-a 404684003` Clinical finding 階層） | **~72** |
| 明確列於 ValueSet | **4**（吸菸相關） |
| 未涵蓋（Procedure codes） | **5** |
| **有重大錯誤** | **2** |
| 中度差異 | **2** |

### 重大錯誤（必須修正）

| Code | 參考文件說明 | 實際 SNOMED 意義 | 建議修正 |
|:---:|:---|:---|:---|
| **166001** | Paralysis（癱瘓） | **Behavioral therapy**（行為治療）— 完全錯誤！ | 改用 **44695005**（Paralysis） =>20260223修正此代碼by Lu
| **40468003** | Hepatitis（肝炎，泛指） | **Viral hepatitis, type A**（僅 A 型肝炎） | 改用 **128241005**（Hepatitis 泛指） =>20260223修正此代碼by Lu

### 中度差異（建議確認）

| Code | 參考文件說明 | 實際意義 | 建議 |
|:---:|:---|:---|:---|
| **281789004** | Anticoagulation therapy | 無法透過公開查詢確認 | 建議改用 **182764009**（Anticoagulant therapy） =>20260223修正此代碼by Lu
| **131148009** | Previous bleeding | 實際為 **Bleeding (finding)**（活動性出血） | 若指「過去出血史」，建議改用 **275265003** |   

### 未涵蓋的 Codes

TW Core 的 `ValueSet-procedure-tw` 僅使用台灣健保支付碼，無 SNOMED Procedure ValueSet。

| Code | 說明 | 原因 |
|:---:|:---|:---|
| 232717009 | CABG | SNOMED Procedure |
| 14106009 | Pacemaker | SNOMED Procedure |
| 415070008 | PCI | SNOMED Procedure |
| 119978007 | Valve surgery | SNOMED Procedure |
| 77465005 | Transplant | SNOMED Procedure |
| 260348003 | Positive result | Qualifier value，非 clinical finding |

### 隱含有效的 SNOMED Codes

透過 `ValueSet-condition-code-sct-tw` 的階層篩選：
- `is-a 404684003` (Clinical finding): 涵蓋大部分疾病/症狀 codes
- `is-a 243796009` (Context-dependent): 涵蓋 "History of..." 相關 codes（如 266897004 Family hx CAD、399211009 Previous MI、161505003 Previous stroke、451574005 History of VTE）

#### 吸菸狀態 Codes

- **明確列於 `smoking-status-type-code`**: 401201003 (Pack-years), 782516008 (Calculated pack-years)
- **明確列於 `smoking-status-comprehensive-code` 篩選根**: 722499006 (E-cigarette), 699009004 (Secondhand smoke)
- **隱含有效**（透過 `descendent-of 365980008`）: 77176002, 266919005, 8517006, 449868002, 428041000124106, 428071000124103, 428061000124105, 266927001

### Minor Display Name 差異（可接受）

| Code | 參考文件 | SNOMED FSN |
|:---:|:---|:---|
| 414915002 | Obesity | Obese (finding) |
| 8517006 | Ex-smoker | Former smoker (finding) |
| 7200002 | Alcohol abuse | Alcoholism (disorder) |
| 66214007 | Drug abuse | Substance abuse (disorder) |
| 429451001 | Dialysis | Dependence on renal dialysis (finding) |
| 125605004 | Fracture | Fracture of bone (disorder) |

---

## 三、RxNorm Codes 比對

**總計 42 個 RxNorm codes — 全部存在 TTY 層級不匹配**

### 核心問題

參考文件使用 RxNorm **Ingredient (IN)** 層級代碼，但 TW Core 的 `ValueSet-medication-rxnorm-tw` 僅接受以下 TTY 層級：

```
SCD, SBD, GPCK, BPCK, SCDG, SBDG, SCDF, SBDF
```

**因此 42 個 RxNorm codes 在 TW Core 驗證下全部不通過。**

若要符合 TW Core，需將 Ingredient 層級轉換為臨床處方層級，例如：
- 1191 (Aspirin, IN) → 212033 (Aspirin 325 MG Oral Tablet, SCD)
- 11289 (Warfarin, IN) → 855332 (Warfarin Sodium 5 MG Oral Tablet, SCD)

### 台灣健保藥品系統中未找到的藥物（5 個）

| RxNorm Code | 藥名 | 說明 |
|:---:|:---|:---|
| **855812** | Prasugrel | 健保無此藥（含品牌 EFFIENT） |
| **1599538** | Edoxaban | 健保無此藥（含品牌 LIXIANA/SAVAYSA） |
| **8640** | Prednisone | 健保無此藥（台灣以 Prednisolone 為主） |
| **35296** | Ramipril | 健保無此藥（含品牌 ALTACE/TRITACE） |
| **1886** | Benazepril | 健保無此藥（含品牌 LOTENSIN） |

### 健保系統中僅有少量品牌的藥物

| RxNorm Code | 藥名 | 健保品牌 | 品項數 |
|:---:|:---|:---|:---:|
| 1116632 | Ticagrelor | BRILINTA | 2 |
| 1114195 | Rivaroxaban | XARELTO | 1 |
| 1364430 | Apixaban | THROMBAN（非 ELIQUIS） | 2 |
| 1037042 | Dabigatran | PRADAXA | 2 |
| 11289 | Warfarin | COUMADIN + LENNON-WARFARIN | 6 |

### 無 RxNorm ↔ NHI ConceptMap

TW Core 套件中無 RxNorm 與健保藥碼之間的對應表（ConceptMap），需自行建立。

---

## 四、總結建議

| 優先度 | 項目 | 行動 |
|:---|:---|:---|
| **高** | SNOMED 166001 錯誤 | 改為 **44695005** (Paralysis) |
| **高** | SNOMED 40468003 過窄 | 改為 **128241005** (Hepatitis 泛指) |
| **中** | SNOMED 281789004 待確認 | 驗證後可能改為 **182764009** |
| **中** | SNOMED 131148009 語意不符 | 若指歷史出血，改為 **275265003** |
| **中** | RxNorm TTY 層級問題 | 全部 42 個需轉為 SCD/SBD 層級才能符合 TW Core |
| **低** | 5 個 SNOMED Procedure 未涵蓋 | TW Core 無 SNOMED procedure VS，需自建或用健保碼對應 |
| **低** | 5 個藥物不在健保系統 | 僅能用 RxNorm/SNOMED 編碼，無健保藥碼對應 |

---

*Generated: 2026-02-23*
