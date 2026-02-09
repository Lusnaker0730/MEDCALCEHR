import Fuse, { IFuseOptions } from 'fuse.js';
import { CalculatorMetadata } from './calculators/index.js';

const FUSE_OPTIONS: IFuseOptions<CalculatorMetadata> = {
    keys: [
        { name: 'title', weight: 0.6 },
        { name: 'description', weight: 0.25 },
        { name: 'category', weight: 0.15 }
    ],
    threshold: 0.4,
    distance: 100,
    includeScore: true,
    minMatchCharLength: 2,
    shouldSort: true
};

export class FuzzySearch {
    private fuse: Fuse<CalculatorMetadata>;

    constructor(items: CalculatorMetadata[]) {
        this.fuse = new Fuse(items, FUSE_OPTIONS);
    }

    search(query: string): CalculatorMetadata[] {
        if (!query || query.trim().length < 2) return [];
        return this.fuse.search(query.trim()).map(r => r.item);
    }

    updateCollection(items: CalculatorMetadata[]): void {
        this.fuse.setCollection(items);
    }
}
