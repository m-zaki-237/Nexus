import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["entrepreneur", "investor"],
      required: true,
    },

    avatarUrl: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    // Entrepreneur Fields
    startupName: {
      type: String,
      default: "",
    },

    pitchSummary: {
      type: String,
      default: "",
    },

    fundingNeeded: {
      type: String,
      default: "",
    },

    industry: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    foundedYear: {
      type: Number,
    },

    teamSize: {
      type: Number,
    },

    // Investor Fields
    investmentInterests: {
      type: [String],
      default: [],
    },

    investmentStage: {
      type: [String],
      default: [],
    },

    portfolioCompanies: {
      type: [String],
      default: [],
    },

    totalInvestments: {
      type: Number,
      default: 0,
    },

    minimumInvestment: {
      type: String,
      default: "",
    },

    maximumInvestment: {
      type: String,
      default: "",
    },

    // Stripe Subscription Fields
    stripeCustomerId: {
      type: String,
      default: null,
    },

    stripeSubscriptionId: {
      type: String,
      default: null,
    },

    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },

    status: {
      type: String,
      default: "inactive",
    },

    currentPeriodEnd: {
      type: Date,
      default: null,
    },

    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;