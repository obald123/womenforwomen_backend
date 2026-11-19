import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { hashPassword } from "../utils/auth";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: env.ADMIN_EMAIL } });
  if (!existing) {
    const password = await hashPassword(env.ADMIN_PASSWORD);
    await prisma.user.create({
      data: {
        email: env.ADMIN_EMAIL,
        password,
        verified: true,
      },
    });
  }

  const campaignImages = [
    new URL("/images/site/Teamwork.jpeg", env.BASE_URL).toString(),
    new URL("/images/site/programs-skills-building.jpeg", env.BASE_URL).toString(),
    new URL("/images/site/aboutus-cohort%202024.jpeg", env.BASE_URL).toString(),
    new URL("/images/site/gallery-home.jpeg", env.BASE_URL).toString(),
  ];
  const campaignGalleryItems = campaignImages.map((url, index) => ({
    url,
    caption: [
      "A participant works through a practical task with a trainer.",
      "Women practice garment-making at a skills workshop.",
      "Women display honey made by their group.",
      "Women celebrate together at a program gathering.",
    ][index],
  }));
  const campaignParagraphs = [
    "This Giving Tuesday, help women in Rwanda learn skills they can use to earn an income.",
    "Through Stronger Women, Stronger Nation, women train in trades that meet local demand, including tailoring, agribusiness, leatherwork, and knitting.",
    "The 12-month program also covers budgeting and financial literacy. Women can join savings groups to put those lessons into practice and plan for a business.",
    "The GlobalGiving page tells Claire's story: she used sewing skills to build a business serving customers in Kigali, and now teaches the trade to her daughter.",
    "Your donation will help women in Kayonza, Bugesera, Gasabo, and Rwamagana take part in this training and savings groups.",
  ];
  const impactFacts = [
    {
      value: "43%",
      label: "Higher net earnings",
      detail: "Increase reported by women in the last completed cohort.",
    },
    {
      value: "96%",
      label: "Joined a group",
      detail: "Participants joined a business or social group.",
    },
    {
      value: "RWF 38M+",
      label: "Saved together",
      detail: "Collective savings built by members of the groups.",
    },
  ];
  const donationUrl = "https://www.globalgiving.org/projects/help-rwandan-women-learn-earn-and-thrive/";

  await prisma.donationCampaign.upsert({
    where: { id: "giving-tuesday-2026" },
    update: {
      eyebrow: "Giving Tuesday | December 1, 2026",
      title: "Help another woman learn a trade and earn her own income",
      paragraphs: campaignParagraphs,
      closingLine: "Thank you for helping make the next training place possible.",
      imageUrl: campaignImages[0],
      imageUrls: campaignImages,
      galleryItems: campaignGalleryItems,
      impactFacts,
      donationUrl,
      ctaLabel: "Donate now",
    },
    create: {
      id: "giving-tuesday-2026",
      eyebrow: "Giving Tuesday | December 1, 2026",
      title: "Help another woman learn a trade and earn her own income",
      paragraphs: campaignParagraphs,
      closingLine: "Thank you for helping make the next training place possible.",
      imageUrl: campaignImages[0],
      imageUrls: campaignImages,
      galleryItems: campaignGalleryItems,
      impactFacts,
      donationUrl,
      ctaLabel: "Donate now",
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