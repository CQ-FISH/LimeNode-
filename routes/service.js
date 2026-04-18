/**
 * 服务路由
 * 处理云服务器等服务的管理（开机、关机、重启等）
 */

const express = require('express');
const router = express.Router();
const db = require('../db/database');

// 服务列表页面
router.get('/', (req, res) => {
  const userId = req.session.user.id;
  const services = db.get('services').filter({ userId }).value();

  // 按状态分组
  const runningServices = services.filter(s => s.status === 'running');
  const stoppedServices = services.filter(s => s.status === 'stopped');

  res.render('service/index', {
    title: '我的服务',
    services,
    runningServices,
    stoppedServices,
    stats: {
      total: services.length,
      running: runningServices.length,
      stopped: stoppedServices.length
    }
  });
});

// 服务详情页
router.get('/detail/:id', (req, res) => {
  const userId = req.session.user.id;
  const service = db.get('services').find({
    id: req.params.id,
    userId
  }).value();

  if (!service) {
    return res.status(404).render('error', {
      title: '服务不存在',
      message: '您查看的服务不存在'
    });
  }

  // 获取该服务的监控数据（模拟）
  const monitoringData = {
    cpu: Math.floor(Math.random() * 100),
    memory: Math.floor(Math.random() * 100),
    disk: Math.floor(Math.random() * 100),
    network: Math.floor(Math.random() * 100)
  };

  res.render('service/detail', {
    title: service.productName,
    service,
    monitoringData
  });
});

// 开机操作
router.post('/start', (req, res) => {
  try {
    const userId = req.session.user.id;
    const { serviceId } = req.body;

    const service = db.get('services').find({
      id: serviceId,
      userId
    }).value();

    if (!service) {
      return res.json({
        success: false,
        message: '服务不存在'
      });
    }

    if (service.status === 'running') {
      return res.json({
        success: false,
        message: '服务已在运行中'
      });
    }

    db.get('services').find({ id: serviceId }).assign({
      status: 'running',
      lastStartAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).write();

    res.json({
      success: true,
      message: '开机成功'
    });
  } catch (error) {
    console.error('Start service error:', error);
    res.json({
      success: false,
      message: '操作失败，请稍后重试'
    });
  }
});

// 关机操作
router.post('/stop', (req, res) => {
  try {
    const userId = req.session.user.id;
    const { serviceId } = req.body;

    const service = db.get('services').find({
      id: serviceId,
      userId
    }).value();

    if (!service) {
      return res.json({
        success: false,
        message: '服务不存在'
      });
    }

    if (service.status === 'stopped') {
      return res.json({
        success: false,
        message: '服务已关机'
      });
    }

    db.get('services').find({ id: serviceId }).assign({
      status: 'stopped',
      lastStopAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).write();

    res.json({
      success: true,
      message: '关机成功'
    });
  } catch (error) {
    console.error('Stop service error:', error);
    res.json({
      success: false,
      message: '操作失败，请稍后重试'
    });
  }
});

// 重启操作
router.post('/restart', (req, res) => {
  try {
    const userId = req.session.user.id;
    const { serviceId } = req.body;

    const service = db.get('services').find({
      id: serviceId,
      userId
    }).value();

    if (!service) {
      return res.json({
        success: false,
        message: '服务不存在'
      });
    }

    if (service.status !== 'running') {
      return res.json({
        success: false,
        message: '服务需要处于运行状态才能重启'
      });
    }

    // 先关机再开机（模拟）
    db.get('services').find({ id: serviceId }).assign({
      status: 'stopped',
      updatedAt: new Date().toISOString()
    }).write();

    setTimeout(() => {
      db.get('services').find({ id: serviceId }).assign({
        status: 'running',
        lastStartAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).write();
    }, 2000);

    res.json({
      success: true,
      message: '重启中，请稍候...'
    });
  } catch (error) {
    console.error('Restart service error:', error);
    res.json({
      success: false,
      message: '操作失败，请稍后重试'
    });
  }
});

// 获取监控数据
router.get('/monitor/:id', (req, res) => {
  try {
    const userId = req.session.user.id;
    const service = db.get('services').find({
      id: req.params.id,
      userId
    }).value();

    if (!service) {
      return res.json({
        success: false,
        message: '服务不存在'
      });
    }

    // 模拟监控数据
    res.json({
      success: true,
      data: {
        cpu: Math.floor(Math.random() * 100),
        memory: Math.floor(Math.random() * 100),
        disk: Math.floor(Math.random() * 100),
        networkIn: Math.floor(Math.random() * 1000),
        networkOut: Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.json({
      success: false,
      message: '获取监控数据失败'
    });
  }
});

module.exports = router;
