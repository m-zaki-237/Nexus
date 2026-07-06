import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ message: "User registered successfully", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "User logged in successfully", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logoutUser = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "User logged out successfully" });
};

export const getUserProfile = async (req, res) => {
  try {
    const { _id, password, __v, ...user } = req.user.toObject();

    res.status(200).json({
      user: {
        id: _id,
        ...user,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      bio,
      avatarUrl,
      startupName,
      pitchSummary,
      fundingNeeded,
      industry,
      location,
      foundedYear,
      teamSize,
      investmentInterests,
      investmentStage,
      portfolioCompanies,
      minimumInvestment,
      maximumInvestment,
    } = req.body;

    if (name !== undefined) req.user.name = name;
    if (bio !== undefined) req.user.bio = bio;
    if (avatarUrl !== undefined) req.user.avatarUrl = avatarUrl;

    if (req.user.role === "entrepreneur") {
      if (startupName !== undefined) req.user.startupName = startupName;
      if (pitchSummary !== undefined) req.user.pitchSummary = pitchSummary;
      if (fundingNeeded !== undefined) req.user.fundingNeeded = fundingNeeded;
      if (industry !== undefined) req.user.industry = industry;
      if (location !== undefined) req.user.location = location;
      if (foundedYear !== undefined) req.user.foundedYear = foundedYear;
      if (teamSize !== undefined) req.user.teamSize = teamSize;
    }

    if (req.user.role === "investor") {
      if (investmentInterests !== undefined)
        req.user.investmentInterests = investmentInterests;
      if (investmentStage !== undefined)
        req.user.investmentStage = investmentStage;
      if (portfolioCompanies !== undefined)
        req.user.portfolioCompanies = portfolioCompanies;
      if (minimumInvestment !== undefined)
        req.user.minimumInvestment = minimumInvestment;
      if (maximumInvestment !== undefined)
        req.user.maximumInvestment = maximumInvestment;
    }

    await req.user.save();
    const { password, ...updatedUser } = req.user.toObject();

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};


export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getEntrepreneurs = async (req, res) => {
  try {
    const entrepreneurs = await User.find({ role: "entrepreneur" }).select("-password");

    res.status(200).json({
      entrepreneurs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getInvestors = async (req, res) => {
  try {
    const investors = await User.find({ role: "investor" }).select("-password");

    res.status(200).json({
      investors,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
};