import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.bot.createMany({
    data: [
      {
        name: "SupportBot",
        type: "Support",
        description: "Answers customer questions and provides help 24/7.",
      },
      {
        name: "TrainerBot",
        type: "Training",
        description: "Trains new employees by giving them examples and testing how well they respond.",
      },
      {
        name: "TaskBot",
        type: "Automation",
        description: "Performs repetitive tasks, like data entry and email analysis.",
      },
    ],
  });
}

main().then(() => {
  console.log("Seeded bots");
  process.exit(0);
});
