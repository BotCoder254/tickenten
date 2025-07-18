const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Event = require('../models/event.model');
const Ticket = require('../models/ticket.model');

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/me
 * @access  Private
 */
exports.updateCurrentUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    // Create update object
    const updateFields = {};
    if (req.body.name) updateFields.name = req.body.name;
    if (req.body.email) updateFields.email = req.body.email;
    if (req.body.bio) updateFields.bio = req.body.bio;
    if (req.body.location) updateFields.location = req.body.location;
    if (req.body.website) updateFields.website = req.body.website;
    if (req.body.socialLinks) updateFields.socialLinks = req.body.socialLinks;

    // Check if email is already in use
    if (req.body.email) {
      const emailExists = await User.findOne({
        email: req.body.email,
        _id: { $ne: req.user.id },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use',
        });
      }
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update current user password
 * @route   PUT /api/users/me/password
 * @access  Private
 */
exports.updatePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id);

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Public
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get events created by a user
 * @route   GET /api/users/:id/events
 * @access  Public
 */
exports.getUserEvents = async (req, res) => {
  try {
    const events = await Event.find({
      creator: req.params.id,
      status: 'published',
      visibility: 'public',
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Upload user avatar
 * @route   PUT /api/users/me/avatar
 * @access  Private
 */
exports.uploadAvatar = async (req, res) => {
  try {
    // Check if file exists in request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update user with avatar URL - ensure it's accessible from frontend
    const avatarUrl = `/uploads/${req.file.filename}`;
    
    user.avatar = avatarUrl;
    await user.save();

    console.log(`Avatar uploaded successfully for user ${user._id}: ${avatarUrl}`);

    res.status(200).json({
      success: true,
      data: {
        avatarUrl,
      },
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete current user account
 * @route   DELETE /api/users/me
 * @access  Private
 */
exports.deleteAccount = async (req, res) => {
  try {
    // Get user ID for reference
    const userId = req.user.id;

    // Find all events created by the user
    const Event = require('../models/event.model');
    const Ticket = require('../models/ticket.model');

    // 1. Find all events created by this user
    const userEvents = await Event.find({ creator: userId });
    const eventIds = userEvents.map(event => event._id);
    
    // 2. Delete all tickets associated with the user's events
    if (eventIds.length > 0) {
      await Ticket.deleteMany({ event: { $in: eventIds } });
      console.log(`Deleted tickets for ${eventIds.length} events created by user ${userId}`);
    }
    
    // 3. Delete all tickets purchased by the user
    await Ticket.deleteMany({ user: userId });
    console.log(`Deleted tickets purchased by user ${userId}`);
    
    // 4. Delete all events created by the user
    await Event.deleteMany({ creator: userId });
    console.log(`Deleted ${userEvents.length} events created by user ${userId}`);
    
    // 5. Finally, delete the user account
    await User.findByIdAndDelete(userId);
    console.log(`User account ${userId} deleted successfully`);

    res.status(200).json({
      success: true,
      message: 'Account and all associated data deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
}; 