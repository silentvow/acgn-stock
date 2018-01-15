import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';

import { dbProducts } from '/db/dbProducts';
import { getAvailableProductTradeQuota } from '/db/dbUserOwnedProducts';
import { voteProduct } from '../utils/methods';
import { alertDialog } from '../layout/alertDialog';

Template.productCard.helpers({
  isAdmin() {
    const user = Meteor.user();

    return user && user.profile.isAdmin;
  },
  soldAmount() {
    const { product } = Template.currentData();
    const { totalAmount, stockAmount, availableAmount } = product;

    return totalAmount - stockAmount - availableAmount;
  }
});

Template.productCard.events({
  'click [data-vote-product]'(event) {
    event.preventDefault();
    const productId = $(event.currentTarget).attr('data-vote-product');
    voteProduct(productId);
  },
  'click [data-ban-product]'(event) {
    event.preventDefault();
    const productId = $(event.currentTarget).attr('data-ban-product');
    alertDialog.dialog({
      type: 'prompt',
      title: '違規處理 - 產品下架',
      message: `請輸入處理事由：`,
      callback: function(message) {
        if (message) {
          Meteor.customCall('banProduct', { productId, message });
        }
      }
    });
  },
  'click [data-buy-product]'(event) {
    event.preventDefault();
    const productId = $(event.currentTarget).attr('data-buy-product');

    const { companyId, price, availableAmount } = dbProducts.findOne(productId);

    const tradeQuota = getAvailableProductTradeQuota({
      userId: Meteor.userId(),
      companyId
    });

    if (tradeQuota < price) {
      alertDialog.alert('您的剩餘購買額度不足！');

      return;
    }

    if (Meteor.user().profile.money < price) {
      alertDialog.alert('您的剩餘現金不足！');

      return;
    }

    if (availableAmount <= 0) {
      alertDialog.alerg('該產品已無剩餘數量！');

      return;
    }

    const maxAmount = Math.min(
      availableAmount,
      Math.floor(Meteor.user().profile.money / price),
      Math.floor(tradeQuota / price));

    alertDialog.dialog({
      type: 'prompt',
      inputType: 'number',
      title: '購買產品',
      message: `請輸入數量：(1~${maxAmount})`,
      callback: function(result) {
        if (! result) {
          return;
        }

        const amount = parseInt(result, 10);

        if (! amount || amount <= 0 || amount > maxAmount) {
          alertDialog.alert('不正確的數量設定！');

          return;
        }

        Meteor.customCall('buyProduct', { productId, amount });
      }
    });
  }
});
