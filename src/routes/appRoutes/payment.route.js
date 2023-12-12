const authorize = require('authorizenet');
const config = require('../../services/config/payment');

const express = require('express');
const router = express.Router();
const authorize = require('authorizenet');

router.post('/charge', (req, res) => {
  const API_LOGIN_ID = config.apiLoginId;
  const TRANSACTION_KEY = config.transactionKey;

  const apiClient = new authorize.ApiClient();
  apiClient.merchantAuthentication.setLoginId(API_LOGIN_ID);
  apiClient.merchantAuthentication.setTransactionKey(TRANSACTION_KEY);

  const createTransactionRequest =
    new authorize.CreateTransactionRequest();
  const transactionRequestType =
    new authorize.TransactionRequestType();
  transactionRequestType.setTransactionType(
    authorize.TransactionTypeEnum.AUTH_CAPTURE_TRANSACTION
  );
  transactionRequestType.setAmount(req.body.amount); // assuming the amount is sent in the request body
  transactionRequestType.setPayment(
    new authorize.PaymentType({
      creditCard: new authorize.CreditCardType({
        cardNumber: req.body.cardNumber, // assuming card number and expiration date are sent in the request body
        expirationDate: req.body.expirationDate,
      }),
    })
  );
  createTransactionRequest.setTransactionRequest(
    transactionRequestType
  );

  authorize.Transaction.createTransaction(
    createTransactionRequest,
    (error, response) => {
      if (error) {
        console.log(error);
        res.status(500).send('Error processing payment');
      } else {
        console.log(response);
        res.send('Payment processed successfully');
      }
    }
  );
});

module.exports = router;
