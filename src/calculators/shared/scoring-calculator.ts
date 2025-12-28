/**
 * 統一評分計算器工廠函數
 *
 * 整合了原有的三種評分計算器：
 * - Radio Score Calculator (radio groups)
 * - Score Calculator (checkboxes)
 * - Yes/No Calculator (yes/no radio pairs)
 *
 * 支援 FHIRDataService 整合，可使用聲明式 dataRequirements 配置
 *
 * @example
 * // Radio 模式 (預設)
 * createScoringCalculator({ inputType: 'radio', ... });
 *
 * // Checkbox 模式
 * createScoringCalculator({ inputType: 'checkbox', ... });
 *
 * // Yes/No 模式
 * createScoringCalculator({ inputType: 'yesno', ... });
 */

import { uiBuilder } from '../../ui-builder.js';
import {
    fhirDataService,
    FieldDataRequirement,
    FHIRClient,
    Patient
} from '../../fhir-data-service.js';

// ==========================================
// 類型定義
// ==========================================

/** 輸入類型 */
export type InputType = 'radio' | 'checkbox' | 'yesno';

/** 選項配置 */
export interface ScoringOption {
    /** 選項 ID (checkbox 模式必須，radio 模式可選) */
    id?: string;
    /** 選項值 (支援 string 或 number) */
    value: string | number;
    /** 顯示標籤 */
    label: string;
    /** 是否預設選中 */
    checked?: boolean;
    /** 額外說明 */
    description?: string;
    /** SNOMED 條件代碼（用於 FHIR 自動選擇） */
    conditionCode?: string;
}

/** 區塊配置 */
export interface ScoringSection {
    /** 區塊 ID (radio 模式作為 name，checkbox 模式可選用於 ID 前綴) */
    id?: string;
    /** 區塊標題 */
    title: string;
    /** 圖示 */
    icon?: string;
    /** 副標題/說明 */
    subtitle?: string;
    /** 選項列表 */
    options: ScoringOption[];
    /** LOINC 代碼（用於 FHIR 自動填充） */
    loincCode?: string;
    /** 數值映射（用於將 FHIR 數值轉換為選項值） */
    valueMapping?: Array<{
        condition: (value: number) => boolean;
        /** 選項值 */
        optionValue?: string;
        /** @deprecated 使用 optionValue 代替 */
        radioValue?: string;
    }>;
    /** 觀察值條件（用於 FHIR 自動選「是」） - yesno 模式 */
    observationCriteria?: {
        code: string;
        condition: (value: number) => boolean;
    };
}

/** Yes/No 問題 (yesno 模式的簡化配置) */
export interface YesNoQuestion {
    /** 問題 ID */
    id: string;
    /** 問題標籤 */
    label: string;
    /** 選「是」時的分數 */
    points: number;
    /** 額外說明 */
    description?: string;
    /** SNOMED 條件代碼（用於 FHIR 自動選「是」） */
    conditionCode?: string;
    /** LOINC 觀察值條件 */
    observationCriteria?: {
        code: string;
        condition: (value: number) => boolean;
    };
}

/** Yes/No 模式額外配置 */
export interface YesNoModeConfig {
    /** 區塊標題 */
    sectionTitle?: string;
    /** 區塊圖示 */
    sectionIcon?: string;
    /** 分數範圍文字 (如 'points') */
    scoreRange?: string;
}

/** 風險等級 */
export interface ScoringRiskLevel {
    minScore: number;
    maxScore: number;
    /** 標籤 (通用，可選 - 如未提供則使用 category 或 risk) */
    label?: string;
    /** 風險描述 (score-calculator 兼容) */
    risk?: string;
    /** 類別 (score-calculator 兼容) */
    category?: string;
    /** 嚴重程度 */
    severity: 'success' | 'warning' | 'danger' | 'info';
    /** 描述/建議 */
    description?: string;
    /** 建議行動 */
    recommendation?: string;
}

