// js/utils.js

/**
 * Gets the most recent FHIR Observation for a given LOINC code.
 * @param {Object} client The FHIR client instance.
 * @param {string} code The LOINC code for the observation.
 * @returns {Promise<Object|null>} A promise that resolves to the Observation resource or null.
 */
export function getMostRecentObservation(client, code) {
    return client.patient.request(`Observation?code=${code}&_sort=-date&_count=1`)
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
    const renderPatient = (patient) => {
        const name = patient.name[0];
        const formattedName = `${name.given.join(" ")} ${name.family}`;
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
            patientInfoDiv.innerHTML = `<p>No patient data available. Please launch from the EHR.</p>`;
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
                patientInfoDiv.innerText = "Error fetching patient data.";
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
    return client.patient.request(`Condition?clinical-status=active&code=${codeString}`)
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
    return client.patient.request(`Observation?code=${code}&_sort=-date&_count=1`)
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
    if (!client) return null;
    try {
        const query = new URLSearchParams({
            'code': `http://www.nlm.nih.gov/research/umls/rxnorm|${rxnormCodes.join(',')}`,
            'patient': client.patient.id,
            'status': 'active'
        });
        const response = await client.request(`MedicationRequest?${query}`);
        return response.entry ? response.entry.map(e => e.resource) : [];
    } catch (error) {
        console.error('Error fetching medication requests:', error);
        return [];
    }
}

