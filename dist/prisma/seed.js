"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../config/prisma");
const env_1 = require("../config/env");
const auth_1 = require("../utils/auth");
async function main() {
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: env_1.env.ADMIN_EMAIL } });
    if (!existing) {
        const password = await (0, auth_1.hashPassword)(env_1.env.ADMIN_PASSWORD);
        await prisma_1.prisma.user.create({
            data: {
                email: env_1.env.ADMIN_EMAIL,
                password,
                verified: true,
            },
        });
    }
    const campaignImages = [
        new URL("/images/site/join-community.jpg", env_1.env.BASE_URL).toString(),
        new URL("/images/site/programs-skills-building.jpeg", env_1.env.BASE_URL).toString(),
        new URL("/images/site/aboutus-cohort%202024.jpeg", env_1.env.BASE_URL).toString(),
        new URL("/images/wfw/Home%20page/A7401584.jpg", env_1.env.BASE_URL).toString(),
    ];
    const campaignGalleryItems = campaignImages.map((url, index) => ({
        url,
        caption: [
            "Women creating possibilities together.",
            "Practical skills open doors to independent livelihoods.",
            "Learning, saving, and growing in community.",
            "A new skill can help build a future for the whole family.",
        ][index],
    }));
    const campaignParagraphs = [
        "On December 1, your generosity can open new doors for women in Rwanda.",
        "At Women for Women Rwanda, we believe that when a woman gains the skills and confidence to earn her own income, the possibilities go far beyond her.",
        "Through our Stronger Women, Stronger Nation program, women gain practical vocational skills, learn to manage money, save, and explore opportunities to build their own livelihoods.",
        "This Giving Tuesday, December 1, 2026, we invite you to join that journey. Your support can make a difference that reaches far beyond one woman.",
        "Your donation through GlobalGiving will help us continue creating opportunities for women to learn, grow, and build brighter futures for themselves, their families, and their communities.",
        "The GlobalGiving project describes a 12-month training program in Kayonza, Bugesera, Gasabo, and Rwamagana. Women choose locally relevant trades such as tailoring, agribusiness, leatherwork, and knitting, alongside financial literacy and savings groups.",
        "The project also shares Claire's story: she turned basic sewing skills into a business serving customers in Kigali and now teaches the trade to her daughter.",
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
    await prisma_1.prisma.donationCampaign.upsert({
        where: { id: "giving-tuesday-2026" },
        update: {
            eyebrow: "Giving Tuesday",
            title: "The Next Pair of Hands: Help Another Woman Build a Future of Her Own",
            paragraphs: campaignParagraphs,
            closingLine: "Every gift counts. Every woman deserves the opportunity to thrive.",
            imageUrl: campaignImages[0],
            imageUrls: campaignImages,
            galleryItems: campaignGalleryItems,
            impactFacts,
            donationUrl,
            ctaLabel: "Donate now",
        },
        create: {
            id: "giving-tuesday-2026",
            eyebrow: "Giving Tuesday",
            title: "The Next Pair of Hands: Help Another Woman Build a Future of Her Own",
            paragraphs: campaignParagraphs,
            closingLine: "Every gift counts. Every woman deserves the opportunity to thrive.",
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
    await prisma_1.prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map