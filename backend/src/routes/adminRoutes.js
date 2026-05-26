const router = require('express').Router();
const controller = require('../controllers/adminController');
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

router.use(auth, admin);
router.get('/users', controller.users);
router.get('/users/:id/wallet', controller.userWallet);
router.get('/users/:id/transactions', controller.userTransactions);
router.put('/users/:id/add-balance', controller.updateBalance('admin_add_balance'));
router.put('/users/:id/deduct-balance', controller.updateBalance('admin_deduct_balance'));
router.put('/users/:id/freeze', controller.setTradingStatus('frozen'));
router.put('/users/:id/unfreeze', controller.setTradingStatus('active'));
router.put('/users/:id/leverage', controller.updateLeverage);
router.put('/users/:id/reset-demo', controller.resetDemo);
router.put('/users/:id/notes', controller.updateNotes);
router.get('/deposits', controller.deposits);
router.put('/deposits/:id/approve', controller.reviewDeposit('approved'));
router.put('/deposits/:id/reject', controller.reviewDeposit('rejected'));
router.get('/withdrawals', controller.withdrawals);
router.put('/withdrawals/:id/approve', controller.reviewWithdrawal('approved'));
router.put('/withdrawals/:id/reject', controller.reviewWithdrawal('rejected'));
router.get('/trades', controller.trades);

module.exports = router;
