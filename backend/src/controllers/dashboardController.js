const { createTradingAccount, dashboardForUser } = require('../services/dashboardService');

exports.dashboard = async (req, res, next) => {
  try {
    const origin = req.get('origin') || '';
    return res.json(await dashboardForUser(req.user.id, origin));
  } catch (error) {
    return next(error);
  }
};

exports.createAccount = async (req, res, next) => {
  try {
    const account = await createTradingAccount(req.user.id, req.body.type);
    return res.status(201).json({ account });
  } catch (error) {
    return next(error);
  }
};
