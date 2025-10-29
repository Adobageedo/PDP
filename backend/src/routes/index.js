const express = require('express');
const router = express.Router();
const extractionRoutes = require('./extraction.routes');

// Mount routes
router.use('/extraction', extractionRoutes);

module.exports = router;
