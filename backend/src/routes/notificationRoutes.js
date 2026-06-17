const router = require('express').Router();
const controller = require('../controllers/notificationController');
const auth = require('../middleware/authMiddleware');

router.use(auth);
router.get('/', controller.list);
router.get('/unread-count', controller.unreadCount);
router.put('/read-all', controller.markAllRead);
router.put('/:id/read', controller.markRead);

module.exports = router;
