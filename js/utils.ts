// js/utils.ts

import { FHIRClient, Observation, Patient, Condition, MedicationRequest } from './types/fhir';

/**
 * Gets the most recent FHIR Observation for a given LOINC code.
 * @param client The FHIR client instance.
 * @param code The LOINC code for the observation.
 * @returns A promise that resolves to the Observation resource or null.
 */
export function getMostRecentObservation(client: FHIRClient, code: string): Promise<Observation | null> {
    if (!client || !client.patient) {
        return Promise.resolve(null);
    }
    return client.request(`Observation?code=${code}&_sort=-date&_count=1`)
        .then((response: any) => {
            if (response.entry && response.entry.length > 0) {
                return response.entry[0].resource as Observation;
            }
            return null;
        })
        .catch((error: any) => {
            console.error('Error fetching observation:', error);
            return null;
        });
}

/**
 * Calculates age based on a birthdate string.
 * @param birthDate The birthdate in 'YYYY-MM-DD' format.
 * @returns The calculated age in years.
 */
export function calculateAge(birthDate: string): number {
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
    }
    return age;
}

/**
 * Fetches patient data and displays it in a designated div.
 * @param client The FHIR client instance.
 * @param patientInfoDiv The div element to display patient info in.
 * @returns A promise that resolves to the patient resource.
 */
export function displayPatientInfo(client: FHIRClient, patientInfoDiv: HTMLElement): Promise<Patient | null> {
    const renderPatient = (patient: Patient) => {
        const name = patient.name ? patient.name[0] : { text: 'Unknown', given: [], family: '' };
        // 優先使用 text 字段（台灣格式），如果沒有則使用 given 和 family
        const formattedName = name.text || `${name.given?.join(' ') || ''} ${name.family || ''}`.trim();
        const age = patient.birthDate ? calculateAge(patient.birthDate) : 'Unknown';
        patientInfoDiv.innerHTML = `
            <p><strong>Name:</strong> ${formattedName}</p>
            <p><strong>Birth Date:</strong> ${patient.birthDate || 'Unknown'} (Age: ${age})</p>
            <p><strong>Gender:</strong> ${patient.gender || 'Unknown'}</p>
        `;
    };

    // First, try to display data from session storage for a faster UI response.
    const cachedPatientStr = sessionStorage.getItem('patientData');
    const cachedPatient = cachedPatientStr ? JSON.parse(cachedPatientStr) : null;

    if (cachedPatient) {
        renderPatient(cachedPatient);
    }

    if (!client || !client.patient || !client.patient.id) {
        if (!cachedPatient) {
            patientInfoDiv.innerHTML =
                '<p>No patient data available. Please launch from the EHR.</p>';
        }
        return Promise.resolve(cachedPatient);
    }

    return client.patient.read().then(
        (patient: Patient) => {
            sessionStorage.setItem('patientData', JSON.stringify(patient));
            renderPatient(patient);
            return patient;
        },
        (error: any) => {
            console.error(error);
            if (!cachedPatient) {
                patientInfoDiv.innerText = 'Error fetching patient data.';
            }
            throw error;
        }
    );
}

/**
 * Gets patient's conditions for a given set of SNOMED codes.
 * @param client The FHIR client instance.
 * @param codes Array of SNOMED codes for the conditions.
 * @returns A promise that resolves to an array of Condition resources.
 */
export function getPatientConditions(client: FHIRClient, codes: string[]): Promise<Condition[]> {
    if (!client || !client.patient) {
        return Promise.resolve([]);
    }
    const codeString = codes.join(',');
    return client.request(`Condition?clinical-status=active&code=${codeString}`)
        .then((response: any) => {
            if (response.entry) {
                return response.entry.map((e: any) => e.resource as Condition);
            }
            return [];
        })
        .catch((error: any) => {
            console.error('Error fetching patient conditions:', error);
            return [];
        });
}

/**
 * Fetches the patient resource.
 * @param client - The FHIR client instance.
 * @returns A promise that resolves to the patient resource or null.
 */
export function getPatient(client: FHIRClient): Promise<Patient | null> {
    if (!client || !client.patient) {
        return Promise.resolve(null);
    }
    return client.patient.read()
        .then((patient: Patient) => patient || null)
        .catch((error: any) => {
            console.error('Error fetching patient:', error);
            return null;
        });
}

/**
 * Fetches the most recent observation for a given LOINC code.
 * @param client - The FHIR client instance.
 * @param code - The LOINC code for the observation.
 * @returns A promise that resolves to the observation resource or null.
 */
export function getObservation(client: FHIRClient, code: string): Promise<Observation | null> {
    return getMostRecentObservation(client, code);
}

/**
 * Converts a lab value from mg/dL to mmol/L.
 * @param value - The lab value in mg/dL.
 * @param type - The type of lab ('cholesterol', 'hdl', 'glucose').
 * @returns The lab value in mmol/L.
 */
