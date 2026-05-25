const router = require('express').Router();
const controller = require('../controllers/adminController');
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

router.use(auth, admin);
router.get('/users', controller.users);
router.get('/deposits', controller.deposits);
router.put('/deposits/:id/approve', controller.reviewDeposit('approved'));
router.put('/deposits/:id/reject', controller.reviewDeposit('rejected'));
router.get('/withdrawals', controller.withdrawals);
router.put('/withdrawals/:id/approve', controller.reviewWithdrawal('approved'));
router.put('/withdrawals/:id/reject', controller.reviewWithdrawal('rejected'));
router.get('/trades', controller.trades);

module.exports = router;
