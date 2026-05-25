const router = require('express').Router();
const controller = require('../controllers/walletController');
const auth = require('../middleware/authMiddleware');

router.use(auth);
router.get('/', controller.getWallet);
router.get('/transactions', controller.transactions);
router.post('/deposit', controller.deposit);
router.post('/withdraw', controller.withdraw);

module.exports = router;
