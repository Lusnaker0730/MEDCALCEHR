/**
 * Standalone Bundle for Calculator Builder
 * Combines UnitConverter, UIBuilder, GenericCalculator, and Builder Logic
 * to allow running without a local server (file:// protocol).
 */

(function () {

    // ==========================================
    // 1. Unit Converter
    // ==========================================
    const UnitConverter = {
        conversions: {
            weight: {
                'kg': { 'lbs': 2.20462, 'g': 1000 },
                'lbs': { 'kg': 0.453592, 'g': 453.592 },
                'g': { 'kg': 0.001, 'lbs': 0.00220462 }
            },
            height: {
                'cm': { 'in': 0.393701, 'ft': 0.0328084, 'm': 0.01 },
                'in': { 'cm': 2.54, 'ft': 0.0833333, 'm': 0.0254 },
                'ft': { 'cm': 30.48, 'in': 12, 'm': 0.3048 },
                'm': { 'cm': 100, 'in': 39.3701, 'ft': 3.28084 }
            },
            temperature: {
                'C': {
                    'F': (val) => (val * 9 / 5) + 32,
                    'K': (val) => val + 273.15
                },
                'F': {
                    'C': (val) => (val - 32) * 5 / 9,
                    'K': (val) => (val - 32) * 5 / 9 + 273.15
                },
                'K': {
                    'C': (val) => val - 273.15,
                    'F': (val) => (val - 273.15) * 9 / 5 + 32
                }
            },
            pressure: {
                'mmHg': { 'kPa': 0.133322, 'bar': 0.00133322 },
                'kPa': { 'mmHg': 7.50062, 'bar': 0.01 },
                'bar': { 'mmHg': 750.062, 'kPa': 100 }
            },
            volume: {
                'mL': { 'L': 0.001, 'fl oz': 0.033814, 'cup': 0.00422675 },
                'L': { 'mL': 1000, 'fl oz': 33.814, 'cup': 4.22675 },
                'fl oz': { 'mL': 29.5735, 'L': 0.0295735, 'cup': 0.125 },
                'cup': { 'mL': 236.588, 'L': 0.236588, 'fl oz': 8 }
            }
        },

        convert(value, fromUnit, toUnit, type) {
            if (!value || isNaN(value)) return null;
            if (fromUnit === toUnit) return value;

            const typeConversions = this.conversions[type];
            if (!typeConversions || !typeConversions[fromUnit]) return null;

            const conversion = typeConversions[fromUnit][toUnit];
            if (conversion === undefined) return null;

            if (typeof conversion === 'function') {
                return conversion(value);
            }

            return value * conversion;
        },

        createUnitToggle(inputElement, type, units = [], defaultUnit = units[0]) {
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'unit-toggle-btn';
            toggleBtn.dataset.currentUnit = defaultUnit;
            toggleBtn.dataset.units = JSON.stringify(units);
            toggleBtn.dataset.type = type;
            toggleBtn.textContent = defaultUnit;
            toggleBtn.title = `Click to switch units (${units.join(' ↔ ')})`;

            let storedValue = null;
            let currentUnitIndex = 0;

            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();

                const currentValue = parseFloat(inputElement.value);
                if (!isNaN(currentValue)) {
                    storedValue = currentValue;
                }

                currentUnitIndex = (currentUnitIndex + 1) % units.length;
                const oldUnit = units[(currentUnitIndex - 1 + units.length) % units.length];
                const newUnit = units[currentUnitIndex];

                if (storedValue !== null && !isNaN(storedValue)) {
                    const converted = this.convert(storedValue, oldUnit, newUnit, type);
                    if (converted !== null) {
                        const decimals = this.getDecimalPlaces(type, newUnit);
                        inputElement.value = converted.toFixed(decimals);
                        storedValue = converted;
                    }
                }

                toggleBtn.textContent = newUnit;
                toggleBtn.dataset.currentUnit = newUnit;

                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            });

            return toggleBtn;
        },

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

        enhanceInput(inputElement, type, units, defaultUnit = units[0]) {
            if (inputElement.parentElement?.classList.contains('unit-converter-wrapper')) {
                return inputElement.parentElement;
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'unit-converter-wrapper';
            wrapper.style.display = 'inline-flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '5px';

            inputElement.parentNode.insertBefore(wrapper, inputElement);
            wrapper.appendChild(inputElement);

            const toggleBtn = this.createUnitToggle(inputElement, type, units, defaultUnit);
            wrapper.appendChild(toggleBtn);

            inputElement.dataset.currentUnit = defaultUnit;

            return wrapper;
        },

        autoEnhance(container, config = {}) {
            const defaultConfig = {
                weight: { type: 'weight', units: ['kg', 'lbs'], default: 'kg' },
                height: { type: 'height', units: ['cm', 'in'], default: 'cm' },
                temperature: { type: 'temperature', units: ['C', 'F'], default: 'C' },
                temp: { type: 'temperature', units: ['C', 'F'], default: 'C' }
            };

            const finalConfig = { ...defaultConfig, ...config };

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

        getCurrentUnit(inputElement) {
            const wrapper = inputElement.closest('.unit-converter-wrapper');
            if (!wrapper) return null;

            const toggleBtn = wrapper.querySelector('.unit-toggle-btn');
            return toggleBtn?.dataset.currentUnit || null;
        },

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

    // Inject Unit Converter Styles
    const ucStyle = document.createElement('style');
    ucStyle.textContent = `
.unit-converter-wrapper { display: inline-flex; align-items: center; gap: 5px; position: relative; }
.unit-toggle-btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: 600; transition: all 0.3s ease; min-width: 50px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.unit-toggle-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.2); background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); }
.unit-toggle-btn:active { transform: translateY(0); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.unit-converter-wrapper input { flex: 1; min-width: 80px; }
`;
    document.head.appendChild(ucStyle);


    // ==========================================
    // 2. UI Builder
    // ==========================================
    class UIBuilder {
        constructor() {
            this.defaultStyles = this.injectStyles();
        }

        injectStyles() {
            if (document.getElementById('ui-builder-styles')) return;
            const style = document.createElement('style');
            style.id = 'ui-builder-styles';
            // Simplified styles for standalone
            style.textContent = `
            .ui-section { background: #ffffff; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
            .ui-section-title { font-size: 1.1em; font-weight: 600; color: #2c3e50; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e8f4f8; }
            .ui-result-box { margin-top: 20px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); background: #ffffff; display: none; }
            .ui-result-box.show { display: block; }
            .ui-result-header { padding: 15px 20px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; font-weight: 600; }
            .ui-result-content { padding: 20px; }
            .ui-result-value { font-size: 2.5em; font-weight: 700; color: #2c3e50; }
            .ui-input-group { margin-bottom: 15px; }
            .ui-input-group label { display: block; font-weight: 500; color: #34495e; margin-bottom: 6px; }
            .ui-input { width: 100%; padding: 10px 12px; border: 2px solid #e0e6ed; border-radius: 8px; font-size: 1em; box-sizing: border-box; }
            .ui-input:focus { border-color: #3498db; outline: none; }
        `;
            document.head.appendChild(style);
        }

        createForm({ fields }) {
            return fields.map(field => {
                if (field.type === 'section') return this.createSection(field);
                if (field.type === 'input') return this.createInput(field);
                if (field.type === 'radio') return this.createRadioGroup(field);
                if (field.type === 'checkbox') return this.createCheckboxGroup(field);
                return '';
            }).join('');
        }

        createSection({ title, subtitle, content = '' }) {
            return `<div class="ui-section">${title ? `<div class="ui-section-title">${title}</div>` : ''}${content}</div>`;
        }

        createInput({ id, label, type = 'number', placeholder = '', required = false, unit = null, unitToggle = null }) {
            const toggleData = unitToggle ? `data-unit-toggle='${JSON.stringify(unitToggle)}'` : '';
            return `
            <div class="ui-input-group">
                <label for="${id}">${label}</label>
                <div class="ui-input-wrapper" ${toggleData}>
                    <input class="ui-input" id="${id}" type="${type}" placeholder="${placeholder}">
                </div>
            </div>
        `;
        }

        createRadioGroup({ name, label, options = [] }) {
            const optionsHTML = options.map(opt => `
            <div class="ui-radio-option">
                <input type="radio" id="${name}-${opt.value}" name="${name}" value="${opt.value}" ${opt.checked ? 'checked' : ''}>
                <label for="${name}-${opt.value}">${opt.label}</label>
            </div>
        `).join('');
            return `<div class="ui-input-group"><label>${label}</label><div class="ui-radio-group">${optionsHTML}</div></div>`;
        }

        createCheckboxGroup({ name, label, options = [] }) {
            const optionsHTML = options.map((opt, i) => `
            <div class="ui-checkbox-option">
                <input type="checkbox" id="${name}-${i}" name="${name}" value="${opt.value}" ${opt.checked ? 'checked' : ''}>
                <label for="${name}-${i}">${opt.label}</label>
            </div>
        `).join('');
            return `<div class="ui-input-group"><label>${label}</label><div class="ui-checkbox-group">${optionsHTML}</div></div>`;
        }

        createResultBox({ id, title = 'Results' }) {
            return `<div id="${id}" class="ui-result-box"><div class="ui-result-header">${title}</div><div class="ui-result-content"></div></div>`;
        }

        createResultItem({ label, value, unit = '', interpretation = '' }) {
            return `
            <div class="ui-result-score">
                ${label ? `<div>${label}</div>` : ''}
                <div class="ui-result-value">${value} <span style="font-size:0.5em">${unit}</span></div>
                ${interpretation ? `<div>${interpretation}</div>` : ''}
            </div>
        `;
        }

        initializeComponents(container) {
            // Find all inputs with unit toggle data
            const inputs = container.querySelectorAll('[data-unit-toggle]');
            inputs.forEach(wrapper => {
                const input = wrapper.querySelector('input');
                const data = JSON.parse(wrapper.dataset.unitToggle);
                if (input && data) {
                    UnitConverter.enhanceInput(input, data.type, data.units, data.default);
                }
            });
        }
    }

    const uiBuilder = new UIBuilder();


    // ==========================================
    // 3. Generic Calculator
    // ==========================================
    class GenericCalculator {
        constructor(definition) {
            this.def = definition;
            this.id = definition.meta.id;
            this.title = definition.meta.title;
            this.description = definition.meta.description;
        }

        generateHTML() {
            const formConfig = {
                fields: this.def.inputs.map(input => input)
            };

            const formHTML = uiBuilder.createForm(formConfig);
            const resultHTML = uiBuilder.createResultBox({
                id: `${this.id}-result`,
                title: 'Result'
            });

            return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${formHTML}
            ${resultHTML}
        `;
        }

        initialize(client, patient, container) {
            uiBuilder.initializeComponents(container);

            const resultBox = container.querySelector(`#${this.id}-result`);
            const resultContent = resultBox.querySelector('.ui-result-content');

            const getValue = (inputId, unitType) => {
                const el = container.querySelector(`#${inputId}`);
                if (!el) return 0;

                if (unitType) {
                    return UnitConverter.getStandardValue(el, unitType);
                }

                if (el.type === 'checkbox') return el.checked;
                if (el.type === 'radio') {
                    const checked = container.querySelector(`input[name="${inputId}"]:checked`);
                    return checked ? checked.value : null;
                }

                return parseFloat(el.value) || 0;
            };

            const calculate = () => {
                const variables = {};

                for (const [varName, inputId] of Object.entries(this.def.variables || {})) {
                    const inputDef = this.def.inputs.find(i => i.id === inputId || i.name === inputId);
                    const unitType = inputDef?.unitToggle?.default;

                    let targetUnit = null;
                    if (inputDef?.unitToggle?.type === 'weight') targetUnit = 'kg';
                    if (inputDef?.unitToggle?.type === 'height') targetUnit = 'cm';
                    if (inputDef?.unitToggle?.type === 'temperature') targetUnit = 'C';

                    variables[varName] = getValue(inputId, targetUnit);
                }

                for (const calc of this.def.calculations || []) {
                    if (calc.type === 'formula') {
                        try {
                            const varNames = Object.keys(variables);
                            const varValues = Object.values(variables);
                            const func = new Function(...varNames, `return ${calc.expression};`);
                            variables[calc.var] = func(...varValues);
                        } catch (e) {
                            console.error(`Calculation error in ${calc.var}:`, e);
                            variables[calc.var] = null;
                        }
                    }
                }

                const resultsHTML = (this.def.outputs || []).map(output => {
                    if (output.type === 'result_item') {
                        const val = variables[output.value_var];
                        if (val === null || val === undefined || isNaN(val)) return '';

                        return uiBuilder.createResultItem({
                            label: output.label,
                            value: typeof val === 'number' ? val.toFixed(output.decimals || 1) : val,
                            unit: output.unit,
                            interpretation: output.interpretation_var ? variables[output.interpretation_var] : undefined
                        });
                    }
                    return '';
                }).join('');

                if (resultsHTML) {
                    resultContent.innerHTML = resultsHTML;
                    resultBox.classList.add('show');
                } else {
                    resultBox.classList.remove('show');
                }
            };

            container.addEventListener('input', calculate);
            container.addEventListener('change', calculate);
        }
    }


    // ==========================================
    // 4. Builder Logic
    // ==========================================
    let definition = {
        meta: { id: 'my-calc', title: 'My Calculator', description: 'A custom calculator.' },
        inputs: [],
        variables: {},
        calculations: [],
        outputs: []
    };

    let currentEditType = null;
    let currentEditIndex = -1;

    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const previewContainer = document.getElementById('preview-container');

    const metaId = document.getElementById('meta-id');
    const metaTitle = document.getElementById('meta-title');
    const metaDesc = document.getElementById('meta-desc');

    function init() {
        setupTabs();
        setupMetaListeners();
        setupInputEditors();
        setupCalcEditors();
        setupOutputEditors();

        document.getElementById('btn-preview').addEventListener('click', updatePreview);
        document.getElementById('btn-export').addEventListener('click', exportJSON);

        updatePreview();
    }

    function setupTabs() {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.style.display = 'none');

                tab.classList.add('active');
                document.getElementById(`tab-${tab.dataset.tab}`).style.display = 'block';
            });
        });
    }

    function setupMetaListeners() {
        const updateMeta = () => {
            definition.meta.id = metaId.value;
            definition.meta.title = metaTitle.value;
            definition.meta.description = metaDesc.value;
            updatePreview();
        };
        metaId.addEventListener('input', updateMeta);
        metaTitle.addEventListener('input', updateMeta);
        metaDesc.addEventListener('input', updateMeta);
    }

    function renderInputsList() {
        const list = document.getElementById('inputs-list');
        list.innerHTML = '';
        definition.inputs.forEach((input, index) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.textContent = `${input.label} (${input.id})`;
            div.onclick = () => editInput(index);
            list.appendChild(div);
        });
    }

    function editInput(index) {
        currentEditType = 'input';
        currentEditIndex = index;
        const input = definition.inputs[index];

        document.getElementById('input-id').value = input.id;
        document.getElementById('input-label').value = input.label;
        document.getElementById('input-type').value = input.type;
        document.getElementById('input-unit-type').value = input.unitToggle?.type || '';

        document.getElementById('input-editor').style.display = 'block';
    }

    function setupInputEditors() {
        document.getElementById('btn-add-input').addEventListener('click', () => {
            definition.inputs.push({
                type: 'input',
                id: `input_${definition.inputs.length + 1}`,
                label: 'New Input',
                type: 'number'
            });
            renderInputsList();
            editInput(definition.inputs.length - 1);
        });

        document.getElementById('btn-save-input').addEventListener('click', () => {
            if (currentEditIndex === -1) return;

            const id = document.getElementById('input-id').value;
            const label = document.getElementById('input-label').value;
            const type = document.getElementById('input-type').value;
            const unitType = document.getElementById('input-unit-type').value;

            const input = {
                type: 'input',
                id,
                label,
                type: type === 'number' ? 'number' : 'text'
            };

            if (unitType) {
                let units = [];
                if (unitType === 'weight') units = ['kg', 'lbs'];
                if (unitType === 'height') units = ['cm', 'in'];
                if (unitType === 'temperature') units = ['C', 'F'];

                input.unitToggle = {
                    type: unitType,
                    units: units,
                    default: units[0]
                };
            }

            definition.inputs[currentEditIndex] = input;
            definition.variables[id] = id;

            renderInputsList();
            updatePreview();
        });

        document.getElementById('btn-delete-input').addEventListener('click', () => {
            if (currentEditIndex === -1) return;
            definition.inputs.splice(currentEditIndex, 1);
            document.getElementById('input-editor').style.display = 'none';
            currentEditIndex = -1;
            renderInputsList();
            updatePreview();
        });
    }

    function renderCalcsList() {
        const list = document.getElementById('calcs-list');
        list.innerHTML = '';
        definition.calculations.forEach((calc, index) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.textContent = `${calc.var} = ${calc.expression}`;
            div.onclick = () => editCalc(index);
            list.appendChild(div);
        });
    }

    function editCalc(index) {
        currentEditType = 'calc';
        currentEditIndex = index;
        const calc = definition.calculations[index];

        document.getElementById('calc-var').value = calc.var;
        document.getElementById('calc-expr').value = calc.expression;

        document.getElementById('calc-editor').style.display = 'block';
    }

    function setupCalcEditors() {
        document.getElementById('btn-add-calc').addEventListener('click', () => {
            definition.calculations.push({
                type: 'formula',
                var: 'result',
                expression: '0'
            });
            renderCalcsList();
            editCalc(definition.calculations.length - 1);
        });

        document.getElementById('btn-save-calc').addEventListener('click', () => {
            if (currentEditIndex === -1) return;

            definition.calculations[currentEditIndex] = {
                type: 'formula',
                var: document.getElementById('calc-var').value,
                expression: document.getElementById('calc-expr').value
            };

            renderCalcsList();
            updatePreview();
        });

        document.getElementById('btn-delete-calc').addEventListener('click', () => {
            if (currentEditIndex === -1) return;
            definition.calculations.splice(currentEditIndex, 1);
            document.getElementById('calc-editor').style.display = 'none';
            currentEditIndex = -1;
            renderCalcsList();
            updatePreview();
        });
    }

    function renderOutputsList() {
        const list = document.getElementById('outputs-list');
        list.innerHTML = '';
        definition.outputs.forEach((out, index) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.textContent = `${out.label} (${out.value_var})`;
            div.onclick = () => editOutput(index);
            list.appendChild(div);
        });
    }

    function editOutput(index) {
        currentEditType = 'output';
        currentEditIndex = index;
        const out = definition.outputs[index];

        document.getElementById('output-label').value = out.label;
        document.getElementById('output-var').value = out.value_var;
        document.getElementById('output-unit').value = out.unit || '';

        document.getElementById('output-editor').style.display = 'block';
    }

    function setupOutputEditors() {
        document.getElementById('btn-add-output').addEventListener('click', () => {
            definition.outputs.push({
                type: 'result_item',
                label: 'Result',
                value_var: 'result',
                unit: ''
            });
            renderOutputsList();
            editOutput(definition.outputs.length - 1);
        });

        document.getElementById('btn-save-output').addEventListener('click', () => {
            if (currentEditIndex === -1) return;

            definition.outputs[currentEditIndex] = {
                type: 'result_item',
                label: document.getElementById('output-label').value,
                value_var: document.getElementById('output-var').value,
                unit: document.getElementById('output-unit').value
            };

            renderOutputsList();
            updatePreview();
        });

        document.getElementById('btn-delete-output').addEventListener('click', () => {
            if (currentEditIndex === -1) return;
            definition.outputs.splice(currentEditIndex, 1);
            document.getElementById('output-editor').style.display = 'none';
            currentEditIndex = -1;
            renderOutputsList();
            updatePreview();
        });
    }

    function updatePreview() {
        try {
            definition.inputs.forEach(input => {
                if (!definition.variables[input.id]) {
                    definition.variables[input.id] = input.id;
                }
            });

            const calc = new GenericCalculator(definition);
            previewContainer.innerHTML = calc.generateHTML();
            calc.initialize(null, null, previewContainer);
        } catch (e) {
            console.error('Preview error:', e);
            previewContainer.innerHTML = `<div style="color:red">Error generating preview: ${e.message}</div>`;
        }
    }

    function exportJSON() {
        const json = JSON.stringify(definition, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${definition.meta.id}.json`;
        a.click();
    }

    // Start
    init();

})();
