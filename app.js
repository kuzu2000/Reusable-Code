const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const authRoute = require('./Routes/authRoute');
const postRoute = require('./Routes/postRoute');
const favouriteRoute = require('./Routes/favouriteRoute');
const app = express();
const AppError = require('./utils/appError');
const globalErrorHandler = require('./Routes/errorRoutes');

app.use(cors());

app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limit = rateLimit({
  max: 100,
  window: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});

app.use('/api', limit);
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

app.use('/api/auth', authRoute);
app.use('/api/posts', postRoute);
app.use('/api/favourite', favouriteRoute);



app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
