const authorize = require('authorizenet');
const env = 'development';

const config = {
  development: {
    apiLoginId: '897bMjLMv6px',
    transactionKey: '2zA6824PwQ4tp75m',
    environment: authorize.Constants.endpoint.sandbox,
  },
  production: {
    apiLoginId: '897bMjLMv6px',
    transactionKey: '2zA6824PwQ4tp75m',
    environment: authorize.Constants.endpoint.production,
  }
};

const apiLoginId = config[env].apiLoginId;
const transactionKey = config[env].transactionKey;
const environment = config[env].environment;

// const client = new authorize.ApiClient({ authData: { username: apiLoginId, password: transactionKey } });
var client = new authorize.APIContracts.MerchantAuthenticationType()
client.setName(apiLoginId)
client.setTransactionKey(transactionKey)
client.basePath = environment // change this to `authorize.Environment.PRODUCTION` for production

const apiInstance = client

module.exports = apiInstance;
