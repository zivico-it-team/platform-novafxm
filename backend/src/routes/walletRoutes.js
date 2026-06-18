const router = require('express').Router();
const controller = require('../controllers/walletController');
const auth = require('../middleware/authMiddleware');
const client = require('../middleware/clientMiddleware');

router.use(auth);
router.get('/', controller.getWallet);
router.get('/transactions', controller.transactions);
router.post('/deposit', client, controller.deposit);
router.post('/withdraw', client, controller.withdraw);

module.exports = router;
