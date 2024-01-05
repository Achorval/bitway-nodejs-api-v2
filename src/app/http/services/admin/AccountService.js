const axios = require('axios');
const jwt = require('jsonwebtoken');
const { Op, Sequelize } = require('sequelize');
const config = require('../../../../utils/constant');
const { slug } = require('../../../../utils/functions');
const { 
  user,
  service, 
  bankAccount,
  transaction,
  balance
} = require('../../../models');

class AccountService {
  
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
   * Block User Account.
   *
   * @return void
   */
  blockCustomerAccount = (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await user.update({ 
          blocked: request.body.blocked
        },{
          where: {
            id: request.body.userId
          }
        });
        resolve(result);
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
  userCountOverview = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Use Sequelize to query your database for user counts
        const result = await user.count();
        resolve(result);
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
  transactionOverview = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const { period } = request.query;

        let processedTransactionAmount;
        const today = new Date();
        let startDate;

        // Calculate the start date based on the 'period' parameter
        if (period === 'Weekly') {
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 7);
        } else if (period === 'Monthly') {
          startDate = new Date(today);
          startDate.setMonth(today.getMonth() - 1);
        } else if (period === 'Yearly') {
          startDate = new Date(today);
          startDate.setFullYear(today.getFullYear() - 1);
        } else if (period === 'All') {
          startDate = null;
        } 
         
        if (startDate === null) {
          processedTransactionAmount = await transaction.sum('amount');
        } else {
          processedTransactionAmount = await transaction.sum('amount', {
            where: {
              createdAt: {
                [Op.gte]: startDate,
              }
            }
          });
        }
        resolve(processedTransactionAmount);
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
  withdrawalOverview = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const { period } = request.query;

        let processedWithdrawalAmount;
        const today = new Date();
        let startDate;

