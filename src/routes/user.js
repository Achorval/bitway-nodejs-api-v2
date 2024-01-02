const SystemMiddleware = require('../app/http/middlewares/SystemMiddleware');
const UserController = require('../app/http/controllers/user/UserController');

module.exports = (app) => {
  const systemMiddleware = new SystemMiddleware();
  const userController = new UserController();

  app.post('/register', 
    userController.register);
  app.post('/login', 
    userController.login);
  app.post('/account/recover',  
    userController.forgotPassword);
  app.post('/reset/password', 
    systemMiddleware.recoveryMiddleware,
    userController.resetPassword);
  app.post('/validate/email',  
    systemMiddleware.emailMiddleware,
    userController.processValidateEmail);
  app.post('/resend/email', 
    systemMiddleware.userMiddleware, 
    userController.resendVerifyEmail);
  app.post('/verifyToken', 
    userController.getUserByToken);
  app.get('/user', 
    systemMiddleware.userMiddleware, 
    userController.getUserDetails);
  
  app.get('/balance', 
    systemMiddleware.userMiddleware, 
    userController.fetchBalance); 
  app.post('/profile/update',   
    systemMiddleware.userMiddleware, 
    userController.updateProfile);
  app.post('/security/change-password', 
    systemMiddleware.userMiddleware, 
    userController.changePassword);
  app.post('/verify/password',   
    systemMiddleware.userMiddleware,
    userController.verifyPassword);
  app.post('/security/pin',   
    systemMiddleware.userMiddleware,
    userController.securityPin);
  app.post('/security/2FAuth',   
    systemMiddleware.userMiddleware,
    userController.updateTwoFactorAuth);
  app.post('/security/bvn',   
    systemMiddleware.userMiddleware,
    userController.updateBvn);
    
  app.get('/bank/accounts', 
    systemMiddleware.userMiddleware, 
    userController.fetchBankAccounts);
  app.post('/bank/account/verify', 
    systemMiddleware.userMiddleware, 
    userController.verifyAccountNumber);
  app.post('/bank/account/create', 
    systemMiddleware.userMiddleware, 
    userController.createBankAccount);
  app.get('/bank/account/edit/:id', 
    systemMiddleware.userMiddleware, 
    userController.editBackAccount);
  app.put('/bank/account/update/:id', 
    systemMiddleware.userMiddleware, 
    userController.updateBankACcount);
  app.delete('/bank/accounts/delete/:id', 
    systemMiddleware.userMiddleware, 
    userController.deleteBankAccount);  
  app.get('/bank/list', 
    systemMiddleware.userMiddleware, 
    userController.fetchBankList);

  app.get('/transactions', 
    systemMiddleware.userMiddleware,
    userController.fetchTransactions);  
  app.post('/withdraw', 
    systemMiddleware.userMiddleware, 
    userController.withdraw);  
  app.get('/service',
    systemMiddleware.userMiddleware,
    userController.fetchService);
  app.post('/trade/bitcoin', 
    systemMiddleware.userMiddleware,
    userController.tradeBitcoin);
  app.post('/trade/usdt', 
    systemMiddleware.userMiddleware,
    userController.tradeUsdt);
  app.post('/toggle/balance', 
    systemMiddleware.userMiddleware, 
    userController.toggleBalance);
};

