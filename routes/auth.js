/**
 * 认证路由
 * 处理用户登录、注册、登出等功能
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const authMiddleware = require('../middleware/auth');

// 登录页面
router.get('/login', authMiddleware.requireGuest, (req, res) => {
  res.render('auth/login', {
    title: '用户登录',
    redirect: req.query.redirect || '/console'
  });
});

// 注册页面
router.get('/register', authMiddleware.requireGuest, (req, res) => {
  res.render('auth/register', {
    title: '用户注册'
  });
});

// 登录处理
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({
        success: false,
        message: '请输入用户名和密码'
      });
    }

    // 查找用户
    const user = db.get('users').find({ username }).value();
    if (!user) {
      return res.json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 更新最后登录时间
    db.get('users').find({ id: user.id }).assign({
      lastLoginAt: new Date().toISOString()
    }).write();

    // 设置 session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      level: user.level,
      realname: user.realname,
      balance: user.balance || 0
    };

    res.json({
      success: true,
      message: '登录成功',
      redirect: req.body.redirect || '/console'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

// 注册处理
router.post('/register', async (req, res) => {
  try {
    const { username, password, confirmPassword, email, phone, agreeTerms } = req.body;

    // 验证必填项
    if (!username || !password || !email) {
      return res.json({
        success: false,
        message: '请填写所有必填项'
      });
    }

    // 验证密码确认
    if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: '两次密码输入不一致'
      });
    }

    // 验证协议
    if (!agreeTerms) {
      return res.json({
        success: false,
        message: '请同意用户协议'
      });
    }

    // 检查用户名是否存在
    const existingUser = db.get('users').find({ username }).value();
    if (existingUser) {
      return res.json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 检查邮箱是否存在
    const existingEmail = db.get('users').find({ email }).value();
    if (existingEmail) {
      return res.json({
        success: false,
        message: '邮箱已被注册'
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const newUser = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      email,
      phone: phone || '',
      level: 'free', // free, basic, pro, enterprise
      balance: 100, // 新用户赠送100元
      realname: '',
      idCard: '',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    db.get('users').push(newUser).write();

    // 自动登录
    req.session.user = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      phone: newUser.phone,
      level: newUser.level,
      realname: newUser.realname,
      balance: newUser.balance
    };

    res.json({
      success: true,
      message: '注册成功',
      redirect: '/console'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
});

// 登出
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/auth/login');
});

module.exports = router;
