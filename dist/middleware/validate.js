"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const errors_1 = require("../utils/errors");
function validate(schema) {
    return (req, _res, next) => {
        const parsed = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });
        if (!parsed.success) {
            throw new errors_1.ValidationError("Invalid request", parsed.error.flatten());
        }
        next();
    };
}
//# sourceMappingURL=validate.js.map