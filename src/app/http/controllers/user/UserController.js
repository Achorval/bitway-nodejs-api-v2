let Validator = require('validatorjs');
const thirdParty = require('../../../../utils/thirdParty');
const UserService = require('../../services/user/UserService');
const { compareHashPassword, accessToken } = require("../../../../utils/functions");


class UserController {
  constructor() {  
    this.userService = new UserService();
  };

  /**
   * Create a new user for an incoming registration request.
   *
   * @param  array  $data
   * @return User
   */
  register = async (request, response) => {
    try {
      let validation = new Validator(request.body, {
        firstname: 'required|string',
        lastname: 'required|string',
        email: 'required|string',
        phone: 'required|string',
        password: 'required|string|min:8'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };

      /** Check if Email Exist */
      const emailExist = await this.userService.validateEmail(request);
      if (emailExist) {
        return response.status(400).send({
          status: 'Error',
          message: 'Email record already in use.'
        });
      };

      /** Check if Phone Number Exist */
      const phoneExist = await this.userService.validatePhone(request);
      if (phoneExist) {
        return response.status(400).send({
          status: 'Error',
          message: 'Phone number already in use.'
        });
      };

      /** Create a new user */
      const userData = await this.userService.addNewUser(request);

      /** Get Exising Wallet */
      await this.userService.createBalance(userData);

      /**Send Verification Email */
      await this.userService.SendVerificationEmail(userData);

      return response.status(201).send({
        status: 'Success',
        message: 'Account created successfully!'
      });
    } catch (error) {   
      return response.status(400).send({
        error: error,
        status: 'error',
        message: 'An Error Occured, try again later'
      });
    }
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
      const userData = await this.userService.validateEmailOrPhone(request);
      /** Check Admin Exist */
      if (userData ==  null) {
        return response.status(401).send({
          status: 'Error',
          message: 'Incorrect login details.'
        });
      };
      /** Validate Admin Password */ 
      if(!compareHashPassword(request.body.password, userData.password)) {
        return response.status(401).send({
          status: 'Error',
          message: 'Incorrect login details.'
        });
      };
      /** Check if User is Blocked */
      if(userData.blocked === true) {
        return response.status(403).send({
          status: 'Error',
          message: 'Account is deactivated, contact support!'
        });
      };
      // ** Check user role
      if(userData.roleId !== 1) {
        return response.status(403).send({
          status: 'Error',
          message: 'Account is not allowed!'
        });
      };
      return response.send({
        accessToken: accessToken(userData.id),
        details: userData,
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
   * Get a user details for a login user.
   *
   * @param  array  $data
   * @return User
   */
  getUserDetails = async (request, response) => {
    try {
      return response.status(200).send({
        details: request.userData,
        status: 'Success',
        message: 'User details retrieved successfully!'
      })
    } catch (error) {
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later'
      })
    }
  };

  /**
   * Display a list of the resource.
   *
   * @return Response
   */
  getUserByToken = async (request, response) => {
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
      const result = await this.userService.getUserByToken(request);
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
        message: 'User record retrieved successful!'
      });
    } catch (error) {  
      return response.status(400).send({
        status: 'Error',
        message: 'An Error Occured, try again later'
      })
    }
  };

  /**
   * Verify user for an incoming email verification request.
   *
   * @param  Request  $request
   * @return Response
   */
  processValidateEmail = async (request, response) => {
    try {
      // ** Validation Rules
      let validation = new Validator(request.body, {
        id: 'required|string'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      /** Process Validate Email */
      const result = await this.userService.processValidateEmail(request);
      if (result === 'not-found') {
        return response.status(401).send({
          status: 'Error',
          message: 'User not found, contact support!'
        });
      };
      if (result === 'email--verified') {
        return response.status(401).send({
          status: 'Success',
          message: 'Your email address is already verified!'
        });
      };
      return response.status(200).send({
        status: 'Success',
        message: 'Your email address has been verified successfully!'
      });
    } catch (error) { 
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later'
      });
    }
  };

  /**
   * Resend Verify Email application request.
   *
   * @param  Request  $request
   * @return Response
   */
  resendVerifyEmail = async (request, response) => {
    try {
      // ** Validation Rules
      let validation = new Validator(request.body, {
        id: 'required|string'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      /** Process Validate Email */
      const userData = await this.userService.resendVerifyEmail(request);
      if (userData === 'User-not-found') {
        return response.status(401).send({
          status: 'error',
          message: 'User not found!'
        });
      }
      /**Send Verification Email */
      await this.userService.SendVerificationEmail(userData);
      return response.status(200).send({
        status: 'success',
        message: 'Activation link has been sent to Your email!'
      });
    } catch (error) { 
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later'
      });
    }
  };

  /**
   * Show the application admin details.
   *
   * @return void
   */
  forgotPassword = async (request, response) => {
    try {
      // ** Validation Rules
      let validation = new Validator(request.body, {
        email: 'required|string'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };

      /** Check if Email Exist */
      const userData = await this.userService.validateEmail(request);

      if (!userData) {
        return response.status(401).send({
          status: 'error',
          message: 'User email not found!'
        });
      }

      /**Send Verification Email */
      await this.userService.forgotPassword(userData);

      return response.status(200).send({
        status: 'success',
        message: 'Reset link has been sent to your email'
      });

    } catch (error) {  
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later'
      });
    }
  };

  /**
   * Show the application admin details.
   *
   * @return void
   */
  resetPassword = async (request, response) => {
    try {    
      // ** Validation Rules
      let validation = new Validator(request.body, {
        newPassword: 'required|string',
        confirmPassword: 'required|string'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const userData = await this.userService.resetPassword(request);
      if (userData === null) {
        return response.status(401).send({
          status: 'Error',
          message: 'User not found, contact support!'
        });
      };
      if (request.body.newPassword !== request.body.confirmPassword) {
        return response.status(401).send({
          status: 'Success',
          message: 'Password does not match!'
        });
      };
      return response.status(200).send({
        status: 'Success',
        message: 'Password Reset completed successfully!'
      });
    } catch (error) { 
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later'
      });
    }
  };

  //= ====================================
  //  USER CONTROLLER
  //--------------------------------------  
  /**
   * Show the application admin details.
   *
   * @return void
   */
  toggleBalance = async (request, response) => {
    try {
      // ** Validation Rules
      let validation = new Validator(request.body, {
        newPassword: 'required|string',
        confirmPassword: 'required|string'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      await this.userService.toggleBalance(request);
      return response.status(200).send({
        status: 'success',
        message: 'Your balance status changed successfully!'
      });
    } catch (error) { 
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later'
      });
    }
  };

  /**
   * Show the application admin details.
   *
   * @return void
   */
  fetchServices = async (request, response) => {
    try {
      return response.status(200).send({
        status: 'success',
        message: 'Services retrieved successfully!'
      });
    } catch (error) { 
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later!'
      })
    }
  };

  /**
   * Display a listing of the resource.
   *
   * @return Response
   */
  fetchTransactions = async (request, response) => {
    try {
      // ** Validation Rules
      let validation = new Validator(request.query, {
        page: 'required|string',
        perPage: 'required|string'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const result = await this.userService.fetchTransactions(request);
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
        status: 'error',
        message: 'An Error Occured try, again later.'
      })
    }
  };

  /**
   * Display a listing of the resource.
   *
   * @return Response
   */
  fetchBalance = async (request, response) => {
    try {
      const result = await this.userService.fetchBalance(request);
      return response.send({
        details: result,
        status: 'Success',
        message: 'Balance retrieved successfully!',
      });
    } catch (error) { 
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later!'
      });
    }
  };

  /**
   * Show the application admin details.
   *
   * @return void
   */
  updateProfile = async (request, response) => {
    try { 
      // ** Validation Rules
      let validation = new Validator(request.body, {
        firstname: 'required|string',
        lastname: 'required|string',
        phone: 'required|string'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      await this.userService.updateProfile(request);
      return response.send({
        status: 'Success',
        message: 'Profile have been updated successfully!'
      });
    } catch (error) { 
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later!'
      });
    }
  };

  /**
   * Change a password of the resource.
   *
   * @return Response
   */
  changePassword = async (request, response) => {
    try {  
      // ** Validation Rules
      let validation = new Validator(request.body, {
        currentPassword: 'required|string',
        newPassword: 'required|string',
        retypeNewPassword: 'required|string'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const result = await this.userService.changePassword(request);
      if (result === 'No-user-found') {
        return response.status(400).send({
          status: 'Error',
          message: `No user found`,
        });
      };
      if(result === 'Password-is-incorrect') {
        return response.status(401).send({
          status: 'Error',
          message: 'Current password is incorrect!'
        });
      };
      if (result === 'Password-does-not-match') {
        return response.status(400).send({
          status: 'Error',
          message: 'New password does not match!'
        });
      };
      return response.status(200).send({
        status: 'Success',
        message: 'Password have been changed successfuly!'
      });
    } catch (error) {  
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later!'
      });
    }
  };

  /**
   * Verify password of the resource.
   *
   * @return Response
   */
  verifyPassword = async (request, response) => {
    try {  
      // ** Validation Rules
      let validation = new Validator(request.userData, {
        currentPassword: 'required|string',
        newPassword: 'required|string',
        retypeNewPassword: 'required|string'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const result = await this.userService.verifyPassword(request);
      if (result === 'No-user-found') {
        return response.status(400).send({
          status: 'Error',
          message: `No user found`,
        });
      };
      if (result === 'Password-is-incorrect') {
        return response.status(401).send({
          status: 'error',
          message: 'Current password is incorrect!'
        });
      };
      return response.status(200).send({
        status: 'success',
        message: 'Password verified successfuly!'
      });
    } catch (error) {  
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later!'
      });
    }
  };

  /**
   * Verify password of the resource.
   *
   * @return Response
   */
  securityPin = async (request, response) => {
    try {  
      // ** Validation Rules
      let validation = new Validator(request.body, {
        pin: 'required|string',
        password: 'required|string'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const result = await this.userService.securityPin(request);
      if (result === 'No-user-found') {
        return response.status(400).send({
          status: 'Error',
          message: `No user found`,
        });
      };
      // ** Compare password
      if(result === 'Incorrect-user-password') {
        return response.status(401).send({
          status: 'Error',
          message: 'Incorrect user password.'
        });
      };
      return response.status(200).send({
        status: 'Success',
        message: 'Pin updated successfuly!'
      });
    } catch (error) {  
      return response.status(400).send({
        status: 'Error',
        message: 'An Error Occured, try again later!'
      });
    }
  };

  /**
   * Show the application admin details.
   *
   * @return void
   */
  updateTwoFactorAuth = async (request, response) => {
    try { 
      // ** Validation Rules
      let validation = new Validator(request.body, {
        email2FAuth: 'required|string'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const result = await this.userService.updateTwoFactorAuth(request);
      if (!result) {
        return response.status(400).send({
          status: 'Error',
          message: `No user found`,
        });
      };
      return response.send({
        data: request.body.email2FAuth,
        status: 'success',
        message: `Two-factor authentication ${request.body.email2FAuth ? 'enabled' : 'disabled'} successfully!`
      });
    } catch (error) { 
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later!'
      });
    }
  };

  /**
   * Show the application admin details.
   *
   * @return void
   */
  updateBvn = async (request, response) => {
    try {
      // ** Validation Rules
      let validation = new Validator(request.body, {
        bvn: 'required|string'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const result = await this.userService.updateBvn(request);
      if (!result) {
        return response.status(400).send({
          status: 'Error',
          message: `No user found`,
        });
      };
      return response.send({
        status: 'Success',
        message: `Bvn confirmed successfully!`
      });
    } catch (error) { 
      return response.status(400).send({
        status: 'Error',
        message: 'An Error Occured, try again later!'
      });
    }
  };

  //= ====================================
  //  WITHDRAWAL CONTROLLER  
  //--------------------------------------
  /**
   * Show the application admin details.
   *
   * @return void
   */
  withdraw = async (request, response) => {
    try {
      // ** Validation Rules
      let validation = new Validator(request.body, {
        service: 'required|integer',
        amount: 'required|string',
        bankAccount: 'required|string',
        pin: 'required|string'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      // ** Compare transaction pin
      if(!compareHashPassword(request.body.pin, request.userData.transactionPin)) {
        return response.status(401).send({
          status: 'error',
          message: 'Incorrect transaction pin.'
        });
      };
      const result = await this.userService.withdraw(request);
      if (result === 'Insufficient-balance') {
        return response.status(406).send({
          status: 'Error',
          message: 'Insufficient balance in your wallet!'
        });
      };
      return response.status(200).send({
        status: 'Success',
        message: 'Withdrawal request have been sent successfuly!'
      });
    } catch (error) {  
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later!'
      })
    }
  };

  //= ====================================
  //  BANK ACCOUNT CONTROLLER
  //--------------------------------------
  /**
   * Display a listing of the resource.
   *
   * @return Response
   */  
  fetchBankAccounts = async (request, response) => {
    try { 
      const result = await this.userService.fetchBankAccounts(request);
      return response.status(200).send({
        details: result,
        status: 'Success',
        message: 'Bank account retrieved successfully!'
      });
    } catch (error) {
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later!'
      })
    }
  };

  /**
   * Verify a specified resource in storage.
   *
   * @return Response
   */
  verifyAccountNumber = async (request, response) => {
    const result = await this.userService.verifyAccountNumber(request);
    if(result !== false) {
      return response.status(200).send({
        details: result.data.data,
        status: 'Success',
        message: 'Account number verified successfully!'
      });
    } else {
      return response.status(400).send({
        status: 'Error',
        message: 'Incorrect bank account details, try again later!'
      });
    }
  };

  /**
   * Store a newly created resource in storage.
   *
   * @param  Request  $request
   * @return Response
   */
  createBankAccount = async (request, response) => {
    try {
      // ** Validation Rules
      let validation = new Validator(request.body, {
        accountNumber: 'required|string',
        accountName: 'required|string',
        bankCode: 'required|string',
        bankName: 'required|string'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const result = await this.userService.createBankAccount(request);
      if (result) {
        return response.status(201).send({
          status: 'Success',
          message: 'Bank account created successfully!'
        });
      } else {
        return response.status(401).send({
          status: 'Error',
          message: 'Account account already exist!'
        });
      }
    } catch (error) {  
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later!'
      });
    }
  };  

  /**
   * Edit the specified resource in storage. 
   *
   * @param  string  $id
   * @return Response
   */
  editBackAccount = async (request, response) => {
    try { 
      const result = await this.userService.editBackAccount(request);
      return response.status(200).send({
        details: result,
        status: 'success',
        message: 'Bank account edited successfully!'
      });
    } catch (error) {
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later'
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
  updateBankACcount = async (request, response) => {
    try { 
      // ** Validation Rules
      let validation = new Validator(request.params, {
        id: 'required|string'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const result = await this.userService.updateBankACcount(request);
      return response.status(200).send({
        // data: request.params.id,
        status: 'Success',
        message: 'Bank account updated successfully!'
      });
    } catch (error) {
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later!'
      })
    }
  };

  /**
   * Remove the specified resource from storage.
   *
   * @param  string  $id
   * @return Response
   */
  deleteBankAccount = async (request, response) => {
    try {
      // ** Validation Rules
      let validation = new Validator(request.params, {
        id: 'required|string'
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const result = await this.userService.deleteBankAccount(request);
      if (!result) {
        return response.status(200).send({
          status: 'Error',
          message: 'Bank account not found!'
        });
      };
      return response.status(200).send({
        status: 'Success',
        message: 'Bank account deleted successfully!'
      });
    } catch (error) {
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later!'
      })
    }
  };

  /**
   * Display a listing of the resource.
   *
   * @return Response
   */
  fetchBankList = async (request, response) => {
    try { 
      const data = await thirdParty.paystackGetRequest(`bank`);
      if(data.data.status == true) {
        return response.status(200).send({
          details: data.data.data,
          status: 'success',
          message: 'Bank list have been retrieved successfully!'
        });
      } 
    } catch (error) { 
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later!'
      })
    }
  };

  /**
   * Show the application admin details.
   *
   * @return void
   */
  fetchService = async (request, response) => {
    try {
      const result = await this.userService.fetchService(request);
      return response.status(200).send({
        details: result,
        status: 'Success',
        message: 'Services retrieved successfully!'
      });
    } catch (error) { 
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later!'
      })
    }
  };

  /**
   * Store a newly created resource in storage.
   *
   * @param  Request  $request
   * @return Response
   */
  tradeBitcoin = async (request, response) => {
    try {
      // ** Validation Rules
      let validation = new Validator(request.params, {
        service: 'required|integer',
        rate: 'required|integer',
        address: 'required|string',
        amount: 'required|integer',
        amountToReceive: 'required|integer',
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const result = await this.userService.tradeBitcoin(request);
      return response.status(201).send({
        status: 'success',
        message: 'Your transaction submitted successfully!'
      });

    } catch (error) {  
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later!'
      });
    }
  };

  /**
   * Store a newly created resource in storage.
   *
   * @param  Request  $request
   * @return Response
   */
  tradeUsdt = async (request, response) => {
    try {
      // ** Validation Rules
      let validation = new Validator(request.body, {
        service: 'required|integer',
        rate: 'required|integer',
        imageUrl: 'required|string',
        amount: 'required|integer',
        amountToReceive: 'required|integer',
      });
      if (validation.fails()) {
        const errors = validation.errors.all();
        const errorMessage = Object.values(errors)[0][0];
        return response.status(400).send({
          status: 'Error',
          message: errorMessage
        });
      };
      const result = await this.userService.tradeUsdt(request);
      return response.status(201).send({
        status: 'Success',
        message: 'Your transaction submitted successfully!'
      });
    } catch (error) {  
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later!'
      });
    }
  };
}

module.exports = UserController;

