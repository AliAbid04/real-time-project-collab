import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded token:", decoded);  // This shows: { id: '...' }

    // 🔑 FIX HERE: decoded has "id", not "userId"
    req.user = { id: decoded.id };  // ✅ Use decoded.id, not decoded.userId

    console.log("req.user:", req.user);

    next();
  } catch (err) {
    console.error("JWT error:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
};
