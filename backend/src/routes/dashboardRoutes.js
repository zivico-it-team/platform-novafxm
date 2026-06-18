const router = require('express').Router();
const controller = require('../controllers/dashboardController');
const auth = require('../middleware/authMiddleware');
const client = require('../middleware/clientMiddleware');

router.use(auth, client);
router.get('/', controller.dashboard);
router.post('/accounts', controller.createAccount);

module.exports = router;
