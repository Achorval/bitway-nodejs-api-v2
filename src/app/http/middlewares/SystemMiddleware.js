const jwt = require('jsonwebtoken');
const { user, balance } = require('../../models');

const config = {
  accessTokenSecretKey: 'dd5f3089-40c3-403d-af14-d0c228b05cb4',
  refreshTokenSecretKey: '7c4c1c50-3230-45bf-9eae-c9b2e401c767'
};

class SystemMiddleware {
  adminMiddleware = (request, response, next) => {
    try {
      const bearerHeader = request.headers.authorization;
      if (bearerHeader) {
        const ONE_WEEK = 60 * 60 * 24 * 7;
        const token = bearerHeader.split(' ')[1];
        jwt.verify(token, config.accessTokenSecretKey, { expiresIn: ONE_WEEK }, (err, decoded) => {
          if (decoded) {
            user.findOne({
              where: {
                id: decoded.id
              },
              attributes: [
                'id', 
                'firstname', 
                'lastname',
                'email',
                'isEmailVerified',
                'phone', 
                'isPhoneVerified',
                'dob',
                'gender',
                'bvn',
                'isBvnVerified', 
                'isDocumentVerified',
                'balanceStatus',
                'blocked'
              ], 
            }).then(function (adminData) {
              request.adminData = adminData
              next();
            });
          } else if (err.message === 'jwt expired') {
            return response.status(403).send({
              error: true,
              message: "Access token expired!"
            });
          } else {
            return response.status(403).send({
              error: true,
              message: "Unauthorized!"
            });
          }
        });
    } else {
        return response.status(403).send({
          error: true,
          message: "No token provided!"
        });
      };
    } catch (error) {
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later'
      })
    }
  }

  userMiddleware = (request, response, next) => {
    try {
      const bearerHeader = request.headers.authorization;
      if ( bearerHeader ) {
        const ONE_WEEK = 60 * 60 * 24 * 7;
        const token = bearerHeader.split(' ')[1];
        jwt.verify(token, config.accessTokenSecretKey, { expiresIn: ONE_WEEK },  (err, decoded) => {
          if (decoded) {
            user.findOne({
              where: {
                id: decoded.id
              },
              attributes: [
                'id', 
                'firstname', 
                'lastname',
                'email',
                'isEmailVerified',
                'emailVerifiedAt',
                'phone', 
                'isPhoneVerified',
                'dob',
                'gender',
                'bvn',
                'isBvnVerified', 
                'isDocumentVerified',
                'transactionPin',
                'balanceStatus',
                'blocked'
              ],
              include: {
                model: balance,
                required: true,
                where: {
                  userId: decoded.id,
                  status: true
                },
                attributes: [
                  'current'
                ]
              }
            }).then(function (userData) {
              request.userData = userData
              next();
            });
          } else if (err.message === 'jwt expired') {
            return response.status(403).send({
              error: true,
              message: "Access token expired!"
            });
          } else {
            return response.status(403).send({
              error: true,
              message: "Unauthorized!"
            });
          }
        });
      } else {
        return response.status(403).send({
          error: true,
          message: "No token provided!"
        });
      };
    } catch (error) {  
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later'
      })
    }
  }
  
  emailMiddleware = (request, response, next) => {
    try {
      const token = request.body.token;
      if ( token ) {
        jwt.verify(token, config.accessTokenSecretKey,  (err, decoded) => { 
          if (decoded) {
            
            request.authUser = decoded;
            next();
  
          } else if (err.message === 'jwt expired') {
            return response.status(403).send({
              error: true,
              message: "Access token expired!"
            });
          } else {
            return response.status(403).send({
              error: true,
              message: "Unauthorized!"
            });
          }
        });
      }   else {
        return response.status(403).send({
          message: "No token provided!"
        });
      };
    } catch (error) { 
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later'
      })
    }
  }
  
  recoveryMiddleware = (request, response, next) => {
    try {
      const token = request.body.token;
      if ( token ) {
        jwt.verify(token, config.accessTokenSecretKey,  (err, decoded) => { 
          if (decoded) {
            request.authUser = decoded;
            next();
  
          } else if (err.message === 'jwt expired') {
            return response.status(403).send({
              status: 'error',
              message: "Access token expired!"
            });
          } else {
            return response.status(403).send({
              status: 'error',
              message: "Unauthorized!"
            });
          }
        });
      }   else {
        return response.status(403).send({
          status: 'error',
          message: "No token provided!"
        });
      };
    } catch (error) { 
      return response.status(400).send({
        status: 'error',
        message: 'An Error Occured, try again later'
      })
    }
  }
};

module.exports = SystemMiddleware;