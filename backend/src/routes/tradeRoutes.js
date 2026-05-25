const router = require('express').Router();
const controller = require('../controllers/tradeController');
const auth = require('../middleware/authMiddleware');

router.use(auth);
router.post('/open', controller.open);
router.post('/close/:id', controller.close);
router.get('/open', controller.openTrades);
router.get('/closed', controller.closedTrades);

module.exports = router;
