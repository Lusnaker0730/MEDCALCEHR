/**
 * 計算器基類 - 抽象共用邏輯
 * 
 * 這個基類提供了所有計算器共用的功能：
 * - UI 初始化
 * - 事件綁定
 * - FHIR 數據獲取（透過 FHIRDataService）
 * - 錯誤處理
 * - 結果顯示
 */

import { uiBuilder } from '../../ui-builder.js';
import { displayError, logError } from '../../errorHandler.js';
import { createFHIRDataService, FHIRDataService } from '../../../src/fhir-data-service.js';
import type {
    CalculatorConfig,
    CalculatorInput,
    CalculatorResult,
    FHIRClient,
    Patient,
    StalenessTracker,
    Observation
} from '../../types/calculator.js';

/**
 * 計算器基類
 * 繼承此類可以快速創建新的計算器
 */
export abstract class BaseCalculator<TInputs extends Record<string, any>, TResult extends CalculatorResult> {
    // 基本屬性
    public readonly id: string;
    public readonly title: string;
    public readonly description: string;
    public readonly category: string;

    // 執行環境
    protected container: HTMLElement | null = null;
    protected client: FHIRClient | null = null;
    protected patient: Patient | null = null;
    protected stalenessTracker: StalenessTracker | null = null;
    protected fhirService: FHIRDataService | null = null;

    constructor(config: CalculatorConfig) {
        this.id = config.id;
        this.title = config.title;
        this.description = config.description;
        this.category = config.category;
    }

    /**
     * 生成計算器的 HTML
     * 子類必須實現此方法
     */
    abstract generateHTML(): string;

    /**
     * 定義輸入欄位和 FHIR 映射
     * 子類必須實現此方法
     */
    abstract getInputConfig(): CalculatorInput[];

    /**
     * 執行計算邏輯
     * 子類必須實現此方法
     */
    abstract calculate(inputs: TInputs): TResult;

    /**
     * 解讀計算結果
     * 子類可以覆寫此方法
     */
    abstract interpretResult(result: TResult): {
        severity: 'success' | 'warning' | 'danger' | 'info';
        message: string;
    };

    /**
     * 初始化計算器（共用邏輯）
     */
    initialize(client: FHIRClient | null, patient: Patient | null, container: HTMLElement): void {
        this.container = container;
        this.client = client;
        this.patient = patient;

        // 1. 初始化 UI 組件
        uiBuilder.initializeComponents(container);

        // 2. 初始化 FHIR 數據服務（整合快取、過期追蹤、單位轉換）
        this.fhirService = createFHIRDataService();
        this.fhirService.initialize(client as any, patient as any, container);

        // 使用服務的過期追蹤器
        this.stalenessTracker = this.fhirService.getStalenessTracker() as unknown as StalenessTracker;

        // 3. 綁定事件監聽器
        this.bindEvents();

        // 4. 從 FHIR 獲取數據
        this.fetchFHIRData();

        // 5. 執行初始計算
        this.onCalculate();
    }

