import { BaseEHRAdapter } from './base-adapter.js';
import { EHRVendor } from './types.js';

export class GenericEHRAdapter extends BaseEHRAdapter {
    readonly vendor: EHRVendor = 'generic';
}
