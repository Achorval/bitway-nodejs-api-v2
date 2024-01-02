const jwt = require('jsonwebtoken');
const config = require('./constant');
const passwordHash = require('password-hash');

/**
 * Create a new unique instance.
 *
 * @return unique
 */
exports.uniqueNumber = (length) => {
  var time = new Date().getTime();
  var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var result = '';
  for ( var i = 0; i < length; i++ ) {
    result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  return time+result;
}

/**
* Create a slug.
*
* @var string
*/
exports.slug = async (Text) => {
  return Text
  .toLowerCase()
  .replace(/[^\w ]+/g,'')
  .replace(/ +/g,'-')
  ;
};

/**
* Create a Title case.
*
* @var string
*/
exports.titleCase = (str) => {
  var splitStr = str.toLowerCase().split(' ');
  for (var i = 0; i < splitStr.length; i++) {
    splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
  }
  return splitStr.join(' '); 
};

/**
* Create a Title case.
*
* @var string
*/
exports.hashPassword = (password) => {
  return passwordHash.generate(password); 
}

/**
* Create a Title case.
*
* @var string
*/
exports.compareHashPassword = (password, hashedPassword) => {
  return passwordHash.verify(password, hashedPassword); 
}

exports.accessToken = (id) => {
  if (id) {
    return jwt.sign({ id: id }, config.AccessTokenSecretKey, { expiresIn: config.ONE_WEEK });  
  }
}

/**
* Create a Title case.
*
* @var string
*/
exports.refresToken = (id) => {
  if (id) {
    return jwt.sign({ id: id }, config.RefreshTokenSecretKey, { expiresIn: config.ONE_WEEK });
  }
};