export function convertToMmolL(value: number, type: 'cholesterol' | 'hdl' | 'glucose'): number {
    const conversionFactors: { [key: string]: number } = {
        cholesterol: 0.02586,
        hdl: 0.02586,
        glucose: 0.0555
    };
    return value * (conversionFactors[type] || 1);
}

/**
 * Converts a lab value from mmol/L to mg/dL.
 * @param value - The lab value in mmol/L.
 * @param type - The type of lab ('cholesterol', 'hdl', 'glucose').
 * @returns The lab value in mg/dL.
 */
export function convertToMgDl(value: number, type: 'cholesterol' | 'hdl' | 'glucose'): number {
    const conversionFactors: { [key: string]: number } = {
        cholesterol: 38.67,
        hdl: 38.67,
        glucose: 18.018
    };
    return value * (conversionFactors[type] || 1);
}

export async function getMedicationRequests(client: FHIRClient, rxnormCodes: string[]): Promise<MedicationRequest[]> {
    if (!client) {
        return [];
    }
    try {
        const query = new URLSearchParams({
            code: `http://www.nlm.nih.gov/research/umls/rxnorm|${rxnormCodes.join(',')}`,
            patient: client.patient.id || '',
            status: 'active'
        });
        const response = await client.request(`MedicationRequest?${query}`);
        return response.entry ? response.entry.map((e: any) => e.resource as MedicationRequest) : [];
    } catch (error) {
        console.error('Error fetching medication requests:', error);
        return [];
    }
}

/**
 * Universal unit conversion system
 * Supports automatic unit conversion for common lab values and measurements
 */

type ConversionMap = { [key: string]: { [key: string]: number | ((v: number) => number) } };
type UnitConversionDatabase = { [key: string]: ConversionMap };

// Comprehensive conversion factor database
export const UNIT_CONVERSIONS: UnitConversionDatabase = {
    // Cholesterol (Total, LDL, HDL)
    cholesterol: {
        'mg/dL': { 'mmol/L': 0.02586 },
        'mmol/L': { 'mg/dL': 38.67 }
    },

    // Triglycerides
    triglycerides: {
        'mg/dL': { 'mmol/L': 0.01129 },
        'mmol/L': { 'mg/dL': 88.57 }
    },

    // Glucose
    glucose: {
        'mg/dL': { 'mmol/L': 0.0555 },
        'mmol/L': { 'mg/dL': 18.018 }
    },

    // Creatinine
    creatinine: {
        'mg/dL': { 'µmol/L': 88.4, 'umol/L': 88.4 },
        'µmol/L': { 'mg/dL': 0.0113 },
        'umol/L': { 'mg/dL': 0.0113 }
    },

    // Calcium
    calcium: {
        'mg/dL': { 'mmol/L': 0.2495 },
        'mmol/L': { 'mg/dL': 4.008 }
    },

    // Albumin
    albumin: {
        'g/dL': { 'g/L': 10 },
        'g/L': { 'g/dL': 0.1 }
    },

    // Bilirubin
    bilirubin: {
        'mg/dL': { 'µmol/L': 17.1, 'umol/L': 17.1 },
        'µmol/L': { 'mg/dL': 0.0585 },
        'umol/L': { 'mg/dL': 0.0585 }
    },

    // Hemoglobin
    hemoglobin: {
        'g/dL': { 'g/L': 10, 'mmol/L': 0.6206 },
        'g/L': { 'g/dL': 0.1 },
        'mmol/L': { 'g/dL': 1.611 }
    },

    // Weight
    weight: {
        'kg': { 'lbs': 2.20462 },
        'lbs': { 'kg': 0.453592 }
    },

    // Height
    height: {
        'cm': { 'in': 0.393701, 'm': 0.01 },
        'in': { 'cm': 2.54, 'm': 0.0254 },
        'm': { 'cm': 100, 'in': 39.3701 }
    },

    // Temperature
    temperature: {
        'C': { 'F': (v: number) => (v * 9 / 5) + 32 },
        'F': { 'C': (v: number) => (v - 32) * 5 / 9 }
    },

    // Fibrinogen
    fibrinogen: {
        'mg/dL': { 'g/L': 0.01 },
        'g/L': { 'mg/dL': 100 }
    }
};

/**
 * Convert a value between units
 * @param value - The value to convert
 * @param fromUnit - The source unit
 * @param toUnit - The target unit
 * @param measurementType - The type of measurement (e.g., 'cholesterol', 'weight')
 * @returns The converted value or null if conversion not found
 */
export function convertUnit(value: number, fromUnit: string, toUnit: string, measurementType: string): number | null {
    if (fromUnit === toUnit) return value;

    const typeConversions = UNIT_CONVERSIONS[measurementType];
    if (!typeConversions) return null;

    const fromConversions = typeConversions[fromUnit];
    if (!fromConversions) return null;

    const factor = fromConversions[toUnit];
    if (factor === undefined) return null;

    if (typeof factor === 'function') {
        return factor(value);
    }

    return value * factor;
}

