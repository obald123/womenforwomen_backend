"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailer = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("./env");
exports.mailer = nodemailer_1.default.createTransport({
    host: env_1.env.MAIL_HOST,
    port: env_1.env.MAIL_PORT,
    secure: env_1.env.MAIL_PORT === 465,
    auth: {
        user: env_1.env.MAIL_USER,
        pass: env_1.env.MAIL_PASS,
    },
});
//# sourceMappingURL=mail.js.map