/** FHIR 數據需求配置 */
export interface ScoringFHIRDataRequirements {
    /** 觀察值需求 */
    observations?: FieldDataRequirement[];
    /** 條件代碼（SNOMED） */
    conditions?: string[];
    /** 藥物代碼（RxNorm） */
    medications?: string[];
    /** 自動填充患者年齡 */
    autoPopulateAge?: {
        inputId?: string;
        questionId?: string;
        condition?: (age: number) => boolean;
    };
    /** 自動填充患者性別 */
    autoPopulateGender?: {
        radioName?: string;
        questionId?: string;
        maleValue: string;
        femaleValue: string;
    };
}

/** 評分標準項目 */
export interface ScoringCriteriaItem {
    criteria: string;
    points?: string;
    isHeader?: boolean;
}

/** 解釋項目 */
export interface InterpretationItem {
    score: string;
    category?: string;
    interpretation: string;
    severity?: 'success' | 'warning' | 'danger' | 'info';
}

/** Formula 區塊配置 */
export interface FormulaSectionConfig {
    show: boolean;
    title?: string;
    calculationNote?: string;
    scoringCriteria?: ScoringCriteriaItem[];
    footnotes?: string[];
    interpretationTitle?: string;
    tableHeaders?: string[];
    interpretations?: InterpretationItem[];
}

/** 統一評分計算器配置 */
export interface ScoringCalculatorConfig {
    /** 計算器 ID */
    id: string;
    /** 計算器標題 */
    title: string;
    /** 計算器描述 */
    description: string;

    /**
     * 輸入類型
     * - 'radio': Radio groups (每個區塊單選)
     * - 'checkbox': Checkboxes (可多選)
     * - 'yesno': Yes/No radio pairs (是/否選擇)
     * @default 'radio'
     */
    inputType?: InputType;

    /** 區塊列表 (radio/checkbox 模式) */
    sections?: ScoringSection[];

    /** 問題列表 (yesno 模式的簡化配置) */
    questions?: YesNoQuestion[];

    /** Yes/No 模式區塊標題 */
    sectionTitle?: string;
    /** Yes/No 模式區塊圖示 */
    sectionIcon?: string;
    /** 分數範圍文字 */
    scoreRange?: string;

    /** 風險等級列表 */
    riskLevels: ScoringRiskLevel[];

    /** 提示訊息 */
    infoAlert?: string;
    /** 解釋說明 */
    interpretationInfo?: string;
    /** 參考文獻 */
    references?: string[];

    /** Formula 區塊配置 */
    formulaSection?: FormulaSectionConfig;

    /**
     * 舊格式公式項目 (向後兼容)
     * @deprecated 請使用 formulaSection 代替
     */
    formulaItems?: Array<{
        title: string;
        formulas?: string[];
        content?: string;
        notes?: string;
    }>;

    /** FHIR 數據需求 */
    dataRequirements?: ScoringFHIRDataRequirements;

    /** 自定義結果渲染函數 */
    customResultRenderer?: (score: number, sectionScores: Record<string, number>) => string;

    /** 自定義初始化函數 */
    customInitialize?: (
        client: unknown,
        patient: unknown,
        container: HTMLElement,
        calculate: () => void
    ) => void | Promise<void>;
}

/** 計算器模組介面 */
export interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: unknown, patient: unknown, container: HTMLElement) => void;
}

// ==========================================
// 內部輔助函數
// ==========================================

/**
 * 將 YesNoQuestion 轉換為 ScoringSection (每個問題獨立 section)
 */
function convertYesNoToSections(questions: YesNoQuestion[]): ScoringSection[] {
    return questions.map(q => ({
        id: q.id,
        title: q.label,
        subtitle: q.description,
        options: [
            { value: '0', label: 'No', checked: true },
            { value: String(q.points), label: 'Yes' }
        ],
        observationCriteria: q.observationCriteria
    }));
}

/**
 * 生成 Yes/No 模式的 HTML (統一 section 內多個 radio groups)
 */
