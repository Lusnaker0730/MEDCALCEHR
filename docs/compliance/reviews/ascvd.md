# 臨床計算器審查表 — Clinical Calculator Review Form

**文件編號 / Doc ID:** CR-{ascvd}-001
**計算器名稱 / Calculator:** {ASCVD}
**計算器 ID:** `{ascvd}`
**分類 / Category:** {cardiology}
**審查版本 / Version:** 1.0
**審查日期 / Review Date:** 2026-02-24

---

## 1. 臨床用途與適用族群 Clinical Purpose & Target Population

| 項目 | 內容 |
|------|------|
| **臨床用途** | 
1. 在初次就診時評估患者未來 10 年的動脈粥狀硬化性心血管疾病 (ASCVD) 風險，以建立參考值。 |
2. 預測不同幹預措施對患者風險的潛在影響。
3. 該應用程式僅適用於一級預防患者（未患 ASCVD 的患者）。
| **適用族群** | 20-79 歲成人，未患 ASCVD 的患者。 |超過79歲可考慮使用79歲計算
| **不適用族群** | 未滿 20 歲或超過 79 歲的患者，已患 ASCVD 的患者。 |
| **臨床場景** | [V] 門診 [ ] 急診 [V] 加護病房 [V] 病房 [ ] 手術室 [ ] 其他：_____ |
| **主要使用者** | [V] 醫師 [ ] 護理師 [ ] 藥師 [ ] 其他：_____ |

---

## 2. 公式 / 評分標準驗證 Formula & Scoring Criteria Verification

### 2.1 計算類型

- [V] 公式計算 (Formula) — 連續數值運算
- [ ] 評分計算 (Scoring) — 離散選項加總
- [ ] 複合型 (Complex) — 混合公式 + 評分

### 2.2 公式 / 評分邏輯

| 項目 | 審查結果 |
|------|----------|
| 公式或評分規則與原始文獻一致 | [V] 是 [ ] 否 [ ] 不適用 |
| 變數名稱與原始文獻定義相符 | [V] 是 [ ] 否 |
| 計算步驟（含中間變數）正確 | [V] 是 [ ] 否 |
| 單位轉換邏輯正確 | [V] 是 [ ] 否 [ ] 不適用 |
| 小數點精度適當 | [V] 是 [ ] 否 |

**公式或評分規則摘要：**

```
公式邏輯 (Formula)： 這是一個基於多因子回歸的 Cox 比例風險模型 (Cox proportional hazards model)。它會根據患者的性別與種族，將人口分為四組（白人男性、白人女性、非裔男性、非裔女性），每組有各自特定的風險係數 (coefficients)。 公式結構為： $Risk = 1 - S_0^{\exp(\text{IndividualSum} - \text{MeanCoefficient})}$
$S_0$：特定群體的 10 年基準生存率 (Baseline Survival)。
$\text{IndividualSum}$：患者個別危險因子的加權總和（包含年齡(取自然對數)、總膽固醇(ln)、HDL(ln)、收縮壓(ln且區分是否服藥)、是否有糖尿病、是否吸菸等變數與各自係數相乘）。
$\text{MeanCoefficient}$：該群體平均危險因子的加權和。
```

![alt text](image.png)

Table 4. Equation Parameters of the Pooled Cohort Equations for Estimation of 10-Year Risk for Hard ASCVD* and Specific Examples for Each Race and Sex Group
 	White	African American
 	Coefficient	Individual Example
