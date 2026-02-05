// src/security-labels-service.ts
// FHIR Security Labels Service for Sensitive Data Handling
// Reference: https://build.fhir.org/valueset-security-labels.html
// Reference: https://twcore.mohw.gov.tw/ig/twcore/
import { escapeHTML } from './security.js';
import { auditEventService } from './audit-event-service.js';
// ============================================================================
// Constants
// ============================================================================
/**
 * Code systems for security labels
 */
const CODE_SYSTEMS = {
    CONFIDENTIALITY: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
    ACT_CODE: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    OBSERVATION_VALUE: 'http://terminology.hl7.org/CodeSystem/v3-ObservationValue',
    SECURITY_LABEL: 'http://terminology.hl7.org/CodeSystem/v3-SecurityLabel',
    TW_SECURITY: 'https://twcore.mohw.gov.tw/ig/twcore/CodeSystem/security-category-tw'
};
/**
 * Confidentiality level hierarchy (lower index = lower confidentiality)
 */
const CONFIDENTIALITY_HIERARCHY = ['U', 'L', 'M', 'N', 'R', 'V'];
/**
 * Display names for confidentiality codes
 */
const CONFIDENTIALITY_DISPLAY = {
    U: { en: 'Unrestricted', zh: '無限制' },
    L: { en: 'Low', zh: '低度保密' },
    M: { en: 'Moderate', zh: '中度保密' },
    N: { en: 'Normal', zh: '一般保密' },
    R: { en: 'Restricted', zh: '限制級' },
    V: { en: 'Very Restricted', zh: '極機密' }
};
/**
 * Sensitivity category display names and descriptions
 */
const SENSITIVITY_DISPLAY = {
    HIV: { en: 'HIV/AIDS', zh: '愛滋病相關', description: '包含 HIV 感染狀態或治療資訊' },
    PSY: { en: 'Psychiatric', zh: '精神疾病', description: '精神科診斷或治療紀錄' },
    ETH: { en: 'Substance Abuse', zh: '物質濫用', description: '藥物或酒精濫用相關紀錄' },
    SDV: { en: 'Sexual/Domestic Violence', zh: '性侵害/家暴', description: '性侵害或家庭暴力相關紀錄' },
    SEX: { en: 'Sexual Health', zh: '性健康', description: '性傳染病或性健康相關紀錄' },
    GENETIC: { en: 'Genetic', zh: '基因檢測', description: '基因檢測或遺傳疾病資訊' },
    REPRODUCTIVE: { en: 'Reproductive Health', zh: '生殖健康', description: '生殖健康或懷孕相關紀錄' },
    MINOR: { en: 'Minor', zh: '未成年人', description: '未成年人敏感醫療紀錄' },
    CELEBRITY: { en: 'Celebrity/VIP', zh: '特殊身分', description: '公眾人物或 VIP 病患' },
    RESEARCH: { en: 'Research', zh: '研究用途', description: '研究用途限定資料' },
    GENERAL: { en: 'General', zh: '一般', description: '一般醫療資料' }
};
/**
 * SNOMED/ICD codes that indicate sensitive categories
 */
