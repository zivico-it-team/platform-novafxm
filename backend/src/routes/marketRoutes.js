const router = require('express').Router();
const controller = require('../controllers/marketController');

router.get('/symbols', controller.symbols);
router.get('/prices', controller.prices);
router.get('/candles/:symbol', controller.candles);

module.exports = router;