function generateYesNoSectionHTML(
    questions: YesNoQuestion[],
    sectionTitle: string,
    sectionIcon?: string
): string {
    const questionsHTML = questions
        .map(q => {
            const pointsLabel = q.points >= 0 ? `+${q.points}` : String(q.points);
            return `
                <div class="yesno-question">
                    <div class="yesno-label">${q.label}</div>
                    ${q.description ? `<div class="yesno-description">${q.description}</div>` : ''}
                    ${uiBuilder.createRadioGroup({
                        name: q.id,
                        options: [
                            { value: '0', label: 'No', checked: true },
                            { value: String(q.points), label: `Yes (${pointsLabel})` }
                        ]
                    })}
                </div>
            `;
        })
        .join('');

    return uiBuilder.createSection({
        title: sectionTitle,
        icon: sectionIcon,
        content: questionsHTML
    });
}

/**
 * 生成 Radio Group HTML
 */
function generateRadioSectionsHTML(sections: ScoringSection[]): string {
    return sections
        .map((section, index) =>
            uiBuilder.createSection({
                title: section.title,
                icon: section.icon,
                subtitle: section.subtitle,
                content: uiBuilder.createRadioGroup({
                    name: section.id || `section-${index}`,
                    options: section.options.map(opt => ({
                        value: String(opt.value),
                        label: opt.label,
                        checked: opt.checked
                    }))
                })
            })
        )
        .join('');
}

/**
 * 生成 Checkbox HTML
 */
function generateCheckboxSectionsHTML(sections: ScoringSection[]): string {
    return sections
        .map((section, sectionIndex) => {
            const sectionIdPrefix = section.id || `section-${sectionIndex}`;
            const checkboxesHTML = section.options
                .map((opt, optIndex) =>
                    uiBuilder.createCheckbox({
                        id: opt.id || `${sectionIdPrefix}-${optIndex}`,
                        label: opt.label,
                        value: String(opt.value),
                        description: opt.description
                    })
                )
                .join('');

            return uiBuilder.createSection({
                title: section.title,
                icon: section.icon,
                subtitle: section.subtitle,
                content: checkboxesHTML
            });
        })
        .join('');
}

/**
 * 生成 Formula Section HTML
 */
