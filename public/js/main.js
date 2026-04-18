/**
 * LimeNode 清柠云 - 前端通用 JavaScript
 */

(function() {
  'use strict';

  // 全局错误处理
  window.onerror = function(msg, url, line) {
    console.error('Global error:', msg, 'at line', line);
    return false;
  };

  // AJAX 基础配置
  const API = {
    async post(url, data = {}) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        return await response.json();
      } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: '网络错误，请稍后重试' };
      }
    },

    async get(url) {
      try {
        const response = await fetch(url);
        return await response.json();
      } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: '网络错误，请稍后重试' };
      }
    }
  };
  window.API = API;

  // Toast 提示封装
  const Toast = {
    show(type, message, duration = 3000) {
      const toast = document.createElement('div');
      toast.className = `alert alert-${type} position-fixed fade show`;
      toast.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 280px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);';
      toast.innerHTML = `
        <div class="d-flex align-items-center">
          <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'times-circle' : 'info-circle'} me-2"></i>
          <span>${message}</span>
          <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },

    success(message) { this.show('success', message); },
    error(message) { this.show('danger', message); },
    info(message) { this.show('info', message); }
  };
  window.Toast = Toast;

  // 表单提交处理
  document.addEventListener('DOMContentLoaded', function() {
    // 处理所有 form-ajax 类型的表单
    document.querySelectorAll('form.form-ajax').forEach(function(form) {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const submitBtn = form.querySelector('[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> 处理中...';

        try {
          const formData = new FormData(form);
          const data = Object.fromEntries(formData.entries());
          const url = form.action || window.location.href;

          const result = await API.post(url, data);

          if (result.success) {
            Toast.success(result.message || '操作成功');
            if (result.redirect) {
              setTimeout(() => window.location.href = result.redirect, 1000);
            }
          } else {
            Toast.error(result.message || '操作失败');
          }
        } catch (error) {
          Toast.error('网络错误，请稍后重试');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    });

    // 处理按钮点击效果
    document.querySelectorAll('.btn-action').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const icon = this.querySelector('i');
        if (icon) {
          icon.classList.add('fa-spin');
          setTimeout(() => icon.classList.remove('fa-spin'), 1000);
        }
      });
    });
  });

  // 确认对话框
  window.confirmAction = function(title, text, confirmText, callback) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: title || '确认操作',
        text: text || '确定要执行此操作吗？',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#FFC0D9',
        cancelButtonColor: '#E8F4F8',
        confirmButtonText: confirmText || '确定',
        cancelButtonText: '取消'
      }).then((result) => {
        if (result.isConfirmed && callback) {
          callback();
        }
      });
    } else if (confirm(text || '确定要执行此操作吗？')) {
      callback();
    }
  };

  // 服务操作（开机、关机、重启）
  window.serviceAction = async function(action, serviceId, btn) {
    const actions = {
      start: { message: '开机', success: '开机成功' },
      stop: { message: '关机', success: '关机成功' },
      restart: { message: '重启', success: '重启成功' }
    };

    const info = actions[action];
    if (!info) return;

    // 禁用按钮
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="loading"></span>';
    }

    try {
      const result = await API.post('/service/' + action, { serviceId });

      if (result.success) {
        Toast.success(info.success);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        Toast.error(result.message);
      }
    } catch (error) {
      Toast.error('操作失败，请稍后重试');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-power-off"></i>';
      }
    }
  };

  // 购物车操作
  window.updateCartQuantity = async function(cartId, quantity) {
    try {
      const result = await API.post('/cart/update', { cartId, quantity });
      if (result.success) {
        Toast.success('更新成功');
        window.location.reload();
      } else {
        Toast.error(result.message);
      }
    } catch (error) {
      Toast.error('更新失败');
    }
  };

  window.removeCartItem = async function(cartId) {
    confirmAction('确认删除', '确定要从购物车中移除此商品吗？', '删除', async function() {
      try {
        const result = await API.post('/cart/remove', { cartId });
        if (result.success) {
          Toast.success('已删除');
          window.location.reload();
        } else {
          Toast.error(result.message);
        }
      } catch (error) {
        Toast.error('删除失败');
      }
    });
  };

  // 添加到购物车
  window.addToCart = async function(productId) {
    try {
      const result = await API.post('/product/add-to-cart', { productId });
      if (result.success) {
        Toast.success('已添加到购物车');
        // 更新购物车数量
        const badge = document.querySelector('.cart-badge');
        if (badge) {
          badge.textContent = parseInt(badge.textContent || '0') + 1;
        }
      } else {
        Toast.error(result.message);
      }
    } catch (error) {
      Toast.error('添加失败');
    }
  };

  // 网络安全操作
  window.updateProtection = async function(serviceId, level) {
    try {
      const result = await API.post('/security/protection/update', { serviceId, level });
      if (result.success) {
        Toast.success('防护等级已更新');
        window.location.reload();
      } else {
        Toast.error(result.message);
      }
    } catch (error) {
      Toast.error('更新失败');
    }
  };

  window.deleteDomain = async function(domainId) {
    confirmAction('确认删除', '确定要删除此域名吗？', '删除', async function() {
      try {
        const result = await API.post('/network/domain/delete', { domainId });
        if (result.success) {
          Toast.success('域名已删除');
          window.location.reload();
        } else {
          Toast.error(result.message);
        }
      } catch (error) {
        Toast.error('删除失败');
      }
    });
  };

  window.deleteProxy = async function(proxyId) {
    confirmAction('确认删除', '确定要删除此反向代理配置吗？', '删除', async function() {
      try {
        const result = await API.post('/network/proxy/delete', { proxyId });
        if (result.success) {
          Toast.success('已删除');
          window.location.reload();
        } else {
          Toast.error(result.message);
        }
      } catch (error) {
        Toast.error('删除失败');
      }
    });
  };

})();
