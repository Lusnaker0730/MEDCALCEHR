// js/unit-converter.js
// Universal Unit Conversion System for MedCalcEHR

/**
 * Unit conversion definitions and functions
 */
export const UnitConverter = {
    // Conversion factors
    conversions: {
        // Weight
        weight: {
            'kg': { 'lbs': 2.20462, 'g': 1000 },
            'lbs': { 'kg': 0.453592, 'g': 453.592 },
            'g': { 'kg': 0.001, 'lbs': 0.00220462 }
        },
        // Height/Length
        height: {
            'cm': { 'in': 0.393701, 'ft': 0.0328084, 'm': 0.01 },
            'in': { 'cm': 2.54, 'ft': 0.0833333, 'm': 0.0254 },
            'ft': { 'cm': 30.48, 'in': 12, 'm': 0.3048 },
            'm': { 'cm': 100, 'in': 39.3701, 'ft': 3.28084 }
        },
        // Temperature
        temperature: {
            'C': { 
                'F': (val) => (val * 9/5) + 32,
                'K': (val) => val + 273.15
            },
            'F': { 
                'C': (val) => (val - 32) * 5/9,
                'K': (val) => (val - 32) * 5/9 + 273.15
            },
            'K': { 
                'C': (val) => val - 273.15,
                'F': (val) => (val - 273.15) * 9/5 + 32
            }
        },
        // Blood Pressure (less common, but available)
        pressure: {
            'mmHg': { 'kPa': 0.133322, 'bar': 0.00133322 },
            'kPa': { 'mmHg': 7.50062, 'bar': 0.01 },
            'bar': { 'mmHg': 750.062, 'kPa': 100 }
        },
        // Volume
        volume: {
            'mL': { 'L': 0.001, 'fl oz': 0.033814, 'cup': 0.00422675 },
            'L': { 'mL': 1000, 'fl oz': 33.814, 'cup': 4.22675 },
            'fl oz': { 'mL': 29.5735, 'L': 0.0295735, 'cup': 0.125 },
            'cup': { 'mL': 236.588, 'L': 0.236588, 'fl oz': 8 }
        },
        // Concentration (for labs)
        concentration: {
            'mg/dL': { 'mmol/L': null }, // Depends on molecular weight, handled separately
            'g/L': { 'mg/dL': 100, 'g/dL': 0.1 },
            'g/dL': { 'mg/dL': 1000, 'g/L': 10 }
        },
        // Cholesterol (TC, HDL, LDL)
        cholesterol: {
            'mg/dL': { 'mmol/L': 0.02586 },
            'mmol/L': { 'mg/dL': 38.67 }
        },
        // Triglycerides
        triglycerides: {
            'mg/dL': { 'mmol/L': 0.01129 },
            'mmol/L': { 'mg/dL': 88.57 }
        }
    },

    /**
     * Convert a value from one unit to another
     * @param {number} value - The value to convert
     * @param {string} fromUnit - The source unit
     * @param {string} toUnit - The target unit
     * @param {string} type - The measurement type (weight, height, temperature, etc.)
     * @returns {number|null} - The converted value or null if conversion not available
     */
    convert(value, fromUnit, toUnit, type) {
        if (!value || isNaN(value)) return null;
        if (fromUnit === toUnit) return value;
        
        const typeConversions = this.conversions[type];
        if (!typeConversions || !typeConversions[fromUnit]) return null;
        
        const conversion = typeConversions[fromUnit][toUnit];
        if (conversion === undefined) return null;
        
        // Handle function-based conversions (like temperature)
        if (typeof conversion === 'function') {
            return conversion(value);
        }
        
        // Handle factor-based conversions
        return value * conversion;
    },

    /**
     * Create a unit toggle button with conversion logic
     * @param {HTMLElement} inputElement - The input element to attach conversion to
     * @param {string} type - The measurement type
     * @param {Array} units - Array of unit strings, e.g., ['kg', 'lbs']
     * @param {string} defaultUnit - The default unit
     * @returns {HTMLElement} - The toggle button element
     */
    createUnitToggle(inputElement, type, units = [], defaultUnit = units[0]) {
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'unit-toggle-btn';
        toggleBtn.dataset.currentUnit = defaultUnit;
        toggleBtn.dataset.units = JSON.stringify(units);
        toggleBtn.dataset.type = type;
        toggleBtn.textContent = defaultUnit;
        toggleBtn.title = `Click to switch units (${units.join(' ↔ ')})`;
        
        // Store original value and unit
        let storedValue = null;
        let currentUnitIndex = 0;
        
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const currentValue = parseFloat(inputElement.value);
            if (!isNaN(currentValue)) {
                storedValue = currentValue;
            }
            
            // Cycle to next unit
            currentUnitIndex = (currentUnitIndex + 1) % units.length;
            const oldUnit = units[(currentUnitIndex - 1 + units.length) % units.length];
            const newUnit = units[currentUnitIndex];
            
            // Convert the value if present
            if (storedValue !== null && !isNaN(storedValue)) {
                const converted = this.convert(storedValue, oldUnit, newUnit, type);
                if (converted !== null) {
                    // Determine appropriate decimal places
                    const decimals = this.getDecimalPlaces(type, newUnit);
                    inputElement.value = converted.toFixed(decimals);
                    storedValue = converted;
                }
            }
            
            // Update button
            toggleBtn.textContent = newUnit;
            toggleBtn.dataset.currentUnit = newUnit;
            
            // Trigger change event on input to recalculate
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        });
        
        return toggleBtn;
    },

    /**
     * Get appropriate decimal places for a given unit
     */
    getDecimalPlaces(type, unit) {
        const decimalMap = {
            weight: { 'kg': 1, 'lbs': 1, 'g': 0 },
            height: { 'cm': 1, 'in': 1, 'ft': 2, 'm': 2 },
            temperature: { 'C': 1, 'F': 1, 'K': 1 },
            pressure: { 'mmHg': 0, 'kPa': 2, 'bar': 3 },
            volume: { 'mL': 0, 'L': 2, 'fl oz': 1, 'cup': 2 }
        };
        
        return decimalMap[type]?.[unit] ?? 1;
    },

    /**
     * Enhance an input field with unit conversion
     * Wraps the input in a container and adds a toggle button
     * @param {HTMLElement} inputElement - The input element to enhance
     * @param {string} type - The measurement type
     * @param {Array} units - Array of unit strings
     * @param {string} defaultUnit - The default unit
     * @returns {HTMLElement} - The wrapper container
     */
    enhanceInput(inputElement, type, units, defaultUnit = units[0]) {
        // Check if already enhanced
        if (inputElement.parentElement?.classList.contains('unit-converter-wrapper')) {
            return inputElement.parentElement;
        }
        
        const wrapper = document.createElement('div');
        wrapper.className = 'unit-converter-wrapper';
        wrapper.style.display = 'inline-flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '5px';
        
        // Replace input with wrapper
        inputElement.parentNode.insertBefore(wrapper, inputElement);
        wrapper.appendChild(inputElement);
        
        // Create and add toggle button
        const toggleBtn = this.createUnitToggle(inputElement, type, units, defaultUnit);
        wrapper.appendChild(toggleBtn);
        
        // Add unit indicator to input
        inputElement.dataset.currentUnit = defaultUnit;
        
        return wrapper;
    },

    /**
     * Auto-detect and enhance common inputs in a calculator
     * @param {HTMLElement} container - The calculator container
     * @param {Object} config - Configuration object mapping input IDs to unit specs
     * Example config: { 'weight': { type: 'weight', units: ['kg', 'lbs'] } }
     */
    autoEnhance(container, config = {}) {
        // Default configurations for common fields
        const defaultConfig = {
            weight: { type: 'weight', units: ['kg', 'lbs'], default: 'kg' },
            height: { type: 'height', units: ['cm', 'in'], default: 'cm' },
            temperature: { type: 'temperature', units: ['C', 'F'], default: 'C' },
            temp: { type: 'temperature', units: ['C', 'F'], default: 'C' }
        };
        
        const finalConfig = { ...defaultConfig, ...config };
        
        // Find and enhance matching inputs
        Object.entries(finalConfig).forEach(([key, spec]) => {
            const input = container.querySelector(`#${key}, input[name="${key}"], #${key}-input, .${key}-input`);
            if (input && input.type !== 'checkbox' && input.type !== 'radio') {
                this.enhanceInput(
                    input,
                    spec.type,
                    spec.units,
                    spec.default || spec.units[0]
                );
            }
        });
    },

    /**
     * Get the current unit of an enhanced input
     */
    getCurrentUnit(inputElement) {
        const wrapper = inputElement.closest('.unit-converter-wrapper');
        if (!wrapper) return null;
        
        const toggleBtn = wrapper.querySelector('.unit-toggle-btn');
        return toggleBtn?.dataset.currentUnit || null;
    },

    /**
     * Convert value back to standard unit before calculation
     * @param {HTMLElement} inputElement - The input element
     * @param {string} standardUnit - The standard unit to convert to
     * @returns {number|null} - The value in standard units
     */
    getStandardValue(inputElement, standardUnit) {
        const value = parseFloat(inputElement.value);
        if (isNaN(value)) return null;
        
        const currentUnit = this.getCurrentUnit(inputElement);
        if (!currentUnit) return value;
        
        const wrapper = inputElement.closest('.unit-converter-wrapper');
        const toggleBtn = wrapper?.querySelector('.unit-toggle-btn');
        const type = toggleBtn?.dataset.type;
        
        if (!type) return value;
        
        return this.convert(value, currentUnit, standardUnit, type) || value;
    }
};

// Add CSS for unit toggle buttons
const style = document.createElement('style');
style.textContent = `
.unit-converter-wrapper {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    position: relative;
}

.unit-toggle-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85em;
    font-weight: 600;
    transition: all 0.3s ease;
    min-width: 50px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.unit-toggle-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.unit-toggle-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.unit-converter-wrapper input {
    flex: 1;
    min-width: 80px;
}

@media (max-width: 768px) {
    .unit-toggle-btn {
        padding: 4px 8px;
        font-size: 0.75em;
        min-width: 40px;
    }
}
`;
document.head.appendChild(style);

export default UnitConverter;

