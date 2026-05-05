#!/usr/bin/env node
/**
 * Verify Admin User Script
 * Usage: node scripts/verify-admin.mjs
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
try {
  const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  env.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx < 0) return;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  });
} catch {}

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI not set");
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    role: String,
    isActive: Boolean,
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function verify() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to database\n");

  const admin = await User.findOne({ email: "admin@camtask.com" });

  if (!admin) {
    console.log("❌ Admin user NOT found in database");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log("✅ Admin user found in database!\n");
  console.log("User Details:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("ID       :", admin._id.toString());
  console.log("Name     :", admin.name);
  console.log("Email    :", admin.email);
  console.log("Role     :", admin.role);
  console.log("Active   :", admin.isActive);
  console.log("Created  :", admin.createdAt);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Count total users
  const totalUsers = await User.countDocuments();
  console.log(`📊 Total users in database: ${totalUsers}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

verify().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
