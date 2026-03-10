# AI Calculator API 架構規劃

## 目標
讓 AI 系統能使用 MEDCALCEHR 已驗證的 92 個臨床計算器

## 核心優勢：已有的可重用資產

| 資產 | 用途 |
|------|------|
| 92 個純計算函數 (calculation.ts) | 直接在 server-side 執行，無需瀏覽器 |
| 416 個 golden dataset (83 calc × 5 cases) | 驗證 AI 呼叫結果的正確性 |
| 3 種 runner pattern 的統一簽名 | 標準化 API 介面 |
| FormulaResultItem[] 輸出格式 | 統一的回傳結構 |

## 計算函數簽名（3 種 pattern）

### Simple (45 calculators)
```typescript
(values: Record<string, number|string|boolean>) => FormulaResultItem[]
```

### Scoring (32 calculators)
```typescript
(config, inputs) => { totalScore, riskLevel }
```

### Complex (6 calculators)
```typescript
(getValue, getStdValue, getRadioValue, getCheckboxValue) => { score, interpretation, additionalResults }
```

## 三層架構方案

### Phase 1: Calculator Engine 抽取
- 建立 `packages/calculator-engine/`
- 將 92 個 calculation.ts 純函數打包為獨立模組
- 統一 input schema 自動生成（從現有 calculator config 萃取）
- golden dataset 做為 engine 的整合測試
- 關鍵：計算邏輯已與 UI 分離，每個計算器的 `calculation.ts` 是純函數

### Phase 2: MCP Server（優先推薦）
- 建立 `packages/mcp-server/`
- 每個計算器 → 一個 MCP Tool
- Anthropic Model Context Protocol，Claude 原生支援
- inputSchema 從 calculator config 自動生成
- 加入臨床 context（whenToUse, limitations）

```
AI Agent (Claude)
    ↓ MCP Protocol (stdio/SSE)
MCP Server (Node.js)
    ↓ import
Calculator Engine (92 pure functions)
    ↓
Structured Results (JSON)
```

MCP Tool 範例：
```typescript
{
  name: "calculate_bmi_bsa",
  description: "Calculate BMI and Body Surface Area",
  inputSchema: {
    type: "object",
    properties: {
      weight_kg: { type: "number", description: "Patient weight in kg" },
      height_cm: { type: "number", description: "Patient height in cm" }
    },
    required: ["weight_kg", "height_cm"]
  }
}
```

### Phase 3: REST API + OpenAPI（可選）
- Express/Fastify thin layer
- `POST /api/v1/calculators/{id}/calculate`
- `GET /api/v1/calculators` — 列出所有計算器 + schema
- `GET /api/v1/calculators/{id}/schema` — 取得 inputSchema
- OpenAPI spec 自動生成，可轉為任何 AI 的 function definition
- Auth (API key / JWT)、rate limiting、audit logging
- 可部署為獨立微服務或加入現有 Docker

### Phase 4: CDS Hooks（可選）
- HL7 CDS Hooks 醫療業界標準
- 對接醫院 EHR 系統
- CDS Card 回傳建議 + 計算結果 + 參考文獻

## 關鍵設計決策

| 決策點 | 建議 |
|--------|------|
| Schema 來源 | 從現有 calculator config 自動生成，不手寫 |
| 單位處理 | API 層統一用標準單位（kg, cm, mg/dL），內部轉換 |
| 驗證 | 重用現有 validator.ts 的 red/yellow/green zone |
| AI 可發現性 | 每個工具包含 description、whenToUse、limitations |
| 安全 | PHI 不經過 AI — AI 只送識別碼，計算在本地執行 |

## 關鍵檔案參考

- `src/calculators/index.ts` — 計算器註冊表
- `src/calculators/shared/unified-formula-calculator.ts` — Formula factory
- `src/calculators/shared/scoring-calculator.ts` — Scoring factory
- `src/calculators/shared/conversion-calculator.ts` — Conversion factory
- `src/calculators/shared/dynamic-list-calculator.ts` — Dynamic list factory
- `src/calculators/*/calculation.ts` — 各計算器的純計算函數
- `src/__tests__/golden-datasets/*.json` — Golden dataset test cases
- `src/__tests__/golden-dataset-runner.ts` — Test runner (3 patterns)

## 狀態
- **規劃完成**: 2026-03-10
- **待實作**: Phase 1 → Phase 2