/**
 * Create a unit selector HTML with automatic conversion display
 * @param {string} inputId - ID of the input field
 * @param {string} measurementType - Type of measurement for conversion
 * @param {Array<string>} units - Array of unit options (e.g., ['mg/dL', 'mmol/L'])
 * @param {string} defaultUnit - Default unit to display
 * @returns {string} HTML string for unit selector
 */
export function createUnitSelector(inputId, measurementType, units, defaultUnit = units[0]) {
    const unitOptions = units
        .map(
            unit =>
                `<option value="${unit}"${unit === defaultUnit ? ' selected' : ''}>${unit}</option>`
        )
        .join('');

    return `
        <div style="display: flex; gap: 10px; align-items: center;">
            <input type="number" id="${inputId}" placeholder="Enter value" style="flex: 1;" step="0.1">
            <select id="${inputId}-unit" style="width: 100px;" data-measurement="${measurementType}">
                ${unitOptions}
            </select>
        </div>
        <small id="${inputId}-converted" style="color: #666; margin-top: 4px; display: none; font-style: italic;"></small>
    `;
}

/**
 * Initialize unit conversion for an input field
 * @param {HTMLElement} container - Container element
 * @param {string} inputId - ID of the input field
 * @param {Function} onChangeCallback - Callback function when value changes
 */
export function initializeUnitConversion(container, inputId, onChangeCallback) {
    const input = container.querySelector(`#${inputId}`);
    const unitSelect = container.querySelector(`#${inputId}-unit`);
    const convertedDisplay = container.querySelector(`#${inputId}-converted`);

    if (!input || !unitSelect) {
        return;
    }

    const measurementType = unitSelect.dataset.measurement;

    const updateConversion = () => {
        const value = parseFloat(input.value);
        const currentUnit = unitSelect.value;

        if (value && !isNaN(value) && convertedDisplay) {
            // Get all available units for this measurement type
            const availableUnits = Object.keys(
                UNIT_CONVERSIONS[measurementType][currentUnit] || {}
            );

            if (availableUnits.length > 0) {
                const targetUnit = availableUnits[0];
                const converted = convertUnit(value, currentUnit, targetUnit, measurementType);

                if (converted !== null) {
                    convertedDisplay.textContent = `≈ ${converted.toFixed(2)} ${targetUnit}`;
                    convertedDisplay.style.display = 'block';
                } else {
                    convertedDisplay.style.display = 'none';
                }
            } else {
                convertedDisplay.style.display = 'none';
            }
        } else if (convertedDisplay) {
            convertedDisplay.style.display = 'none';
        }

        if (onChangeCallback) {
            onChangeCallback();
        }
    };

    input.addEventListener('input', updateConversion);
    unitSelect.addEventListener('change', updateConversion);

    return updateConversion;
}

/**
 * Get value in standard unit (converts if necessary)
 * @param {HTMLElement} container - Container element
 * @param {string} inputId - ID of the input field
 * @param {string} standardUnit - The standard unit to convert to
 * @returns {number|null} Value in standard unit, or null if invalid
 */
export function getValueInStandardUnit(container, inputId, standardUnit) {
    const input = container.querySelector(`#${inputId}`);
    const unitSelect = container.querySelector(`#${inputId}-unit`);

    if (!input || !unitSelect) {
        return null;
    }

    const value = parseFloat(input.value);
    const currentUnit = unitSelect.value;
    const measurementType = unitSelect.dataset.measurement;

    if (isNaN(value)) {
        return null;
    }

    if (currentUnit === standardUnit) {
        return value;
    }

    return convertUnit(value, currentUnit, standardUnit, measurementType);
}

/**
 * Initialize visual feedback for segmented controls with radio buttons
 * Adds 'selected' class to the label when its radio button is checked
 * @param {HTMLElement} container - Container element that contains segmented controls
 */
export function initializeSegmentedControls(container) {
    // Handle all segmented controls in the container
    container.querySelectorAll('.segmented-control, .radio-group').forEach(control => {
        const labels = control.querySelectorAll('label');
        const radioInputs = control.querySelectorAll('input[type="radio"]');

        // Function to update selected state
        const updateSelectedState = () => {
            radioInputs.forEach(input => {
                const label = input.parentElement;
                if (input.checked) {
                    label.classList.add('selected');
                } else {
                    label.classList.remove('selected');
                }
            });
        };

        // Add change event listeners to radio buttons
        radioInputs.forEach(input => {
            input.addEventListener('change', updateSelectedState);
        });

        // Add click handlers to labels for immediate visual feedback
        labels.forEach(label => {
            label.addEventListener('click', () => {
                // Use setTimeout to ensure the radio state is updated first
                setTimeout(updateSelectedState, 0);
            });
        });

        // Initialize state on load
        updateSelectedState();
    });
}
