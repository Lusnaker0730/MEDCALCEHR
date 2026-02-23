# FHIR Codes Reference

Source: [`src/fhir-codes.ts`](file:///d:/CGHCALC/MEDCALCEHR/src/fhir-codes.ts)

---

## LOINC Codes

### Vital Signs

| 常數名稱 | LOINC Code | 說明 |
| :--- | :---: | :--- |
| VITAL_SIGNS_PANEL | 85353-1 | Vital signs panel |
| SYSTOLIC_BP | 8480-6 | Systolic blood pressure |
| DIASTOLIC_BP | 8462-4 | Diastolic blood pressure |
| BP_PANEL | 85354-9,55284-4 | Blood pressure panel (OR) |
| BP_PANEL_ALT | 55284-4 | Blood pressure panel (alternative) |
| MEAN_BP | 8478-0 | Mean blood pressure |
| HEART_RATE | 8867-4 | Heart rate |
| RESPIRATORY_RATE | 9279-1 | Respiratory rate |
| TEMPERATURE | 8310-5,8331-1 | Body temperature (core OR oral) |
| TEMPERATURE_ORAL | 8331-1 | Oral temperature |
| OXYGEN_SATURATION | 59408-5 | Oxygen saturation (Pulse Ox) |
| OXYGEN_SATURATION_ARTERIAL | 2708-6 | Oxygen saturation (Arterial) |
| O2_FLOW_RATE | 3151-8 | Inhaled oxygen flow rate |
| AVG_BP_PANEL | 96607-7 | Average blood pressure panel |
| AVG_BP_SYSTOLIC | 96608-5 | Average systolic blood pressure |
| AVG_BP_DIASTOLIC | 96609-3 | Average diastolic blood pressure |
| ECG | 11524-6 | ECG study |

### Body Measurements

| 常數名稱 | LOINC Code | 說明 |
| :--- | :---: | :--- |
| HEIGHT | 8302-2 | Body height |
| BODY_HEIGHT_LYING | 8306-3 | Body height lying (recumbent) |
| BODY_HEIGHT_STANDING | 8308-9 | Body height standing |
| WEIGHT | 29463-7 | Body weight |
| BODY_WEIGHT_MEASURED | 3141-9 | Body weight measured |
| BMI | 39156-5 | Body mass index |
| HEAD_CIRCUMFERENCE | 9843-4 | Head circumference |
| HEAD_CIRCUMFERENCE_TAPE | 8287-5 | Head circumference by tape measure |

### Pediatric Measurements

| 常數名稱 | LOINC Code | 說明 |
| :--- | :---: | :--- |
| PEDIATRIC_BMI_FOR_AGE | 59576-9 | Pediatric BMI for age percentile |
| PEDIATRIC_WEIGHT_FOR_HEIGHT | 77606-2 | Pediatric weight for height percentile |
| PEDIATRIC_HEAD_CIRCUMFERENCE | 8289-1 | Pediatric head circumference percentile |

### Hematology

| 常數名稱 | LOINC Code | 說明 |
| :--- | :---: | :--- |
| HEMOGLOBIN | 718-7 | Hemoglobin |
| HEMATOCRIT | 4544-3 | Hematocrit |
| WBC | 6690-2 | White blood cells |
| PLATELETS | 777-3 | Platelets (automated count) |
| PLATELET_COUNT | 777-3 | Platelets (alias) |
| PLATELETS_ALT | 26515-7 | Platelets in blood |
| EOSINOPHILS | 26478-8 | Eosinophils |

### Chemistry

| 常數名稱 | LOINC Code | 說明 |
| :--- | :---: | :--- |
| SODIUM | 2951-2 | Sodium |
| POTASSIUM | 2823-3 | Potassium |
| CHLORIDE | 2075-0 | Chloride |
| BICARBONATE | 1963-8 | Bicarbonate (serum) |
| CO2 | 2028-9 | Carbon dioxide |
| BUN | 3094-0 | Blood urea nitrogen |
| BUN_ALT | 6299-8 | BUN (alternative) |
| CREATININE | 2160-0 | Creatinine |
| GLUCOSE | 2345-7 | Glucose |
| CALCIUM | 17861-6 | Calcium |
| MAGNESIUM | 2601-3 | Magnesium |
| PHOSPHATE | 2777-1 | Phosphate |
| ALBUMIN | 1751-7 | Albumin |
| INSULIN_LEVEL | 20448-7 | Fasting Insulin |
| FASTING_GLUCOSE | 2339-0 | Fasting Glucose |

### Liver Function

| 常數名稱 | LOINC Code | 說明 |
| :--- | :---: | :--- |
| BILIRUBIN_TOTAL | 1975-2 | Bilirubin total |
| BILIRUBIN_DIRECT | 1968-7 | Bilirubin direct |
| AST | 1920-8 | AST (SGOT) |
| ALT | 1742-6 | ALT (SGPT) |
| ALP | 6768-6 | Alkaline phosphatase |
| GGT | 2324-2 | Gamma glutamyl transferase |
| ALBUMIN_SERUM | 1751-7 | Albumin serum |
| TOTAL_PROTEIN | 2885-2 | Total protein |
| INR | 6301-6 | INR |

### Lipid Panel

| 常數名稱 | LOINC Code | 說明 |
| :--- | :---: | :--- |
| CHOLESTEROL_TOTAL | 2093-3 | Cholesterol total |
| HDL | 2085-9 | HDL cholesterol |
| LDL | 2089-1 | LDL cholesterol |
| TRIGLYCERIDES | 2571-8 | Triglycerides |

### Renal Function

| 常數名稱 | LOINC Code | 說明 |
| :--- | :---: | :--- |
| EGFR | 33914-3 | eGFR |
| URINE_POTASSIUM | 2829-0 | Urine potassium |
| SERUM_OSMOLALITY | 2695-6 | Serum osmolality |
| URINE_OSMOLALITY | 2697-2 | Urine osmolality |
| URINE_SODIUM | 2828-2,2955-3 | Urine sodium (24h OR random) |
| URINE_SODIUM_RANDOM | 2955-3 | Urine sodium random |
| URINE_CREATININE | 2161-8 | Urine creatinine |
| URINE_UREA_NITROGEN | 3095-7 | Urine urea nitrogen |

### Inflammatory Markers

| 常數名稱 | LOINC Code | 說明 |
| :--- | :---: | :--- |
| CRP | 1988-5 | C-reactive protein |
| ESR | 4537-7 | Erythrocyte sedimentation rate |
| PROCALCITONIN | 33959-8 | Procalcitonin |

### Cardiac Markers

| 常數名稱 | LOINC Code | 說明 |
| :--- | :---: | :--- |
| TROPONIN_I | 10839-9 | Troponin I |
| TROPONIN_T | 6598-7 | Troponin T |
| TROPONIN_T_HIGH | 30239-8 | Troponin T high sensitivity |
| TROPONIN_I_HIGH | 15056-5 | Troponin I high sensitivity |
| TROPONIN_ALT | 32195-5 | Troponin (alternative) |
| BNP | 30934-4 | BNP |
| NT_PRO_BNP | 33762-6 | NT-proBNP |

### Coagulation

| 常數名稱 | LOINC Code | 說明 |
| :--- | :---: | :--- |
| PT | 5902-2 | Prothrombin time |
| PTT | 14979-9 | Partial thromboplastin time |
| INR_COAG | 34714-6 | INR from coagulation panel |
| FIBRINOGEN | 3255-7 | Fibrinogen |
| D_DIMER | 48065-7 | D-dimer |

### Arterial Blood Gas

| 常數名稱 | LOINC Code | 說明 |
| :--- | :---: | :--- |
| PH | 2744-1 | pH |
| PCO2 | 2019-8 | pCO2 |
| PO2 | 2703-7 | pO2 |
| PaO2_FiO2 | 50984-4 | PaO2/FiO2 ratio |
| HCO3 | 1960-4 | Bicarbonate (ABG) |
| BASE_EXCESS | 1925-7 | Base excess |
| LACTATE | 2524-7 | Lactate |
| FIO2 | 3150-0 | Inhaled oxygen concentration |

### Cardiac Measurements

| 常數名稱 | LOINC Code | 說明 |
| :--- | :---: | :--- |
| QT_INTERVAL | 8633-1 | QT interval |
| LVEF | 10230-1 | Left ventricular ejection fraction |
| LVEF_2D | 18043-0 | LVEF by 2D Echo |
| PA_SYSTOLIC_PRESSURE | 27164-3 | Pulmonary artery systolic pressure |
| PA_MEAN_PRESSURE | 8414-5 | Pulmonary artery mean pressure |

### Other Laboratory

| 常數名稱 | LOINC Code | 說明 |
| :--- | :---: | :--- |
| HBA1C | 4548-4 | Hemoglobin A1c |
| TSH | 3016-3 | Thyroid stimulating hormone |
| FREE_T4 | 3053-6 | Free T4 |
| CORTISOL | 2143-6 | Cortisol |
| URIC_ACID | 3084-1 | Uric acid |
| AMYLASE | 1798-8 | Amylase |
| LIPASE | 3040-3 | Lipase |
| LDH | 2532-0 | Lactate dehydrogenase |
| CULTURE | 630-4 | Bacteria in specimen by culture |
| ETHANOL | 49765-1 | Ethanol concentration |
| FERRITIN | 2276-4 | Ferritin |
| VITAMIN_D | 1989-3 | Vitamin D 25-hydroxy |
| CSF_GRAM_STAIN | 664-3 | CSF Gram stain |
| CSF_ANC | 26485-3 | Neutrophils in CSF |
| CSF_PROTEIN | 3137-7 | Protein in CSF |
| NEUTROPHILS_ABSOLUTE | 751-8 | Neutrophils in Blood |

### Clinical Assessments / Other

| 常數名稱 | LOINC Code | 說明 |
| :--- | :---: | :--- |
| GCS | 9269-2 | Glasgow Coma Scale total |
| GCS_EYE | 9267-6 | GCS eye opening |
| GCS_VERBAL | 9270-0 | GCS verbal |
| GCS_MOTOR | 9268-4 | GCS motor |
| PAIN_SCORE | 72514-3 | Pain severity |
| APGAR_1MIN | 9272-6 | Apgar score 1 min |
| APGAR_5MIN | 9274-2 | Apgar score 5 min |
| SMOKING_STATUS | 72166-2 | Smoking status |
| TOBACCO_HISTORY | 11367-0 | Tobacco use and exposure |
| UREA | 3094-0 | Urea |
| BLOOD_TYPE | 882-1 | Blood type |
| RH_FACTOR | 10331-7 | Rh factor |
| ASA_PHYSICAL_STATUS | 11368-0 | ASA Physical Status Class |

---

## SNOMED CT Codes

### Cardiovascular

| 常數名稱 | SNOMED Code | 說明 |
| :--- | :---: | :--- |
| HYPERTENSION | 38341003 | Hypertension |
| CORONARY_ARTERY_DISEASE | 53741008 | Coronary artery disease |
| MYOCARDIAL_INFARCTION | 22298006 | Myocardial infarction |
| HEART_FAILURE | 84114007 | Heart failure |
| CONGESTIVE_HEART_FAILURE | 42343007 | Congestive heart failure |
| ATRIAL_FIBRILLATION | 49436004 | Atrial fibrillation |
| STROKE | 230690007 | Stroke |
| TIA | 266257000 | Transient ischemic attack |
| PERIPHERAL_ARTERY_DISEASE | 399957001 | Peripheral artery disease |
| CARDIOGENIC_SHOCK | 27885002 | Cardiogenic shock |
| ACUTE_CORONARY_SYNDROME | 394659003 | ACS |
| ENDOCARDITIS | 56819008 | Endocarditis |
| PULMONARY_HYPERTENSION | 70995007 | Pulmonary hypertension |
| PREVIOUS_CARDIAC_SURGERY | 232717009 | CABG (marker) |
| DEEP_VEIN_THROMBOSIS | 128053003 | DVT |
| CARDIAC_ARREST | 410429000 | Cardiac arrest |

### Respiratory

| 常數名稱 | SNOMED Code | 說明 |
| :--- | :---: | :--- |
| COPD | 13645005 | COPD |
| ASTHMA | 195967001 | Asthma |
| PNEUMONIA | 233604007 | Pneumonia |
| PULMONARY_EMBOLISM | 59282003 | Pulmonary embolism |
| RESPIRATORY_FAILURE | 409622000 | Respiratory failure |
| SLEEP_APNEA | 78275009 | Sleep apnea |

### Metabolic / Endocrine

| 常數名稱 | SNOMED Code | 說明 |
| :--- | :---: | :--- |
| DIABETES_MELLITUS | 73211009 | Diabetes mellitus |
| DIABETES_TYPE_1 | 46635009 | Type 1 DM |
| DIABETES_TYPE_2 | 44054006 | Type 2 DM |
| HYPERLIPIDEMIA | 55822004 | Hyperlipidemia |
| OBESITY | 414915002 | Obesity |
| HYPOTHYROIDISM | 40930008 | Hypothyroidism |
| HYPERTHYROIDISM | 34486009 | Hyperthyroidism |

### Renal

| 常數名稱 | SNOMED Code | 說明 |
| :--- | :---: | :--- |
| CHRONIC_KIDNEY_DISEASE | 709044004 | CKD |
| ACUTE_KIDNEY_INJURY | 14669001 | AKI |
| END_STAGE_RENAL_DISEASE | 46177005 | ESRD |
| DIALYSIS_DEPENDENT | 429451001 | Dialysis dependent |

### Liver

| 常數名稱 | SNOMED Code | 說明 |
| :--- | :---: | :--- |
| CIRRHOSIS | 19943007 | Cirrhosis |
| LIVER_FAILURE | 59927004 | Liver failure |
| HEPATITIS | 40468003 | Hepatitis |
| ALCOHOLIC_LIVER_DISEASE | 41309000 | Alcoholic liver disease |

### Hematological

| 常數名稱 | SNOMED Code | 說明 |
| :--- | :---: | :--- |
| ANEMIA | 271737000 | Anemia |
| BLEEDING_DISORDER | 64779008 | Bleeding disorder |
| THROMBOCYTOPENIA | 415116008 | Thrombocytopenia |
| ANTICOAGULATION_THERAPY | 281789004 | Anticoagulation therapy |

### Neurological

| 常數名稱 | SNOMED Code | 說明 |
| :--- | :---: | :--- |
| DEMENTIA | 52448006 | Dementia |
| EPILEPSY | 84757009 | Epilepsy |
| PARKINSONS_DISEASE | 49049000 | Parkinson's disease |
| MULTIPLE_SCLEROSIS | 24700007 | Multiple sclerosis |
| PARALYSIS | 166001 | Paralysis |

### Malignancies

| 常數名稱 | SNOMED Code | 說明 |
| :--- | :---: | :--- |
| MALIGNANCY | 363346000 | Malignancy |
| METASTATIC_CANCER | 94225005 | Metastatic cancer |
| LEUKEMIA | 93143009 | Leukemia |
| LYMPHOMA | 118600007 | Lymphoma |

### Infections

| 常數名稱 | SNOMED Code | 說明 |
| :--- | :---: | :--- |
| SEPSIS | 91302008 | Sepsis |
| HIV | 86406008 | HIV |
| TUBERCULOSIS | 56717001 | Tuberculosis |
| COVID_19 | 840539006 | COVID-19 |

### Smoking Status

| 常數名稱 | SNOMED Code | 說明 |
| :--- | :---: | :--- |
| SMOKING | 77176002 | Smoker (current status unknown) |
| NEVER_SMOKER | 266919005 | Never smoked tobacco |
| FORMER_SMOKER | 8517006 | Ex-smoker |
| CURRENT_EVERY_DAY_SMOKER | 449868002 | Current every day smoker |
| CURRENT_SOME_DAY_SMOKER | 428041000124106 | Current some day smoker |
| CURRENT_HEAVY_SMOKER | 428071000124103 | Current heavy smoker |
| CURRENT_LIGHT_SMOKER | 428061000124105 | Current light smoker |
| SMOKING_STATUS_UNKNOWN | 266927001 | Unknown if ever smoked |
| E_CIGARETTE_USER | 722499006 | Electronic cigarette user |
| SECONDHAND_SMOKE_EXPOSURE | 699009004 | History of secondhand smoke |
| CIGARETTE_PACK_YEARS | 401201003 | Pack-years |
| CALCULATED_PACK_YEARS | 782516008 | Calculated pack-years |

### Procedures / Risk Factors / Other

| 常數名稱 | SNOMED Code | 說明 |
| :--- | :---: | :--- |
| PACEMAKER | 14106009 | Pacemaker |
| CABG | 232717009 | CABG |
| PCI | 415070008 | PCI |
| VALVE_SURGERY | 119978007 | Valve surgery |
| TRANSPLANT | 77465005 | Transplant |
| FAMILY_HISTORY_CAD | 266897004 | Family history of CAD |
| PREVIOUS_MI | 399211009 | Previous MI |
| PREVIOUS_STROKE | 161505003 | Previous stroke |
| PREVIOUS_BLEEDING | 131148009 | Previous bleeding |
| ISCHEMIC_HEART_DISEASE | 414545008 | Ischemic heart disease |
| FRACTURE | 125605004 | Fracture |
| HEMOPTYSIS | 66857006 | Hemoptysis |
| CONNECTIVE_TISSUE_DISEASE | 105969002 | Connective tissue disease |
| PEPTIC_ULCER_DISEASE | 13200003 | Peptic ulcer disease |
| HEMIPLEGIA | 50582007 | Hemiplegia |
| AIDS | 62479008 | AIDS |
| SEIZURE | 91175000 | Seizure |
| ALCOHOL_ABUSE | 7200002 | Alcohol abuse |
| DRUG_ABUSE | 66214007 | Drug abuse |
| POSITIVE_RESULT | 260348003 | Positive result |
| HISTORY_OF_VTE | 451574005 | History of VTE |

---

## RxNorm Codes (Medications)

| 常數名稱 | RxNorm Code | 說明 |
| :--- | :---: | :--- |
| **Antiplatelets** | | |
| ASPIRIN | 1191 | Aspirin |
| CLOPIDOGREL | 32968 | Clopidogrel |
| TICAGRELOR | 1116632 | Ticagrelor |
| PRASUGREL | 855812 | Prasugrel |
| P2Y12_INHIBITOR | 32968,1116632,855812 | P2Y12 inhibitors (OR) |
| **Anticoagulants** | | |
| WARFARIN | 11289 | Warfarin |
| HEPARIN | 5224 | Heparin |
| ENOXAPARIN | 67108 | Enoxaparin |
| RIVAROXABAN | 1114195 | Rivaroxaban |
| APIXABAN | 1364430 | Apixaban |
| DABIGATRAN | 1037042 | Dabigatran |
| EDOXABAN | 1599538 | Edoxaban |
| **Diabetic Medications** | | |
| INSULIN | 274783 | Insulin |
| **NSAIDs** | | |
| IBUPROFEN | 5640 | Ibuprofen |
| NAPROXEN | 7258 | Naproxen |
| DICLOFENAC | 3355 | Diclofenac |
| KETOROLAC | 6130 | Ketorolac |
| INDOMETHACIN | 5775 | Indomethacin |
| MELOXICAM | 6835 | Meloxicam |
| CELECOXIB | 202472 | Celecoxib |
| **Corticosteroids** | | |
| PREDNISONE | 8640 | Prednisone |
| PREDNISOLONE | 8638 | Prednisolone |
| METHYLPREDNISOLONE | 6902 | Methylprednisolone |
| DEXAMETHASONE | 3264 | Dexamethasone |
| HYDROCORTISONE | 5492 | Hydrocortisone |
| TRIAMCINOLONE | 10759 | Triamcinolone |
| **Beta Blockers** | | |
| METOPROLOL | 6918 | Metoprolol |
| CARVEDILOL | 20352 | Carvedilol |
| BISOPROLOL | 16154 | Bisoprolol |
| ATENOLOL | 1202 | Atenolol |
| PROPRANOLOL | 8787 | Propranolol |
| LABETALOL | 6221 | Labetalol |
| **ACE Inhibitors** | | |
| LISINOPRIL | 29046 | Lisinopril |
| ENALAPRIL | 3827 | Enalapril |
| RAMIPRIL | 35296 | Ramipril |
| CAPTOPRIL | 1998 | Captopril |
| BENAZEPRIL | 1886 | Benazepril |
| **ARBs** | | |
| LOSARTAN | 52175 | Losartan |
| VALSARTAN | 69749 | Valsartan |
| CANDESARTAN | 83367 | Candesartan |
| IRBESARTAN | 83515 | Irbesartan |
| OLMESARTAN | 259255 | Olmesartan |

---

## ICD-10 Codes

> 詳細內容見 `ICD10_CODES` 物件（`src/fhir-codes.ts`），對應範圍與 SNOMED_CODES 相同，包含心血管、呼吸、代謝、腎臟、肝臟、血液、神經、惡性腫瘤、感染及其他類別。
