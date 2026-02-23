import { calculateTpaDosing } from '../../calculators/tpa-dosing/index.js';
describe('tPA Dosing for PE and MI', () => {
    test('PE logic: Standard dose > 65kg', () => {
        const result = calculateTpaDosing({ 'tpa-weight': 70, 'tpa-indication': 'pe' });
        expect(result).not.toBeNull();
        expect(result[1].value).toBe('100.0 mg');
    });
    test('STEMI logic: Standard dose > 67kg', () => {
        const result = calculateTpaDosing({ 'tpa-weight': 80, 'tpa-indication': 'stemi' });
        expect(result).not.toBeNull();
        expect(result[1].value).toBe('100.0');
    });
});
