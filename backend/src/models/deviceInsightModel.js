import mongoose from "mongoose";

const deviceInsightSchema = new mongoose.Schema(
  {
    queryKey: { type: String, required: true, unique: true, index: true },
    deviceName: { type: String, required: true, trim: true },
    category: { type: String, default: "" },
    provider: { type: String, default: "Live Feed Analyzer" },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    warrantyTrend: {
      type: String,
      enum: ["rising", "stable", "low"],
      default: "stable",
    },
    trendHeadline: { type: String, default: "" },
    trendSummary: { type: String, default: "" },
    internalStats: {
      totalTickets: { type: Number, default: 0 },
      recent30d: { type: Number, default: 0 },
      previous30d: { type: Number, default: 0 },
      changePercent: { type: Number, default: 0 },
    },
    topCommonIssues: [
      {
        title: { type: String, default: "" },
        sharePercent: { type: Number, default: 0 },
        severity: { type: String, default: "medium" },
        symptoms: { type: String, default: "" },
      },
    ],
    preExpiryChecklist: [{ type: String }],
    sources: [
      {
        title: { type: String, default: "" },
        source: { type: String, default: "" },
        channel: { type: String, default: "news" },
        lang: { type: String, default: "en" },
        publishedAt: { type: String, default: "" },
        url: { type: String, default: "" },
        imageUrl: { type: String, default: "" },
        snippet: { type: String, default: "" },
      },
    ],
    timeframeMonths: { type: Number, default: 12 },
    brandDetected: { type: String, default: "" },
    articleCount: { type: Number, default: 0 },
    fetchedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "device_insights",
  }
);

export const DeviceInsight =
  mongoose.models.DeviceInsight || mongoose.model("DeviceInsight", deviceInsightSchema);
