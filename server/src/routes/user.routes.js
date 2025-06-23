const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, userController.getCurrentUser);

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  '/me',
  protect,
  [
    check('name', 'Name is required').optional(),
    check('email', 'Please include a valid email').optional().isEmail(),
    check('bio', 'Bio cannot exceed 500 characters').optional().isLength({ max: 500 }),
  ],
  userController.updateCurrentUser
);

/**
 * @route   PUT /api/users/me/password
 * @desc    Update current user password
 * @access  Private
 */
router.put(
  '/me/password',
  protect,
  [
    check('currentPassword', 'Current password is required').not().isEmpty(),
    check('newPassword', 'Please enter a password with 6 or more characters').isLength({
      min: 6,
    }),
  ],
  userController.updatePassword
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Public
 */
router.get('/:id', userController.getUserById);

/**
 * @route   GET /api/users/:id/events
 * @desc    Get events created by a user
 * @access  Public
 */
router.get('/:id/events', userController.getUserEvents);

/**
 * @route   PUT /api/users/me/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.put('/me/avatar', protect, userController.uploadAvatar);

/**
 * @route   DELETE /api/users/me
 * @desc    Delete current user account
 * @access  Private
 */
router.delete('/me', protect, userController.deleteAccount);

module.exports = router; 