"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../config/prisma");
const env_1 = require("../config/env");
const auth_1 = require("../utils/auth");
async function main() {
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: env_1.env.ADMIN_EMAIL } });
    if (existing)
        return;
    const password = await (0, auth_1.hashPassword)(env_1.env.ADMIN_PASSWORD);
    await prisma_1.prisma.user.create({
        data: {
            email: env_1.env.ADMIN_EMAIL,
            password,
            verified: true,
        },
    });
}
main()
    .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map