const SENSITIVE_CONDITION_CODES = {
    HIV: [
        '86406008', // HIV infection (SNOMED)
        '62479008', // AIDS (SNOMED)
        'B20', // HIV disease (ICD-10)
        'B21', 'B22', 'B23', 'B24' // HIV-related conditions (ICD-10)
    ],
    PSY: [
        'F20', 'F21', 'F22', 'F23', 'F24', 'F25', // Schizophrenia (ICD-10)
        'F30', 'F31', 'F32', 'F33', // Mood disorders (ICD-10)
        'F40', 'F41', // Anxiety disorders (ICD-10)
        '191736004', '35489007', '13746004' // SNOMED psychiatric codes
    ],
    ETH: [
        'F10', 'F11', 'F12', 'F13', 'F14', 'F15', 'F16', 'F17', 'F18', 'F19', // Substance use (ICD-10)
        '7200002', // Alcoholism (SNOMED)
        '66214007' // Substance abuse (SNOMED)
    ],
    SDV: [
        'T74', 'T76', // Adult/child maltreatment (ICD-10)
        'Y07', // Perpetrator of assault (ICD-10)
        '95930005' // Domestic violence (SNOMED)
    ],
    SEX: [
        'A50', 'A51', 'A52', 'A53', 'A54', 'A55', 'A56', // STIs (ICD-10)
        '8098009' // STI (SNOMED)
    ],
    GENETIC: [
        'Z13.7', // Genetic screening (ICD-10)
        '405824009' // Genetic testing (SNOMED)
    ],
    REPRODUCTIVE: [
        'O00', 'O01', 'O02', 'O03', 'O04', 'O05', 'O06', 'O07', 'O08', // Pregnancy complications (ICD-10)
        'Z30', 'Z31', 'Z32', 'Z33', 'Z34', 'Z35', 'Z36', 'Z37', // Reproductive encounters (ICD-10)
        '77386006' // Pregnancy (SNOMED)
    ],
    MINOR: [], // Determined by patient age
    CELEBRITY: [], // Determined by patient flag
    RESEARCH: [],
    GENERAL: []
};
/**
 * Default masking configuration by confidentiality level
 */
const DEFAULT_MASKING = {
    U: { style: 'full', showIndicator: false },
    L: { style: 'full', showIndicator: false },
    M: { style: 'full', showIndicator: false },
    N: { style: 'full', showIndicator: false },
    R: { style: 'partial', visibleChars: 2, showIndicator: true },
    V: { style: 'redact', maskText: '[極機密資料]', showIndicator: true }
};
/**
 * Fields that should be masked based on confidentiality
 */
const MASKED_FIELDS_BY_LEVEL = {
    U: [],
    L: [],
    M: [],
    N: [],
    R: ['name', 'identifier', 'telecom', 'address', 'contact'],
    V: ['name', 'identifier', 'telecom', 'address', 'contact', 'birthDate', 'photo', 'text']
};
// ============================================================================
// SecurityLabelsService Class
// ============================================================================
/**
 * FHIR Security Labels Service
 * Handles sensitive data classification, masking, and access control
 */
