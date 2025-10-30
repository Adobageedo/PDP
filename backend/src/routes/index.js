const express = require('express');
const router = express.Router();
const extractionRoutes = require('./extraction.routes');
const pdpRoutes = require('./pdp.routes');

// Mount routes
router.use('/extraction', extractionRoutes);
router.use('/pdp', pdpRoutes);

module.exports = router;
