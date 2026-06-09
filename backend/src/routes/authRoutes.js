const router = require('express').Router();
const controller = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', auth, controller.me);
router.post('/referral/claim', auth, controller.claimReferral);

module.exports = router;
