"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
function parsePagination(page, pageSize) {
    const p = Math.max(1, Number(page || 1));
    const ps = Math.min(50, Math.max(10, Number(pageSize || 10)));
    const skip = (p - 1) * ps;
    return { page: p, pageSize: ps, skip, take: ps };
}
//# sourceMappingURL=pagination.js.map