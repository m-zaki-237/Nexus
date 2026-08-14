export const requirePro = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized Access!" });
    }

    const isPro =
      req.user.plan === "pro" &&
      (req.user.status === "active" || req.user.status === "trialing");

    if (!isPro) {
      return res.status(403).json({
        message: "Pro subscription required to access this feature.",
        upgradeUrl: "/pricing",
      });
    }

    next();
  } catch (error) {
    console.error("requirePro error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
