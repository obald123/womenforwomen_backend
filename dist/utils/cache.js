"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
class SimpleCache {
    constructor() {
        this.store = new Map();
    }
    set(key, value, ttlMs) {
        const expiresAt = Date.now() + ttlMs;
        this.store.set(key, { value, expiresAt });
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return undefined;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }
        return entry.value;
    }
    del(key) {
        this.store.delete(key);
    }
    clear() {
        this.store.clear();
    }
}
exports.cache = new SimpleCache();
//# sourceMappingURL=cache.js.map