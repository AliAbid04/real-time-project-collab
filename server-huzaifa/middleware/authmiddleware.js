const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // no token in header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  // separates the token from bearer
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // extracts info from the token
    req.user = decoded; // attach user id
    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
