import { GenericEHRAdapter } from './generic-adapter.js';
import { EpicEHRAdapter } from './epic-adapter.js';
import { CernerEHRAdapter } from './cerner-adapter.js';
import { MeditechEHRAdapter } from './meditech-adapter.js';
import { logger } from '../logger.js';
const adapterRegistry = {
    generic: GenericEHRAdapter,
    epic: EpicEHRAdapter,
    cerner: CernerEHRAdapter,
    meditech: MeditechEHRAdapter
};
let activeAdapter = null;
export function createAdapter(vendor) {
    const AdapterClass = adapterRegistry[vendor];
    if (!AdapterClass) {
        logger.warn(`Unknown EHR vendor: ${vendor}, falling back to generic`);
        return new GenericEHRAdapter();
    }
    return new AdapterClass();
}
export function getActiveAdapter() {
    if (!activeAdapter) {
        activeAdapter = new GenericEHRAdapter();
    }
    return activeAdapter;
}
export function initializeAdapter(config) {
    const vendor = config?.vendor
        || window.MEDCALC_CONFIG?.ehr?.vendor
        || 'generic';
    activeAdapter = createAdapter(vendor);
    logger.info('EHR adapter initialized', { vendor: activeAdapter.vendor });
    return activeAdapter;
}
export function registerAdapter(vendor, adapterClass) {
    adapterRegistry[vendor] = adapterClass;
}
