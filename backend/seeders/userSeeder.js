import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const password = await bcrypt.hash("12345678", 10);

const users = [
  // ================= Entrepreneurs =================
  {
    name: "Ali Khan",
    email: "ali@nexus.com",
    password,
    role: "entrepreneur",
    avatarUrl: "",
    bio: "Founder building AI products for healthcare",
    startupName: "MedAI",
    pitchSummary: "AI powered diagnostics for hospitals",
    fundingNeeded: "$500K",
    industry: "Healthcare",
    location: "Lahore",
    foundedYear: 2023,
    teamSize: 8,
  },
  {
    name: "Sara Ahmed",
    email: "sara@nexus.com",
    password,
    role: "entrepreneur",
    avatarUrl: "",
    bio: "Building the future of online education",
    startupName: "EduSpark",
    pitchSummary: "Interactive learning platform",
    fundingNeeded: "$1M",
    industry: "Education",
    location: "Islamabad",
    foundedYear: 2022,
    teamSize: 14,
  },
  {
    name: "Hamza Tariq",
    email: "hamza@nexus.com",
    password,
    role: "entrepreneur",
    avatarUrl: "",
    bio: "Making logistics smarter",
    startupName: "SwiftMove",
    pitchSummary: "Smart logistics management",
    fundingNeeded: "$2M",
    industry: "Logistics",
    location: "Karachi",
    foundedYear: 2021,
    teamSize: 20,
  },

  // ================= Investors =================
  {
    name: "Ahmed Raza",
    email: "ahmed@nexus.com",
    password,
    role: "investor",
    avatarUrl: "",
    bio: "Angel investor focused on startups",
    investmentInterests: [
      "AI",
      "Healthcare",
      "FinTech",
    ],
    investmentStage: [
      "Seed",
      "Series A",
    ],
    portfolioCompanies: [
      "TechFlow",
      "QuickPay",
    ],
    totalInvestments: 25,
    minimumInvestment: "$25K",
    maximumInvestment: "$500K",
  },
  {
    name: "Fatima Noor",
    email: "fatima@nexus.com",
    password,
    role: "investor",
    avatarUrl: "",
    bio: "Backing women-led startups",
    investmentInterests: [
      "EdTech",
      "HealthTech",
    ],
    investmentStage: [
      "Pre-Seed",
      "Seed",
    ],
    portfolioCompanies: [
      "LearnHub",
      "CareSync",
    ],
    totalInvestments: 18,
    minimumInvestment: "$10K",
    maximumInvestment: "$300K",
  },
  {
    name: "Usman Malik",
    email: "usman@nexus.com",
    password,
    role: "investor",
    avatarUrl: "",
    bio: "VC interested in scalable SaaS",
    investmentInterests: [
      "SaaS",
      "Cloud",
      "Cybersecurity",
    ],
    investmentStage: [
      "Series A",
      "Series B",
    ],
    portfolioCompanies: [
      "CloudX",
      "SecureNet",
    ],
    totalInvestments: 42,
    minimumInvestment: "$100K",
    maximumInvestment: "$2M",
  },
];

try {
  await User.deleteMany();

  await User.insertMany(users);

  console.log("Users seeded successfully");

  process.exit();
} catch (error) {
  console.error(error);
  process.exit(1);
}