#!/usr/bin/env node
/**
 * Create Admin User Script for Camtask CRM
 * Usage: node scripts/create-admin.mjs
 *
 * Creates an admin user in the "camtask" database
 * Requires MONGODB_URI in .env.local
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Manually load .env.local
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
} catch (err) {
  console.error("⚠️  Could not load .env.local:", err.message);
}

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  ERROR: MONGODB_URI not set in .env.local");
  console.error("    Please add MONGODB_URI to your .env.local file");
  process.exit(1);
}

// User Schema - matches models/User.js exactly
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "sales_member"],
      default: "sales_member",
    },
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function createAdmin() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    console.log("   Database:", MONGODB_URI.split("?")[0].split("/").pop());

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected successfully\n");

    // Check if admin already exists
    const existing = await User.findOne({ email: "admin@camtask.com" });
    if (existing) {
      console.log("ℹ️  Admin user already exists!");
      console.log("   Email:", existing.email);
      console.log("   Name:", existing.name);
      console.log("   Role:", existing.role);
      console.log("\n✨ You can now login with:");
      console.log("   Email: admin@camtask.com");
      console.log("   Password: Admin@123");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Hash password using bcrypt with cost factor 12 (same as User model pre-save hook)
    console.log("🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash("Admin@123", 12);

    // Create admin user
    console.log("👤 Creating admin user...");
    const admin = await User.create({
      name: "Admin",
      email: "admin@camtask.com",
      password: hashedPassword,
      role: "admin",
      isActive: true,
      roles: [], // Empty array for dynamic RBAC roles
      company_id: null,
    });

    console.log("✅ Admin user created successfully!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email   : admin@camtask.com");
    console.log("🔑 Password: Admin@123");
    console.log("👑 Role    : admin");
    console.log("🆔 User ID : " + admin._id);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("⚠️  IMPORTANT: Change the password after first login!");
    console.log("   Go to Settings → Change Password\n");

    await mongoose.disconnect();
    console.log("✅ Done! You can now login at http://localhost:3000/login");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error creating admin user:");
    console.error("   ", error.message);

    if (error.code === 11000) {
      console.error(
        "\n   This usually means the email already exists in the database.",
      );
      console.error("   Try logging in with: admin@camtask.com / Admin@123");
    }

    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

createAdmin();
