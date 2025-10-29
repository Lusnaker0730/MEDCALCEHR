# 🏥 CGMH EHRCALC on FHIR

A comprehensive SMART on FHIR application providing **92 clinical calculators** for healthcare professionals, inspired by MDCalc. This application integrates seamlessly with Electronic Health Records (EHR) to provide automated patient data population and clinical decision support.

## ✨ Features

### 🧮 **92 Clinical Calculators**
- **Cardiovascular Risk Assessment**: ASCVD, Framingham, GRACE ACS, etc.
- **Renal Function**: CKD-EPI, MDRD, Cockcroft-Gault, etc.
- **Critical Care Scoring**: APACHE II, SOFA, qSOFA, etc.
- **Drug Conversion**: Benzodiazepine, Steroid, MME calculators
- **Pediatric Tools**: Growth Charts, APGAR, PECARN, etc.
- **Infection Assessment**: CURB-65, SIRS, Bacterial Meningitis Score, etc.

### 🔗 **SMART on FHIR Integration**
- Automatic patient data population from EHR
- Real-time lab value retrieval
- Seamless integration with clinical workflows

### 🎨 **Modern User Interface**
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Sticky Header**: Patient info and search always visible
- **Advanced Search & Sort**: Find calculators quickly with A-Z, Z-A sorting
- **Beautiful UI**: Modern gradient design with smooth animations

### 📊 **Enhanced Calculator Features**
- **Formula Display**: Mathematical formulas with detailed explanations
- **Reference Materials**: Citations and clinical images
- **Normal Value Ranges**: Built-in reference ranges
- **Clinical Notes**: Important usage guidelines

## 🚀 How to Run

### Method 1: Docker (推薦 / Recommended) 🐳

**最簡單的方式 - 一鍵啟動！**

```bash
# Windows
.\start-docker.ps1

# Linux/Mac
chmod +x start-docker.sh
./start-docker.sh

# 或使用 Docker Compose
docker-compose up -d
```

訪問：**http://localhost:8080**

📖 詳細說明請參考 [Docker 部署指南](README_DOCKER.md)

### Method 2: Python HTTP Server
1. Navigate to the project directory
2. Start a local web server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

### Method 3: Node.js HTTP Server
```bash
npx http-server -p 8000
```

### Method 4: Live Server (VS Code Extension)
1. Install the "Live Server" extension in VS Code
2. Right-click on `launch.html` and select "Open with Live Server"

## 🔧 SMART on FHIR Setup

