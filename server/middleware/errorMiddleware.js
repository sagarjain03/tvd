/**
 * 404 Not Found middleware
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global error handler middleware
 * Should be registered as the last middleware in the Express app
 */
export const errorHandler = (err, req, res, next) => {
  // Use status code set in error or default to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    // Only send stack trace in development
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
