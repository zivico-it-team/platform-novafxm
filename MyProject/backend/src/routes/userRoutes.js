const router = require('express').Router();
const controller = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

router.use(auth);
router.get('/profile', controller.profile);
router.put('/profile', controller.updateProfile);

module.exports = router;
