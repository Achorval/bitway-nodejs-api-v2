let Validator = require('validatorjs');
const AccountService = require('../../services/admin/AccountService');
const { compareHashPassword, accessToken } = require("../../../../utils/functions");

class AccountController {
  constructor() {  
    this.accountService = new AccountService();
  };

  /**
   * Verify a user for an incoming login request.
   *
   * @param  array  $data
   * @return User
   */
  login = async (request, response) => {
    try {
      let validation = new Validator(request.body, {
        username: 'required|string',
        password: 'required|string|min:8'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      }
      /** Validate Email or Phone Number */
      const adminData = await this.accountService.validateEmailOrPhone(request);
      /** Check Admin Exist */
      if (adminData ==  null) {
        return response.status(401).send({
          status: 'Error',
          message: 'Incorrect login details.'
        });
      };
      /** Validate Admin Password */ 
      if(!compareHashPassword(request.body.password, adminData.password)) {
        return response.status(401).send({
          status: 'Error',
          message: 'Incorrect login details.'
        });
      };
      /** Check Admin is Blocked */
      if(adminData.blocked === true) {
        return response.status(403).send({
          status: 'Error',
          message: 'Account is deactivated, contact support!'
        });
      };
      // ** Check user role
      if(adminData.roleId !== 2) {
        return response.status(403).send({
          status: 'Error',
          message: 'Account is not allowed!'
        });
      };
      return response.send({
        accessToken: accessToken(adminData.id),
        details: adminData,
        status: 'Success',
        message: 'Login authentication was successful!'
      });
    } catch (error) {  
      return response.status(500).send({
        status: 'Error',
        message: "An error occured trying to log in."
      });
    }
  };

  /**
   * Display a list of the resource.
   *
   * @return Response
   */
  getAdminByToken = async (request, response) => {
    try {
      // ** Validation Rules
      let validation = new Validator(request.body, {
        accessToken: 'required|string'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      /** Validate Email or Phone Number */
      const result = await this.accountService.getAdminByToken(request);
      if (!result) {
        return response.status(403).send({
          status: 'Error',
          message: "No token provided!"
        });
      }
      return response.send({
        accessToken: accessToken(result.id),
        details: result,
        status: 'Success',
        message: 'Admin record retrieved successful!'
      });
    } catch (error) { 
      return response.status(400).send({
        status: 'Error',
        message: 'An Error Occured, try again later'
      })
    }
  };

  /**
   * Display a listing of the resource.
   *
   * @return Response
   */
  dashboardOverview = async (request, response) => {
    try {
      const userCountOverview = await this.accountService.userCountOverview(request);
      const transactionOverview = await this.accountService.transactionOverview(request);
      const withdrawalOverview = await this.accountService.withdrawalOverview(request);
      const data = {
        userCountOverview: userCountOverview !== null ? userCountOverview : 0,
        transactionOverview: transactionOverview !== null ? transactionOverview : 0,
        withdrawalOverview: withdrawalOverview !== null ? withdrawalOverview : 0
      }
      return response.send({
        details: data,
        status: 'Success',
        message: 'Records retrieved successfully!'
      });
    } catch (error) { 
      return response.status(400).send({
        status: 'Error',
        message: 'An Error Occured, try again later!'
      });
    }
  };

  /**
   * Update a listing of the resource.
   *
   * @return Response
   */
  blockCustomerAccount = async (request, response) => {
    try {
      // Validation Rules
      let validation = new Validator(request.body, {
        userId: 'required|integer',
        blocked: 'required|boolean'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const result = await this.accountService.blockCustomerAccount(request);
      if (!result[0]) {
        return response.status(401).send({
          status: 'Error',
          message: 'User account not found!.'
        });
      }; 
      return response.status(200).send({
        status: 'Success',
        message: `Customer account ${request.body.blocked ? 'disabled' : 'enabled'} successfully!`
      });
    } catch (error) {   
      return response.status(400).send({
        status: 'Error',
        message: 'An Error Occured, try again later'
      });
    }
  };

  /**
   * Fund User Account Balance.
   *
   * @return void
   */
  creditDebitCustomerWallet = async (request, response) => {
    try {
      // Validation Rules
      let validation = new Validator(request.body, {
        username: 'required|string',
        type: 'required|string',
        amount: 'required|integer'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      /** Credit or Debit customer balance */
      const result = await this.accountService.creditDebitCustomerWallet(
        request.body.username,
        request.body.type, 
        parseInt(request.body.amount)
      );
      /** Check wallet Balance */
      if (result === 'Insufficient-wallet') {
        return response.status(400).send({
          status: 'Error',
          message: 'Insufficient wallet balance!.'
        });
      };
      if (result === 'User-not-found') {
        return response.status(400).send({
          status: 'Error',
          message: 'User not found!'
        });
      };      
      return response.status(201).send({
        status: 'Success',
        message: 'Customer wallet credited successfully!'
      });
    } catch (error) {   
      return response.status(400).send({
        status: 'Error',
        message: 'An Error Occured, try again later'
      });
    }
  };

  /**
   * Display a listing of the resource.
   *
   * @return Response
   */
  fetchCustomers = async (request, response) => {
    try {
      const result = await this.accountService.fetchCustomers(request);
      return response.status(200).send({
        details: {
          totalItems: result.count, 
          allItems: result.rows, 
          currentPage: parseInt(request.query.page),
          perPage: parseInt(request.query.perPage),
        },
        status: 'Success',
        message: 'Customers retrieved successfully!'
      });
    } catch (error) {  
      return response.status(400).send({
        status: 'Error',
        message: 'An Error Occured try, again later.'
      })
    }
  }; 

  /**
   * Display the specified resource.
   *
   * @param  int  $id
   * @return Response
   */
  fetchCustomer = async (request, response) => {
    try {
      // Validation Rules
      let validation = new Validator(request.params, {
        username: 'required'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const result = await this.accountService.fetchCustomer(request);
      // ** Check if User Exist
      if (!result) {
        return response.status(401).send({
          status: 'Error',
          message: 'Customer account not found!.'
        });
      }; 
      return response.status(200).send({
        details: result,
        status: 'Success',
        message: 'Customer retrieved successfuly!'
      });
    } catch (error) {  
      return response.status(400).send({
        status: 'Error',
        message: 'An Error Occured, try again later'
      });
    }
  };

  //= ====================================
  //  WALLET CONTROLLER
  //-------------------------------------- 
  /**
   * Display a listing of the resource.
   *
   * @return Response
   */
  fetchWithdrawals = async (request, response) => {
    try {
      const result = await this.accountService.fetchWithdrawals(request);
      return response.status(200).send({
        details: {
          totalItems: result.count, 
          allItems: result.rows, 
          currentPage: parseInt(request.query.page),
          perPage: parseInt(request.query.perPage),
        },
        status: 'Success',
        message: 'Withdrawals retrieved successfully!'
      });

      // const { offset, limit } = limitAndOffset(request.query.page, request.query.perPage);
      // await transaction.findAndCountAll({
      //   limit: limit, 
      //   offset: offset,
      //   where: {
      //     status: 'pending'
      //   },
      //   order: [
      //     ['createdAt', 'DESC']
      //   ], 
      //   attributes: [
      //     'id',
      //     'serviceId',
      //     'reference',
      //     'amount',
      //     'type',
      //     'status'
      //   ],
      //   include: [{
      //     model: service, 
      //     required: true,
      //     attributes: [
      //       'id',
      //       'name'
      //     ] 
      //   },
      //   {
      //     model: user, 
      //     required: true,
      //     attributes: [
      //       'id',
      //       'firstname',
      //       'lastname'
      //     ]
      //   }]
      // }).then(function (result) {
      //   return response.status(200).send({
      //     data: paginate(result.rows, request.query.page, result.count, request.query.perPage),
      //     status: 'success',
      //     message: 'Withdrawal list have been retrieved successfully!'
      //   });
      // });
    } catch (error) { 
      return response.status(400).send({
        status: 'Error',
        message: 'An Error Occured, try again later!'
      })
    }
  };

  /**
   * Update the specified resource in storage.
   *
   * @param  Request  $request
   * @param  string  $id
   * @return Response
   */
  updateWithdrawal = async (request, response) => {
    try {
      // Validation Rules
      let validation = new Validator(request.body, {
        id: 'required|string',
        status: 'required|boolean'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };      
      const result = await this.accountService.updateWithdrawal(request);
      if (!result) {
        return response.status(401).send({
          status: 'Error',
          message: 'Transaction not found!.'
        });
      }; 
      return response.status(200).send({
        status: 'Success',
        message: `Withdrawal updated successfully!`
      });
    } catch (error) {
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later!'
      });
    }
  };

  //= ====================================
  //  TRANSACTION CONTROLLER
  //--------------------------------------
  /**
   * Display a listing of the resource.
   *
   * @return Response
   */
  fetchTransactions = async (request, response) => {
    try {
      const result = await this.accountService.fetchTransactions(request);
      return response.status(200).send({
        details: {
          totalItems: result.count, 
          allItems: result.rows, 
          currentPage: parseInt(request.query.page),
          perPage: parseInt(request.query.perPage),
        },
        status: 'Success',
        message: 'Transactions retrieved successfully!'
      });
    } catch (error) {  
      return response.status(400).send({
        status: 'Error',
        message: 'An Error Occured try, again later.'
      })
    }
  };  

  /**
   * Show the specified resource from storage.
   *
   * @param  string  $id
   * @return Response
   */
  fetchTransactionsDetails = async (request, response) => {
    try {
      // Validation Rules
      let validation = new Validator(request.query, {
        id: 'required'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const result = await this.accountService.fetchTransactionDetails(request);
      if (!result) {
        return response.status(400).send({
          status: 'Error',
          message: 'No transaction found!'
        });
      };
      return response.status(200).send({
        details: result,
        status: 'Success',
        message: 'Transaction details retrived successfuly!'
      });
    } catch (error) { 
      return response.status(400).send({
        status: 'Error',
        message: 'An Error Occured try, again later.'
      });
    }
  };

  /**
   * Store a newly created resource in storage.
   *
   * @param  Request  $request
   * @return Response
   */
  updateTransactionStatus = async (request, response) => {
    try {
      // Validation Rules
      let validation = new Validator(request.body, {
        id: 'required',
        status: 'required',
        amount: 'required',
        userId: 'required',
        service: 'required',
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      await this.accountService.updateTransactionStatus(request);
      return response.status(201).send({
        status: 'success',
        message: 'Transaction status updated successfully!'
      });
    } catch (error) {  
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later!'
      });
    }
  };

  //= ====================================
  //  SERVICE CONTROLLER
  //--------------------------------------
  /**
   * Store a newly created resource in storage.
   *
   * @param  Request  $request
   * @return Response
   */
  fetchServices = async (request, response) => {
    try {
      const result = await this.accountService.fetchServices(request);
      return response.status(200).send({
        details: {
          totalItems: result.count, 
          allItems: result.rows, 
          currentPage: parseInt(request.query.page),
          perPage: parseInt(request.query.perPage),
        },
        status: 'Success',
        message: 'Services retrieved successfully!'
      });
    } catch (error) {
      return response.status(400).send({
        status: 'Error',
        message: 'An Error Occured, try again later!'
      });
    }
  };

  /**
   * 
   * Store a newly created resource in storage.
   *
   * @param  Request  $request
   * @return Response
   */
  createService = async (request, response) => {
    try {
      // Validation Rules
      let validation = new Validator(request.body, {
        name: 'required',
        rate: 'required',
        description: 'required',
        status: 'required'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      await this.accountService.createService(request);
      return response.status(201).send({
        status: 'Success',
        message: 'Service created successfully!'
      });  
    } catch (error) { 
      return response.status(400).send({
        status: 'Error',
        message: 'An Error Occured, try again later!'
      });
    }
  };  

  /**
   * Update the specified resource in storage.
   *
   * @param  Request  $request
   * @param  int  $id
   * @return Response
   */
  updateService = async (request, response) => {
    try {
      // Validation Rules
      let validation = new Validator(request.body, {
        name: 'required',
        rate: 'required',
        description: 'required',
        status: 'required'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const result = await this.accountService.updateService(request);
      // ** Check if Product Exist
      if(!result) {
        return response.status(401).send({
          status: 'Error',
          message: 'Service not found!.'
        });
      };
      return response.status(200).send({
        status: 'Success',
        message: 'Service updated successfully!'
      });
    } catch (error) {   
      return response.status(400).send({
        status: 'Error',
        message: 'An Error Occured, try again later!'
      });
    }
  };

  /**
   * Remove the specified resource from storage.
   *
   * @param  int  $id
   * @return Response
   */
  deleteService = async (request, response) => {
    try {
      // Validation Rules
      let validation = new Validator(request.params, {
        id: 'required|integer'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const result = await this.accountService.deleteService(request);
      // ** Check if Cable exist
      if(!result) {
        return response.status(401).send({
          status: 'Error',
          message: 'Service not found!.'
        });
      };
      return response.status(200).send({
        status: 'Success',
        message: 'Service deleted successfully!'
      });
    } catch (error) {
      return response.status(400).send({
        status: 'Error',
        message: 'An Error Occured, try again later!'
      });
    }
  };

  /**
   * Remove the specified resource from storage.
   *
   * @param  int  $id
   * @return Response
   */
  serviceStatus = async (request, response) => {
    try {
      // Validation Rules
      let validation = new Validator(request.params, {
        id: 'required|integer'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const result = await this.accountService.deleteService(request);
      // ** Check if Cable exist
      if(!result) {
        return response.status(401).send({
          status: 'Error',
          message: 'Service not found!.'
        });
      };
      return response.status(200).send({
        status: 'Success',
        message: 'Service deleted successfully!'
      });
    } catch (error) {
      return response.status(400).send({
        status: 'Error',
        message: 'An Error Occured, try again later!'
      });
    }
  };
}

module.exports = AccountController;