        // Calculate the start date based on the 'period' parameter
        if (period === 'Weekly') {
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 7);
        } else if (period === 'Monthly') {
          startDate = new Date(today);
          startDate.setMonth(today.getMonth() - 1);
        } else if (period === 'Yearly') {
          startDate = new Date(today);
          startDate.setFullYear(today.getFullYear() - 1);
        } else if (period === 'All') {
          startDate = null;
        } 
         
        if (startDate === null) {
          processedWithdrawalAmount = await transaction.sum('amount');
        } else {
          processedWithdrawalAmount = await transaction.sum('amount', {
            where: {
              createdAt: {
                [Op.gte]: startDate,
              }
            }
          });
        }
        resolve(processedWithdrawalAmount);
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
  fetchCustomers = (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const { page, perPage, q } = request.query;

        // Calculate the offset correctly
        const offset = (page - 1) * perPage;

        // Define the options for querying
        const options = {
          limit: parseInt(perPage),
          offset: offset,
          where: {}
        };

        // Apply filters if provided
        if (q) {
          options.where[Op.or] = [
            { firstname: { [Op.like]: `%${q}%` } },
            { lastname: { [Op.like]: `%${q}%` } },
            { email: { [Op.like]: `%${q}%` } },
            { phone: { [Op.like]: `%${q}%` } }
          ];
        };
        
        const result = await user.findAndCountAll({ 
          order: [
            ['createdAt', 'DESC']
          ], 
          attributes: [
            'id', 
            'email',
            'firstname',
            'lastname',
            'phone',
            'gender',
            'blocked'
          ],
          ...options
        });
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  };

  /**
   * Display the specified resource.
   *
   * @param  int  $id
   * @return Response
   */
  fetchCustomer = (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await user.findOne({ 
          attributes: [
            'id', 
            'firstname', 
            'lastname',
            'email',
            'emailVerifiedAt',
            'phone', 
            'phoneVerifiedAt',
            'dob',
            'gender'
          ],
          where: {
            id: request.query.id
          }
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
  fetchTransactions = (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const { page, perPage, q } = request.query;

        // Calculate the offset correctly
        const offset = (page - 1) * perPage;

        // Define the options for querying
        const options = {
          limit: parseInt(perPage),
          offset: offset,
          where: {}
        };

        // Apply filters if provided
        if (q) {
          options.where[Op.or] = [
            { firstname: { [Op.like]: `%${q}%` } },
            { lastname: { [Op.like]: `%${q}%` } },
            { email: { [Op.like]: `%${q}%` } },
            { phone: { [Op.like]: `%${q}%` } }
          ];
        };
        
        const result = await transaction.findAndCountAll({ 
          order: [
            ['createdAt', 'DESC']
          ], 
          attributes: [
            'id',
            'serviceId',
            'reference', 
            'amount', 
            'type',
            'narration',
            'imageUrl',
            'status',
            'createdAt'
          ],
          include: [{
            model: service, 
            required: true,
            attributes: [
              'id',
              'name'
            ] 
          },
          {
            model: user, 
            required: true,
            attributes: [
              'id',
              'firstname',
              'lastname'
            ] 
          }],
          ...options
        });
        resolve(result);
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
  fetchTransactionDetails = (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await transaction.findOne({ 
          order: [
            ['createdAt', 'DESC']
          ],
          where: {
            id: request.query.id
          },
          attributes: [
            'id',
            'serviceId',
            'reference', 
            'amount', 
            'type',
            'narration',
            'imageUrl',
            'status',
            'createdAt'
          ],
          include: [{
            model: service, 
            required: true,
            attributes: [
              'id',
              'name'
            ] 
          },
          {
            model: user, 
            required: true,
            attributes: [
              'id',
              'firstname',
              'lastname'
            ] 
          },
          {
            model: bankAccount, 
            required: false,
            attributes: [
              'id',
              'bankName',
              'accountNumber',
              'accountName'
            ] 
          }]
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
  debitUserBalance = async (userId, amount) => {
    return new Promise(async (resolve, reject) => {
      try {
        const balanceData = await balance.findOne({
          where: {
            userId: request.body.userId,
            status: true
          }
        });
        if (balanceData) {
          balanceData.update({
            status: false
          });
          await balance.create({
            userId: userId,
            previous: balanceData.current,
            book: 0.00,
            current: (parseFloat(balanceData.current)) - (parseFloat(amount)),
            status: true
          });
          resolve(true);
        } else {
          resolve(false);
        }
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
  creditUserBalance = async (userId, amount) => {
    return new Promise(async (resolve, reject) => {
      try {
        const balanceData = await balance.findOne({
          where: {
            userId: request.body.userId,
            status: true
          }
        });
        if (balanceData) {
          balanceData.update({
            status: false
          });
          await balance.create({
            userId: userId,
            previous: balanceData.current,
            book: 0.00,
            current: (parseFloat(balanceData.current)) + (parseFloat(amount)),
            status: true
          });
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (e) { 
        reject(e);
      }
    });
  };

  /**
   * Display the specified resource.
   *
   * @param  int  $id
   * @return Response
   */
  creditDebitCustomerWallet = (username, type, amount) => {
    return new Promise(async (resolve, reject) => {
      try {
        const userData = await user.findOne({
          where: {
            [Sequelize.Op.or]: [
              { email: username },
              { phone: username }
            ]
          }
        });
        if (!userData) {
          resolve('User-not-found')
        };
        const balanceData = await balance.findOne({
          where: {
            userId: userData.id,
            status: true
          }
        });  
        if (balanceData) {
          if (type === 'Debit' && parseFloat(amount) > parseFloat(balanceData.current)) {
            resolve('Insufficient-wallet');
          } else {
            balanceData.update({
              status: false
            });
            let newBalance = balanceData.current;
            if (type === 'Credit') {
              newBalance += amount;
            } else if (type === 'Debit') {
              newBalance -= amount;
            } else {
              resolve(false);
            };
            await balance.create({
              userId: userData.id,
              previous: balanceData.current,
              book: 0,
              current: newBalance,
              status: true  
            });
            resolve(true)
          }
        } 
        resolve(false);
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
  updateTransactionStatus = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const userData = await user.findOne({ 
          where: {
            id: request.body.userId
          }
        });
  
        if (request.body.status === "success" && (request.body.service === "Sell Bitcoin" || request.body.service === "Sell USDT")) {

          const walletbalance = await balance.findOne({
            where: {
              userId: request.body.userId,
              status: true
            }
          });
  
          walletbalance.update({
            status: false
          });
  
          const balanceData = await balance.create({
            userId: request.body.userId,
            previous: walletbalance.current,
            book: 0.00,
            current: (parseFloat(walletbalance.current)) + (parseFloat(request.body.amount)),
            status: true
          });
  
          const transData = await transaction.findOne({  
            where: {
              id: request.body.id,
              userId: request.body.userId
            }
          });
  
          transData.update({
            status: request.body.status,
            balanceId: balanceData.id
          });
  
          // ** Send SMS
          const msg = "Your trade has been successfully confirmed, please refresh your dashboard to view your wallet balance and initiate a withdrawal. Thanks for choosing BitWay";
          await axios.post(`https://account.kudisms.net/api/?username=hammedadewale3366@gmail.com&password=Patriciaogechi@@0&message=${msg}&sender=BitWay.ng&mobiles=${userData.phone}`);
          
          resolve(true);
  
        } else if (request.body.status === "success" && request.body.service === "Withdrawal") {

          const walletbalance = await balance.findOne({
            where: {
              userId: request.body.userId,
              status: true
            }
          });
  
          walletbalance.update({
            status: false
          });
  
          const balanceData = await balance.create({
            userId: request.body.userId,
            previous: walletbalance.current,
            book: 0.00,
            current: (parseFloat(walletbalance.current)) - (parseFloat(request.body.amount)),
            status: true
          });
  
          const transData = await transaction.findOne({  
            where: {
              id: request.body.id,
              userId: request.body.userId
            }
          });
  
          transData.update({
            status: request.body.status,
            balanceId: balanceData.id
          });
  
          // ** Send SMS
          const msg = "Your withdraw request has been successfully confirmed. Thanks for choosing BitWay";
          await axios.post(`https://account.kudisms.net/api/?username=hammedadewale3366@gmail.com&password=Patriciaogechi@@0&message=${msg}&sender=BitWay.ng&mobiles=${userData.phone}`);
  
          resolve(true);

        } else if (request.body.status === "failed") {
          
          const transData = await transaction.findOne({  
            where: {
              id: request.body.id,
              userId: request.body.userId
            }
          });
  
          transData.update({
            status: request.body.status
          });
      
          resolve(true);
        }
        resolve(false);
      } catch (e) {
        console.log(e)
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
  fetchWithdrawals = (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const { page, perPage, q } = request.query;

        // Calculate the offset correctly
        const offset = (page - 1) * perPage;

        // Define the options for querying
        const options = {
          limit: parseInt(perPage),
          offset: offset,
          where: {}
        };

        // Apply filters if provided
        if (q) {
          options.where[Op.or] = [
            { firstname: { [Op.like]: `%${q}%` } },
            { lastname: { [Op.like]: `%${q}%` } },
            { email: { [Op.like]: `%${q}%` } },
            { phone: { [Op.like]: `%${q}%` } }
          ];
        };
        
        const result = await transaction.findAndCountAll({ 
          order: [
            ['createdAt', 'DESC']
          ], 
          attributes: [
            'id',
            'serviceId',
            'reference',
            'amount',
            'type',
            'status'
          ],
          include: [{
            model: service, 
            required: true,
            attributes: [
              'id',
              'name'
            ] 
          },
          {
            model: user, 
            required: true,
            attributes: [
              'id',
              'firstname',
              'lastname'
            ]
          }],
          ...options
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
  updateWithdrawal = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await transaction.findOne({
          where: {
            id: request.body.id,
            status: 'pending'
          },
        });
        if (result) {
          result.update({
            status: request.body.status
          });
          resolve(true);
        } else {
          resolve(false);
        }
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
  fetchServices = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const { page, perPage, q } = request.query;

        // Calculate the offset correctly
        const offset = (page - 1) * perPage;

        // Define the options for querying
        const options = {
          limit: parseInt(perPage),
          offset: offset,
          where: {}
        };

        // Apply filters if provided
        if (q) {
          options.where[Op.or] = [
            { name: { [Op.like]: `%${q}%` } }
          ];
        };
        
        const result = await service.findAndCountAll({ 
          order: [
            ['createdAt', 'DESC']
          ], 
          attributes: [
            'id', 
            'name',
            'imageUrl', 
            'url', 
            'color',
            'slug',
            'rate',
            'description',
            'status'
          ],
          ...options
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
  createService = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await service.create({
          name: request.body.name,
          slug: await slug(request.body.name),
          imageUrl: '',
          url: '',
          color: '',
          rate: request.body.rate,
          description: request.body.description,
          status: request.body.status
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
  updateService = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await service.findOne({
          where: {
            id: request.params.id
          },
          attributes: [
            'id', 
            'name', 
            'slug',
            'imageUrl',
            'url',
            'color',
            'rate',
            'description'
          ]
        });
        if (result) {
          await result.update({
            name: request.body.name,
            slug: await slug(request.body.name),
            imageUrl: '',
            url: '',
            color: '',
            rate: request.body.rate,
            description: request.body.description,
            status: request.body.status
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
   * Remove the specified resource from storage.
   *
   * @param  string  $id
   * @return Response
   */
  deleteService = async (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await service.destroy({
          where: {
            id: request.params.id
          }
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
  serviceStatus = async  (request) => {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await service.findOne({
          where: {
            id: request.body.id
          },
          attributes: [
            'id',  
            'status',
          ]
        });
        if (result) {
          await result.update({
            status: request.body.status
          });
          resolve(true);
        }
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  };
}

module.exports = AccountService;