import { BaseEHRAdapter } from './base-adapter.js';
export class GenericEHRAdapter extends BaseEHRAdapter {
    constructor() {
        super(...arguments);
        this.vendor = 'generic';
    }
}