Value	Coefficient
× Value†	Coefficient	Individual Example
Value	Coefficient
× Value†
Women (Example: 55 years of age with total cholesterol 213 mg/dL, HDL–C 50 mg/dL, untreated systolic BP 120 mm Hg, nonsmoker, and without diabetes)
Ln Age (y)	–29.799	4.01	–119.41	17.114	4.01	68.58
Ln Age, Squared	4.884	16.06	78.44	N/A	N/A	N/A
Ln Total Cholesterol (mg/dL)	13.540	5.36	72.59	0.940	5.36	5.04
Ln Age×Ln Total Cholesterol	–3.114	21.48	–66.91	N/A	N/A	N/A
Ln HDL–C (mg/dL)	–13.578	3.91	–53.12	–18.920	3.91	–74.01
Ln Age×Ln HDL–C 	3.149	15.68	49.37	4.475	15.68	70.15
Log Treated Systolic BP (mm Hg)	2.019	–	–	29.291	–	–
Log Age×Log Treated Systolic BP	N/A	N/A	N/A	–6.432	–	–
Log Untreated Systolic BP (mm Hg)	1.957	4.79	9.37	27.820	4.79	133.19
Log Age×Log Untreated Systolic BP	N/A	N/A	N/A	–6.087	19.19	–116.79
Current Smoker (1=Yes, 0=No)	7.574	0	0	0.691	0	0
Log Age×Current Smoker	–1.665	0	0	N/A	N/A	N/A
Diabetes (1=Yes, 0=No)	0.661	0	0	0.874	0	0
Individual Sum			–29.67			86.16
Mean (Coefficient× Value)	N/A	N/A	–29.18	N/A	N/A	86.61
Baseline Survival	N/A	N/A	0.9665	N/A	N/A	0.9533
Estimated 10-Y Risk for hard ASCVD	N/A	N/A	2.1%	N/A	N/A	3.0%
Men (Example: 55 years of age with total cholesterol 213 mg/dL, HDL–C 50 mg/dL, untreated systolic BP 120 mm Hg, nonsmoker, and without diabetes)
Log Age (y)	12.344	4.01	49.47	2.469	4.01	9.89
Log Total Cholesterol (mg/dL)	11.853	5.36	63.55	0.302	5.36	1.62
Log Age×Log Total Cholesterol	–2.664	21.48	–57.24	N/A	N/A	N/A
Log HDL–C (mg/dL)	–7.990	3.91	–31.26	–0.307	3.91	–1.20
Log Age×Log HDL–C	1.769	15.68	27.73	N/A	N/A	N/A
Log Treated Systolic BP (mm Hg)	1.797	–	–	1.916	–	–
Log Untreated Systolic BP (mm Hg)	1.764	4.79	8.45	1.809	4.79	8.66
Current Smoker (1=Yes, 0=No)	7.837	0	0	0.549	0	0
Log Age×Current Smoker	–1.795	0	0	N/A	N/A	N/A
Diabetes (1=Yes, 0=No)	0.658	0	0	0.645	0	0
Individual Sum			60.69			18.97
Mean (Coefficient× Value)	N/A	N/A	61.18	N/A	N/A	19.54
Baseline Survival	N/A	N/A	0.9144	N/A	N/A	0.8954
Estimated 10-Y Risk for hard ASCVD	N/A	N/A	5.3%	N/A	N/A	6.1%


Lifetime risk formula 公式邏輯 (Methodology / Criteria)： 系統會依據 Framingham 心臟研究的流行病學數據，根據以下的主要危險因子 (Major Risk Factors) 對患者進行分類：

最佳 (All Optimal)：TC < 180, BP < 120/<80, 沒抽菸, 無糖尿病。
非最佳 (Not Optimal)：TC 180-199, 或未服藥之 BP 120-139 / 80-89。
輕度偏高 (Elevated)：TC 200-239, 或未服藥之 BP 140-159 / 90-99。
1 個主要危險因子 (1 Major Risk Factor)：TC ≥ 240, 或是未服藥之 BP ≥ 160/100, 或是目前有服降血壓藥/降血脂藥, 或是抽菸, 或是糖尿病。
≥ 2 個主要危險因子 (≥2 Major Risk Factors)：合併上述 2 個（含）以上的主要危險因子。
分類完成後，再根據性別與分類結果，查出該組別對應的預期終生風險百分比（例如：含有 2 個以上主要危險因子的 50 歲患者，其終生風險可能高達 ~69%，而條件最佳者僅為 ~5%）。


sk Stratum*	Men	Women
Lifetime Risk for CVD (95% CI), %	Median Survival (IQR), y	Lifetime Risk for CVD (95% CI), %	Median Survival (IQR), y
To 75 y	To 95 y	To 75 y	To 95 y
IQR indicates interquartile range.
*Risk factor levels defined as for Table 1.
Overall	35.0 (32.9–37.2)	51.7 (49.3–54.2)	30 (22–37)	19.2 (17.5–20.8)	39.2 (37.0–41.4)	36 (28–42)
All optimal risk factors	5.2 (0–12.2)	5.2 (0–12.2)	>39 (32–>45)	8.2 (0–22.3)	8.2 (0–22.3)	>39 (28–>45)
≥1 Not optimal risk factor	17.6 (10.9–24.4)	36.4 (23.1–49.6)	36 (29–42)	6.9 (3.3–10.5)	26.9 (18.4–35.5)	39 (33–43)
≥1 Elevated risk factor	26.0 (21.0–31.0)	45.5 (38.0–53.1)	35 (26–42)	14.6 (11.2–17.9)	39.1 (33.0–45.1)	39 (32–44)
1 Major risk factor	37.6 (33.8–41.5)	50.4 (46.2–54.5)	30 (23–36)	18.0 (15.3–20.7)	38.8 (35.0–42.6)	35 (28–42)
≥2 Major risk factors	53.2 (47.1–59.3)	68.9 (61.7–73.2)	28 (18–35)	37.7 (32.5–43.0)	50.2 (44.7–55.7)	31 (23–38)

