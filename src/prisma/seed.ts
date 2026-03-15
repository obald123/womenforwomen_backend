import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { hashPassword } from "../utils/auth";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: env.ADMIN_EMAIL } });
  if (existing) return;

  const password = await hashPassword(env.ADMIN_PASSWORD);
  await prisma.user.create({
    data: {
      email: env.ADMIN_EMAIL,
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
    await prisma.$disconnect();
  });