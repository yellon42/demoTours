const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes.js');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

// 1) GLOBAL MIDDLEWARES
// set security http headers
app.use(helmet());

// development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); //logs requests to console or file
}

// limit incomming requests from same IP
const limiter = rateLimit({
  max: 100, // limit connections
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many request from this IP, please try again later!',
});
app.use('/api', limiter); // apply to all routes after "/api"

// put data from body into req.body
app.use(
  express.json({
    limit: '10kb',
  })
);
//app.use(express.static(`${__dirname}/public`));   //static files

// protect data against NoSQL query injection
app.use(mongoSanitize());

// protect data against XSS
app.use(xss());

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// testing middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.headers);

  next();
});

// 2) ROUTES  | mounting routers
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// handle all non-defined routes
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  // if there is argument in next() function, it's considered that it is an ERROR and
  // skips all other middlewares and go straigth to error handler
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//if we specify 4 params, express automatically recognizes this as ERROR handling middleware
app.use(globalErrorHandler);

module.exports = app;
