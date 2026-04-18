/**
 * 购物车路由
 * 处理购物车管理和结算
 */

const express = require('express');
const router = express.Router();
const db = require('../db/database');

// 购物车页面
router.get('/', (req, res) => {
  const userId = req.session.user.id;
  const cartItems = db.get('cart').filter({ userId }).value();

  // 计算总价
  const totalPrice = cartItems.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  res.render('cart/index', {
    title: '购物车',
    cartItems,
    totalPrice: totalPrice.toFixed(2)
  });
});

// 更新购物车数量
router.post('/update', (req, res) => {
  try {
    const userId = req.session.user.id;
    const { cartId, quantity } = req.body;

    const cartItem = db.get('cart').find({ id: cartId, userId }).value();
    if (!cartItem) {
      return res.json({
        success: false,
        message: '购物车项目不存在'
      });
    }

    if (quantity <= 0) {
      // 删除项目
      db.get('cart').remove({ id: cartId }).write();
    } else {
      db.get('cart').find({ id: cartId }).assign({
        quantity
      }).write();
    }

    // 重新计算总价
    const cartItems = db.get('cart').filter({ userId }).value();
    const totalPrice = cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    res.json({
      success: true,
      message: '更新成功',
      totalPrice: totalPrice.toFixed(2)
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.json({
      success: false,
      message: '更新失败'
    });
  }
});

// 删除购物车项目
router.post('/remove', (req, res) => {
  try {
    const userId = req.session.user.id;
    const { cartId } = req.body;

    db.get('cart').remove({ id: cartId, userId }).write();

    // 重新计算总价
    const cartItems = db.get('cart').filter({ userId }).value();
    const totalPrice = cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    res.json({
      success: true,
      message: '已删除',
      totalPrice: totalPrice.toFixed(2)
    });
  } catch (error) {
    console.error('Remove cart error:', error);
    res.json({
      success: false,
      message: '删除失败'
    });
  }
});

// 清空购物车
router.post('/clear', (req, res) => {
  try {
    const userId = req.session.user.id;
    db.get('cart').remove({ userId }).write();

    res.json({
      success: true,
      message: '购物车已清空'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.json({
      success: false,
      message: '清空失败'
    });
  }
});

// 结算
router.get('/checkout', (req, res) => {
  const userId = req.session.user.id;
  const cartItems = db.get('cart').filter({ userId }).value();

  if (cartItems.length === 0) {
    return res.redirect('/cart');
  }

  const totalPrice = cartItems.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const user = db.get('users').find({ id: userId }).value();

  res.render('cart/checkout', {
    title: '确认订单',
    cartItems,
    totalPrice: totalPrice.toFixed(2),
    balance: user.balance,
    canPay: user.balance >= totalPrice
  });
});

module.exports = router;
