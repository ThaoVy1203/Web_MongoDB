import { CONNECT_DB, CLOSE_DB } from "../config/mongodb.js";
import { seedInitialDatabase } from "../services/seedService.js";

const run = async () => {
  try {
    await CONNECT_DB();
    await seedInitialDatabase({ force: process.argv.includes("--force") });
    console.log("🌱 Seeded WarrantyOps database successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await CLOSE_DB();
  }
};

run();
