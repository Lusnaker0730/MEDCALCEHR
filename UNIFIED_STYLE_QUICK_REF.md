# 統一樣式快速參考

## 🎯 核心原則

✅ **使用** CSS 類  
❌ **避免** 內聯樣式（inline styles）

## 📦 常用組件

### 標題
```html
<!-- 選項 A：帶漸變背景 -->
<div class="calculator-header">
    <h3>計算器名稱</h3>
    <p class="description">說明文字</p>
</div>

<!-- 選項 B：簡單標題 -->
<h3 class="calculator-title">計算器名稱</h3>
```

### 輸入欄位
```html
<div class="input-group">
    <label for="age">Age:</label>
    <input type="number" id="age">
</div>
```

### 單選按鈕
```html
<!-- 傳統樣式 -->
<div class="radio-group">
    <span class="radio-group-title">選擇：</span>
    <label class="radio-option">
        <input type="radio" name="choice" value="1">
        <span>選項 1</span>
    </label>
</div>

<!-- 分段控制（2-4 個選項）-->
<div class="segmented-control">
    <label>
        <input type="radio" name="gender" value="male" checked>
        <span>Male</span>
    </label>
    <label>
        <input type="radio" name="gender" value="female">
        <span>Female</span>
    </label>
</div>
```

### 按鈕
```html
<button class="btn-calculate">Calculate</button>
<button class="btn-secondary">Details</button>
<button class="btn-reset">Reset</button>
```

### 結果顯示
```html
<!-- 大數字結果 -->
<div class="result-container show">
    <div class="result-score">
        <span class="result-score-value">24.5</span>
        <span class="result-score-unit">kg/m²</span>
    </div>
</div>

<!-- 多行結果 -->
<div class="result-container show">
    <div class="result-item">
        <span class="result-item-label">BMI</span>
        <span class="result-item-value">
            24.5 <span class="result-item-unit">kg/m²</span>
        </span>
    </div>
</div>
```

### 風險指標
```html
<div class="risk-badge low">Low Risk</div>
<div class="risk-badge moderate">Moderate Risk</div>
<div class="risk-badge high">High Risk</div>
<div class="risk-badge severe">Severe</div>
```

### 提示訊息
```html
<div class="alert info">
    <span class="alert-icon">ℹ️</span>
    <div class="alert-content">
        <div class="alert-title">Note</div>
        <p>提示內容...</p>
    </div>
</div>
```

### 公式區塊
```html
<div class="info-section">
    <h4>📐 Formula</h4>
    <div class="formula-box">
        <div class="formula-title">公式名稱：</div>
        <div class="formula-code">
            BMI = Weight (kg) / Height² (m²)
        </div>
    </div>
</div>
```

## 🎨 顏色對應

| 用途 | CSS 類 | 顏色 |
|------|--------|------|
| 低風險 | `.low` | 綠色 |
| 中等風險 | `.moderate` | 橙色 |
| 高風險 | `.high` | 紅色 |
| 嚴重 | `.severe` | 深紅 |
| 資訊 | `.info` | 藍色 |
| 成功 | `.success` | 綠色 |
| 警告 | `.warning` | 黃色 |
| 錯誤 | `.error` | 紅色 |

## 🔧 工具類

```html
<!-- 間距 -->
<div class="mt-20">上邊距 20px</div>
<div class="mb-30">下邊距 30px</div>

<!-- 文字對齊 -->
<div class="text-center">置中</div>
<div class="text-right">靠右</div>

<!-- 分隔線 -->
<div class="divider"></div>

<!-- 顯示/隱藏 -->
<div class="hidden">隱藏</div>
<div class="visible">顯示</div>
```

## 📋 完整範本

```javascript
export const myCalculator = {
    generateHTML: function() {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="input-group">
                <label for="age">Age:</label>
                <input type="number" id="age">
            </div>
            
            <button class="btn-calculate" id="calc-btn">Calculate</button>
            
            <div class="result-container" id="result" style="display: none;">
                <div class="result-score">
                    <span class="result-score-value" id="score">--</span>
                </div>
                <div id="risk"></div>
            </div>
            
            <div class="info-section mt-30">
                <h4>📐 Formula</h4>
                <div class="formula-box">
                    <div class="formula-code">
                        Score = ...
                    </div>
                </div>
            </div>
        `;
    },
    
    initialize: function(client, patient, container) {
        container.querySelector('#calc-btn').addEventListener('click', () => {
            const score = this.calculate(...);
            container.querySelector('#score').textContent = score;
            container.querySelector('#result').style.display = 'block';
            
            if (score < 5) {
                container.querySelector('#risk').innerHTML = 
                    '<div class="risk-badge low">Low Risk</div>';
            }
        });
    }
};
```

## ⚡ 快速轉換

### 舊寫法 ❌
```html
<div style="margin-bottom: 15px;">
    <label style="font-weight: 600;">Age:</label>
    <input type="number" style="width: 100%; padding: 10px;">
</div>
```

### 新寫法 ✅
```html
<div class="input-group">
    <label>Age:</label>
    <input type="number">
</div>
```

## 🔗 完整文件

詳細說明請參閱：[CALCULATOR_STYLE_GUIDE.md](CALCULATOR_STYLE_GUIDE.md)

## 🧪 測試

測試工具：http://localhost:8080/test-calculators.html

## 📞 需要幫助？

查看範例計算器：
- `js/calculators/bmi-bsa/index.js`
- `js/calculators/gcs/index.js`

---

**記住**：統一樣式 = 更好的使用者體驗！