    /**
     * 綁定輸入事件
     */
    protected bindEvents(): void {
        if (!this.container) return;

        const inputs = this.container.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.onCalculate());
            input.addEventListener('change', () => this.onCalculate());
        });
    }

    /**
     * 從 FHIR 獲取數據
     */
    protected async fetchFHIRData(): Promise<void> {
        if (!this.client || !this.container) return;

        const inputConfigs = this.getInputConfig();

        for (const config of inputConfigs) {
            if (config.fhirCode) {
                try {
                    const observation = await this.getFHIRObservation(config.fhirCode);
                    if (observation) {
                        this.populateInput(config, observation);
                    }
                } catch (error) {
                    console.warn(`Failed to fetch ${config.label}:`, error);
                }
            }

            // 從 Patient 資源獲取數據
            if (config.patientField && this.patient) {
                this.populateFromPatient(config);
            }
        }
    }

    /**
     * 獲取 FHIR Observation（透過 FHIRDataService）
     */
    protected async getFHIRObservation(loincCode: string): Promise<any> {
        if (!this.fhirService || !this.fhirService.isReady()) {
            return null;
        }
        const result = await this.fhirService.getObservation(loincCode, {
            trackStaleness: true
        });
        return result.observation;
    }

    /**
     * 自動填充所有輸入欄位（使用 FHIRDataService）
     * 這是一個簡化的方法，可以替代 fetchFHIRData
     */
    protected async autoPopulateAllInputs(): Promise<void> {
        if (!this.fhirService || !this.container) return;

        const inputConfigs = this.getInputConfig();

        for (const config of inputConfigs) {
            if (config.fhirCode) {
                await this.fhirService.autoPopulateInput(
                    `#${config.id}`,
                    config.fhirCode,
                    {
                        label: config.label,
                        decimals: (config as any).decimals,
                        targetUnit: (config as any).targetUnit
                    }
                );
            }

            // 從 Patient 資源獲取數據
            if (config.patientField && this.patient) {
                this.populateFromPatient(config);
            }
        }
    }

    /**
     * 填充輸入欄位
     */
    protected populateInput(config: CalculatorInput, observation: any): void {
        if (!this.container) return;

        const input = this.container.querySelector(`#${config.id}`) as HTMLInputElement;
        if (input && observation.valueQuantity) {
            input.value = observation.valueQuantity.value.toString();
            input.dispatchEvent(new Event('input'));

            // 追蹤數據過期狀態
            if (this.stalenessTracker && config.fhirCode) {
                this.stalenessTracker.trackObservation(
                    `#${config.id}`,
                    observation,
                    config.fhirCode,
                    config.label
                );
            }
        }
    }

    /**
     * 從 Patient 資源填充數據
     */
    protected populateFromPatient(config: CalculatorInput): void {
        if (!this.container || !this.patient || !config.patientField) return;

        const input = this.container.querySelector(`#${config.id}`) as HTMLInputElement;
        if (!input) return;

        switch (config.patientField) {
            case 'birthDate':
                if (this.patient.birthDate) {
                    const age = this.calculateAge(this.patient.birthDate);
                    input.value = age.toString();
                }
                break;
            case 'gender':
                if (this.patient.gender) {
                    const radio = this.container.querySelector(
                        `input[name="${config.id}"][value="${this.patient.gender.toLowerCase()}"]`
                    ) as HTMLInputElement;
                    if (radio) radio.checked = true;
                }
                break;
        }
    }

    /**
     * 計算年齡
     */
    protected calculateAge(birthDate: string): number {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    /**
     * 執行計算並更新結果
     */
    protected onCalculate(): void {
        if (!this.container) return;

        const errorContainer = this.container.querySelector(`#${this.id}-error-container`);
        const resultBox = this.container.querySelector(`#${this.id}-result`);

        // 清除之前的錯誤
        if (errorContainer) errorContainer.innerHTML = '';

        try {
            // 收集輸入值
            const inputs = this.collectInputs();

            // 驗證輸入
            const validationResult = this.validateInputs(inputs);
            if (!validationResult.isValid) {
                if (resultBox) resultBox.classList.remove('show');
                return;
            }

            // 執行計算
            const result = this.calculate(inputs as TInputs);

            // 顯示結果
            this.displayResult(result);

        } catch (error) {
            logError(error, { calculator: this.id, action: 'calculate' });
            if (errorContainer) displayError(errorContainer, error);
            if (resultBox) resultBox.classList.remove('show');
        }
    }

    /**
     * 收集輸入值
     */
    protected collectInputs(): Record<string, any> {
        if (!this.container) return {};

        const inputs: Record<string, any> = {};
        const inputConfigs = this.getInputConfig();

        for (const config of inputConfigs) {
            const element = this.container.querySelector(`#${config.id}`) as HTMLInputElement;
            if (element) {
                if (config.type === 'number') {
                    inputs[config.name || config.id] = parseFloat(element.value);
                } else if (config.type === 'checkbox') {
                    inputs[config.name || config.id] = element.checked;
                } else {
                    inputs[config.name || config.id] = element.value;
                }
            }

            // Radio buttons
            if (config.type === 'radio') {
                const checked = this.container.querySelector(
                    `input[name="${config.id}"]:checked`
                ) as HTMLInputElement;
                if (checked) {
                    inputs[config.name || config.id] = checked.value;
                }
            }
        }

        return inputs;
    }

    /**
     * 驗證輸入
     */
    protected validateInputs(inputs: Record<string, any>): { isValid: boolean; errors: string[] } {
        // 子類可以覆寫此方法進行自定義驗證
        return { isValid: true, errors: [] };
    }

    /**
     * 顯示計算結果
     */
    protected displayResult(result: TResult): void {
        if (!this.container) return;

        const resultBox = this.container.querySelector(`#${this.id}-result`);
        if (!resultBox) return;

        const resultContent = resultBox.querySelector('.ui-result-content');
        if (!resultContent) return;

        const interpretation = this.interpretResult(result);

        // 生成結果 HTML（子類可以覆寫 renderResult 方法來自定義）
        resultContent.innerHTML = this.renderResult(result, interpretation);
        resultBox.classList.add('show');
    }

    /**
     * 渲染結果 HTML
     * 子類可以覆寫此方法來自定義結果顯示
     */
    protected renderResult(
        result: TResult,
        interpretation: { severity: string; message: string }
    ): string {
        return uiBuilder.createResultItem({
            label: 'Result',
            value: result.value?.toString() || '',
            unit: result.unit || '',
            interpretation: interpretation.message,
            alertClass: `ui-alert-${interpretation.severity}`
        });
    }
}

/**
 * 評分計算器基類
 * 用於基於選項計算分數的計算器（如 APACHE II、GCS 等）
 */
export abstract class ScoreCalculator extends BaseCalculator<Record<string, number>, { score: number; value: number }> {
    /**
     * 計算總分
     */
    calculate(inputs: Record<string, number>): { score: number; value: number } {
        const score = Object.values(inputs).reduce((sum, val) => sum + (val || 0), 0);
        return { score, value: score };
    }
}

/**
 * 實驗室值計算器基類
 * 用於基於實驗室數值計算的計算器（如 CKD-EPI、FENa 等）
 */
export abstract class LabCalculator extends BaseCalculator<Record<string, number>, CalculatorResult> {
    // 實驗室值計算器的共用邏輯
}

