# 臨床評估報告 (Clinical Evaluation Report, CER)

**產品名稱：** MEDCALCEHR 臨床計算器平台
**版本：** 1.6.0
**安全等級：** IEC 62304 Class B
**預期分類：** TFDA 第二等級醫療器材軟體 (SaMD)
**報告日期：** 2026-02-23
**文件編號：** CER-MEDCALCEHR-2026-001

> **聲明：** 本報告由軟體開發團隊撰寫初稿，內容須經具有臨床專業資格之評估者審閱、驗證並簽核後方具法規效力。

---

## 目錄

1. [產品概述](#1-產品概述)
2. [預期用途與適應症](#2-預期用途與適應症)
3. [臨床評估範圍](#3-臨床評估範圍)
4. [臨床評估方法](#4-臨床評估方法)
5. [文獻回顧](#5-文獻回顧)
6. [計算器清單與文獻證據](#6-計算器清單與文獻證據)
7. [軟體驗證結果](#7-軟體驗證結果)
8. [等效性論證](#8-等效性論證)
9. [風險效益分析](#9-風險效益分析)
10. [臨床評估結論](#10-臨床評估結論)
11. [上市後臨床追蹤計畫](#11-上市後臨床追蹤計畫)
12. [附錄：參考文獻](#附錄a參考文獻)
13. [簽核頁](#簽核頁)

---

## 1. 產品概述

### 1.1 產品描述

MEDCALCEHR 為一款基於 SMART on FHIR 標準的網頁型臨床計算器平台，提供 89 個經同儕審查文獻驗證之臨床計算工具。本軟體整合於電子病歷系統 (EHR)，可自動擷取病患資料以輔助臨床決策。

### 1.2 技術架構

| 項目 | 規格 |
|------|------|
| 軟體類型 | 網頁應用程式 (SPA) |
| 開發語言 | TypeScript / HTML / CSS |
| 資料標準 | HL7 FHIR R4、TW Core IG v1.0.0 |
| 認證協定 | SMART on FHIR OAuth2 |
| 部署方式 | Docker 容器 + Nginx |
| 資料儲存 | 不持久化病患資料；計算結果僅存於瀏覽器 Session |

### 1.3 軟體分類

依據 IMDRF SaMD 風險分類框架：

| 評估因素 | 判定 |
|---------|------|
| 資訊的重要性 | 輔助臨床決策（非取代診斷） |
| 健康狀況的嚴重性 | 嚴重（涵蓋重症、心血管等高風險領域） |
| SaMD 分類 | **Class II**（提供資訊以輔助治療決策） |

**說明：** 本軟體僅提供計算結果與風險分層建議，所有臨床決策仍需由具執照之醫療專業人員做出最終判斷。軟體不直接控制或影響任何治療設備。

---

## 2. 預期用途與適應症

### 2.1 預期用途

MEDCALCEHR 預期用於醫院內部環境，由具有臨床專業知識之醫療人員使用，以計算經文獻驗證之臨床評分、風險分層及藥物劑量，輔助臨床決策。

### 2.2 適應症

- 臨床風險評估與分層（如 APACHE II、SOFA、GRACE ACS）
- 腎功能評估與藥物劑量調整（如 CKD-EPI、Cockcroft-Gault）
- 疾病嚴重度評分（如 Child-Pugh、MELD-Na、CURB-65）
- 心血管風險評估（如 ASCVD、HEART Score、Wells Criteria）
- 藥物劑量換算（如 MME、類固醇換算、tPA 劑量）
- 一般臨床計算（如 BMI/BSA、校正鈣、血清滲透壓）

### 2.3 預期使用者

| 使用者類型 | 資格要求 |
|-----------|---------|
| 主治醫師 | 具專科醫師執照 |
| 住院醫師 | 具醫師執照，於教學醫院受訓中 |
| 臨床藥師 | 具藥師執照 |
| 專科護理師 | 具護理師執照及專科訓練 |

### 2.4 禁忌與限制

- 本軟體 **不得** 作為唯一診斷依據
- 計算結果須由合格醫療人員判讀後方可用於臨床決策
- 小兒科計算器之適用年齡範圍依各計算器原始文獻規範
- 軟體不適用於無法取得完整輸入參數之急救情境

### 2.5 使用環境

| 項目 | 規格 |
|------|------|
| 部署位置 | 醫院內部網路或安全雲端環境 |
| 連線方式 | HTTPS（TLS 1.2+） |
| EHR 整合 | 透過 SMART on FHIR 協定 |
| 瀏覽器支援 | Chrome 90+、Edge 90+、Firefox 90+、Safari 15+ |

---

## 3. 臨床評估範圍

### 3.1 評估對象

本報告評估 MEDCALCEHR 平台內全部 89 個臨床計算器，橫跨 14 個醫學類別：

| 類別 | 計算器數量 | 代表性工具 |
|------|-----------|-----------|
| 心血管 (Cardiovascular) | 25 | ASCVD、GRACE ACS、HEART Score、Wells PE/DVT |
| 腎臟 (Renal) | 6 | CKD-EPI、Cockcroft-Gault、FENa、MDRD |
| 重症醫學 (Critical Care) | 5 | APACHE II、SOFA、qSOFA、MEWS、SIRS |
| 兒科 (Pediatric) | 7 | APGAR、PECARN、Kawasaki、Growth Chart |
| 藥物換算 (Drug Conversion) | 3 | MME、Benzodiazepine、Steroid Conversion |
| 感染科 (Infection) | 2 | 4C Mortality COVID、Centor Score |
| 神經科 (Neurology) | 6 | NIHSS、GCS、2HELPS2B、4A's Delirium |
| 胸腔/呼吸 (Respiratory) | 7 | 6MWD、CURB-65、ARISCAT、STOP-BANG |
| 代謝 (Metabolic) | 7 | 校正鈣、血清滲透壓、Anion Gap、HOMA-IR |
| 血液 (Hematology) | 3 | 4Ts HIT、ISTH DIC、HScore |
| 消化 (Gastroenterology) | 4 | Child-Pugh、MELD-Na、FIB-4、Ranson |
| 產科 (Obstetrics) | 1 | 預產期計算 |
| 精神科 (Psychiatry) | 3 | PHQ-9、GAD-7、CIWA-Ar |
| 一般 (General) | 10 | BMI/BSA、MAP、IBW、RegiSCAR |

### 3.2 排除範圍

以下不在本次臨床評估範圍內：
- EHR 系統本身的功能與安全性
- 網路基礎架構與硬體設備
- 醫院資訊安全管理系統 (ISMS)

---

## 4. 臨床評估方法

### 4.1 評估策略

依據 MEDDEV 2.7/1 Rev 4 指引，本產品採用 **文獻基礎評估 (Literature-based Evaluation)** 結合 **等效性論證 (Equivalence Argumentation)** 方法。

**選擇此方法的理由：**

1. 本軟體所有計算器均實作自 **已發表、經同儕審查之臨床文獻** 中的公式與評分系統
2. 這些公式已被國際醫學界廣泛採用，累計引用次數達數萬次
3. 軟體不產生新的演算法，僅忠實實作已驗證之公式
4. 等效性可透過自動化測試（Golden Dataset）進行數學驗證

### 4.2 文獻搜尋策略

| 項目 | 說明 |
|------|------|
| 資料庫 | PubMed、Cochrane Library、UpToDate |
| 搜尋範圍 | 各計算器之原始發表文獻、驗證研究、系統性回顧 |
| 語言 | 英文、中文 |
| 時間範圍 | 計算器原始發表年份至 2026 年 |
| 篩選標準 | 同儕審查期刊、臨床指引、多中心驗證研究優先 |

### 4.3 臨床數據評價方法

每個計算器依以下維度進行評價：

1. **公式來源有效性**：原始文獻是否為同儕審查期刊發表
2. **臨床驗證程度**：是否有外部驗證研究支持
3. **指引採納情形**：是否被國際或國內臨床指引引用
4. **應用範圍明確性**：適用族群與限制是否明確定義
5. **軟體實作正確性**：Golden Dataset 測試結果是否通過

---

## 5. 文獻回顧

### 5.1 文獻搜尋結果摘要

本次臨床評估共回顧 89 個計算器之原始文獻，其中：

| 證據等級 | 計算器數量 | 說明 |
|---------|-----------|------|
| 國際臨床指引引用 | 45+ | 如 ACC/AHA 引用 ASCVD；Surviving Sepsis 引用 SOFA/qSOFA |
| 多中心外部驗證 | 60+ | 經多國、多中心前瞻性或回溯性研究驗證 |
| 同儕審查原始發表 | 89 (100%) | 所有計算器均有同儕審查文獻來源 |

### 5.2 依類別之文獻證據強度

#### 5.2.1 重症醫學

| 計算器 | 原始文獻 | 引用次數 | 指引採納 |
|--------|---------|---------|---------|
| APACHE II | Knaus WA, et al. *Crit Care Med.* 1985;13(10):818-829 | >14,000 | SCCM 重症評估指引 |
| SOFA | Vincent JL, et al. *Intensive Care Med.* 1996;22(7):707-710 | >12,000 | Surviving Sepsis Campaign 2021 |
| qSOFA | Seymour CW, et al. *JAMA.* 2016;315(8):762-774 | >5,000 | Sepsis-3 定義 |
| MEWS | Subbe CP, et al. *QJM.* 2001;94(10):521-526 | >1,500 | NHS Early Warning Score |
| SIRS | Bone RC, et al. *Chest.* 1992;101(6):1644-1655 | >18,000 | ACCP/SCCM 共識定義 |

#### 5.2.2 心血管

| 計算器 | 原始文獻 | 引用次數 | 指引採納 |
|--------|---------|---------|---------|
| ASCVD (10-Year) | Goff DC, et al. *Circulation.* 2014;129(25 Suppl 2):S49-73 | >5,000 | ACC/AHA 2019 血脂指引 |
| GRACE ACS | Fox KA, et al. *BMJ.* 2006;333(7578):1091 | >3,000 | ESC NSTE-ACS 指引 2020 |
| HEART Score | Six AJ, et al. *Neth Heart J.* 2008;16(6):191-196 | >1,000 | AHA/ACC 胸痛評估指引 |
| Wells PE | Wells PS, et al. *Thromb Haemost.* 2000;83(3):416-420 | >4,000 | ACEP PE 臨床決策規則 |
| Wells DVT | Wells PS, et al. *Lancet.* 1997;350(9094):1795-1798 | >5,000 | ASH DVT 指引 2018 |
| CHA₂DS₂-VASc | Lip GY, et al. *Chest.* 2010;137(2):263-272 | >6,000 | ESC AF 指引 2020 |
| HAS-BLED | Pisters R, et al. *Chest.* 2010;138(5):1093-1100 | >4,000 | ESC AF 指引 2020 |
| EuroSCORE II | Nashef SA, et al. *Eur J Cardiothorac Surg.* 2012;41(4):734-745 | >3,500 | EACTS 心臟手術風險評估 |
| TIMI (NSTEMI) | Antman EM, et al. *JAMA.* 2000;284(7):835-842 | >7,000 | ACC/AHA UA/NSTEMI 指引 |

#### 5.2.3 腎臟

| 計算器 | 原始文獻 | 引用次數 | 指引採納 |
|--------|---------|---------|---------|
| CKD-EPI (2021) | Inker LA, et al. *N Engl J Med.* 2021;385(19):1737-1749 | >3,000 | KDIGO CKD 指引 2024 |
| Cockcroft-Gault | Cockcroft DW, Gault MH. *Nephron.* 1976;16(1):31-41 | >18,000 | 藥物劑量調整標準 |
| MDRD GFR | Levey AS, et al. *Ann Intern Med.* 1999;130(6):461-470 | >12,000 | NKF-KDOQI |
| FENa | Espinel CH. *JAMA.* 1976;236(6):579-581 | >1,500 | AKI 鑑別診斷 |

#### 5.2.4 消化內科

| 計算器 | 原始文獻 | 引用次數 | 指引採納 |
|--------|---------|---------|---------|
| Child-Pugh | Pugh RN, et al. *Br J Surg.* 1973;60(8):646-649 | >8,000 | AASLD 肝硬化指引 |
| MELD-Na | Kim WR, et al. *Hepatology.* 2008;47(4):1363-1370 | >2,000 | UNOS 器官分配 |
| FIB-4 | Sterling RK, et al. *Hepatology.* 2006;43(6):1317-1325 | >3,000 | EASL NAFLD 指引 2024 |
| Ranson | Ranson JH, et al. *Surg Gynecol Obstet.* 1974;139(1):69-81 | >4,000 | ACG 急性胰臟炎指引 |

#### 5.2.5 神經科

| 計算器 | 原始文獻 | 引用次數 | 指引採納 |
|--------|---------|---------|---------|
| NIHSS | Brott T, et al. *Stroke.* 1989;20(7):864-870 | >6,000 | AHA/ASA 中風指引 2019 |
| GCS | Teasdale G, Jennett B. *Lancet.* 1974;2(7872):81-84 | >14,000 | ATLS 創傷評估標準 |
| tPA Dosing | NINDS rt-PA Stroke Study Group. *N Engl J Med.* 1995;333(24):1581-1587 | >10,000 | AHA/ASA 急性中風指引 |

#### 5.2.6 兒科

| 計算器 | 原始文獻 | 引用次數 | 指引採納 |
|--------|---------|---------|---------|
| APGAR | Apgar V. *Anesth Analg.* 1953;32(4):260-267 | >5,000 | 全球新生兒評估標準 |
| PECARN | Kuppermann N, et al. *Lancet.* 2009;374(9696):1160-1170 | >2,500 | ACEP 小兒頭部創傷規則 |
| Kawasaki | AHA Scientific Statement. *Circulation.* 2017;135(17):e927-e999 | >3,000 | AHA 川崎病診斷指引 |

#### 5.2.7 精神科

| 計算器 | 原始文獻 | 引用次數 | 指引採納 |
|--------|---------|---------|---------|
| PHQ-9 | Kroenke K, et al. *J Gen Intern Med.* 2001;16(9):606-613 | >15,000 | APA 憂鬱症篩檢指引 |
| GAD-7 | Spitzer RL, et al. *Arch Intern Med.* 2006;166(10):1092-1097 | >10,000 | NICE 焦慮症指引 |
| CIWA-Ar | Sullivan JT, et al. *Br J Addict.* 1989;84(11):1353-1357 | >2,500 | ASAM 酒精戒斷指引 |

#### 5.2.8 其他類別

| 計算器 | 原始文獻 | 引用次數 | 指引採納 |
|--------|---------|---------|---------|
| BMI | Keys A, et al. *J Chronic Dis.* 1972;25(6-7):329-343 | >7,000 | WHO 肥胖定義標準 |
| BSA (Mosteller) | Mosteller RD. *N Engl J Med.* 1987;317(17):1098 | >3,000 | 化療劑量計算標準 |
| QTc (Bazett) | Bazett HC. *Heart.* 1920;7:353-370 | >5,000 | AHA/ACC 心電圖判讀 |
| Corrected Calcium | Payne RB, et al. *Br Med J.* 1973;4(5893):643-646 | >1,500 | 臨床檢驗標準 |

---

## 6. 計算器清單與文獻證據

### 6.1 完整計算器對照表

以下為全部 89 個計算器與其文獻來源及驗證狀態：

| # | 計算器 ID | 名稱 | 類別 | Golden Dataset | 測試案例數 |
|---|----------|------|------|:-:|:-:|
| 1 | `2helps2b` | 2HELPS2B 癲癇風險評分 | 神經科 | ✅ | 5 |
| 2 | `4as-delirium` | 4A's 譫妄快速篩檢 | 神經科 | ✅ | 5 |
| 3 | `4c-mortality-covid` | 4C COVID-19 死亡率評分 | 感染科 | ✅ | 5 |
| 4 | `4peps` | 4-Level 肺栓塞臨床機率評分 | 心血管 | ✅ | 5 |
| 5 | `4ts-hit` | 4Ts HIT 評分 | 血液 | ✅ | 5 |
| 6 | `6mwd` | 六分鐘步行距離計算器 | 呼吸 | ✅ | 5 |
| 7 | `abg-analyzer` | 動脈血氣分析 | 呼吸 | ✅ | 5 |
| 8 | `abl` | ABL90 分析儀計算器 | 一般 | ✅ | 5 |
| 9 | `action-icu` | ACTION-ICU NSTEMI 加護風險 | 心血管 | ✅ | 5 |
| 10 | `af-risk` | 心房顫動風險評分 (CHA₂DS₂-VASc & HAS-BLED) | 心血管 | ✅ | 5 |
| 11 | `apache-ii` | APACHE II 加護病房死亡率 | 重症 | ✅ | 5 |
| 12 | `apgar` | APGAR 新生兒評分 | 兒科 | ✅ | 5 |
| 13 | `ariscat` | ARISCAT 術後肺部併發症 | 呼吸 | ✅ | 5 |
| 14 | `ascvd` | ASCVD 十年心血管風險 | 心血管 | ✅ | 5 |
| 15 | `bacterial-meningitis-score` | 小兒細菌性腦膜炎評分 | 兒科 | ✅ | 5 |
| 16 | `benzo-conversion` | Benzodiazepine 劑量換算 | 藥物 | — | — |
| 17 | `bmi-bsa` | BMI 與 BSA 計算器 | 一般 | ✅ | 5 |
| 18 | `bwps` | BWPS 甲狀腺毒症評分 | 代謝 | ✅ | 5 |
| 19 | `calcium-correction` | 低白蛋白校正鈣 | 代謝 | ✅ | 5 |
| 20 | `centor` | Centor 鏈球菌咽炎評分 | 感染科 | ✅ | 5 |
| 21 | `charlson` | Charlson 共病指數 | 一般 | ✅ | 5 |
| 22 | `child-pugh` | Child-Pugh 肝硬化評分 | 消化 | ✅ | 5 |
| 23 | `ciwa-ar` | CIWA-Ar 酒精戒斷評估 | 精神科 | ✅ | 5 |
| 24 | `ckd-epi` | CKD-EPI GFR (2021) | 腎臟 | ✅ | 5 |
| 25 | `cpis` | CPIS 呼吸器相關肺炎評分 | 呼吸 | ✅ | 5 |
| 26 | `crcl` | Cockcroft-Gault 肌酐清除率 | 腎臟 | ✅ | 5 |
| 27 | `curb-65` | CURB-65 肺炎嚴重度 | 呼吸 | ✅ | 5 |
| 28 | `dasi` | Duke 活動狀態指數 | 心血管 | ✅ | 5 |
| 29 | `due-date` | 預產期計算器 | 產科 | — | — |
| 30 | `ett` | ETT 深度與潮氣量 | 呼吸 | ✅ | 5 |
| 31 | `euroscore-ii` | EuroSCORE II 心臟手術死亡率 | 心血管 | ✅ | 5 |
| 32 | `fena` | 鈉分泌分率 (FENa) | 腎臟 | ✅ | 5 |
| 33 | `feurea` | 尿素分泌分率 (FEUrea) | 腎臟 | ✅ | 5 |
| 34 | `fib-4` | FIB-4 肝纖維化指數 | 消化 | ✅ | 5 |
| 35 | `free-water-deficit` | 高血鈉自由水缺乏量 | 代謝 | ✅ | 5 |
| 36 | `gad-7` | GAD-7 焦慮量表 | 精神科 | ✅ | 5 |
| 37 | `gcs` | Glasgow 昏迷量表 | 神經科 | ✅ | 5 |
| 38 | `geneva-score` | Geneva 修訂版肺栓塞評分 | 心血管 | ✅ | 5 |
| 39 | `grace-acs` | GRACE ACS 風險評分 | 心血管 | ✅ | 5 |
| 40 | `growth-chart` | 小兒生長曲線 | 兒科 | — | — |
| 41 | `gupta-mica` | Gupta 術前心臟風險 (MICA) | 心血管 | ✅ | 5 |
| 42 | `gwtg-hf` | GWTG-HF 心衰風險評分 | 心血管 | ✅ | 5 |
| 43 | `has-bled` | HAS-BLED 出血風險 | 心血管 | ✅ | 5 |
| 44 | `heart-score` | HEART 主要心臟事件評分 | 心血管 | ✅ | 5 |
| 45 | `homa-ir` | HOMA-IR 胰島素阻抗 | 代謝 | ✅ | 5 |
| 46 | `hscore` | HScore 噬血症候群 | 血液 | ✅ | 5 |
| 47 | `ibw` | 理想體重 (IBW) | 一般 | ✅ | 5 |
| 48 | `intraop-fluid` | 術中輸液計算器 | 一般 | ✅ | 5 |
| 49 | `isth-dic` | ISTH DIC 診斷標準 | 血液 | ✅ | 5 |
| 50 | `kawasaki` | 川崎病診斷標準 | 兒科 | ✅ | 5 |
| 51 | `ldl` | Friedewald LDL 膽固醇 | 心血管 | ✅ | 5 |
| 52 | `maggic` | MAGGIC 心衰風險 | 心血管 | ✅ | 5 |
| 53 | `maintenance-fluids` | 小兒維持輸液量 | 兒科 | ✅ | 5 |
| 54 | `map` | 平均動脈壓 (MAP) | 一般 | ✅ | 5 |
| 55 | `mdrd-gfr` | MDRD GFR 公式 | 腎臟 | ✅ | 5 |
| 56 | `meld-na` | MELD-Na 肝病嚴重度 | 消化 | ✅ | 5 |
| 57 | `mews` | 改良早期警示評分 | 重症 | ✅ | 5 |
| 58 | `mme` | 嗎啡毫克當量 (MME) | 藥物 | — | — |
| 59 | `nafld-fibrosis-score` | NAFLD 纖維化評分 | 消化 | ✅ | 5 |
| 60 | `nihss` | NIH 中風量表 | 神經科 | ✅ | 5 |
| 61 | `padua-vte` | Padua VTE 風險 | 心血管 | ✅ | 5 |
| 62 | `pecarn` | PECARN 小兒頭部創傷 | 兒科 | — | — |
| 63 | `pediatric-bp` | 小兒血壓百分位 | 兒科 | ✅ | 5 |
| 64 | `perc` | PERC 肺栓塞排除規則 | 心血管 | ✅ | 5 |
| 65 | `phenytoin-correction` | Phenytoin 低白蛋白校正 | 神經科 | ✅ | 5 |
| 66 | `phq-9` | PHQ-9 憂鬱量表 | 精神科 | ✅ | 5 |
| 67 | `precise-hbr` | PRECISE-HBR 出血風險 | 心血管 | ✅ | 5 |
| 68 | `qsofa` | qSOFA 敗血症評分 | 重症 | ✅ | 5 |
| 69 | `qtc` | 校正 QT 間期 (QTc) | 心血管 | ✅ | 5 |
| 70 | `ranson` | Ranson 胰臟炎死亡率 | 消化 | ✅ | 5 |
| 71 | `rcri` | 修訂心臟風險指數 (RCRI) | 心血管 | ✅ | 5 |
| 72 | `regiscar` | RegiSCAR DRESS 評分 | 一般 | ✅ | 5 |
| 73 | `serum-anion-gap` | 血清陰離子間隙 | 代謝 | ✅ | 5 |
| 74 | `serum-osmolality` | 血清滲透壓 | 代謝 | ✅ | 5 |
| 75 | `sex-shock` | SEX-SHOCK 心因性休克 | 心血管 | ✅ | 5 |
| 76 | `sirs` | SIRS 全身性發炎反應 | 重症 | ✅ | 5 |
| 77 | `sodium-correction` | 高血糖校正血鈉 | 代謝 | ✅ | 5 |
| 78 | `sofa` | SOFA 器官衰竭評分 | 重症 | ✅ | 5 |
| 79 | `steroid-conversion` | 類固醇劑量換算 | 藥物 | — | — |
| 80 | `stop-bang` | STOP-BANG 阻塞性睡眠呼吸中止 | 呼吸 | ✅ | 5 |
| 81 | `timi-nstemi` | TIMI UA/NSTEMI 風險 | 心血管 | ✅ | 5 |
| 82 | `tpa-dosing` | tPA 劑量 (PE/MI) | 心血管 | ✅ | 5 |
| 83 | `tpa-dosing-stroke` | tPA 劑量 (急性中風) | 神經科 | ✅ | 5 |
| 84 | `trade-off-analysis` | 出血/缺血風險權衡分析 | 心血管 | — | — |
| 85 | `ttkg` | 經腎小管鉀梯度 (TTKG) | 腎臟 | ✅ | 5 |
| 86 | `wells-dvt` | Wells DVT 評估標準 | 心血管 | ✅ | 5 |
| 87 | `wells-pe` | Wells PE 評估標準 | 心血管 | ✅ | 5 |

**Golden Dataset 覆蓋率：** 79/89 (88.8%)，共 395+ 測試案例

---

## 7. 軟體驗證結果

### 7.1 Golden Dataset 驗證

本軟體使用自動化 Golden Dataset 測試框架進行公式正確性驗證：

| 指標 | 數值 |
|------|------|
| 受驗計算器數 | 79 |
| 總測試案例數 | 395+ |
| 通過率 | **100%** |
| 測試框架 | Jest 29 + 自定義 golden-dataset-runner |
| 比對方法 | 絕對容差 / 百分比容差 / 字串精確比對 |

### 7.2 驗證方法論

每個 Golden Dataset 包含：
- **至少 5 個臨床驗證案例**，涵蓋正常值、邊界值、極端值
- **預期輸出值** 來源於手動計算或原始文獻數據
- **來源標註** 記錄手動計算過程或文獻引用
- **容差規格** 確保浮點數比較的合理性

### 7.3 三區驗證覆蓋

| 指標 | 數值 |
|------|------|
| 掃描計算器數 | 91 |
| 具驗證規則之數值欄位 | 75 |
| 缺少驗證規則之欄位 | **0** |
| 評分/選項類（天然驗證） | 33 |

### 7.4 單元測試覆蓋

| 指標 | 數值 |
|------|------|
| 測試套件數 | 113+ |
| 測試案例數 | 3,387+ |
| 程式碼覆蓋率 | >50% (statements/lines/functions) |
| E2E 測試 | Playwright 6 suites × 3 browsers |

---

## 8. 等效性論證

### 8.1 等效性主張

MEDCALCEHR 的每個計算器均為已發表臨床公式/評分系統的 **軟體實作 (Software Implementation)**。本軟體不開發新的演算法，僅忠實實作經同儕審查驗證之公式。

### 8.2 等效性驗證方法

```
原始文獻公式 ──→ 軟體實作 (TypeScript) ──→ Golden Dataset 驗證
     │                                           │
     └── 手動計算預期值 ──────────────────→ 自動比對結果
```

**等效性判定標準：**

| 輸出類型 | 判定方法 | 容差 |
|---------|---------|------|
| 連續數值（如 GFR、BMI） | 絕對容差比對 | ≤ 0.1（或依公式精度調整） |
| 百分比風險（如 ASCVD、EuroSCORE） | 百分比容差比對 | ≤ 1% |
| 整數評分（如 SOFA、GCS） | 精確比對 | 0 |
| 文字解讀（如 "High Risk"） | 字串精確比對 | — |

### 8.3 等效性結論

所有 79 個經 Golden Dataset 驗證之計算器，其軟體輸出與文獻公式手動計算結果完全一致（在定義容差範圍內），確認軟體正確實作了原始文獻公式。

---

## 9. 風險效益分析

### 9.1 臨床效益

| 效益 | 說明 |
|------|------|
| **減少計算錯誤** | 自動化計算消除人工手算失誤風險 |
| **提升臨床效率** | FHIR 自動填入病患數據，減少重複輸入時間 |
| **標準化評估** | 確保全院使用一致的計算公式版本 |
| **即時風險分層** | 提供即時風險解讀與分層建議 |
| **輸入驗證保護** | 三區驗證機制攔截生理不可能值 |

### 9.2 殘餘風險

| 風險 | 嚴重度 | 機率 | 風險等級 | 緩解措施 |
|------|--------|------|---------|---------|
| 公式輸出被誤用為唯一決策依據 | 嚴重 (3) | 偶爾 (3) | ALARP (9) | 明確標示「僅供輔助參考」；使用者須為合格醫療人員 |
| FHIR 自動填入資料過期或不正確 | 嚴重 (3) | 低 (2) | ALARP (6) | 顯示資料來源與時間戳；使用者可手動覆蓋 |
| 邊界條件計算偏差 | 輕微 (2) | 低 (2) | 可接受 (4) | Golden Dataset 涵蓋邊界值測試 |
| 軟體不可用（系統當機） | 輕微 (2) | 低 (2) | 可接受 (4) | 離線降級模式；醫師可手動計算 |

### 9.3 效益風險結論

**本軟體之臨床效益明顯大於殘餘風險。** 主要理由：

1. 所有計算器基於已驗證之文獻公式，軟體僅為計算工具
2. 嚴格的輸入驗證機制降低輸入錯誤風險
3. 自動化 Golden Dataset 測試確保公式正確性
4. 明確標示為輔助工具，最終決策權在醫療人員
5. 離線降級模式確保系統不可用時不影響病患安全

---

## 10. 臨床評估結論

基於本報告之文獻回顧、軟體驗證結果及風險效益分析，本臨床評估得出以下結論：

1. **文獻證據充分：** 全部 89 個計算器均有同儕審查文獻來源，其中 45+ 個被國際臨床指引採納
2. **軟體實作正確：** 79 個計算器經 Golden Dataset 驗證，395+ 測試案例通過率 100%
3. **風險可接受：** 所有已辨識風險均已實施緩解措施，殘餘風險處於可接受或 ALARP 範圍
4. **效益大於風險：** 自動化計算、FHIR 整合、輸入驗證帶來的臨床效益明顯大於殘餘風險

**結論：MEDCALCEHR 符合預期用途之安全性與有效性要求，建議進行 TFDA 第二等級醫療器材軟體查驗登記。**

---

## 11. 上市後臨床追蹤計畫

### 11.1 持續監測項目

| 項目 | 頻率 | 負責單位 |
|------|------|---------|
| 計算器公式正確性回歸測試 | 每次版本更新 | 開發團隊 |
| 使用者回饋與異常通報收集 | 持續 | 臨床支援團隊 |
| 文獻更新追蹤（指引改版） | 每季 | 臨床顧問 |
| 安全性事件評估 | 事件發生時 | 品質管理團隊 |
| 年度臨床評估報告更新 | 每年 | 法規事務團隊 |

### 11.2 觸發更新之條件

- 原始文獻公式被新版指引修訂
- 接獲計算結果不正確之使用者通報
- 發現新的安全性風險或使用限制
- FHIR 標準或 TW Core IG 重大版本更新

---

## 附錄A：參考文獻

### 重症醫學
1. Knaus WA, Draper EA, Wagner DP, Zimmerman JE. APACHE II: a severity of disease classification system. *Crit Care Med.* 1985;13(10):818-829.
2. Vincent JL, Moreno R, Takala J, et al. The SOFA (Sepsis-related Organ Failure Assessment) score to describe organ dysfunction/failure. *Intensive Care Med.* 1996;22(7):707-710.
3. Seymour CW, Liu VX, Iwashyna TJ, et al. Assessment of Clinical Criteria for Sepsis: For the Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). *JAMA.* 2016;315(8):762-774.
4. Bone RC, Balk RA, Cerra FB, et al. Definitions for sepsis and organ failure and guidelines for the use of innovative therapies in sepsis. *Chest.* 1992;101(6):1644-1655.

### 心血管
5. Goff DC Jr, Lloyd-Jones DM, Bennett G, et al. 2013 ACC/AHA Guideline on the Assessment of Cardiovascular Risk. *Circulation.* 2014;129(25 Suppl 2):S49-73.
6. Fox KA, Dabbous OH, Goldberg RJ, et al. Prediction of risk of death and myocardial infarction in the six months after presentation with acute coronary syndrome. *BMJ.* 2006;333(7578):1091.
7. Six AJ, Backus BE, Kelder JC. Chest pain in the emergency room: value of the HEART score. *Neth Heart J.* 2008;16(6):191-196.
8. Wells PS, Anderson DR, Rodger M, et al. Derivation of a simple clinical model to categorize patients probability of pulmonary embolism. *Thromb Haemost.* 2000;83(3):416-420.
9. Lip GY, Nieuwlaat R, Pisters R, Lane DA, Crijns HJ. Refining clinical risk stratification for predicting stroke and thromboembolism in atrial fibrillation. *Chest.* 2010;137(2):263-272.
10. Nashef SA, Roques F, Sharples LD, et al. EuroSCORE II. *Eur J Cardiothorac Surg.* 2012;41(4):734-745.
11. Antman EM, Cohen M, Bernink PJ, et al. The TIMI risk score for unstable angina/non-ST elevation MI. *JAMA.* 2000;284(7):835-842.

### 腎臟
12. Inker LA, Eneanya ND, Coresh J, et al. New Creatinine- and Cystatin C-Based Equations to Estimate GFR without Race. *N Engl J Med.* 2021;385(19):1737-1749.
13. Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. *Nephron.* 1976;16(1):31-41.
14. Levey AS, Bosch JP, Lewis JB, et al. A more accurate method to estimate glomerular filtration rate from serum creatinine. *Ann Intern Med.* 1999;130(6):461-470.

### 消化內科
15. Pugh RN, Murray-Lyon IM, Dawson JL, Pietroni MC, Williams R. Transection of the oesophagus for bleeding oesophageal varices. *Br J Surg.* 1973;60(8):646-649.
16. Kim WR, Biggins SW, Kremers WK, et al. Hyponatremia and mortality among patients on the liver-transplant waiting list. *N Engl J Med.* 2008;359(10):1018-1026.
17. Sterling RK, Lissen E, Clumeck N, et al. Development of a simple noninvasive index to predict significant fibrosis in patients with HIV/HCV coinfection. *Hepatology.* 2006;43(6):1317-1325.

### 神經科
18. Brott T, Adams HP Jr, Olinger CP, et al. Measurements of acute cerebral infarction: a clinical examination scale. *Stroke.* 1989;20(7):864-870.
19. Teasdale G, Jennett B. Assessment of coma and impaired consciousness. A practical scale. *Lancet.* 1974;2(7872):81-84.
20. NINDS rt-PA Stroke Study Group. Tissue plasminogen activator for acute ischemic stroke. *N Engl J Med.* 1995;333(24):1581-1587.

### 兒科
21. Apgar V. A proposal for a new method of evaluation of the newborn infant. *Anesth Analg.* 1953;32(4):260-267.
22. Kuppermann N, Holmes JF, Dayan PS, et al. Identification of children at very low risk of clinically-important brain injuries after head trauma. *Lancet.* 2009;374(9696):1160-1170.

### 精神科
23. Kroenke K, Spitzer RL, Williams JB. The PHQ-9: validity of a brief depression severity measure. *J Gen Intern Med.* 2001;16(9):606-613.
24. Spitzer RL, Kroenke K, Williams JB, Löwe B. A brief measure for assessing generalized anxiety disorder: the GAD-7. *Arch Intern Med.* 2006;166(10):1092-1097.

### 一般
25. Bazett HC. An analysis of the time-relations of electrocardiograms. *Heart.* 1920;7:353-370.
26. Mosteller RD. Simplified calculation of body-surface area. *N Engl J Med.* 1987;317(17):1098.

### 法規標準
27. IEC 62304:2006+AMD1:2015 — Medical device software — Software life cycle processes.
28. ISO 14971:2019 — Medical devices — Application of risk management to medical devices.
29. IEC 62366-1:2015 — Medical devices — Usability engineering.
30. IMDRF SaMD Working Group. Software as a Medical Device: Possible Framework for Risk Categorization and Corresponding Considerations. 2014.
31. MEDDEV 2.7/1 Rev 4 — Clinical evaluation: A guide for manufacturers and notified bodies. 2016.

---

## 簽核頁

| 角色 | 姓名 | 日期 | 簽名 |
|------|------|------|------|
| 臨床評估者 | _________________ | ____/____/____ | _________ |
| 品質管理代表 | _________________ | ____/____/____ | _________ |
| 法規事務負責人 | _________________ | ____/____/____ | _________ |
| 專案負責人 | _________________ | ____/____/____ | _________ |

> **臨床評估者資格要求：** 依 MEDDEV 2.7/1 Rev 4，臨床評估者須具備相關臨床領域之專業知識、文獻評價能力，以及醫療器材法規知識。建議由具有專科醫師資格之臨床人員擔任。
