/**
 * 产品路由
 * 处理服务商城产品展示
 */

const express = require('express');
const router = express.Router();
const db = require('../db/database');

// 服务商城首页
router.get('/mall', (req, res) => {
  const products = db.get('products').filter({ status: 'active' }).value();
  const categories = [...new Set(products.map(p => p.category))];

  // 按分类分组
  const productsByCategory = {};
  categories.forEach(cat => {
    productsByCategory[cat] = products.filter(p => p.category === cat);
  });

  res.render('product/mall', {
    title: '服务商城',
    products,
    productsByCategory,
    categories
  });
});

// 产品详情页
router.get('/detail/:id', (req, res) => {
  const product = db.get('products').find({ id: req.params.id }).value();

  if (!product) {
    return res.status(404).render('error', {
      title: '产品不存在',
      message: '您查看的产品不存在或已下架'
    });
  }

  res.render('product/detail', {
    title: product.name,
    product
  });
});

// 添加到购物车 (API)
router.post('/add-to-cart', (req, res) => {
  try {
    if (!req.session.user) {
      return res.json({
        success: false,
        message: '请先登录'
      });
    }

    const userId = req.session.user.id;
    const { productId, quantity = 1 } = req.body;

    const product = db.get('products').find({ id: productId }).value();
    if (!product) {
      return res.json({
        success: false,
        message: '产品不存在'
      });
    }

    // 检查购物车是否已有该产品
    const existingItem = db.get('cart').find({
      userId,
      productId
    }).value();

    if (existingItem) {
      // 更新数量
      db.get('cart').find({ id: existingItem.id }).assign({
        quantity: existingItem.quantity + quantity
      }).write();
    } else {
      // 添加到购物车
      db.get('cart').push({
        id: require('uuid').v4(),
        userId,
        productId,
        productName: product.name,
        price: product.price,
        period: product.period,
        quantity,
        createdAt: new Date().toISOString()
      }).write();
    }

    res.json({
      success: true,
      message: '已添加到购物车'
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.json({
      success: false,
      message: '添加失败，请稍后重试'
    });
  }
});

module.exports = router;