*Defined as total cholesterol <4.65 mmol/L (<180 mg/dL), blood pressure <120/<80 mm Hg, nonsmoker, and nondiabetic.
†Defined as total cholesterol 4.65 to 5.15 mmol/L (180 to 199 mg/dL), systolic blood pressure 120 to 139 mm Hg, diastolic blood pressure 80 to 89 mm Hg, nonsmoker, and nondiabetic.
‡Defined as total cholesterol 5.16 to 6.19 mmol/L (200 to 239 mg/dL), systolic blood pressure 140 to 159 mm Hg, diastolic blood pressure 90 to 99 mm Hg, nonsmoker, and nondiabetic.
§Defined as total cholesterol ≥6.20 mmol/L (≥240 mg/dL), systolic blood pressure ≥160 mm Hg, diastolic blood pressure ≥100 mm Hg, smoker, or diabetic.
Total cholesterol, mean±SD, mmol/L (mg/dL)	5.66±1.03 (219±40)	5.72±1.14 (221±44)
HDL cholesterol, mean±SD, mmol/L (mg/dL)	1.14±0.31 (44±12)	1.47±0.41 (57±16)
Systolic blood pressure, mean±SD, mm Hg	130±17	127±19
Diastolic blood pressure, mean±SD, mm Hg	82±10	79±11
Diabetes, n (%)	103 (2.9)	61 (1.4)

**若有差異，說明：**

>

---

## 3. 輸入欄位驗證 Input Field Validation

### 3.1 輸入欄位清單

| 欄位 ID | 欄位名稱 | 類型 | 驗證規則 (validationType) | 硬限制 (min–max) | 警示範圍 (warn) | 單位 | 臨床合理性 |
|---------|---------|------|--------------------------|-----------------|----------------|------|-----------|
|ascvd_age | 年齡 | number | |20-79 | | year | [V] 合理 [ ] 需調整 |
|ascvd_race | 種族 | radio | | | | | [V] 合理 [ ] 需調整 |
|ascvd_tc | 總膽固醇 | number | |130-320 | | mg/dL | [V] 合理 [ ] 需調整 |
|ascvd_hdl | HDL膽固醇 | number | |20-100 | | mg/dL | [V] 合理 [ ] 需調整 |
|ascvd_ldl | LDL膽固醇 | number | |30-300 | | mg/dL | [V] 合理 [ ] 需調整 |
|ascvd_sbp | 收縮壓 | number | |90-200 | | mmHg | [V] 合理 [ ] 需調整 |
|ascvd_dbp | 舒張壓 | number | |60-130 | | mmHg | [V] 合理 [ ] 需調整 |
|ascvd_smoker | 抽菸 | radio | | | | | [V] 合理 [ ] 需調整 |
|ascvd_diabetes | 糖尿病 | radio | | | | | [V] 合理 [ ] 需調整 |

### 3.2 驗證範圍審查

| 項目 | 審查結果 |
|------|----------|
| 硬限制（紅區）能阻擋明顯不合理的輸入值 | [V] 是 [ ] 否 |
| 警示範圍（黃區）涵蓋臨床少見但可能存在的極端值 | [ ] 是 [ ] 否 [V] 不適用 |
| 必填欄位設定正確 | [V] 是 [ ] 否 |
| 選項型欄位（radio/checkbox）選項完整無遺漏 | [V] 是 [ ] 否 [ ] 不適用 |

**若有需調整的範圍，建議：**

---
SBP, DBP
TC, LDL, HDL 需要 cross validation (已修正)


## 4. FHIR 自動帶入驗證 FHIR Auto-Population Verification

| 項目 | 審查結果 |
|------|----------|
| LOINC 代碼對應正確 | [V] 是 [ ] 否 [ ] 無 FHIR 帶入 |
| 自動帶入的單位與計算器預設單位一致 | [V] 是 [ ] 否 |
| 自動帶入值經過相同驗證邏輯 | [V] 是 (已確認 unified-formula-calculator 統一驗證) |

**FHIR 對應欄位：**