1. **Start your local server** (using any method above)
2. **Go to SMART Health IT Launcher**: [https://launch.smarthealthit.org/](https://launch.smarthealthit.org/)
3. **Configure the launcher**:
   - **App Launch URL**: `http://localhost:8000/launch.html`
   - **Select a patient** from the available test patients
4. **Launch the application**

## 📱 Usage

### 🔍 **Finding Calculators**
- Use the **search bar** to find specific calculators
- **Sort options**: A→Z, Z→A, Recently Added, Most Used
- **Browse by category**: All calculators are alphabetically organized

### 📋 **Using Calculators**
- Patient data is **automatically populated** from the EHR
- **Manual input** available for all fields
- **Real-time calculations** with immediate results
- **Formula explanations** and clinical guidance provided

### 📊 **Special Features**
- **Growth Charts**: Side-by-side height/weight visualization
- **Reference Images**: Clinical scoring tables and diagrams
- **Formula Sections**: Mathematical explanations with normal values

## 🛠️ Technical Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **FHIR Client**: SMART on FHIR JavaScript client
- **Charts**: Chart.js for pediatric growth charts
- **Design**: Modern CSS with gradients and animations
- **Architecture**: Modular calculator system

## 📁 Project Structure

```
MEDCALCEHR/
├── index.html              # Main calculator list
├── calculator.html          # Individual calculator page
├── launch.html             # SMART on FHIR launch page
├── style.css               # Main stylesheet
├── js/
│   ├── main.js             # Main application logic
│   ├── calculator-page.js  # Calculator page logic
│   ├── utils.js            # FHIR utilities
│   └── calculators/        # Calculator modules
│       ├── index.js        # Calculator registry
│       ├── apache-ii/      # APACHE II calculator
│       ├── growth-chart/   # Pediatric growth charts
│       ├── bwps/          # BWPS calculator
│       └── ...            # 89 other calculators
└── README.md
```

## 🔄 Recent Updates

- ✅ **Fixed Charlson Calculator**: Resolved `codes.join is not a function` error
- ✅ **Enhanced Growth Charts**: Side-by-side height/weight display with optimized space usage
- ✅ **Sticky Header**: Patient info and search remain visible while scrolling
- ✅ **Advanced Sorting**: Multiple sort options for calculator list
- ✅ **Formula Displays**: Added mathematical formulas with explanations
- ✅ **Reference Materials**: Integrated clinical images and citations

## 🏥 Clinical Calculators Included

<details>
<summary>View all 92 calculators</summary>

- 2HELPS2B Score for Seizure Risk
- 4 A's Test for Delirium
- 4C Mortality Score for COVID-19
- 4-Level Pulmonary Embolism Clinical Probability Score (4PEPS)
- 4Ts Score for Heparin-Induced Thrombocytopenia (HIT)
- 6-Minute Walk Distance (6MWD) Calculator
- ABG Analyzer
- ABL90 FLEX Analyzer Calculator
- ACTION-ICU Risk Score for Intensive Care in NSTEMI
- APACHE II Score
- APGAR Score
- ARISCAT Score for Postoperative Pulmonary Complications
- ASCVD Risk Score (10-Year)
- Atrial Fibrillation (AF) Risk Score (AHEAD)
- Bacterial Meningitis Score for Children
- Benzodiazepine Conversion Calculator
- BMI and BSA Calculator
- BWPS for Thyrotoxicosis
- Caprini Score for VTE Risk
- Centor Score for Strep Pharyngitis
- Charlson Comorbidity Index (CCI)
- Child-Pugh Score for Cirrhosis Mortality
- CIWA-Ar for Alcohol Withdrawal
- CKD-EPI GFR (2021)
- Clinical Pulmonary Infection Score (CPIS) for VAP
- Cockcroft-Gault Creatinine Clearance
- Corrected Calcium for Hypoalbuminemia
- Corrected Phenytoin for Hypoalbuminemia
- Corrected QT Interval (QTc)
- Corrected Sodium for Hyperglycemia
- Corticosteroid Conversion Calculator
- CURB-65 Score for Pneumonia Severity
- Duke Activity Status Index (DASI)
- Due Date Calculator
- Ethanol Concentration Conversion
- ETT Depth and Tidal Volume Calculator
- FIB-4 Score for Liver Fibrosis
- Fractional Excretion of Sodium (FENa)
- Framingham Risk Score for Coronary Heart Disease
- Free Water Deficit in Hypernatremia
- Friedewald Equation for LDL Cholesterol
- GAD-7 for Anxiety
- GARFIELD-AF Risk Score
- Geneva Score (Revised) for Pulmonary Embolism
- Glasgow Coma Scale (GCS)
- GRACE ACS Risk Score
- Gupta Perioperative Cardiac Risk (MICA)
- GWTG-HF Risk Score
- HAS-BLED Score for Major Bleeding Risk
- HEART Score for Major Cardiac Events
- HOMA-IR for Insulin Resistance
- HScore for Hemophagocytic Lymphohistiocytosis (HLH)
- Ideal Body Weight (IBW) Calculator
- Intraoperative Fluid Dosing Calculator
- ISTH Criteria for DIC
- Kawasaki Disease Diagnostic Criteria
- MAGGIC Risk Calculator for Heart Failure
- Maintenance Fluids Calculator
- Mean Arterial Pressure (MAP)
- MDRD GFR Equation
- MELD-Na Score for Liver Disease Severity
- Morphine Milligram Equivalent (MME) Calculator
- NAFLD Fibrosis Score
- NIH Stroke Scale (NIHSS)
- Padua Prediction Score for VTE Risk
- PECARN Head Trauma Rule for Children
- Pediatric Growth Chart
- PERC Rule for Pulmonary Embolism
- PHQ-9 for Depression
- QRISK3-Based CVD Risk (UK)
- qSOFA Score for Sepsis
- Ranson Criteria for Pancreatitis Mortality
- RegiSCAR Score for DRESS
- Revised Cardiac Risk Index (RCRI)
- SCORE2-Diabetes for 10-Year CVD Risk
- Serum Anion Gap
- Serum Osmolality
- SEX-SHOCK Risk Score for Cardiogenic Shock
- SIRS Criteria for Systemic Inflammatory Response
- SOFA Score for Sepsis Organ Failure
- STOP-BANG for Obstructive Sleep Apnea
- TIMI Risk Score for UA/NSTEMI
- tPA Dosing for Acute Stroke
- tPA Dosing for PE and MI
- Transtubular Potassium Gradient (TTKG)
- Wells Criteria for DVT
- Wells Criteria for PE

</details>

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🏥 About CGMH

Chang Gung Memorial Hospital (CGMH) is one of Taiwan's largest medical centers, committed to providing excellent healthcare services and advancing medical technology.
