/**
 * 首页路由
 * 处理网站首页和控制台总览页面
 */

const express = require('express');
const router = express.Router();
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');

// 首页
router.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/console');
  }
  res.redirect('/auth/login');
});

// 控制台总览页面
router.get('/console', authMiddleware.requireLogin, (req, res) => {
  const userId = req.session.user.id;

  // 获取用户的服务数量
  const services = db.get('services').filter({ userId }).value();
  const activeServices = services.filter(s => s.status === 'running').length;
  const stoppedServices = services.filter(s => s.status === 'stopped').length;

  // 获取用户订单数量
  const orders = db.get('orders').filter({ userId }).value();
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  // 获取用户消费统计
  const bills = db.get('bills').filter({ userId }).value();
  const totalConsumption = bills.reduce((sum, b) => sum + (b.amount || 0), 0);

  // 获取购物车数量
  const cartItems = db.get('cart').filter({ userId }).value();
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  res.render('console/index', {
    title: '控制台总览',
    activeServices,
    stoppedServices,
    totalServices: services.length,
    pendingOrders,
    totalOrders: orders.length,
    totalConsumption: totalConsumption.toFixed(2),
    cartCount,
    recentOrders: orders.slice(-5).reverse(),
    recentServices: services.slice(-5).reverse()
  });
});

module.exports = router;
