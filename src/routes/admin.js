const SystemMiddleware = require('../app/http/middlewares/SystemMiddleware');
const AccountController = require('../app/http/controllers/admin/AccountController');

module.exports = (app) => {  
  const systemMiddleware = new SystemMiddleware();
  const accountController = new AccountController();

  app.post('/admin/login', 
    accountController.login);
  app.post('/admin/verifyToken', 
    accountController.getAdminByToken);
  app.get('/admin/dashboard', 
    systemMiddleware.adminMiddleware, 
    accountController.dashboardOverview);    
  app.post('/admin/users/creditordebit', 
    systemMiddleware.adminMiddleware,
    accountController.creditDebitCustomerWallet);
  app.post('/admin/users/block', 
    systemMiddleware.adminMiddleware, 
    accountController.blockCustomerAccount);
  app.get('/admin/transactions', 
    systemMiddleware.adminMiddleware,
    accountController.fetchTransactions);
  app.get('/admin/transactions/details', 
    systemMiddleware.adminMiddleware,
    accountController.fetchTransactionsDetails);
  app.post('/admin/transactions/status/update', 
    systemMiddleware.adminMiddleware,
    accountController.updateTransactionStatus);

  app.get('/admin/users', 
    systemMiddleware.adminMiddleware,
    accountController.fetchCustomers);
  app.get('/admin/users/:id', 
    systemMiddleware.adminMiddleware, 
    accountController.fetchCustomer);
  app.get('/admin/withdrawals', 
    systemMiddleware.adminMiddleware,
    accountController.fetchWithdrawals);
  app.put('/admin/withdrawals/update', 
    systemMiddleware.adminMiddleware,
    accountController.updateWithdrawal);
      
  app.get('/admin/services', 
    systemMiddleware.adminMiddleware,
    accountController.fetchServices);
  app.post('/admin/services/create', 
    systemMiddleware.adminMiddleware,
    accountController.createService);
  app.put('/admin/services/update/:id',
    systemMiddleware.adminMiddleware, 
    accountController.updateService);
  app.delete('/admin/services/delete/:id',
    systemMiddleware.adminMiddleware, 
    accountController.deleteService);
  app.put('/admin/services/status', 
    systemMiddleware.adminMiddleware,
    accountController.serviceStatus);
}