function generateFormulaSectionHTML(
    config: ScoringCalculatorConfig,
    sections: ScoringSection[]
): string {
    if (!config.formulaSection?.show) return '';

    const fs = config.formulaSection;
    const formulaTitle = fs.title || 'FORMULA';
    const calcNote = fs.calculationNote || 'Addition of the selected points:';

    // 生成評分標準內容
    let scoringContentHTML = '';

    if (fs.scoringCriteria?.length) {
        const scoringRows = fs.scoringCriteria
            .map(item => {
                if (item.isHeader) {
                    return `
                        <tr class="ui-scoring-table__category">
                            <td colspan="2">${item.criteria}</td>
                        </tr>
                    `;
                } else {
                    return `
                        <tr class="ui-scoring-table__item">
                            <td class="ui-scoring-table__criteria">${item.criteria}</td>
                            <td class="ui-scoring-table__points">${item.points || ''}</td>
                        </tr>
                    `;
                }
            })
            .join('');

        scoringContentHTML = `
            <div class="ui-table-wrapper">
                <table class="ui-scoring-table">
                    <thead>
                        <tr>
                            <th class="ui-scoring-table__header ui-scoring-table__header--criteria">Criteria</th>
                            <th class="ui-scoring-table__header ui-scoring-table__header--points">Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${scoringRows}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        // 從 sections 自動提取
        const scoringRows = sections
            .map(section => {
                const optionRows = section.options
                    .map(opt => {
                        const displayLabel = opt.label
                            .replace(/\s*\([+-]?\d+\)\s*$/, '')
                            .replace(/\s*\(\+?\d+\)\s*$/, '');
                        return `<tr><td class="option-label">${displayLabel}</td><td class="option-points">${opt.value}</td></tr>`;
                    })
                    .join('');

                return `
                    <tr class="category-row">
                        <td class="category-title">${section.title.replace(/^\d+\.\s*/, '')}</td>
                        <td></td>
                    </tr>
                    ${section.subtitle ? `<tr><td colspan="2" class="category-subtitle">${section.subtitle}</td></tr>` : ''}
                    ${optionRows}
                `;
            })
            .join('');

        scoringContentHTML = `
            <table class="ui-table w-100">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th class="text-center ui-scoring-table__header--points">Points</th>
                    </tr>
                </thead>
                <tbody>
                    ${scoringRows}
                </tbody>
            </table>
        `;
    }

    // 生成註腳
    const footnotesHTML = fs.footnotes?.length
        ? `<div class="footnotes-section">
            ${fs.footnotes.map(fn => `<p class="footnote-item">${fn}</p>`).join('')}
           </div>`
        : '';

    // 生成解釋表格
    let interpretationTableHTML = '';
    if (fs.interpretations?.length) {
        const interpTitle = fs.interpretationTitle || 'FACTS & FIGURES';
        const hasCategory = fs.interpretations.some(item => item.category);
        const defaultHeaders = hasCategory
            ? ['Score', 'Risk Category', 'Description']
            : ['Score', 'Interpretation'];
        const headers = fs.tableHeaders || defaultHeaders;

        const interpRows = fs.interpretations
            .map(item => {
                const severityClass = item.severity
                    ? `ui-interpretation-table__row--${item.severity}`
                    : '';

                if (hasCategory) {
                    return `
                        <tr class="ui-interpretation-table__row ${severityClass}">
                            <td class="ui-interpretation-table__cell ui-interpretation-table__score">${item.score}</td>
                            <td class="ui-interpretation-table__cell text-center">${item.category || ''}</td>
                            <td class="ui-interpretation-table__cell">${item.interpretation}</td>
                        </tr>
                    `;
                } else {
                    return `
                        <tr class="ui-interpretation-table__row ${severityClass}">
                            <td class="ui-interpretation-table__cell ui-interpretation-table__score">${item.score}</td>
                            <td class="ui-interpretation-table__cell">${item.interpretation}</td>
                        </tr>
                    `;
                }
            })
            .join('');

        const headerCells = headers
            .map(
                (h, i) =>
                    `<th class="ui-interpretation-table__header ${i === 0 ? 'text-center' : ''}">${h}</th>`
            )
            .join('');

        interpretationTableHTML = `
            <div class="ui-section mt-20">
                <div class="ui-section-title">📊 ${interpTitle}</div>
                <div class="ui-table-wrapper">
                    <table class="ui-interpretation-table">
                        <thead>
                            <tr>${headerCells}</tr>
                        </thead>
                        <tbody>
                            ${interpRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    return `
        <div class="ui-section mt-20">
            <div class="ui-section-title">📐 ${formulaTitle}</div>
            <p class="calculation-note">${calcNote}</p>
            ${scoringContentHTML}
            ${footnotesHTML}
        </div>
        ${interpretationTableHTML}
    `;
}

// ==========================================
// 主要工廠函數
// ==========================================

/**
 * 創建統一評分計算器
 */
export function createScoringCalculator(config: ScoringCalculatorConfig): CalculatorModule {
    const inputType = config.inputType || 'radio';

    // 將 questions 轉換為 sections (yesno 模式，無 sectionTitle 時)
    const sections: ScoringSection[] =
        inputType === 'yesno' && config.questions && !config.sectionTitle
            ? convertYesNoToSections(config.questions)
            : config.sections || [];

    return {
        id: config.id,
        title: config.title,
        description: config.description,

        generateHTML(): string {
            // 根據輸入類型生成對應的 HTML
            let sectionsHTML = '';
            if (inputType === 'checkbox') {
                sectionsHTML = generateCheckboxSectionsHTML(sections);
            } else if (inputType === 'yesno' && config.questions && config.sectionTitle) {
                // yesno 模式 + sectionTitle：使用專用生成函數
                sectionsHTML = generateYesNoSectionHTML(
                    config.questions,
                    config.sectionTitle,
                    config.sectionIcon
                );
            } else {
                // radio 和 yesno（無 sectionTitle）使用 radio group
                sectionsHTML = generateRadioSectionsHTML(sections);
            }

            // 生成提示框
            const infoAlertHTML = config.infoAlert
                ? uiBuilder.createAlert({ type: 'info', message: config.infoAlert })
                : '';

            // 生成解釋說明
            const interpretationHTML = config.interpretationInfo
                ? uiBuilder.createAlert({ type: 'info', message: config.interpretationInfo })
                : '';

            // 生成參考文獻
            const referencesHTML = config.references?.length
                ? `<div class="info-section reference-section">
                    <h4>📚 Reference</h4>
                    ${config.references.map(ref => `<p>${ref}</p>`).join('')}
                   </div>`
                : '';

            // 生成 Formula 區塊
            let formulaSectionHTML = '';
            if (config.formulaItems) {
                // 舊格式兼容
                formulaSectionHTML = uiBuilder.createFormulaSection({ items: config.formulaItems });
            } else {
                const effectiveSections =
                    inputType === 'yesno' && config.questions
                        ? config.questions.map(q => ({
                              id: q.id,
                              title: q.label,
                              options: [
                                  { value: '0', label: 'No' },
                                  { value: String(q.points), label: 'Yes' }
                              ]
                          }))
                        : sections;
                formulaSectionHTML = generateFormulaSectionHTML(
                    config,
                    effectiveSections as ScoringSection[]
                );
            }

            return `
                <div class="calculator-header">
                    <h3>${config.title}</h3>
                    <p class="description">${config.description}</p>
                </div>
                
                ${infoAlertHTML}
                ${sectionsHTML}
                
                ${uiBuilder.createResultBox({
                    id: `${config.id}-result`,
                    title: `${config.title} Results`
                })}
                
                ${formulaSectionHTML}
                ${interpretationHTML}
                ${referencesHTML}
            `;
        },

        initialize(client: unknown, patient: unknown, container: HTMLElement): void {
            uiBuilder.initializeComponents(container);

            // 初始化 FHIR 數據服務
            fhirDataService.initialize(
                client as FHIRClient | null,
                patient as Patient | null,
                container
            );

            /**
             * 設置 Radio 值
             */
            const setRadioValue = (name: string, value: string): void => {
                const radio = container.querySelector(
                    `input[name="${name}"][value="${value}"]`
                ) as HTMLInputElement | null;
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            };

            /**
             * 設置 Checkbox 狀態
             */
            const setCheckbox = (id: string, checked: boolean): void => {
                const checkbox = container.querySelector(`#${id}`) as HTMLInputElement | null;
                if (checkbox) {
                    checkbox.checked = checked;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            };

            /**
             * 計算分數
             */
            const calculate = (): void => {
                let totalScore = 0;
                const sectionScores: Record<string, number> = {};

                if (inputType === 'checkbox') {
                    // Checkbox 模式：收集所有勾選的值
                    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
                    checkboxes.forEach(box => {
                        const checkbox = box as HTMLInputElement;
                        if (checkbox.checked) {
                            const value = parseFloat(checkbox.value) || 0;
                            totalScore += value;

                            const sectionId = checkbox.id.split('-')[0];
                            sectionScores[sectionId] = (sectionScores[sectionId] || 0) + value;
                        }
                    });
                } else if (inputType === 'yesno' && config.questions && config.sectionTitle) {
                    // YesNo 模式 + sectionTitle：從 questions 收集
                    config.questions.forEach(q => {
                        const radio = container.querySelector(
                            `input[name="${q.id}"]:checked`
                        ) as HTMLInputElement | null;

                        if (radio) {
                            const value = parseFloat(radio.value) || 0;
                            sectionScores[q.id] = value;
                            totalScore += value;
                        }
                    });
                } else {
                    // Radio 模式：收集每個區塊的選中值
                    sections.forEach((section, index) => {
                        const sectionId = section.id || `section-${index}`;
                        const radio = container.querySelector(
                            `input[name="${sectionId}"]:checked`
                        ) as HTMLInputElement | null;

                        if (radio) {
                            const value = parseFloat(radio.value) || 0;
                            sectionScores[sectionId] = value;
                            totalScore += value;
                        }
                    });
                }

                // 找到對應的風險等級
                const riskLevel =
                    config.riskLevels.find(
                        r => totalScore >= r.minScore && totalScore <= r.maxScore
                    ) || config.riskLevels[config.riskLevels.length - 1];

                // 更新結果顯示
                const resultBox = document.getElementById(`${config.id}-result`);
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        if (config.customResultRenderer) {
                            resultContent.innerHTML = config.customResultRenderer(
                                totalScore,
                                sectionScores
                            );
                        } else {
                            // 根據配置格式選擇顯示方式
                            const displayLabel = riskLevel.label || riskLevel.category || '';
                            const displayRisk = riskLevel.risk || '';
                            const displayDesc =
                                riskLevel.description || riskLevel.recommendation || '';

                            let resultHTML = uiBuilder.createResultItem({
                                label: 'Total Score',
                                value: totalScore.toString(),
                                unit: 'points',
                                interpretation: displayLabel,
                                alertClass: `ui-alert-${riskLevel.severity}`
                            });

                            if (displayRisk) {
                                resultHTML += uiBuilder.createResultItem({
                                    label: 'Risk',
                                    value: displayRisk,
                                    alertClass: `ui-alert-${riskLevel.severity}`
                                });
                            }

                            if (displayDesc) {
                                resultHTML += uiBuilder.createAlert({
                                    type: riskLevel.severity,
                                    message: displayDesc
                                });
                            }

                            resultContent.innerHTML = resultHTML;
                        }
                    }
                    resultBox.classList.add('show');
                }
            };

            // 綁定事件
            if (inputType === 'checkbox') {
                container.querySelectorAll('input[type="checkbox"]').forEach(box => {
                    box.addEventListener('change', calculate);
                });
            } else {
                container.querySelectorAll('input[type="radio"]').forEach(radio => {
                    radio.addEventListener('change', calculate);
                });
            }

            /**
             * 執行 FHIR 數據自動填充
             */
            const performAutoPopulation = async (): Promise<void> => {
                if (config.dataRequirements && fhirDataService.isReady()) {
                    try {
                        const dataReqs = config.dataRequirements;
                        const stalenessTracker = fhirDataService.getStalenessTracker();

                        // 自動填充患者性別
                        if (dataReqs.autoPopulateGender) {
                            const gender = fhirDataService.getPatientGender();
                            if (gender) {
                                const value =
                                    gender === 'male'
                                        ? dataReqs.autoPopulateGender.maleValue
                                        : dataReqs.autoPopulateGender.femaleValue;
                                const targetName =
                                    dataReqs.autoPopulateGender.radioName ||
                                    dataReqs.autoPopulateGender.questionId;
                                if (targetName) {
                                    setRadioValue(targetName, value);
                                }
                            }
                        }

                        // 自動填充患者年齡
                        if (dataReqs.autoPopulateAge?.condition) {
                            const age = fhirDataService.getPatientAge();
                            if (age !== null && dataReqs.autoPopulateAge.condition(age)) {
                                const targetId =
                                    dataReqs.autoPopulateAge.inputId ||
                                    dataReqs.autoPopulateAge.questionId;
                                if (targetId) {
                                    if (inputType === 'checkbox') {
                                        setCheckbox(targetId, true);
                                    } else {
                                        // 找到對應的 "Yes" 選項值
                                        const section = sections.find(s => s.id === targetId);
                                        if (section) {
                                            const yesOption = section.options.find(
                                                o => String(o.value) !== '0'
                                            );
                                            if (yesOption) {
                                                setRadioValue(targetId, String(yesOption.value));
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // 處理 sections 中的 LOINC 配置
                        for (let sIdx = 0; sIdx < sections.length; sIdx++) {
                            const section = sections[sIdx];
                            const sectionId = section.id || `section-${sIdx}`;

                            // 使用 valueMapping
                            if (section.loincCode && section.valueMapping) {
                                try {
                                    const result = await fhirDataService.getObservation(
                                        section.loincCode,
                                        {
                                            trackStaleness: true,
                                            stalenessLabel: section.title
                                        }
                                    );

                                    if (result.value !== null) {
                                        const mapping = section.valueMapping.find(m =>
                                            m.condition(result.value!)
                                        );
                                        if (mapping) {
                                            const value = mapping.optionValue || mapping.radioValue;
                                            if (value) {
                                                setRadioValue(sectionId, value);
                                            }
                                        }

                                        if (stalenessTracker && result.observation) {
                                            stalenessTracker.trackObservation(
                                                `input[name="${sectionId}"]`,
                                                result.observation,
                                                section.loincCode,
                                                section.title
                                            );
                                        }
                                    }
                                } catch (e) {
                                    console.warn(
                                        `Error fetching observation for ${sectionId}:`,
                                        e
                                    );
                                }
                            }

                            // 使用 observationCriteria (yesno 模式)
                            if (section.observationCriteria) {
                                try {
                                    const result = await fhirDataService.getObservation(
                                        section.observationCriteria.code,
                                        {
                                            trackStaleness: true,
                                            stalenessLabel: section.title
                                        }
                                    );

                                    if (
                                        result.value !== null &&
                                        section.observationCriteria.condition(result.value)
                                    ) {
                                        // 選擇 "Yes" 選項（非 0 值）
                                        const yesOption = section.options.find(
                                            o => String(o.value) !== '0'
                                        );
                                        if (yesOption) {
                                            setRadioValue(sectionId, String(yesOption.value));
                                        }
                                    }
                                } catch (e) {
                                    console.warn(
                                        `Error fetching observation for ${sectionId}:`,
                                        e
                                    );
                                }
                            }
                        }

                        // 處理 conditions 自動勾選 (checkbox 模式)
                        if (inputType === 'checkbox' && dataReqs.conditions?.length) {
                            const allConditionCodes: string[] = [...dataReqs.conditions];
                            const optionConditionMap = new Map<string, string>();

                            sections.forEach((section, sIdx) => {
                                const sectionIdPrefix = section.id || `section-${sIdx}`;
                                section.options.forEach((opt, optIdx) => {
                                    if (opt.conditionCode) {
                                        allConditionCodes.push(opt.conditionCode);
                                        const checkboxId =
                                            opt.id || `${sectionIdPrefix}-${optIdx}`;
                                        optionConditionMap.set(opt.conditionCode, checkboxId);
                                    }
                                });
                            });

                            if (allConditionCodes.length > 0) {
                                const conditions =
                                    await fhirDataService.getConditions(allConditionCodes);

                                conditions.forEach((condition: any) => {
                                    const codings = condition.code?.coding || [];
                                    codings.forEach((coding: any) => {
                                        const checkboxId = optionConditionMap.get(coding.code);
                                        if (checkboxId) {
                                            setCheckbox(checkboxId, true);
                                        }
                                    });
                                });
                            }
                        }

                        // 處理額外的觀察值需求
                        if (dataReqs.observations?.length) {
                            await fhirDataService.autoPopulateFields(dataReqs.observations);
                        }
                    } catch (error) {
                        console.error('Error during FHIR auto-population:', error);
                    }
                }

                // 調用自定義初始化
                if (config.customInitialize) {
                    await config.customInitialize(client, patient, container, calculate);
                }

                calculate();
            };

            performAutoPopulation();
        }
    };
}

// ==========================================
// 向後兼容的別名函數
// ==========================================

// Type aliases for backward compatibility
export type RadioOption = ScoringOption;
export type RadioSection = ScoringSection;
export type RiskLevel = ScoringRiskLevel;
export type RadioFHIRDataRequirements = ScoringFHIRDataRequirements;

/** 
 * @deprecated 使用 createScoringCalculator({ inputType: 'radio', ... }) 代替
 */
export function createRadioScoreCalculator(
    config: Omit<ScoringCalculatorConfig, 'inputType' | 'questions'>
): CalculatorModule {
    return createScoringCalculator({ ...config, inputType: 'radio' });
}

/**
 * @deprecated 使用 createScoringCalculator({ inputType: 'checkbox', ... }) 代替
 */
export function createScoreCalculator(
    config: Omit<ScoringCalculatorConfig, 'inputType' | 'questions'>
): CalculatorModule {
    return createScoringCalculator({ ...config, inputType: 'checkbox' });
}

/**
 * @deprecated 使用 createScoringCalculator({ inputType: 'yesno', questions: [...] }) 代替
 */
export function createYesNoCalculator(
    config: Omit<ScoringCalculatorConfig, 'inputType' | 'sections'> & {
        questions: YesNoQuestion[];
        customResultRenderer?: (score: number, questionScores: Record<string, number>) => string;
    }
): CalculatorModule {
    return createScoringCalculator({ ...config, inputType: 'yesno' });
}

