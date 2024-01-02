const axios = require('axios');
require('dotenv').config();

//= ======================================
  //  PAYSTACK SERVICES
  //--------------------------------------
exports.paystackGetRequest =  async (endPoint) => {
    try {
        const data = await axios.get(`https://api.paystack.co/${endPoint}`, {
            headers: {
                'Authorization': `Bearer sk_live_0268cd9da6181f3822cc9900fa080c0bf639a892`,
                'Content-Type': 'application/json'
            },
        });

        return data;

    } catch (error) {
        return false;
    }
};

//= ======================================
//  BULKSMS SERVICES
//----------------------------------------
exports.bulkSmsPostRequest =  async (endPoint, payload) => {
    try {
        const data = await axios.post(`https://www.bulksmsnigeria.com/api/v1/sms/${endPoint}`, {
            ...payload
        });

        return data;

    } catch (error) {
        return false;
    }
};

/**
* Return current transaaction pin resources.
*
* @var string $userId
*/
exports.sendPulseAuthorization = async () => {
    return new Promise(async (resolve, reject) => {
        try {
        const result = await axios.post('https://api.sendpulse.com/oauth/access_token', {
            grant_type: 'client_credentials',
            client_id: '8aa88c52579d9055ec7d81747d7ec824',
            client_secret: '21204d3fd41d2fc43b71c8cbe0ed3337'
        } , {
            headers: {
                'content-type': 'application/json'
            }
        });
            resolve(result.data);
        } catch (e) {
            reject(e)
        }
    });
}

exports.dojahPost = async (endPoint, payload=null) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await module.exports.monnifyAuth();
            if (result.data.requestSuccessful === true) {
                const response = await axios.post(`https://sandbox.dojah.io/${endPoint}`, payload, {
                    headers: {
                        'Authorization': `Bearer ${result.data.responseBody.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                resolve(response);
            }
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
exports.sendSMSMessage = async (message, phone) => {
    return new Promise(async (resolve, reject) => {
      try {
        // ** Send SMS
        const result = await axios.post(`https://account.kudisms.net/api/?username=hammedadewale3366@gmail.com&password=Patriciaogechi@@0&message=${message}&sender=BitWay.ng&mobiles=${phone}`);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
};