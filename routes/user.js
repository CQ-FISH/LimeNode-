/**
 * 用户路由
 * 处理个人中心、资料修改、账单等功能
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');

// 个人中心页面
router.get('/profile', (req, res) => {
  const userId = req.session.user.id;
  const user = db.get('users').find({ id: userId }).value();

  res.render('user/profile', {
    title: '个人中心',
    user: {
      ...user,
      password: '' // 不显示密码
    }
  });
});

// 修改资料
router.post('/profile/update', (req, res) => {
  try {
    const userId = req.session.user.id;
    const { email, phone, realname } = req.body;

    db.get('users').find({ id: userId }).assign({
      email,
      phone,
      realname,
      updatedAt: new Date().toISOString()
    }).write();

    // 更新 session
    req.session.user.email = email;
    req.session.user.phone = phone;
    req.session.user.realname = realname;

    res.json({
      success: true,
      message: '资料更新成功'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.json({
      success: false,
      message: '更新失败，请稍后重试'
    });
  }
});

// 修改密码
router.post('/profile/password', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.json({
        success: false,
        message: '请填写所有密码字段'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.json({
        success: false,
        message: '两次密码输入不一致'
      });
    }

    if (newPassword.length < 6) {
      return res.json({
        success: false,
        message: '密码长度不能少于6位'
      });
    }

    const user = db.get('users').find({ id: userId }).value();
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: '原密码错误'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.get('users').find({ id: userId }).assign({
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    }).write();

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.json({
      success: false,
      message: '修改失败，请稍后重试'
    });
  }
});

// 实名认证
router.post('/profile/realname', (req, res) => {
  try {
    const userId = req.session.user.id;
    const { realname, idCard } = req.body;

    if (!realname || !idCard) {
      return res.json({
        success: false,
        message: '请填写真实姓名和身份证号'
      });
    }

    // 简单验证身份证号格式
    if (idCard.length !== 18) {
      return res.json({
        success: false,
        message: '身份证号格式不正确'
      });
    }

    db.get('users').find({ id: userId }).assign({
      realname,
      idCard,
      verified: true,
      verifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).write();

    req.session.user.realname = realname;

    res.json({
      success: true,
      message: '实名认证成功'
    });
  } catch (error) {
    console.error('Realname verification error:', error);
    res.json({
      success: false,
      message: '认证失败，请稍后重试'
    });
  }
});

// 账单页面
router.get('/billing', (req, res) => {
  const userId = req.session.user.id;
  const bills = db.get('bills').filter({ userId }).value().reverse();
  const user = db.get('users').find({ id: userId }).value();

  res.render('user/billing', {
    title: '账单管理',
    bills,
    balance: user.balance
  });
});

// 充值页面
router.get('/recharge', (req, res) => {
  const user = db.get('users').find({ id: req.session.user.id }).value();

  res.render('user/recharge', {
    title: '账户充值',
    balance: user.balance
  });
});

// 充值处理
router.post('/recharge', (req, res) => {
  try {
    const userId = req.session.user.id;
    const { amount } = req.body;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.json({
        success: false,
        message: '充值金额不正确'
      });
    }

    // 更新用户余额
    const user = db.get('users').find({ id: userId }).value();
    const newBalance = user.balance + amountNum;

    db.get('users').find({ id: userId }).assign({
      balance: newBalance,
      updatedAt: new Date().toISOString()
    }).write();

    // 添加账单记录
    db.get('bills').push({
      id: require('uuid').v4(),
      userId,
      type: 'recharge',
      amount: amountNum,
      balance: newBalance,
      description: `账户充值 ${amountNum} 元`,
      status: 'completed',
      createdAt: new Date().toISOString()
    }).write();

    // 更新 session
    req.session.user.balance = newBalance;

    res.json({
      success: true,
      message: '充值成功',
      newBalance
    });
  } catch (error) {
    console.error('Recharge error:', error);
    res.json({
      success: false,
      message: '充值失败，请稍后重试'
    });
  }
});

module.exports = router;
