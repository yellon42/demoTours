//make helping function so we wont have try catch blocks in controllers asyn await functions
module.exports = (fn) => {
  return (req, res, next) => {
    // fn(req, res, next).catch((err) => next(err)); these 2 lines are doing the same
    fn(req, res, next).catch(next);
  };
};
