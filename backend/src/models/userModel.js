import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    customerCode: { type: String, trim: true, default: "" },
    fullname: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true, default: "" },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["customer", "admin", "technician"],
      default: "customer",
    },
    address: { type: String, trim: true, default: "" },
    tier: { type: String, default: "Standard" },
    loyaltyPoints: { type: Number, default: 100 },
    staffCode: { type: String, trim: true, default: "" },
    branch: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
    refresh_token: { type: String, select: false, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(String(candidate), this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refresh_token;
  return obj;
};

export const User = mongoose.models.User || mongoose.model("User", userSchema);
