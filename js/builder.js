import { GenericCalculator } from './generic-calculator.js';

// Initial state
let definition = {
    meta: { id: 'my-calc', title: 'My Calculator', description: 'A custom calculator.' },
    inputs: [],
    variables: {},
    calculations: [],
    outputs: []
};

let currentEditType = null; // 'input', 'calc', 'output'
let currentEditIndex = -1;

// DOM Elements
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const previewContainer = document.getElementById('preview-container');

// Meta inputs
const metaId = document.getElementById('meta-id');
const metaTitle = document.getElementById('meta-title');
const metaDesc = document.getElementById('meta-desc');

// Initialize
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

// --- Inputs ---

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
            type: 'input', // uiBuilder type
            id,
            label,
            type: type === 'number' ? 'number' : 'text' // simplify for now
        };

        if (type === 'radio' || type === 'checkbox') {
            input.type = type;
            // TODO: Add options editor
        }

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

        // Auto-update variables mapping
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

// --- Calculations ---

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

// --- Outputs ---

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

// --- Core ---

function updatePreview() {
    try {
        // Ensure variables map is up to date
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

init();
