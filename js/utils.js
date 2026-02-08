import { escapeHTML, isRestrictedResource, secureSessionStore, secureSessionRetrieve, extractMinimalPatientData } from './security.js';
/** Storage key for patient display data */
const PATIENT_CACHE_KEY = 'patientDisplayData';
/**
 * Gets the most recent FHIR Observation for a given LOINC code.
 * @param {Object} client The FHIR client instance.
 * @param {string} code The LOINC code for the observation.
 * @returns {Promise<Object|null>} A promise that resolves to the Observation resource or null.
 */
export function getMostRecentObservation(client, code) {
    if (!client || !client.patient) {
        return Promise.resolve(null);
    }
    return client.patient
        .request(`Observation?code=${code}&_sort=-date&_count=1`)
        .then((response) => {
        if (response.entry && response.entry.length > 0) {
            const resource = response.entry[0].resource;
            if (isRestrictedResource(resource)) {
                console.warn(`[Security] Access to restricted Observation (${code}) blocked.`);
                return null;
            }
            return resource;
        }
        return null;
    })
        .catch((error) => {
        console.error('Error fetching observation:', error);
        return null;
    });
}
/**
 * Extracts a value from an observation, handling both valueQuantity and components.
 * @param {Object} observation - The FHIR Observation resource.
 * @param {string} code - The specific LOINC code to look for (optional if simple observation).
 * @returns {number|null} - The value or null if not found.
 */
export function getObservationValue(observation, code) {
    if (!observation)
        return null;
    // 1. Check top-level valueQuantity
    if (observation.valueQuantity && observation.valueQuantity.value !== undefined) {
        return observation.valueQuantity.value;
    }
    // 2. Check components if code is provided
    if (observation.component && code) {
        const component = observation.component.find((c) => c.code.coding && c.code.coding.some((coding) => coding.code === code));
        if (component && component.valueQuantity) {
            return component.valueQuantity.value;
        }
    }
    return null;
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
 * Renders minimal patient data to the display element
 * @param minimalData - Minimal patient data (name, birthDate, gender)
 * @param patientInfoDiv - The div element to display patient info in
 */
function renderMinimalPatient(minimalData, patientInfoDiv) {
    const age = calculateAge(minimalData.birthDate);
    // Use escapeHTML to prevent XSS attacks
    const safeName = escapeHTML(minimalData.name);
    const safeBirthDate = escapeHTML(minimalData.birthDate);
    const safeGender = escapeHTML(minimalData.gender);
    patientInfoDiv.innerHTML = `
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Birth Date:</strong> ${safeBirthDate} (Age: ${age})</p>
        <p><strong>Gender:</strong> ${safeGender}</p>
    `;
}
/**
 * Fetches patient data and displays it in a designated div.
 * @param {Object} client The FHIR client instance.
 * @param {HTMLElement} patientInfoDiv The div element to display patient info in.
 * @returns {Promise<Object>} A promise that resolves to the patient resource.
 * @security Only minimal patient data is stored in sessionStorage (encrypted).
 *           Full patient object is kept in memory only.
 */
export async function displayPatientInfo(client, patientInfoDiv) {
    // First, try to display data from secure session storage for a faster UI response.
    const cachedMinimal = await secureSessionRetrieve(PATIENT_CACHE_KEY);
    if (cachedMinimal && cachedMinimal.name) {
        renderMinimalPatient(cachedMinimal, patientInfoDiv);
    }
    if (!client?.patient?.id) {
        if (!cachedMinimal) {
            patientInfoDiv.innerHTML =
                '<p>No patient data available. Please launch from the EHR.</p>';
        }
        // Return a reconstructed minimal patient object for compatibility
        return cachedMinimal ? {
            id: cachedMinimal.id,
            name: [{ text: cachedMinimal.name }],
            birthDate: cachedMinimal.birthDate,
            gender: cachedMinimal.gender
        } : null;
    }
    return client.patient.read().then(async (patient) => {
        // Extract and securely store only minimal data
        const minimalData = extractMinimalPatientData(patient);
        if (minimalData) {
            await secureSessionStore(PATIENT_CACHE_KEY, minimalData);
            renderMinimalPatient(minimalData, patientInfoDiv);
        }
        // Return full patient object (kept in memory only, not persisted)
        return patient;
    }, (error) => {
        console.error(error);
        if (!cachedMinimal) {
            patientInfoDiv.innerText = 'Error fetching patient data.';
        }
        throw error;
    });
}
/**
 * Gets patient's conditions for a given set of SNOMED codes.
 * @param {Object} client The FHIR client instance.
 * @param {Array<string>} codes Array of SNOMED codes for the conditions.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of Condition resources.
 */
export function getPatientConditions(client, codes) {
    if (!client || !client.patient) {
        return Promise.resolve([]);
    }
    const codeString = codes.join(',');
    return client.patient
        .request(`Condition?clinical-status=active&code=${codeString}`)
        .then((response) => {
        if (response.entry) {
            return response.entry
                .map((e) => e.resource)
                .filter((r) => {
                if (isRestrictedResource(r)) {
                    console.warn(`[Security] Access to restricted Condition (${r.id}) blocked.`);
                    return false;
                }
                return true;
            });
        }
        return [];
    })
        .catch((error) => {
        console.error('Error fetching patient conditions:', error);
        return [];
    });
}
/**
 * Fetches the patient resource.
 * @param {Object} client - The FHIR client instance.
 * @returns {Promise<Object|null>} A promise that resolves to the patient resource or null.
 */
export function getPatient(client) {
    if (!client || !client.patient) {
        return Promise.resolve(null);
    }
    return client.patient
        .read()
        .then((patient) => patient || null)
        .catch((error) => {
        console.error('Error fetching patient:', error);
        return null;
    });
}
/**
 * Fetches the most recent observation for a given LOINC code.
 * @param {Object} client - The FHIR client instance.
 * @param {string} code - The LOINC code for the observation.
 * @returns {Promise<Object|null>} A promise that resolves to the observation resource or null.
 */
export function getObservation(client, code) {
    if (!client || !client.patient) {
        return Promise.resolve(null);
    }
    return client.patient
        .request(`Observation?code=${code}&_sort=-date&_count=1`)
        .then((response) => {
        if (response.entry && response.entry.length > 0) {
            return response.entry[0].resource;
        }
        return null;
    })
        .catch((error) => {
        console.error('Error fetching observation:', error);
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
        return Promise.resolve([]);
    }
    try {
        const query = new URLSearchParams({
            code: `http://www.nlm.nih.gov/research/umls/rxnorm|${rxnormCodes.join(',')}`,
            patient: client.patient.id,
            status: 'active'
        });
        const response = await client.request(`MedicationRequest?${query}`);
        return response.entry
            ? response.entry
                .map((e) => e.resource)
                .filter((r) => {
                if (isRestrictedResource(r)) {
                    console.warn(`[Security] Access to restricted MedicationRequest (${r.id}) blocked.`);
                    return false;
                }
                return true;
            })
            : [];
    }
    catch (error) {
        console.error('Error fetching medication requests:', error);
        return [];
    }
}
// Note: Unit conversion functions have been consolidated into unit-converter.ts
// Use UnitConverter.convert(), UnitConverter.conversions, etc.
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
            radioInputs.forEach((input) => {
                const label = input.parentElement;
                if (input.checked) {
                    label.classList.add('selected');
                }
                else {
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
export { isRestrictedResource } from './security.js';
