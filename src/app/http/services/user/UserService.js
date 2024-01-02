const axios = require('axios');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const config = require('../../../../utils/constant');
const thirdParty = require('../../../../utils/thirdParty');
const { cloudinary } = require('../../../../utils/cloudinary');
const { 
  user,
  service, 
  bankAccount,
  transaction,
  balance
} = require('../../../models');
const { 
  titleCase, 
  uniqueNumber, 
  compareHashPassword, 
  accessToken, 
  hashPassword
} = require("../../../../utils/functions");

class UserService {
  
  /**
   * Display a listing of the resource.
   *
   * @return Response
   */
  validateEmail = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await user.findOne({ 
          where: {
            email: request.body.email.toLowerCase()
          }
        });
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Display a listing of the resource.
   *
   * @return Response
   */
  validateEmailOrPhone = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const payload = {
          [Op.or]: [{
            email: {
              [Op.substring]: request.body.username}
            },
            {
            phone: {
              [Op.substring]: request.body.username}
            }
          ]
        };
        const result = await user.findOne({
          where: { ...payload },
          attributes: [
            'id', 
            'roleId',
            'firstname', 
            'lastname',
            'email',
            'isEmailVerified',
            'phone', 
            'isPhoneVerified',
            'dob',
            'gender',
            'password',
            'bvn',
            'isBvnVerified', 
            'isDocumentVerified',
            'balanceStatus',
            'blocked'
          ]
        });
        return resolve(result);
      } catch (e) {
        return reject(e);
      }
    });
  };
  
  /**
   * Verify user token request.
   *
   * @param  Request  $request
   * @return Response
   */
  getUserByToken = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const decoded = await jwt.verify(request.body.accessToken, config.AccessTokenSecretKey, { expiresIn: config.ONE_WEEK });
        var result = await user.findOne({
          where: {
            id: decoded.id
          },
          attributes: [
            'id', 
            'roleId',
            'firstname', 
            'lastname',
            'email',
            'isEmailVerified',
            'phone', 
            'isPhoneVerified',
            'dob',
            'gender',
            'password',
            'bvn',
            'isBvnVerified', 
            'isDocumentVerified',
            'balanceStatus',
            'blocked'
          ]
        });
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  };
  
  /**
   * 
   * Store a newly created resource in storage.
   *
   * @param  Request  $request
   * @return Response
   */
  addNewUser = (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await user.create({
          firstname: await titleCase(request.body.firstname),
          lastname: await titleCase(request.body.lastname),
          photoUrl: '',
          email: request.body.email.toLowerCase(),
          isEmailVerified: false,
          emailVerifiedAt: null,
          phone: request.body.phone,
          phoneVerificationCode: '',
          isPhoneVerified: false,
          phoneVerifiedAt: null,
          dob: '',
          gender: '',
          password: hashPassword(request.body.password),
          bvn: null,
          isBvnVerified: false,
          bvnVerifiedAt: null,
          isDocumentVerified: false,
          documentVerifiedAt: null,
          transactionPin: '',
          hasTransactionPin: false,
          balanceStatus: false,
          rememberToken: '',
          roleId: 1,
          blocked: false,
          blockedAt: null,
          blockedReason: ''   
        });
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Display a listing of the resource.
   *
   * @return Response
   */
  createBalance = async (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        // ** Create user balance
        await balance.create({  
          userId: userData.id,
          previous: 0.00,
          book: 0.00,
          current: 0.00,
          status: true,
        });
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Display a listing of the resource.
   *
   * @return Response
   */
  SendVerificationEmail = async (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        // ** Send Verification Email
        const sendPulseData = await thirdParty.sendPulseAuthorization();
        await axios.post(`https://api.sendpulse.com/smtp/emails`, {
          "email": {
            "subject": "Verify Your Email Address",
            "template": {
              "id": 292161,
              "variables": {
                "firstname": `${userData.firstname}`,
                "lastname": `${userData.lastname}`,
                "verificationUrl": `https://bitway.ng/verify-email/` + accessToken(userData.id)
              }
            },
            "from": {
              "name": "Bitway.ng",
              "email": "support@bitway.ng"
            },
            "to": [
              {
                "name": `${userData.firstname} ${userData.lastname}`,
                "email": email.toLowerCase()
              }
            ]
          }
        } , {
          headers: {
            'Authorization': `Bearer ${sendPulseData.access_token}`,
            'content-type': 'application/json'
          }
        });
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Verify user token request.
   *
   * @param  Request  $request
   * @return Response
   */
  getAdminByToken = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const decoded = await jwt.verify(request.body.accessToken, config.AccessTokenSecretKey, { expiresIn: config.ONE_WEEK });
        var result = await user.findOne({
          where: {
            id: decoded.id
          },
          attributes: [
            'id', 
            'roleId',
            'firstname', 
            'lastname',
            'email',
            'isEmailVerified',
            'phone', 
            'isPhoneVerified',
            'dob',
            'gender',
            'password',
            'bvn',
            'isBvnVerified', 
            'isDocumentVerified',
            'balanceStatus',
            'blocked'
          ]
        });
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Verify user for an incoming email verification request.
   *
   * @param  Request  $request
   * @return Response
   */
  processValidateEmail = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await user.findOne({
          where: {
            id: request.userData.id
          }
        });
        if (result === null) {
          resolve('not-found');
        };
        if (result.isEmailVerified && result.emailVerifiedAt !== null) {
          resolve('email--verified');
        };
        const userData = await result.update({
          isEmailVerified: true,
          emailVerifiedAt: Date.now()
        });
        resolve(userData);
      } catch (e) {
        reject(e);
      }
    });

  };

  /**
   * Resend Verify Email application request.
   *
   * @param  Request  $request
   * @return Response
   */
  resendVerifyEmail = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        // ** User exist
        const result = await user.findOne({
          where: {
            id: request.userData.id
          }
        });
        if (result === null) {
          resolve('User-not-found');
        };
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Display a listing of the resource.
   *
   * @return Response
   */
  forgotPassword = async (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        // ** Account Recovery Email
        const sendPulseData = await thirdParty.sendPulseAuthorization();
        await axios.post(`https://api.sendpulse.com/smtp/emails`, {
          "email": {
            "subject": "Reset your Bitway password",
            "template": {
              "id": 292210,
              "variables": {
                "email": `${userData.email}`,
                "firstname": `${userData.firstname}`,
                "lastname": `${userData.lastname}`,
                "verificationUrl": `https://bitway.ng/auth/reset/` + accessToken(userData.id)
              }
            },
            "from": {
              "name": "Bitway.ng",
              "email": "support@bitway.ng"
            },
            "to": [
              {
                "name": `${userData.firstname} ${userData.lastname}`,
                "email": userData.email
              }
            ]
          }
        } , {
          headers: {
            'Authorization': `Bearer ${sendPulseData.access_token}`,
            'content-type': 'application/json'
          }
        });
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Show the application admin details.
   *
   * @return void
   */
  resetPassword = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await user.findOne({
          where: {
            id: request.userData.id
          }
        });
        if (result) {
          await result.update({
            password: hashPassword(request.body.newPassword)
          });
          resolve(result);
        };
        resolve(false);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Show the application admin details.
   *
   * @return void
   */
  toggleBalance = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await user.findOne({
          where: {
            id: request.userData.id 
          }
        });
        if (result) {
          await result.update({
            balanceStatus: request.body.status
          });
          resolve(result);
        };
        resolve(false);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Show the application admin details.
   *
   * @return void
   */
  fetchServices = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        
        resolve(false);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Display a listing of the resource.
   *
   * @return Response
   */
  fetchTransactions = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const { page, perPage } = request.query;
        const offset = (page - 1) * perPage;
  
        const options = {
          limit: parseInt(perPage),
          offset: offset,
          where: {
            userId: request.userData.id
          }
        };
  
        const result = await transaction.findAndCountAll({
          where: options.where, // Apply the where condition
          limit: options.limit,
          offset: options.offset,
          order: [['createdAt', 'DESC']],
          attributes: [
            'id',
            'reference',
            'amount',
            'type',
            'narration',
            'status',
            'createdAt',
          ],
          include: [
            {
              model: service,
              required: true,
              attributes: ['name'],
            },
          ],
        });
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Display a listing of the resource.
   *
   * @return Response
   */
  fetchBalance = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await balance.findOne({
          where: {
            userId: request.userData.id,
            status: true
          }
        });
        resolve(result);
      } catch (e) {  console.log(e)
        reject(e);
      }
    });
  };

  /**
   * Show the application admin details.
   *
   * @return void
   */
  updateProfile = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await user.findOne({
          where: {
            id: request.userData.id
          }
        });
        if (result) {
          await result.update({
            firstname: request.body.firstname,
            lastname: request.body.lastname,
            phone: request.body.phone
          });
          resolve(true);
        }
        resolve(false);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Change a password of the resource.
   *
   * @return Response
   */
  changePassword = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await user.findOne({
          where: {
            id: request.userData.id
          }
        });
        if (!result) {
          resolve('No-user-found');
        } else if(!compareHashPassword(request.body.currentPassword, result.password)) {
          resolve('Password-is-incorrect');
        } else if(request.body.newPassword !== request.body.retypeNewPassword) {
          resolve('Password-does-not-match');
        } else {
          await result.update({
            password: hashPassword(request.body.newPassword)
          });
          resolve(true);
        }
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Verify password of the resource.
   *
   * @return Response
   */
  verifyPassword = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await user.findOne({
          where: {
            id: request.userData.id
          }
        });
        if (!result) {
          resolve('No-user-found');
        };
        if(!compareHashPassword(request.body.currentPassword, result.password)) {
          resolve('Password-is-incorrect');
        };
        await result.update({
          password: hashPassword(request.body.newPassword)
        });
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Verify password of the resource.
   *
   * @return Response
   */
  securityPin = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await user.findOne({
          where: {
            id: request.userData.id 
          }
        });
        if (!result) {
          resolve('No-user-found');
        };
        if(!compareHashPassword(request.body.password, result.password)) {
          resolve('Incorrect-user-password');
        };
        await result.update({
          transactionPin: hashPassword(request.body.pin)
        });
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Show the application admin details.
   *
   * @return void
   */
  updateTwoFactorAuth = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await user.findOne({
          where: {
            id: request.userData.id
          }
        });
        if (!result) {
          resolve(false);
        };
        await data.update({
          twoFactorAuth: request.body.email2FAuth
        });
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Show the application admin details.
   *
   * @return void
   */
  updateBvn = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await user.findOne({
          where: {
            id: request.userData.id
          }
        });
        if (!result) {
          resolve(false);
        };
        await result.update({
          bvn: request.body.bvn,
          isBvnVerified: true,
          bvnVerifiedAt: Date.now()
        });
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Show the application admin details.
   *
   * @return void
   */
  withdraw = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const walletbalance = await balance.findOne({
          where: {
            userId: request.userData.id,
            status: true
          }
        });
        if (walletbalance.current >= request.body.amount) {
          let reference = uniqueNumber(5);
          await transaction.create({
            userId: request.userData.id,
            serviceId: request.body.service,
            reference: reference,
            amount: request.body.amount,
            balanceId: null,
            type: 'Debit',
            bankAccountId: request.body.bankAccount,
            narration: 'Withdrawal initiated',
            status: 'pending',
          });

          /** Send SMS */
          const msg = "Hello Admin! A user initiated a withdrawal. Please attend to it. Thanks";
          await axios.post(`https://account.kudisms.net/api/?username=hammedadewale3366@gmail.com&password=Patriciaogechi@@0&message=${msg}&sender=BitWay.ng&mobiles=${'08069936564'}`);
          resolve(true);
        } else {
          resolve('Insufficient-balance');
        }
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Display a listing of the resource.
   *
   * @return Response
   */  
  fetchBankAccounts = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await bankAccount.findAll({ 
          order: [
            ['createdAt', 'DESC']
          ], 
          where: {
            userId: request.userData.id,
            status: true
          },
          attributes: [
            'id', 
            'bankName', 
            'bankCode', 
            'accountNumber', 
            'accountName',
          ] 
        });
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Verify a specified resource in storage.
   *
   * @return Response
   */
  verifyAccountNumber = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await thirdParty.paystackGetRequest(`bank/resolve?account_number=${request.body.accountNumber}&bank_code=${request.body.bankCode}`);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Store a newly created resource in storage.
   *
   * @param  Request  $request
   * @return Response
   */
  createBankAccount = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await bankAccount.findOne({
          where: {
            userId: request.userData.id,
            accountNumber: request.body.accountNumber,
            bankCode: request.body.bankCode
          }
        });
        if (result === null) {
          await bankAccount.create({
            userId: request.userData.id,
            bankName: request.body.bankName,
            bankCode: request.body.bankCode, 
            accountNumber: request.body.accountNumber,
            accountName: request.body.accountName.toUpperCase(),
            type: 'own'
          });
          resolve(true);
        };
        resolve(false);
      } catch (e) {
        reject(e);
      }
    });
  }; 

  /**
   * Edit the specified resource in storage. 
   *
   * @param  string  $id
   * @return Response
   */
  editBackAccount = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await bankAccount.findOne({
          where: {
            id: request.params.id,
            userId: request.userData.id
          },
          attributes: [
            'id', 
            'bankName', 
            'bankCode', 
            'accountNumber', 
            'accountName'
          ] 
        });
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Update the specified resource in storage.
   *
   * @param  Request  $request
   * @param  string  $id
   * @return Response
   */
  updateBankACcount = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await bankAccount.findOne({
          where: {
            id: request.params.id,
            userId: request.userData.id
          }
        });
        await data.update({
          bankName: request.body.bankName,
          bankCode: request.body.bankCode,
          accountNumber: request.body.accountNumber,
          accountName: request.body.accountName
        });
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Remove the specified resource from storage.
   *
   * @param  string  $id
   * @return Response
   */
  deleteBankAccount = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await bankAccount.findOne({
          where: {
            id: request.params.id,
            userId: request.userData.id
          }
        });
        if (result) {
          data.update({
            status: 0
          });
          resolve(true)
        }
        resolve(false);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Show the application admin details.
   *
   * @return void
   */
  fetchService = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await service.findOne({ 
          where: {
            slug: request.query.slug
          },
          order: [
            ['createdAt', 'DESC']
          ], 
          attributes: [
            'name', 
            'slug',
            'rate',
            'status'
          ]
        });
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Store a newly created resource in storage.
   *
   * @param  Request  $request
   * @return Response
   */
  tradeBitcoin = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await transaction.create({
          userId: request.userData.id,
          serviceId: request.body.service,
          reference: await uniqueNumber(4),
          amount: request.body.amountToReceive, 
          balanceId: null,
          type: 'credit',
          imageUrl: null,
          narration: `$${request.body.amount} bitcoin purchased at ${request.body.rate}/$`,
          status: 'pending',
          completedAt: null
        });
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Store a newly created resource in storage.
   *
   * @param  Request  $request
   * @return Response
   */
  tradeUsdt = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {      
        const uploadResponse = await cloudinary.uploader.upload(request.body.imageUrl, {
          upload_preset: 'bitway_setups'
        });
        const result = await transaction.create({
          userId: request.userData.id,
          serviceId: request.body.service,
          reference: await uniqueNumber(3),
          amount: request.body.amountToReceive, 
          balanceId: null,
          type: 'credit',
          imageUrl: uploadResponse.url,
          narration: `$${request.body.amount} usdt sold at ${request.body.rate}/$`,
          status: 'pending',
          completedAt: null
        });
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  };
}

module.exports = UserService;


      