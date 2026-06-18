const router = require('express').Router();
const controller = require('../controllers/tradeController');
const auth = require('../middleware/authMiddleware');
const client = require('../middleware/clientMiddleware');

router.use(auth);
router.post('/open', client, controller.open);
router.post('/close/:id', client, controller.close);
router.get('/open', controller.openTrades);
router.get('/closed', controller.closedTrades);

module.exports = router;
