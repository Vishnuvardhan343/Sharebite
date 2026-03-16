const express = require('express');
const router = express.Router();
const { getStats, getAllUsers, toggleUserStatus, updateUserRole, deleteUser, getReports } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleCheck');

router.use(protect, roleCheck('admin'));
router.get('/stats',      getStats);
router.get('/users',      getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/reports',    getReports);



module.exports = router;
