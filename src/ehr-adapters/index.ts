import { EHRAdapter, EHRAdapterConfig, EHRVendor } from './types.js';
import { GenericEHRAdapter } from './generic-adapter.js';
import { EpicEHRAdapter } from './epic-adapter.js';
import { CernerEHRAdapter } from './cerner-adapter.js';
import { MeditechEHRAdapter } from './meditech-adapter.js';
import { logger } from '../logger.js';

const adapterRegistry: Record<EHRVendor, new () => EHRAdapter> = {
    generic: GenericEHRAdapter,
    epic: EpicEHRAdapter,
    cerner: CernerEHRAdapter,
    meditech: MeditechEHRAdapter
};

let activeAdapter: EHRAdapter | null = null;

export function createAdapter(vendor: EHRVendor): EHRAdapter {
    const AdapterClass = adapterRegistry[vendor];
    if (!AdapterClass) {
        logger.warn(`Unknown EHR vendor: ${vendor}, falling back to generic`);
        return new GenericEHRAdapter();
    }
    return new AdapterClass();
}

export function getActiveAdapter(): EHRAdapter {
    if (!activeAdapter) {
        activeAdapter = new GenericEHRAdapter();
    }
    return activeAdapter;
}

export function initializeAdapter(config?: EHRAdapterConfig): EHRAdapter {
    const vendor: EHRVendor = config?.vendor
        || (window.MEDCALC_CONFIG?.ehr?.vendor as EHRVendor)
        || 'generic';

    activeAdapter = createAdapter(vendor);
    logger.info('EHR adapter initialized', { vendor: activeAdapter.vendor });
    return activeAdapter;
}

export function registerAdapter(vendor: EHRVendor, adapterClass: new () => EHRAdapter): void {
    adapterRegistry[vendor] = adapterClass;
}

export type { EHRAdapter, EHRAdapterConfig, EHRVendor } from './types.js';
export type { EHRFeature } from './types.js';
