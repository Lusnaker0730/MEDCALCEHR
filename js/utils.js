// js/utils.js

/**
 * Gets the most recent FHIR Observation for a given LOINC code.
 * @param {Object} client The FHIR client instance.
 * @param {string} code The LOINC code for the observation.
 * @returns {Promise<Object|null>} A promise that resolves to the Observation resource or null.
 */
export function getMostRecentObservation(client, code) {
    return client.patient
        .request(`Observation?code=${code}&_sort=-date&_count=1`)
        .then(response => {
            if (response.entry && response.entry.length > 0) {
                return response.entry[0].resource;
            }
            return null;
        });
}

/**
 * Calculates age based on a birthdate string.
 * @param {string} birthDate The birthdate in 'YYYY-MM-DD' format.
 * @returns {number} The calculated age in years.
 */
export function calculateAge(birthDate) {
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
 * @param {Object} client The FHIR client instance.
 * @param {HTMLElement} patientInfoDiv The div element to display patient info in.
 * @returns {Promise<Object>} A promise that resolves to the patient resource.
 */
export function displayPatientInfo(client, patientInfoDiv) {
    const renderPatient = patient => {
        const name = patient.name[0];
        // 優先使用 text 字段（台灣格式），如果沒有則使用 given 和 family
        const formattedName = name.text || `${name.given?.join(' ') || ''} ${name.family || ''}`.trim();
        const age = calculateAge(patient.birthDate);
        patientInfoDiv.innerHTML = `
            <p><strong>Name:</strong> ${formattedName}</p>
            <p><strong>Birth Date:</strong> ${patient.birthDate} (Age: ${age})</p>
            <p><strong>Gender:</strong> ${patient.gender}</p>
        `;
    };

    // First, try to display data from session storage for a faster UI response.
    const cachedPatient = sessionStorage.getItem('patientData');
    if (cachedPatient) {
        renderPatient(JSON.parse(cachedPatient));
    }

    if (!client?.patient?.id) {
        if (!cachedPatient) {
            patientInfoDiv.innerHTML =
                '<p>No patient data available. Please launch from the EHR.</p>';
        }
        return Promise.resolve(JSON.parse(cachedPatient));
    }

    return client.patient.read().then(
        patient => {
            sessionStorage.setItem('patientData', JSON.stringify(patient));
            renderPatient(patient);
            return patient;
        },
        error => {
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
 * @param {Object} client The FHIR client instance.
 * @param {Array<string>} codes Array of SNOMED codes for the conditions.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of Condition resources.
 */
export function getPatientConditions(client, codes) {
    const codeString = codes.join(',');
    return client.patient
        .request(`Condition?clinical-status=active&code=${codeString}`)
        .then(response => {
            if (response.entry) {
                return response.entry.map(e => e.resource);
            }
            return [];
        });
}

/**
 * Fetches the patient resource.
 * @param {Object} client - The FHIR client instance.
 * @returns {Promise<Object|null>} A promise that resolves to the patient resource or null.
 */
export function getPatient(client) {
    return client.patient.read().then(patient => patient || null);
}

/**
 * Fetches the most recent observation for a given LOINC code.
 * @param {Object} client - The FHIR client instance.
 * @param {string} code - The LOINC code for the observation.
 * @returns {Promise<Object|null>} A promise that resolves to the observation resource or null.
 */
export function getObservation(client, code) {
    return client.patient
        .request(`Observation?code=${code}&_sort=-date&_count=1`)
        .then(response => {
            if (response.entry && response.entry.length > 0) {
                return response.entry[0].resource;
            }
            return null;
        });
}

/**
 * Converts a lab value from mg/dL to mmol/L.
 * @param {number} value - The lab value in mg/dL.
 * @param {string} type - The type of lab ('cholesterol', 'hdl', 'glucose').
 * @returns {number} The lab value in mmol/L.
 */
export function convertToMmolL(value, type) {
    const conversionFactors = {
        cholesterol: 0.02586,
        hdl: 0.02586,
        glucose: 0.0555
    };
    return value * (conversionFactors[type] || 1);
}

/**
 * Converts a lab value from mmol/L to mg/dL.
 * @param {number} value - The lab value in mmol/L.
 * @param {string} type - The type of lab ('cholesterol', 'hdl', 'glucose').
 * @returns {number} The lab value in mg/dL.
 */
export function convertToMgDl(value, type) {
    const conversionFactors = {
        cholesterol: 38.67,
        hdl: 38.67,
        glucose: 18.018
    };
    return value * (conversionFactors[type] || 1);
}

export async function getMedicationRequests(client, rxnormCodes) {
    if (!client) {
        return null;
    }
    try {
        const query = new URLSearchParams({
            code: `http://www.nlm.nih.gov/research/umls/rxnorm|${rxnormCodes.join(',')}`,
            patient: client.patient.id,
            status: 'active'
        });
        const response = await client.request(`MedicationRequest?${query}`);
        return response.entry ? response.entry.map(e => e.resource) : [];
    } catch (error) {
        console.error('Error fetching medication requests:', error);
        return [];
    }
}

/**
 * Universal unit conversion system
 * Supports automatic unit conversion for common lab values and measurements
 */

// Comprehensive conversion factor database
export const UNIT_CONVERSIONS = {
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
        kg: { lbs: 2.20462, lb: 2.20462 },
        lbs: { kg: 0.453592 },
        lb: { kg: 0.453592 }
    },

    // Height
    height: {
        cm: { in: 0.393701, inches: 0.393701 },
        in: { cm: 2.54 },
        inches: { cm: 2.54 },
        m: { cm: 100, in: 39.3701 },
        ft: { cm: 30.48 }
    },

    // Temperature
    temperature: {
        C: { F: v => (v * 9) / 5 + 32 },
        F: { C: v => ((v - 32) * 5) / 9 },
        '°C': { '°F': v => (v * 9) / 5 + 32 },
        '°F': { '°C': v => ((v - 32) * 5) / 9 }
    },

    // Urea/BUN
    bun: {
        'mg/dL': { 'mmol/L': 0.357 },
        'mmol/L': { 'mg/dL': 2.801 }
    },

    // Sodium, Potassium (same for both)
    electrolyte: {
        'mEq/L': { 'mmol/L': 1 },
        'mmol/L': { 'mEq/L': 1 }
    },

    // Platelet count
    platelet: {
        '×10⁹/L': { '×10³/µL': 1, 'K/µL': 1 },
        '×10³/µL': { '×10⁹/L': 1 },
        'K/µL': { '×10⁹/L': 1 }
    },

    // White blood cell count
    wbc: {
        '×10⁹/L': { '×10³/µL': 1, 'K/µL': 1 },
        '×10³/µL': { '×10⁹/L': 1 },
        'K/µL': { '×10⁹/L': 1 }
    },

    // INR (no conversion, but included for completeness)
    inr: {
        ratio: { ratio: 1 }
    },

    // D-dimer
    ddimer: {
        'mg/L': { 'µg/mL': 1, 'ng/mL': 1000 },
        'µg/mL': { 'mg/L': 1 },
        'ng/mL': { 'mg/L': 0.001 }
    },

    // Fibrinogen
    fibrinogen: {
        'g/L': { 'mg/dL': 100 },
        'mg/dL': { 'g/L': 0.01 }
    }
};

/**
 * Convert a value from one unit to another
 * @param {number} value - The value to convert
 * @param {string} fromUnit - The source unit
 * @param {string} toUnit - The target unit
 * @param {string} measurementType - The type of measurement (e.g., 'glucose', 'cholesterol')
 * @returns {number|null} The converted value, or null if conversion not possible
 */
export function convertUnit(value, fromUnit, toUnit, measurementType) {
    if (fromUnit === toUnit) {
        return value;
    }

    const conversionData = UNIT_CONVERSIONS[measurementType];
    if (!conversionData) {
        return null;
    }

    const conversion = conversionData[fromUnit]?.[toUnit];
    if (!conversion) {
        return null;
    }

    // Handle function-based conversions (e.g., temperature)
    if (typeof conversion === 'function') {
        return conversion(value);
    }

    return value * conversion;
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
