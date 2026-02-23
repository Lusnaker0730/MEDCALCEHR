import Fuse from 'fuse.js';
const FUSE_OPTIONS = {
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
    constructor(items) {
        this.fuse = new Fuse(items, FUSE_OPTIONS);
    }
    search(query) {
        if (!query || query.trim().length < 2)
            return [];
        return this.fuse.search(query.trim()).map(r => r.item);
    }
    updateCollection(items) {
        this.fuse.setCollection(items);
    }
}
