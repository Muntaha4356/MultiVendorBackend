// Error that happen while awaiting
const catchAsync = (theFunc) => {
  return (req, res, next) => {
    Promise.resolve(theFunc(req, res, next)).catch(next);
  };
};

export default catchAsync;

//theFunc = your async controller (like async (req, res, next) => { ... }).
// Promise.resolve(...) = takes whatever fftheFunc returns and makes sure it’s treated as a promise.
// .catch(next) = if the promise rejects (error happens), it will call Express’s next(err), which passes the error to your global error handler.
