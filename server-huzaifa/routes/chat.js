const express = require("express");
const router = express.Router();

// temporary test route
router.get("/", (req, res) => {
  res.send("Route is working!");
});

module.exports = router;