| 欄位 ID | LOINC Code | LOINC 名稱 | 正確性 |
|---------|-----------|-----------|--------|
|ascvd_sbp | 8480-6 | Systolic blood pressure | [V] 正確 [ ] 需修正 |
|ascvd_dbp | 8462-4 | Diastolic blood pressure | [V] 正確 [ ] 需修正 |
|ascvd_tc | 2093-3 | Total cholesterol | [V] 正確 [ ] 需修正 |
|ascvd_hdl | 2085-9 | HDL cholesterol | [V] 正確 [ ] 需修正 |
|ascvd_ldl | 2089-1 | LDL cholesterol | [V] 正確 [ ] 需修正 |
|ascvd_diabetes | 44054006,46635009 | Diabetes mellitus type 1+2 | [V] 正確 [ ] 需修正 |

---

## 5. 結果解讀與風險分層 Result Interpretation & Risk Stratification

| 項目 | 審查結果 |
|------|----------|
| 結果數值顯示正確（數值、單位、小數位數） | [V] 是 [ ] 否 |
| 風險分層切點與原始文獻一致 | [V] 是 [ ] 否 [ ] 不適用 |
| 臨床解讀文字正確且清楚 | [V] 是 [ ] 否 |
| 顏色標示（綠/黃/紅）與嚴重度對應 | [V] 是 [ ] 否 |
| 沒有不當的診斷性或指令性語句 | [V] 是 [ ] 否 |

### 風險分層審查

| 分數 / 數值範圍 | 系統顯示分類 | 嚴重度顏色 | 與原始文獻一致 |
|----------------|------------|-----------|---------------|
| | | green / yellow / red | [ ] 是 [ ] 否 |
|<5% | green | | [V] 是 [ ] 否 |
|5% to 7.4% | yellow | | [V] 是 [ ] 否 |
|7.5% to 19.9% | yellow | | [V] 是 [ ] 否 |
|≥20% | red | | [V] 是 [ ] 否 |

**若有差異，說明：**
>**10-year risk for ASCVD is categorized as:
Low-risk (<5%)
Borderline risk (5% to 7.4%)
Intermediate risk (7.5% to 19.9%)
High risk (≥20%)
>

---

## 6. 黃金數據集驗證 Golden Dataset Validation

**黃金數據集檔案：** `src/__tests__/golden-datasets/ascvd.json`

| 案例 ID | 案例描述 | 輸入值合理 | 預期結果正確 | 容許誤差適當 |
|---------|---------|-----------|-------------|-------------|
| GD-ASCVD-001 |White male, 45y, TC=180, HDL=55, SBP=120, no HTN Tx, no DM, non-smoker | [V] 是 [ ] 否 | [V] 是 [ ] 否 | [V] 是 [ ] 否 |
| GD-ASCVD-002 |White female, 60y, TC=240, HDL=45, SBP=150, on HTN Tx, no DM, non-smoker | [V] 是 [ ] 否 | [V] 是 [ ] 否 | [V] 是 [ ] 否 |
| GD-ASCVD-003 |White male, 70y, TC=260, HDL=35, SBP=160, on HTN Tx, DM, smoker | [V] 是 [ ] 否 | [V] 是 [ ] 否 | [V] 是 [ ] 否 |
| GD-ASCVD-004 |AA male, 55y, TC=200, HDL=50, SBP=140, no HTN Tx, no DM, non-smoker | [V] 是 [ ] 否 | [V] 是 [ ] 否 | [V] 是 [ ] 否 |
| GD-ASCVD-005 |Known clinical ASCVD → secondary prevention recommendation | [V] 是 [ ] 否 | [V] 是 [ ] 否 | [V] 是 [ ] 否 |

新增數據集
| GD-ASCVD-006 |Borderline risk boundary - white male, 5-7.4% range | [V] 是 [ ] 否 | [V] 是 [ ] 否 | [V] 是 [ ] 否 |
| GD-ASCVD-007 |Intermediate risk boundary - white male, 7.5-19.9% range | [V] 是 [ ] 否 | [V] 是 [ ] 否 | [V] 是 [ ] 否 |
| GD-ASCVD-008 |High risk boundary - white male with HTN Tx and DM, ≥20% | [V] 是 [ ] 否 | [V] 是 [ ] 否 | [V] 是 [ ] 否 |
| GD-ASCVD-009 |Young adult (age 25) - 10-year risk N/A, lifetime risk only | [V] 是 [ ] 否 | [V] 是 [ ] 否 | [V] 是 [ ] 否 |


| 項目 | 審查結果 |
|------|----------|
| 案例涵蓋正常值情境 | [V] 是 [ ] 否 |
| 案例涵蓋邊界值情境 | [V] 是 [ ] 否 |
| 案例涵蓋高風險/極端值情境 | [V] 是 [ ] 否 |
| 案例計算來源可追溯（手算或文獻） | [V] 是 [ ] 否 |
| 自動化測試通過（golden-dataset.test.ts） | [V] 是 [ ] 否 |

