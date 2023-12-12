const cron = require('node-cron');
const WalletModel=require('../../models/wallets.model')
const moment = require('moment');
const mongoose = require('mongoose');
const ClosingBalanceModel=require('../../models/closing_balance.model')
module.exports.wallet = () => {
    cron.schedule('0 0 * * *', async() => {
      console.log('Running a cron job after 24 hour');
      
      const wallets = await WalletModel.find();
      const yesterday = moment().subtract(1, 'days').toDate();
  await Promise.all(wallets.map(async(wallet)=>{
    const closingBalance = new ClosingBalanceModel({
        closing_credit: wallet.total_credit,
        gift_granted_credit: wallet.gift_granted_credit,
        gift_recived_credit: wallet.gift_recived_credit,
        created_by: wallet.created_by,
        wallet_id: wallet._id,
        posted_at: yesterday
      });
      
      await closingBalance.save();
  }))
     
    });
  }
