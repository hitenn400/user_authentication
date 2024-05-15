const express = require('express');
const router = express.Router();
// home route
const {home,homeDummy} =require('../controllers/homeController');
router.route('/').get(home);
router.route('/dummy').get(homeDummy);

module.exports = router;