export class SecurityLabelsService {
    constructor(config = {}) {
        this.currentUser = null;
        this.breakTheGlassCallback = null;
        this.accessLog = [];
        this.config = {
            enableMasking: true,
            enableWarnings: true,
            defaultConfidentiality: 'N',
            logSensitiveAccess: true,
            enableBreakTheGlass: true,
            maskCharacter: '●',
            enableDebugLogging: false,
            ...config
        };
    }
    // ========================================================================
    // User Context
    // ========================================================================
    /**
     * Set the current user authorization context
     */
    setUserContext(user) {
        this.currentUser = user;
        this.log('User context set:', user.userId, 'Roles:', user.roles);
    }
    /**
     * Clear the current user context
     */
    clearUserContext() {
        this.currentUser = null;
        this.log('User context cleared');
    }
    /**
     * Get the current user context
     */
    getUserContext() {
        return this.currentUser;
    }
    /**
     * Set break-the-glass callback
     */
    setBreakTheGlassCallback(callback) {
        this.breakTheGlassCallback = callback;
    }
    // ========================================================================
    // Security Label Processing
    // ========================================================================
    /**
     * Extract security labels from a FHIR resource
     */
    extractSecurityLabels(resource) {
        if (!resource?.meta?.security) {
            return [];
        }
        return resource.meta.security;
    }
    /**
     * Get the confidentiality level from security labels
     */
    getConfidentiality(resource) {
        const labels = this.extractSecurityLabels(resource);
        // Find confidentiality label
        const confLabel = labels.find(label => label.system === CODE_SYSTEMS.CONFIDENTIALITY);
        if (confLabel && this.isValidConfidentiality(confLabel.code)) {
            return confLabel.code;
        }
        // Check for any other security labels that imply confidentiality
        const hasRestrictedLabel = labels.some(label => label.code === 'R' || label.code === 'V');
        if (hasRestrictedLabel) {
            return 'R';
        }
        return this.config.defaultConfidentiality;
    }
    /**
     * Check if a code is a valid confidentiality code
     */
    isValidConfidentiality(code) {
        return CONFIDENTIALITY_HIERARCHY.includes(code);
    }
    /**
     * Detect sensitivity categories from resource content
     */
    detectSensitivities(resource) {
        const sensitivities = new Set();
        // Check explicit security labels
        const labels = this.extractSecurityLabels(resource);
        for (const label of labels) {
            const category = this.mapLabelToCategory(label);
            if (category && category !== 'GENERAL') {
                sensitivities.add(category);
            }
        }
        // Check resource content for sensitive codes
        if (resource.resourceType === 'Condition' || resource.resourceType === 'Observation') {
            const codes = this.extractCodes(resource);
            for (const code of codes) {
                const category = this.mapCodeToCategory(code);
                if (category && category !== 'GENERAL') {
                    sensitivities.add(category);
                }
            }
        }
        // Check for minor patient
        if (resource.resourceType === 'Patient') {
            if (this.isMinorPatient(resource)) {
                sensitivities.add('MINOR');
            }
            // Check for VIP flag
            if (this.isVIPPatient(resource)) {
                sensitivities.add('CELEBRITY');
            }
        }
        return Array.from(sensitivities);
    }
    /**
     * Map a security label to sensitivity category
     */
    mapLabelToCategory(label) {
        const codeMap = {
            'HIV': 'HIV',
            'PSY': 'PSY',
            'ETH': 'ETH',
            'SDV': 'SDV',
            'SEX': 'SEX',
            'GENETIC': 'GENETIC',
            'SOC': 'SDV', // Social services
            'MENCAT': 'PSY', // Mental health category
            'STD': 'SEX', // Sexually transmitted disease
            'SUD': 'ETH' // Substance use disorder
        };
        return codeMap[label.code] || null;
    }
    /**
     * Map a clinical code to sensitivity category
     */
    mapCodeToCategory(code) {
        for (const [category, codes] of Object.entries(SENSITIVE_CONDITION_CODES)) {
            if (codes.some(c => code.startsWith(c) || code === c)) {
                return category;
            }
        }
        return null;
    }
    /**
     * Extract clinical codes from a resource
     */
    extractCodes(resource) {
        const codes = [];
        // Handle Condition.code
        if (resource.code?.coding) {
            for (const coding of resource.code.coding) {
                if (coding.code) {
                    codes.push(coding.code);
                }
            }
        }
        // Handle Observation.code
        if (resource.valueCodeableConcept?.coding) {
            for (const coding of resource.valueCodeableConcept.coding) {
                if (coding.code) {
                    codes.push(coding.code);
                }
            }
        }
        return codes;
    }
    /**
     * Check if patient is a minor (under 18)
     */
    isMinorPatient(patient) {
        if (!patient.birthDate) {
            return false;
        }
        const birthDate = new Date(patient.birthDate);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            return age - 1 < 18;
        }
        return age < 18;
    }
    /**
     * Check if patient is VIP/Celebrity
     */
    isVIPPatient(patient) {
        // Check for VIP tag in meta.tag
        if (patient.meta?.tag) {
            return patient.meta.tag.some(tag => tag.code === 'VIP' || tag.code === 'CELEBRITY');
        }
        // Check extension for VIP indicator
        if (patient.extension) {
            return patient.extension.some((ext) => ext.url?.includes('vip') || ext.valueBoolean === true);
        }
        return false;
    }
    // ========================================================================
    // Access Control
    // ========================================================================
    /**
     * Assess security for a resource and determine access decision
     */
    assessSecurity(resource) {
        const labels = this.extractSecurityLabels(resource);
        const confidentiality = this.getConfidentiality(resource);
        const sensitivities = this.detectSensitivities(resource);
        // Determine access decision
        const decision = this.makeAccessDecision(confidentiality, sensitivities);
        // Determine masked fields
        const maskedFields = this.getMaskedFields(confidentiality, sensitivities);
        // Generate warning message
        const warningMessage = this.generateWarningMessage(confidentiality, sensitivities);
        // Check if authorization is required
        const requiresAuthorization = decision === 'REQUIRE_AUTH' || confidentiality === 'V';
        const requiredRoles = this.getRequiredRoles(sensitivities);
        const assessment = {
            confidentiality,
            sensitivities,
            decision,
            maskedFields,
            warningMessage,
            requiresAuthorization,
            requiredRoles,
            labels
        };
        // Log access to sensitive data
        if (this.config.logSensitiveAccess && confidentiality !== 'N' && confidentiality !== 'U') {
            this.logAccess(resource, assessment);
        }
        return assessment;
    }
    /**
     * Make access decision based on confidentiality and user authorization
     */
    makeAccessDecision(confidentiality, sensitivities) {
        // If no user context, be restrictive
        if (!this.currentUser) {
            if (confidentiality === 'V') {
                return 'DENY';
            }
            if (confidentiality === 'R') {
                return 'MASK';
            }
            return 'ALLOW';
        }
        // Check if user has required authorization
        const hasRequiredAuth = this.checkUserAuthorization(sensitivities);
        // Very restricted - require explicit authorization
        if (confidentiality === 'V') {
            if (!hasRequiredAuth) {
                return this.config.enableBreakTheGlass ? 'REQUIRE_AUTH' : 'DENY';
            }
            return 'WARN';
        }
        // Restricted - mask unless authorized
        if (confidentiality === 'R') {
            if (!hasRequiredAuth) {
                return 'MASK';
            }
            return 'WARN';
        }
        // Normal or below - allow
        return 'ALLOW';
    }
    /**
     * Check if current user has authorization for sensitivity categories
     */
    checkUserAuthorization(sensitivities) {
        if (!this.currentUser) {
            return false;
        }
        // Check if user has all required categories
        for (const category of sensitivities) {
            if (category === 'GENERAL')
                continue;
            if (!this.currentUser.authorizedCategories.includes(category)) {
                // Check for special permissions
                if (!this.currentUser.permissions.includes(`access:${category}`)) {
                    return false;
                }
            }
        }
        return true;
    }
    /**
     * Get required roles for accessing sensitive categories
     */
    getRequiredRoles(sensitivities) {
        const roles = new Set();
        for (const category of sensitivities) {
            switch (category) {
                case 'HIV':
                    roles.add('infectious-disease-specialist');
                    roles.add('hiv-care-provider');
                    break;
                case 'PSY':
                    roles.add('psychiatrist');
                    roles.add('psychologist');
                    roles.add('mental-health-provider');
                    break;
                case 'ETH':
                    roles.add('addiction-specialist');
                    roles.add('substance-abuse-counselor');
                    break;
                case 'SDV':
                    roles.add('social-worker');
                    roles.add('forensic-specialist');
                    break;
                case 'GENETIC':
                    roles.add('genetic-counselor');
                    roles.add('geneticist');
                    break;
            }
        }
        return Array.from(roles);
    }
    /**
     * Get fields that should be masked
     */
    getMaskedFields(confidentiality, sensitivities) {
        const fields = new Set(MASKED_FIELDS_BY_LEVEL[confidentiality]);
        // Add additional fields based on sensitivities
        if (sensitivities.includes('CELEBRITY')) {
            fields.add('name');
            fields.add('photo');
            fields.add('identifier');
        }
        return Array.from(fields);
    }
    /**
     * Generate warning message for sensitive data
     */
    generateWarningMessage(confidentiality, sensitivities) {
        if (confidentiality === 'U' || confidentiality === 'L' || confidentiality === 'N') {
            return undefined;
        }
        const parts = [];
        // Add confidentiality warning
        const confDisplay = CONFIDENTIALITY_DISPLAY[confidentiality];
        parts.push(`此資料為「${confDisplay.zh}」等級`);
        // Add sensitivity warnings
        if (sensitivities.length > 0) {
            const sensitivityNames = sensitivities
                .filter(s => s !== 'GENERAL')
                .map(s => SENSITIVITY_DISPLAY[s].zh);
            if (sensitivityNames.length > 0) {
                parts.push(`包含敏感類別：${sensitivityNames.join('、')}`);
            }
        }
        // Add legal warning for certain categories
        if (sensitivities.includes('HIV') || sensitivities.includes('PSY')) {
            parts.push('依法受特殊保護，未經授權揭露將負法律責任');
        }
        return parts.join('。') + '。';
    }
    /**
     * Log access to sensitive data
     */
    logAccess(resource, assessment) {
        const logEntry = {
            timestamp: new Date(),
            resourceType: resource.resourceType,
            resourceId: resource.id || 'unknown',
            confidentiality: assessment.confidentiality,
            decision: assessment.decision,
            userId: this.currentUser?.userId
        };
        this.accessLog.push(logEntry);
        // Send to audit service
        if (assessment.confidentiality === 'R' || assessment.confidentiality === 'V') {
            auditEventService.logSecurityAlert('SENSITIVE_DATA_ACCESS', `Access to ${assessment.confidentiality} data: ${resource.resourceType}/${resource.id}`, assessment.confidentiality === 'V' ? 'high' : 'medium').catch(err => {
                console.warn('[SecurityLabels] Failed to log audit event:', err);
            });
        }
        this.log('Access logged:', logEntry);
    }
    // ========================================================================
    // Data Masking
    // ========================================================================
    /**
     * Mask sensitive data in a resource
     */
    maskResource(resource, assessment) {
        if (!this.config.enableMasking) {
            return resource;
        }
        // Get assessment if not provided
        const securityAssessment = assessment || this.assessSecurity(resource);
        if (securityAssessment.decision === 'ALLOW' || securityAssessment.maskedFields.length === 0) {
            return resource;
        }
        // Deep clone the resource
        const masked = JSON.parse(JSON.stringify(resource));
        // Mask specified fields
        for (const field of securityAssessment.maskedFields) {
            this.maskField(masked, field, securityAssessment.confidentiality);
        }
        // Add security indicator to meta
        if (!masked.meta) {
            masked.meta = {};
        }
        if (!masked.meta.tag) {
            masked.meta.tag = [];
        }
        masked.meta.tag.push({
            system: 'http://medcalc-ehr.example.com/tags',
            code: 'MASKED',
            display: 'Data has been masked'
        });
        return masked;
    }
    /**
     * Mask a specific field in a resource
     */
    maskField(resource, fieldPath, confidentiality) {
        const parts = fieldPath.split('.');
        let current = resource;
        // Navigate to parent of the field
        for (let i = 0; i < parts.length - 1; i++) {
            if (current[parts[i]] === undefined) {
                return;
            }
            current = current[parts[i]];
        }
        const fieldName = parts[parts.length - 1];
        const value = current[fieldName];
        if (value === undefined) {
            return;
        }
        const options = DEFAULT_MASKING[confidentiality];
        if (Array.isArray(value)) {
            current[fieldName] = value.map((item) => this.maskValue(item, options));
        }
        else {
            current[fieldName] = this.maskValue(value, options);
        }
    }
    /**
     * Mask a single value
     */
    maskValue(value, options) {
        if (value === null || value === undefined) {
            return value;
        }
        // Handle objects (like HumanName, Identifier)
        if (typeof value === 'object') {
            const masked = { ...value };
            // Mask common text fields
            const textFields = ['text', 'display', 'value', 'family', 'given'];
            for (const field of textFields) {
                if (masked[field]) {
                    if (Array.isArray(masked[field])) {
                        masked[field] = masked[field].map((v) => this.maskString(v, options));
                    }
                    else {
                        masked[field] = this.maskString(masked[field], options);
                    }
                }
            }
            return masked;
        }
        // Handle strings
        if (typeof value === 'string') {
            return this.maskString(value, options);
        }
        return value;
    }
    /**
     * Mask a string value
     */
    maskString(str, options) {
        if (!str) {
            return str;
        }
        const opts = options || DEFAULT_MASKING['R'];
        switch (opts.style) {
            case 'full':
                return this.config.maskCharacter.repeat(str.length);
            case 'partial':
                const visible = opts.visibleChars || 2;
                if (str.length <= visible) {
                    return this.config.maskCharacter.repeat(str.length);
                }
                return str.substring(0, visible) +
                    this.config.maskCharacter.repeat(str.length - visible);
            case 'redact':
                return opts.maskText || '[已遮蔽]';
            case 'blur':
                // For UI use - returns a CSS class indicator
                return `[BLUR:${str.length}]`;
            default:
                return this.config.maskCharacter.repeat(str.length);
        }
    }
    // ========================================================================
    // UI Integration
    // ========================================================================
    /**
     * Create a security badge element
     */
    createSecurityBadge(assessment) {
        const badge = document.createElement('span');
        badge.className = `security-badge security-${assessment.confidentiality.toLowerCase()}`;
        const confDisplay = CONFIDENTIALITY_DISPLAY[assessment.confidentiality];
        badge.textContent = confDisplay.zh;
        badge.title = assessment.warningMessage || confDisplay.en;
        // Add sensitivity icons
        if (assessment.sensitivities.length > 0) {
            const icons = document.createElement('span');
            icons.className = 'sensitivity-icons';
            for (const sensitivity of assessment.sensitivities) {
                if (sensitivity === 'GENERAL')
                    continue;
                const icon = document.createElement('span');
                icon.className = `sensitivity-icon sensitivity-${sensitivity.toLowerCase()}`;
                icon.title = SENSITIVITY_DISPLAY[sensitivity].zh;
                icon.textContent = this.getSensitivityIcon(sensitivity);
                icons.appendChild(icon);
            }
            badge.appendChild(icons);
        }
        return badge;
    }
    /**
     * Get icon for sensitivity category
     */
    getSensitivityIcon(category) {
        const icons = {
            HIV: '🔴',
            PSY: '🧠',
            ETH: '⚠️',
            SDV: '🛡️',
            SEX: '💊',
            GENETIC: '🧬',
            REPRODUCTIVE: '👶',
            MINOR: '👧',
            CELEBRITY: '⭐',
            RESEARCH: '🔬',
            GENERAL: ''
        };
        return icons[category] || '';
    }
    /**
     * Create warning dialog for sensitive data access
     */
    createWarningDialog(assessment, onConfirm, onCancel) {
        const dialog = document.createElement('div');
        dialog.className = 'security-warning-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content">
                <div class="dialog-header">
                    <span class="warning-icon">⚠️</span>
                    <h3>敏感資料存取警告</h3>
                </div>
                <div class="dialog-body">
                    <p class="warning-message">${escapeHTML(assessment.warningMessage || '')}</p>
                    <div class="confidentiality-info">
                        <span class="label">保密等級：</span>
                        <span class="value ${assessment.confidentiality.toLowerCase()}">
                            ${CONFIDENTIALITY_DISPLAY[assessment.confidentiality].zh}
                        </span>
                    </div>
                    ${assessment.sensitivities.length > 0 ? `
                    <div class="sensitivity-info">
                        <span class="label">敏感類別：</span>
                        <ul>
                            ${assessment.sensitivities
            .filter(s => s !== 'GENERAL')
            .map(s => `<li>${SENSITIVITY_DISPLAY[s].zh}</li>`)
            .join('')}
                        </ul>
                    </div>
                    ` : ''}
                    <p class="legal-notice">
                        存取此資料將被記錄。未經授權揭露敏感資訊可能違反《個人資料保護法》及相關醫療法規。
                    </p>
                </div>
                <div class="dialog-footer">
                    <button class="btn-cancel">取消</button>
                    <button class="btn-confirm">我了解，繼續存取</button>
                </div>
            </div>
        `;
        // Add event listeners
        const cancelBtn = dialog.querySelector('.btn-cancel');
        const confirmBtn = dialog.querySelector('.btn-confirm');
        const overlay = dialog.querySelector('.dialog-overlay');
        cancelBtn?.addEventListener('click', () => {
            dialog.remove();
            onCancel();
        });
        confirmBtn?.addEventListener('click', () => {
            dialog.remove();
            onConfirm();
        });
        overlay?.addEventListener('click', () => {
            dialog.remove();
            onCancel();
        });
        return dialog;
    }
    /**
     * Show warning dialog and wait for user decision
     */
    async showWarning(assessment) {
        if (!this.config.enableWarnings) {
            return true;
        }
        return new Promise((resolve) => {
            const dialog = this.createWarningDialog(assessment, () => resolve(true), () => resolve(false));
            document.body.appendChild(dialog);
        });
    }
    /**
     * Handle break-the-glass request
     */
    async requestBreakTheGlass(resource, reason) {
        if (!this.config.enableBreakTheGlass || !this.currentUser) {
            return false;
        }
        // Log the break-the-glass request
        await auditEventService.logSecurityAlert('BREAK_THE_GLASS', `Break-the-glass requested for ${resource.resourceType}/${resource.id}: ${reason}`, 'critical');
        // Call callback if registered
        if (this.breakTheGlassCallback) {
            return this.breakTheGlassCallback(resource, reason, this.currentUser);
        }
        // Default: allow with logging
        this.log('Break-the-glass granted:', resource.resourceType, resource.id);
        return true;
    }
    // ========================================================================
    // CSS Styles
    // ========================================================================
    /**
     * Get CSS styles for security labels UI
     */
    getStyles() {
        return `
            .security-badge {
                display: inline-flex;
                align-items: center;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
                margin-left: 8px;
            }

            .security-badge.security-u,
            .security-badge.security-l,
            .security-badge.security-n {
                background: #e8f5e9;
                color: #2e7d32;
            }

            .security-badge.security-m {
                background: #fff3e0;
                color: #e65100;
            }

            .security-badge.security-r {
                background: #ffebee;
                color: #c62828;
            }

            .security-badge.security-v {
                background: #f3e5f5;
                color: #6a1b9a;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            .sensitivity-icons {
                margin-left: 4px;
            }

            .sensitivity-icon {
                margin-left: 2px;
                font-size: 10px;
            }

            .security-warning-dialog {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .dialog-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
            }

            .dialog-content {
                position: relative;
                background: white;
                border-radius: 8px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            }

            .dialog-header {
                display: flex;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #eee;
            }

            .dialog-header .warning-icon {
                font-size: 24px;
                margin-right: 12px;
            }

            .dialog-header h3 {
                margin: 0;
                color: #c62828;
            }

            .dialog-body {
                padding: 20px;
            }

            .warning-message {
                color: #333;
                line-height: 1.5;
            }

            .confidentiality-info,
            .sensitivity-info {
                margin: 16px 0;
                padding: 12px;
                background: #f5f5f5;
                border-radius: 4px;
            }

            .confidentiality-info .label,
            .sensitivity-info .label {
                font-weight: 500;
            }

            .confidentiality-info .value {
                padding: 2px 8px;
                border-radius: 4px;
            }

            .confidentiality-info .value.r {
                background: #ffebee;
                color: #c62828;
            }

            .confidentiality-info .value.v {
                background: #f3e5f5;
                color: #6a1b9a;
            }

            .sensitivity-info ul {
                margin: 8px 0 0 20px;
                padding: 0;
            }

            .legal-notice {
                font-size: 12px;
                color: #666;
                background: #fff8e1;
                padding: 12px;
                border-radius: 4px;
                border-left: 3px solid #ffc107;
            }

            .dialog-footer {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                padding: 16px 20px;
                border-top: 1px solid #eee;
            }

            .dialog-footer button {
                padding: 8px 16px;
                border-radius: 4px;
                border: none;
                cursor: pointer;
                font-size: 14px;
            }

            .btn-cancel {
                background: #e0e0e0;
                color: #333;
            }

            .btn-confirm {
                background: #c62828;
                color: white;
            }

            .masked-field {
                color: #999;
                font-style: italic;
            }

            .masked-field::before {
                content: '🔒 ';
            }

            .blur-text {
                filter: blur(4px);
                user-select: none;
            }
        `;
    }
    /**
     * Inject styles into document
     */
    injectStyles() {
        const styleId = 'security-labels-styles';
        if (document.getElementById(styleId)) {
            return;
        }
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = this.getStyles();
        document.head.appendChild(style);
    }
    // ========================================================================
    // Security Label Management
    // ========================================================================
    /**
     * Add security label to a resource
     */
    addSecurityLabel(resource, confidentiality, sensitivities) {
        // Deep clone
        const updated = JSON.parse(JSON.stringify(resource));
        // Ensure meta exists
        if (!updated.meta) {
            updated.meta = {};
        }
        if (!updated.meta.security) {
            updated.meta.security = [];
        }
        // Add confidentiality label
        const confLabel = {
            system: CODE_SYSTEMS.CONFIDENTIALITY,
            code: confidentiality,
            display: CONFIDENTIALITY_DISPLAY[confidentiality].en
        };
        // Remove existing confidentiality labels
        updated.meta.security = updated.meta.security.filter(label => label.system !== CODE_SYSTEMS.CONFIDENTIALITY);
        // Add new confidentiality label
        updated.meta.security.push(confLabel);
        // Add sensitivity labels
        if (sensitivities) {
            for (const category of sensitivities) {
                if (category === 'GENERAL')
                    continue;
                updated.meta.security.push({
                    system: CODE_SYSTEMS.ACT_CODE,
                    code: category,
                    display: SENSITIVITY_DISPLAY[category].en
                });
            }
        }
        return updated;
    }
    /**
     * Compare confidentiality levels
     * Returns negative if a < b, 0 if equal, positive if a > b
     */
    compareConfidentiality(a, b) {
        const indexA = CONFIDENTIALITY_HIERARCHY.indexOf(a);
        const indexB = CONFIDENTIALITY_HIERARCHY.indexOf(b);
        return indexA - indexB;
    }
    /**
     * Get the highest confidentiality from multiple resources
     */
    getHighestConfidentiality(resources) {
        let highest = this.config.defaultConfidentiality;
        for (const resource of resources) {
            const conf = this.getConfidentiality(resource);
            if (this.compareConfidentiality(conf, highest) > 0) {
                highest = conf;
            }
        }
        return highest;
    }
    // ========================================================================
    // Utility Methods
    // ========================================================================
    /**
     * Debug logging
     */
    log(...args) {
        if (this.config.enableDebugLogging) {
            console.log('[SecurityLabels]', ...args);
        }
    }
    /**
     * Get access log
     */
    getAccessLog() {
        return [...this.accessLog];
    }
    /**
     * Clear access log
     */
    clearAccessLog() {
        this.accessLog = [];
    }
    /**
     * Export configuration for display names
     */
    getDisplayConfig() {
        return {
            confidentiality: CONFIDENTIALITY_DISPLAY,
            sensitivity: SENSITIVITY_DISPLAY
        };
    }
}
// ============================================================================
// Singleton Instance
// ============================================================================
/**
 * Default singleton instance
 */
export const securityLabelsService = new SecurityLabelsService({
    enableMasking: true,
    enableWarnings: true,
    defaultConfidentiality: 'N',
    logSensitiveAccess: true,
    enableBreakTheGlass: true,
    maskCharacter: '●',
    enableDebugLogging: false
});
// ============================================================================
// Factory Function
// ============================================================================
/**
 * Create a new SecurityLabelsService instance with custom configuration
 */
export function createSecurityLabelsService(config) {
    return new SecurityLabelsService(config);
}
// ============================================================================
// Exports
// ============================================================================
export default {
    SecurityLabelsService,
    securityLabelsService,
    createSecurityLabelsService,
    CONFIDENTIALITY_DISPLAY,
    SENSITIVITY_DISPLAY
};
