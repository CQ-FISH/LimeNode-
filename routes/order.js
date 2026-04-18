/**
 * 订单路由
 * 处理订单管理、支付等功能
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

// 订单列表页面
router.get('/', (req, res) => {
  const userId = req.session.user.id;
  const orders = db.get('orders').filter({ userId }).value().reverse();

  res.render('order/index', {
    title: '订单管理',
    orders
  });
});

// 创建订单并支付
router.post('/create', (req, res) => {
  try {
    const userId = req.session.user.id;
    const { paymentMethod = 'balance' } = req.body;

    // 获取购物车项目
    const cartItems = db.get('cart').filter({ userId }).value();
    if (cartItems.length === 0) {
      return res.json({
        success: false,
        message: '购物车为空'
      });
    }

    // 计算总价
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // 获取用户信息
    const user = db.get('users').find({ id: userId }).value();

    // 检查余额是否足够
    if (paymentMethod === 'balance' && user.balance < totalAmount) {
      return res.json({
        success: false,
        message: '余额不足，请充值'
      });
    }

    // 创建订单
    const orderId = 'ORD' + Date.now();
    const order = {
      id: orderId,
      userId,
      items: cartItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        period: item.period,
        quantity: item.quantity
      })),
      totalAmount,
      paymentMethod,
      status: 'paid', // 直接模拟支付成功
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString()
    };

    db.get('orders').push(order).write();

    // 扣除余额
    if (paymentMethod === 'balance') {
      db.get('users').find({ id: userId }).assign({
        balance: user.balance - totalAmount,
        updatedAt: new Date().toISOString()
      }).write();

      req.session.user.balance = user.balance - totalAmount;
    }

    // 清空购物车
    db.get('cart').remove({ userId }).write();

    // 为每个产品创建服务实例（如果是服务类产品）
    for (const item of cartItems) {
      const product = db.get('products').find({ id: item.productId }).value();
      if (product && product.type === 'cloud_server') {
        // 创建服务实例
        db.get('services').push({
          id: 'SVS' + Date.now() + Math.random().toString(36).substr(2, 6),
          userId,
          orderId,
          productId: item.productId,
          productName: item.productName,
          specs: product.specs,
          status: 'running', // 默认开机状态
          ip: '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
          createdAt: new Date().toISOString(),
          expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }).write();
      }
    }

    // 添加账单记录
    db.get('bills').push({
      id: uuidv4(),
      userId,
      type: 'consumption',
      amount: -totalAmount,
      balance: user.balance - totalAmount,
      description: `订单支付 ${orderId}`,
      status: 'completed',
      createdAt: new Date().toISOString()
    }).write();

    res.json({
      success: true,
      message: '支付成功',
      orderId,
      redirect: '/order'
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.json({
      success: false,
      message: '订单创建失败，请稍后重试'
    });
  }
});

// 模拟支付（用于测试）
router.post('/pay', (req, res) => {
  try {
    const userId = req.session.user.id;
    const { orderId } = req.body;

    const order = db.get('orders').find({ id: orderId, userId }).value();
    if (!order) {
      return res.json({
        success: false,
        message: '订单不存在'
      });
    }

    if (order.status === 'paid') {
      return res.json({
        success: false,
        message: '订单已支付'
      });
    }

    // 更新订单状态
    db.get('orders').find({ id: orderId }).assign({
      status: 'paid',
      paidAt: new Date().toISOString()
    }).write();

    res.json({
      success: true,
      message: '支付成功'
    });
  } catch (error) {
    console.error('Pay order error:', error);
    res.json({
      success: false,
      message: '支付失败'
    });
  }
});

// 订单详情
router.get('/detail/:id', (req, res) => {
  const userId = req.session.user.id;
  const order = db.get('orders').find({ id: req.params.id, userId }).value();

  if (!order) {
    return res.status(404).render('error', {
      title: '订单不存在',
      message: '您查看的订单不存在'
    });
  }

  res.render('order/detail', {
    title: '订单详情',
    order
  });
});

module.exports = router;
