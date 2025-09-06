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
    return client.patient.read().then(
        patient => {
            const name = patient.name[0];
            const formattedName = `${name.given.join(" ")} ${name.family}`;
            const age = calculateAge(patient.birthDate);
            patientInfoDiv.innerHTML = `
                <p><strong>Name:</strong> ${formattedName}</p>
                <p><strong>Birth Date:</strong> ${patient.birthDate} (Age: ${age})</p>
                <p><strong>Gender:</strong> ${patient.gender}</p>
            `;
            return patient;
        },
        error => {
            console.error(error);
            patientInfoDiv.innerText = "Error fetching patient data.";
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

