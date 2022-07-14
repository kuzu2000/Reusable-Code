const User = require('../Models/User');
const {protect, role} = require('./../middleware/authmiddleware')
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const router = require('express').Router();
const catchAsync = require('./../utils/catchAsync');
const crypto = require('crypto');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};


const createToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true
  }

  if(process.env.NODE_ENV === 'production') cookieOptions.secure = true

  res.cookie('jwt', token, cookieOptions)

    res.status(statusCode).json({
      status: 'success',
      token,
      user
    });
}

router.post(
  '/register',
  catchAsync(async (req, res, next) => {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    createToken(newUser, 201, res)
  })
);

router.post(
  '/login',
  catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password!', 400));
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.passwordCorrect(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    createToken(user, 200, res)
  })
);



router.post(
  '/forgotPassword',
  catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError('This user does not exist', 404));
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/auth/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and password confirm to: ${resetUrl}.\n
    If you didn't forget your password, ignore this message`;

    try {
      await sendEmail({
        email: user.email,
        subject: `Your password reset token (valid for 10 mins)`,
        message,
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError(
          'There was an error sending the email. Try again later',
          500
        )
      );
    }
  })
);

router.patch(
  '/resetPassword/:token',
  catchAsync(async (req, res, next) => {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createToken(user, 200, res)
  })
);

router.patch('/updatePassword', protect, catchAsync(async(req, res, next) => {
  const user = await User.findById(req.user.id).select('+password')

  if(!(await user.passwordCorrect(req.body.currentPassword, user.password))) {
    return next(new AppError('Wrong password', 401))
  }

  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  await user.save()

  createToken(user, 200, res)
}))

module.exports = router;