---

## 7. 參考文獻 References

### 7.1 系統引用文獻

| # | 引用文獻 (系統中顯示的 reference) | 可查證 |
|---|----------------------------------|--------|
| 1 | | [V] 是 [ ] 否 |Karmali KN, Goff DC Jr, Ning H, Lloyd-Jones DM. A systematic examination of the 2013 ACC/AHA pooled cohort risk assessment tool for atherosclerotic cardiovascular disease.
| 2 | | [V] 是 [ ] 否 |Lloyd-Jones DM, Leip EP, Larson MG, et al. Prediction of lifetime risk for cardiovascular disease by risk factor burden at 50 years of age. Circulation. 2006 Feb 14;113(6):791-8.
| 3 | | [V] 是 [ ] 否 |2013 ACC/AHA Guideline on the Assessment of Cardiovascular Risk.
| 4 | | [V] 是 [ ] 否 |Am J Prev Cardiol. 2024 Apr 16;18:100669. doi: 10.1016/j.ajpc.2024.100669

### 7.2 文獻審查

| 項目 | 審查結果 |
|------|----------|
| 引用文獻為該計算器的原始研究或公認指引 | [V] 是 [ ] 否 |
| 文獻為最新版本（無更新版取代） | [V] 是 [ ] 否 |
| 文獻出處格式正確（作者、期刊、年份、DOI） | [V] 是 [ ] 否 |

**若文獻已有更新版本，說明：**

>Goff DC Jr, Lloyd-Jones DM, Bennett G, et al. 2013 ACC/AHA Guideline on the Assessment of Cardiovascular Risk: A Report of the American College of Cardiology/American Heart Association Task Force on Practice Guidelines. Circulation. 2014;129(25 suppl 2):S49-S73.

Lloyd-Jones DM, Leip EP, Larson MG, et al. Prediction of lifetime risk for cardiovascular disease by risk factor burden at 50 years of age. Circulation. 2006 Feb 14;113(6):791-8.

Karmali et al., Circulation, 2015;132(16):1571-8. (Million Hearts Longitudinal ASCVD Risk Assessment Tool)
---

## 8. 臨床安全性審查 Clinical Safety Review

| 項目 | 審查結果 |
|------|----------|
| 不合理輸入不會產出看似正確的結果 | [V] 是 [ ] 否 |
| 計算失敗時有適當的錯誤提示 | [V] 是 [ ] 否 |
| 結果不會被誤解為確定診斷 | [V] 是 [ ] 否 |
| 顯示「僅供臨床參考」免責聲明 | [V] 是 [ ] 否 |
| 無潛在的病人安全風險 | [V] 是 [ ] 否 |

**風險等級評估（依 ISO 14971）：**

| 危害情境 | 嚴重度 | 發生可能性 | 風險等級 | 緩解措施 |
|---------|--------|-----------|---------|---------|
| 輸入錯誤值導致錯誤結果 | | | | 三區驗證（紅/黃/綠） |
| FHIR 帶入過時數據 | | | | 數據時效標記 |
| | | | | |

---

## 9. 臨床備註 Clinical Notes

> （審查者的額外觀察、建議、或臨床使用注意事項）

---

## 10. 審查結論 Review Conclusion

### 總體判定

- [V] **通過 (APPROVED)** — 計算器臨床內容正確，可用於臨床環境
- [ ] **有條件通過 (APPROVED WITH CONDITIONS)** — 需修正下列項目後通過
- [ ] **不通過 (REJECTED)** — 存在重大臨床錯誤，需修正後重新審查

### 待修正項目 (若有條件通過)

| # | 待修正項目 | 嚴重度 | 期限 |
|---|-----------|--------|------|
| 1 | | 高 / 中 / 低 | |
| 2 | | 高 / 中 / 低 | |
| 3 | | 高 / 中 / 低 | |

---

## 11. 簽核 Approval Signatures

| 角色 | 姓名 | 簽章 | 日期 |
|------|------|------|------|
| 臨床審查醫師 Clinical Reviewer |呂侑穎|2026/2/25 | |
| 品質管理人員 Quality Manager | | | |
| 軟體開發負責人 Software Lead | | | |

---

**IEC 62304 追溯：** 本審查表對應 IEC 62304 §5.7 (Software Verification) 及 IEC 82304-1 §7 (Clinical Evaluation)
**文件狀態：** [ ] 草稿 Draft [ ] 審查中 Under Review [ ] 定版 Final
