document.addEventListener('DOMContentLoaded', () => {
  // === V6.0: 全局 UI 交互辅助函数 ===
  const toastContainer = document.getElementById('toastContainer');
  
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    
    // 3秒后开始淡出
    setTimeout(() => {
      toast.classList.add('fade-out');
      // 淡出动画结束后移除元素
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function setLoading(btnId, isLoading, text) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    
    btn.disabled = isLoading;
    if (isLoading) {
      if (btnText) btnText.classList.add('is-hidden');
      if (btnLoader) btnLoader.classList.remove('is-hidden');
    } else {
      if (btnText) {
        btnText.classList.remove('is-hidden');
        if (text) btnText.textContent = text;
      }
      if (btnLoader) btnLoader.classList.add('is-hidden');
    }
  }

  // 解决手机端点击空白处收起键盘问题
  document.addEventListener('touchstart', (e) => {
    const t = e.target.tagName;
    if (t !== 'INPUT' && t !== 'TEXTAREA' && t !== 'SELECT' && t !== 'BUTTON') {
      document.activeElement.blur();
    }
  }, { passive: true });

  // === Supabase Initialization ===
  const SUPABASE_URL = 'https://rcdwxpckyeloqbwoggbq.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_PqGg_I2ElFiWkU1BHAY72w_0HlZQRcZ';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Web Push VAPID Public Key
  const VAPID_PUBLIC_KEY = 'BGdMnU3sHJwo5OTJ_sSVwRsTrJlbACvcRiURp0Tx4Z9oAdVAX4HG5qgIMbwyGxDOfRNDLuI4fMHZL8SIgMOMhl8';

  // === V5.8: PWA 引导分发系统 (智能记忆与状态持久化) ===
  const ua = navigator.userAgent.toLowerCase();
  const isWeChat = /micromessenger|wechat/i.test(ua);
  const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  const isiOS = /iphone|ipad|ipod/i.test(ua);

  const wechatOverlay = document.getElementById('wechatGuideOverlay');
  const pwaOverlay = document.getElementById('pwaGlassOverlay');
  const iosHint = document.getElementById('iosInstallHint');
  const pwaActionBtn = document.getElementById('pwaActionBtn');
  
  const pwaDismissed = localStorage.getItem('pwa_onboarding_dismissed') === 'true';

  // 1. 微信环境拦截
  if (isWeChat && !isStandalone) {
    wechatOverlay.classList.remove('is-hidden');
  } 
  // 2. 浏览器环境安装引导
  else if (!isStandalone && !pwaDismissed) {
    pwaOverlay.classList.remove('is-hidden');
    if (isiOS) {
      iosHint.classList.remove('is-hidden');
      pwaActionBtn.classList.add('is-hidden');
    } else {
      pwaActionBtn.classList.remove('is-hidden');
    }
  }

  // 按钮交互
  document.getElementById('pwaCancelBtn').addEventListener('click', () => {
    pwaOverlay.classList.add('is-hidden');
    localStorage.setItem('pwa_onboarding_dismissed', 'true');
  });

  // Android 原生安装
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  // 监听安装完成
  window.addEventListener('appinstalled', () => {
    localStorage.setItem('pwa_onboarding_dismissed', 'true');
    document.querySelector('.pwa-onboarding-card h2').textContent = '🎉 安装成功！';
    document.querySelector('.onboarding-body').innerHTML = '<div style="padding:20px; text-align:center; color:#0f766e; font-weight:bold;">App 已成功添加到桌面。<br/><br/>请关闭浏览器，从桌面图标进入以获得完整体验。</div>';
    pwaActionBtn.classList.add('is-hidden');
    document.getElementById('pwaCancelBtn').textContent = '进入预览版';
  });

  pwaActionBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
    } else if (!isiOS) {
      showToast('📥 请点击浏览器菜单选择“安装应用”或“添加到主屏幕”。安装后下次将不再提示。', 'info');
      localStorage.setItem('pwa_onboarding_dismissed', 'true');
      pwaOverlay.classList.add('is-hidden');
    }
  });

  // === Layout Elements ===
  const viewLogin = document.getElementById('loginView');
  const viewDashboard = document.getElementById('dashboardView');
  const viewAdminBoard = document.getElementById('adminDashboardView');
  const viewForm = document.getElementById('caseFormView');
  const topbar = document.querySelector('.topbar');
  const fabNewCase = document.getElementById('newCaseFab');
  
  // === Auth Elements ===
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const toRegisterBtn = document.getElementById('toRegisterBtn');
  const toLoginBtn = document.getElementById('toLoginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const roleRadios = document.querySelectorAll('input[name="authRole"]');

  // === Form Elements ===
  const btnBack = document.getElementById('backBtn');
  const btnNext = document.getElementById('nextStepBtn');
  const btnPrev = document.getElementById('prevStepBtn');
  const btnSubmit = document.getElementById('submitBtn');
  const stepIndicators = document.querySelectorAll('.stepper .step');
  const formSteps = document.querySelectorAll('.form-step');
  const syncBtn = document.getElementById('syncBtn');
  const hospitalSearch = document.getElementById('hospitalSearch');
  
  // 安全绑定辅助函数
  function safeBind(el, event, handler) {
    if (el) el.addEventListener(event, handler);
  }
  
  const doctorName = document.getElementById('doctorName');
  const hospitalOptions = document.getElementById('hospitalOptions');
  const surgeryType = document.getElementById('surgeryType');
  const surgeryOptions = document.getElementById('surgeryOptions');
  const deviceModelSelect = document.getElementById('deviceModel');
  
  const dynamicParameters = document.getElementById('dynamicParameters');
  const addParamBtn = document.getElementById('addParamBtn');
  const saveTemplateBtn = document.getElementById('saveTemplateBtn');
  const isAbnormal = document.getElementById('isAbnormal');
  const outcome = document.getElementById('outcome');
  const complications = document.getElementById('complications');
  
  const paperParamInput = document.getElementById('paperParamInput');
  const paperParamPreview = document.getElementById('paperParamPreview');
  const qrScanInput = document.getElementById('qrScanInput');
  const consumableList = document.getElementById('consumableList');
  const mediaInput = document.getElementById('mediaInput');
  const mediaPreview = document.getElementById('mediaPreview');
  
  // === Task UI ===
  const pendingTaskList = document.getElementById('pendingTaskList');
  
  // === Admin Elements ===
  const dispatchForm = document.getElementById('dispatchForm');
  const dpEngineer = document.getElementById('dpEngineer');
  const dpHospital = document.getElementById('dpHospital');
  const dpDoctor = document.getElementById('dpDoctor');
  const dpContact = document.getElementById('dpContact');
  const dpSurgery = document.getElementById('dpSurgery');
  const dpTime = document.getElementById('dpTime');
  const dpEquipment = document.getElementById('dpEquipment');
  const dpRemarks = document.getElementById('dpRemarks');
  const adminDispatchList = document.getElementById('adminDispatchList');
  const refreshAdminTasksBtn = document.getElementById('refreshAdminTasksBtn');

  // State
  let currentStep = 1;
  const totalSteps = 4;
  let currentUser = null;
  let currentRole = 'engineer';
  let capturedPaperImages = [];
  let capturedMediaImages = [];

  // Config
  const deviceTypes = [
    'CT引导手术导航系统', '陡脉冲治疗系统', '射频消融系统', '微波消融系统',
    '活检系统', '静脉射频闭合系统', '高频电刀', '达芬奇手术机器人'
  ];
  const defaultSurgeries = [
    'IRE(不可逆电穿孔)', '射频消融', '微波消融', '机器人辅助手术', '穿刺活检', '大隐静脉曲张闭合', '常规高频外科切除'
  ];
  const Surgery_Device_Mapping = {
    '穿刺活检': 'CT引导手术导航系统',
    '射频消融': '射频消融系统',
    '微波消融': '微波消融系统',
    'IRE': '陡脉冲治疗系统',
    '机器人': '达芬奇手术机器人',
    '静脉': '静脉射频闭合系统',
    '常规': '高频电刀'
  };
  const Surgery_Param_Mapping = {
    'IRE(不可逆电穿孔)': [
      { label: '脉冲电压(V)' }, { label: '脉冲宽度(μs)' }, { label: '脉冲个数(N)' },
      { label: '电极针间距(cm)' }, { label: '针尖暴露长度(cm)' }, { label: '术中阻抗变化率(%)' },
      { label: '心脏同步(ECG)状态' }, { label: '肌肉松弛监测等级' }
    ],
    '射频消融': [
      { label: '术前靶标最大径(cm)' }, { label: '输出设定功率(W)' }, { label: '消融持续时间(min)' },
      { label: '针尖暴露长度(cm)' }, { label: '穿刺测温表现(℃)' }, { label: '阻抗下降比例(%)' }
    ],
    '大隐静脉曲张闭合': [
      { label: '静脉主干直径(mm)' }, { label: '治疗节段长度(cm)' }, { label: '闭合目标温度(℃)' },
      { label: '执行内实际平均温度(℃)' }, { label: '导丝回撤速度(cm/s)' }, { label: '总射频能量(J)' }
    ]
  };

  // --- Views Router ---
  function showView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('is-active'));
    document.getElementById(viewId).classList.add('is-active');
    
    if (viewId === 'loginView') {
      topbar.style.display = 'none';
      fabNewCase.classList.add('is-hidden');
      logoutBtn.classList.add('is-hidden');
    } else {
      topbar.style.display = 'flex';
      logoutBtn.classList.remove('is-hidden');
      if(viewId === 'caseFormView' || viewId === 'adminDashboardView') {
        fabNewCase.classList.add('is-hidden');
      } else {
        // === UI Event Listeners ===
        safeBind(document.getElementById('toRegister'), 'click', () => { loginForm.classList.add('is-hidden'); registerForm.classList.remove('is-hidden'); });
        safeBind(document.getElementById('toLogin'), 'click', () => { registerForm.classList.add('is-hidden'); loginForm.classList.remove('is-hidden'); });
        safeBind(logoutBtn, 'click', async () => { await supabase.auth.signOut(); currentUser = null; showView('loginView'); });
        safeBind(syncBtn, 'click', () => syncOfflineData());
        safeBind(surgeryOptions, 'change', (e) => {
          if(e.target.value) { surgeryType.value = e.target.value; generateDynamicForm(e.target.value); }
        });
        
        // V3.0: 角色高颜切换交互逻辑
        const roleTabs = document.querySelectorAll('.role-tab');
        roleTabs.forEach(tab => {
          safeBind(tab.querySelector('input'), 'change', (e) => {
            roleTabs.forEach(t => t.classList.remove('is-active'));
            tab.classList.add('is-active');
          });
        }); fabNewCase.classList.remove('is-hidden');
      }
    }
  }

  // --- Supabase Authenticaton ---
  const roleSwitchContainer = document.getElementById('roleSwitchContainer');
  const tabEngineer = document.getElementById('tabEngineer');
  const tabAdmin = document.getElementById('tabAdmin');
  
  function setRoleTab(role) {
    tabEngineer.classList.remove('is-active');
    tabAdmin.classList.remove('is-active');
    if (role === 'admin') {
      tabAdmin.classList.add('is-active');
      roleSwitchContainer.classList.add('isAdmin');
      document.querySelector('input[name="authRole"][value="admin"]').checked = true;
    } else {
      tabEngineer.classList.add('is-active');
      roleSwitchContainer.classList.remove('isAdmin');
      document.querySelector('input[name="authRole"][value="engineer"]').checked = true;
    }
  }
  
  safeBind(tabEngineer, 'click', () => setRoleTab('engineer'));
  safeBind(tabAdmin, 'click', () => setRoleTab('admin'));
  safeBind(toRegisterBtn, 'click', () => { loginForm.classList.add('is-hidden'); registerForm.classList.remove('is-hidden'); });
  safeBind(toLoginBtn, 'click', () => { registerForm.classList.remove('is-hidden'); loginForm.classList.add('is-hidden'); });

  function getEmailFromPhone(phone) { return `${phone}@antigravity.clinic`; } // Supabase Auth Mock Wrapper

  async function syncProfileRole() {
    try {
      const { data } = await supabase.from('user_profiles').select('role, full_name').eq('id', currentUser.id).single();
      if (data) {
        // 数据库角色为权威来源
        currentRole = data.role;
        localStorage.setItem('userRole', currentRole);
        if (data.full_name) localStorage.setItem('cachedName', data.full_name);

        // 检查登录页选择是否与注册角色一致
        const selectedTab = document.querySelector('input[name="authRole"]:checked').value;
        if (selectedTab !== currentRole) {
          const roleName = currentRole === 'admin' ? '派单调度' : '跟台人员';
          showToast(`⚠️ 此账号注册身份为【${roleName}】，已自动切换到对应系统。`, 'warning');
        }
      } else {
        // 数据库没有 profile，尝试从缓存补写（注册时 RLS 可能阻止了写入）
        const pending = localStorage.getItem('pendingProfile');
        if (pending) {
          try {
            const profile = JSON.parse(pending);
            profile.id = currentUser.id; // 确保用当前登录用户的 ID
            const { error: insertErr } = await supabase.from('user_profiles').upsert(profile);
            if (!insertErr) {
              currentRole = profile.role;
              localStorage.setItem('userRole', currentRole);
              localStorage.setItem('cachedName', profile.full_name);
              localStorage.removeItem('pendingProfile');
              console.log('首次登录补写 profile 成功:', profile);
            } else {
              console.warn('补写 profile 失败:', insertErr);
              currentRole = localStorage.getItem('userRole') || 'engineer';
            }
          } catch(pe) {
            currentRole = localStorage.getItem('userRole') || 'engineer';
          }
        } else {
          currentRole = localStorage.getItem('userRole') || 'engineer';
        }
      }
    } catch(e) {
      console.warn('Profile fetch fail', e);
      currentRole = localStorage.getItem('userRole') || 'engineer';
    }
  }

  // 手机号校验
  function validatePhone(phone) {
    if (!phone || phone.trim() === '') { showToast('⚠️ 请输入手机号码', 'warning'); return false; }
    if (!/^\d+$/.test(phone)) { showToast('⚠️ 手机号只能包含数字，请勿输入字母或特殊字符', 'warning'); return false; }
    if (phone.length !== 11) { showToast(`⚠️ 手机号必须为 11 位，当前输入了 ${phone.length} 位`, 'warning'); return false; }
    if (!/^1[3-9]\d{9}$/.test(phone)) { showToast('⚠️ 手机号格式不正确，请输入有效的大陆手机号', 'warning'); return false; }
    return true;
  }

  safeBind(registerForm, 'submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('regPhone').value.trim();
    const name = document.getElementById('regUsername').value.trim();
    const pwd = document.getElementById('regPassword').value;
    const role = document.querySelector('input[name="authRole"]:checked').value;
    if (!validatePhone(phone)) return;
    if (!name) { showToast('⚠️ 请输入您的姓名', 'warning'); return; }
    if (!pwd || pwd.length < 6) { showToast('⚠️ 密码至少需要 6 位', 'warning'); return; }

    setLoading('regSubmitBtn', true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: getEmailFromPhone(phone), password: pwd });
      if(error) throw error;

      // 写入 user_profiles
      if(data.user) {
        const { error: profileError } = await supabase.from('user_profiles').insert({
          id: data.user.id, full_name: name, role: role
        });
        if (profileError) {
          localStorage.setItem('pendingProfile', JSON.stringify({
            id: data.user.id, full_name: name, role: role
          }));
        }
      }
      showToast('注册成功，请使用新身份登录！', 'success');
      registerForm.classList.add('is-hidden'); loginForm.classList.remove('is-hidden');
    } catch(err) {
      showToast('注册失败: ' + err.message, 'error');
    }
    setLoading('regSubmitBtn', false, '立即进站');
  });

  safeBind(loginForm, 'submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('loginPhone').value.trim();
    const pwd = document.getElementById('loginPassword').value;
    if (!validatePhone(phone)) return;
    if (!pwd) { showToast('⚠️ 请输入密码', 'warning'); return; }

    // 登录前先保存用户选择的角色，确保 checkAuthSession 能区分权限
    const selectedRole = document.querySelector('input[name="authRole"]:checked').value;
    localStorage.setItem('userRole', selectedRole);

    setLoading('loginSubmitBtn', true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: getEmailFromPhone(phone), password: pwd });
      if(error) throw error;
      checkAuthSession();
    } catch(err) {
       showToast('登录失败: 请检查手机号或密码。如无账号请先注册。（错误:'+err.message+')', 'error');
    }
    setLoading('loginSubmitBtn', false, '确 认 登 录');
  });

  safeBind(logoutBtn, 'click', async () => {
    // 退出前清除推送订阅
    await unsubscribeFromPush();
    await supabase.auth.signOut();
    currentUser = null;
    localStorage.removeItem('cachedName');
    localStorage.removeItem('userRole');
    document.getElementById('loginForm').reset();
    showView('loginView');
  });

  async function checkAuthSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      currentUser = session.user;
      await syncProfileRole();
      const name = localStorage.getItem('cachedName') || currentUser.email.split('@')[0];
      
      if (currentRole === 'admin') {
        document.getElementById('adminWelcomeText').textContent = `最高指控官：${name}`;
        showView('adminDashboardView');
        renderAdminTasks();
        loadEngineers(); // 进入管理员页面时立刻加载工程师列表
        
        // 管理员也订阅实时推送，接收工程师提交的更新
        subscribeToRealtimePush(name);
      } else {
        document.getElementById('welcomeText').textContent = `欢迎登入中台，${name}。`;
        showView('dashboardView');
        renderPendingTasks(name);
        
        // V5.0: 智能通知状态检测与引导 + 诊断信息
        const banner = document.getElementById('notificationBanner');
        const diagUA = document.getElementById('diagUA');
        const diagPush = document.getElementById('diagPush');
        const diagPWA = document.getElementById('diagPWA');

        const hasPush = ('Notification' in window && 'PushManager' in window);
        const perm = ('Notification' in window ? Notification.permission : '不支持');
        const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

        if (diagUA) diagUA.textContent = `UA: ${navigator.userAgent}`;
        if (diagPush) diagPush.textContent = `推送支持: ${hasPush ? '✅ 是' : '❌ 否'} | 权限: ${perm}`;
        if (diagPWA) diagPWA.textContent = `运行模式: ${isStandalone ? '✅ PWA (主屏幕)' : '⚠️ 网页 (请存至主屏幕)'}`;

        if (hasPush) {
          if (Notification.permission === 'granted') {
            banner.classList.add('is-hidden');
            subscribeToWebPush(name);
          } else {
            banner.classList.remove('is-hidden'); // 默认显示，引导授权
          }
        } else {
          // 不支持推送时，显示警告信息
          banner.innerHTML = `<div style="font-size:0.75rem; color:#c2410c;">⚠️ 您当前的浏览器或系统版本不支持推送通知。请确保使用 iPhone 且系统版本在 iOS 16.4 以上。</div>`;
        }
        
        // 🚀 实时订阅后台调度指派 (Supabase Realtime)
        subscribeToRealtimePush(name);

        // 📊 加载个人工作统计数据
        updateUserStats(name);
      }
    } else {
      showView('loginView');
    }
  }
  
  // ====== Web Push 后台真推送订阅管理 ======
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function subscribeToWebPush(userName) {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Web Push 不支持');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // 检查是否已经订阅
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // 创建新订阅
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        console.log('Web Push 订阅成功:', subscription.endpoint);
      }

      // 提取订阅信息存入 Supabase
      const subJson = subscription.toJSON();
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: currentUser.id,
        user_name: userName,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth
      }, { onConflict: 'user_id,endpoint' });

      if (error) console.warn('推送订阅存储失败:', error);
      else console.log('推送订阅已同步到云端');
    } catch (e) {
      console.warn('Web Push 订阅失败:', e);
    }
  }

  async function unsubscribeFromPush() {
    try {
      if (!('serviceWorker' in navigator)) return;
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        // 同时从数据库清除
        if (currentUser) {
          await supabase.from('push_subscriptions').delete().eq('user_id', currentUser.id);
        }
        console.log('推送订阅已清除');
      }
    } catch (e) {
      console.warn('取消推送订阅失败:', e);
    }
  }

  let realtimeChannel = null;
  function subscribeToRealtimePush(engineerName) {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }
    realtimeChannel = supabase.channel('public:dispatch_tasks')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dispatch_tasks' }, payload => {
        const newTask = payload.new;
        if (newTask.engineer_name === engineerName && currentRole === 'engineer') {
          // 收到新的派单，触发系统通知和声音
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🚨 新的手术跟台派单', {
              body: `医院: ${newTask.target_hospital}\n医生: ${newTask.target_doctor || '未指定'}\n设备: ${newTask.procedure_type}`,
              icon: './icon-192.png'
            });
          } else {
            showToast(`🚨 收到新的派单：${newTask.target_hospital} - ${newTask.target_doctor}`, 'info');
          }
          renderPendingTasks(engineerName); // 刷新任务列表
        } else if (currentRole === 'admin') {
          renderAdminTasks(); // 管理员自己也刷新
        }
      })
      .subscribe();
  }

  // V2.0: Background & Weak Network Defenses
  let pollingIntervalId = null;

  function startFallbackPolling() {
    if (pollingIntervalId) clearInterval(pollingIntervalId);
    pollingIntervalId = setInterval(() => {
      const name = localStorage.getItem('cachedName');
      if (currentRole === 'admin') renderAdminTasks(true); // true 代表静默拉取不报错
      else if (currentRole === 'engineer' && name) renderPendingTasks(name, true);
    }, 30000); // 30 秒刚性轮询一次，兜底 websocket 断连
  }

  // 手机从黑屏/后台切回前台瞬间，强行激活一次拉取！
  // === iOS 后台唤醒增强：记录切后台时间，回来后检查新派单 ===
  let lastBackgroundTime = null;

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') {
      // 记录切后台的精确时间
      lastBackgroundTime = new Date().toISOString();
    }

    if (document.visibilityState === 'visible') {
      console.log('App Foregrounded - Reconnecting & syncing...');
      const name = localStorage.getItem('cachedName');

      // 1) 重建 Realtime WebSocket（iOS 后台会杀掉连接）
      if (name) {
        subscribeToRealtimePush(name);
      }

      // 2) 刷新任务列表
      if (currentRole === 'admin') renderAdminTasks();
      else if (currentRole === 'engineer' && name) renderPendingTasks(name);

      // 3) 检查后台期间是否有新派单到达（仅工程师）
      if (currentRole === 'engineer' && name && lastBackgroundTime) {
        try {
          const { data } = await supabase
            .from('dispatch_tasks')
            .select('target_hospital, target_doctor, procedure_type')
            .eq('engineer_name', name)
            .gt('created_at', lastBackgroundTime)
            .order('created_at', { ascending: false });

          if (data && data.length > 0) {
            const msgs = data.map(t => `📍 ${t.target_hospital} - ${t.target_doctor || '待定'} (${t.procedure_type})`).join('\n');
            showToast(`🚨 您有 ${data.length} 条新派单！\n\n${msgs}`, 'info');
          }
        } catch(e) { console.warn('Background task check failed:', e); }
      }
      lastBackgroundTime = null;
    }
  });

  // Realtime Supabase Listeners (For instant cross-device drops)
  supabase.channel('public:dispatch_tasks').on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_tasks' }, (payload) => {
    const engineerName = localStorage.getItem('cachedName');
    
    if (currentRole === 'admin') {
      renderAdminTasks();
    } else if (currentRole === 'engineer') {
      renderPendingTasks(engineerName);
      
      // V1.9: OS Level Native Push Notification
      if (payload.eventType === 'INSERT' && payload.new.engineer_name === engineerName) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🚨 医疗跟台新指派', {
            body: `医院: ${payload.new.target_hospital}\n术式: ${payload.new.procedure_type}\n时间: ${payload.new.scheduled_time.replace('T', ' ')}`,
            icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063224.png',
            requireInteraction: true // 让通知保持在屏幕上直到工程师点击
          });
          
          // 如果支持，还可以让设备震动
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        }
      }
    }
  }).subscribe();


  // --- Database Stats Loader ---
  async function updateUserStats(userName) {
    if (!userName || currentRole !== 'engineer') return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // 1. 今日任务统计
      const { count: countToday, error: errToday } = await supabase
        .from('clinical_cases')
        .select('*', { count: 'exact', head: true })
        .eq('engineer_name', userName)
        .gte('created_at', today.toISOString());

      if (!errToday) document.getElementById('statToday').textContent = countToday;

      // 2. 本月场次统计
      const { count: countMonth, error: errMonth } = await supabase
        .from('clinical_cases')
        .select('*', { count: 'exact', head: true })
        .eq('engineer_name', userName)
        .gte('created_at', startOfMonth.toISOString());

      if (!errMonth) document.getElementById('statMonth').textContent = countMonth;

      // 3. 待同步数据
      const offlineData = JSON.parse(localStorage.getItem('pending_cases') || '[]');
      document.getElementById('statPending').textContent = offlineData.length;

    } catch (e) {
      console.warn('统计数据加载失败:', e);
    }
  }

  // --- Offline Storage Logic ---
  function saveOfflineCase(payload) {
    const pending = JSON.parse(localStorage.getItem('pending_cases') || '[]');
    pending.push({ ...payload, offline_id: Date.now() });
    localStorage.setItem('pending_cases', JSON.stringify(pending));
    
    // 更新 UI 计数
    document.getElementById('statPending').textContent = pending.length;
    showToast('⚠️ 当前网络不稳，数据已安全暂存至本地（离线模式），待联网后请点击同步。', 'warning');
  }

  async function syncOfflineData() {
    const pending = JSON.parse(localStorage.getItem('pending_cases') || '[]');
    if (pending.length === 0) {
      showToast('目前没有需要同步的离线数据。', 'info');
      return;
    }

    const btn = document.getElementById('syncBtn');
    const originalText = btn.textContent;
    btn.textContent = `同步中(${pending.length})...`;
    btn.disabled = true;

    let successCount = 0;
    let failedCases = [];

    for (const item of pending) {
      try {
        const { offline_id, ...payload } = item;
        const { error } = await supabase.from('clinical_cases').insert(payload);
        if (error) throw error;
        
        // 如果是关联任务，标记任务完成
        if (payload.task_id) {
          await supabase.from('dispatch_tasks').update({ status: 'completed' }).eq('id', payload.task_id);
        }
        successCount++;
      } catch (e) {
        failedCases.push(item);
      }
    }

    localStorage.setItem('pending_cases', JSON.stringify(failedCases));
    document.getElementById('statPending').textContent = failedCases.length;
    
    // 下行同步：刷新任务与统计
    const name = localStorage.getItem('cachedName');
    if (name) {
      await renderPendingTasks(name);
      await updateUserStats(name);
    }

    if (successCount > 0) {
      showToast(`✅ 成功同步 ${successCount} 条本地数据，并已刷新云端任务。`, 'success');
    } else {
      showToast(`🔄 云端数据已同步至最新。`, 'success');
    }
    
    if (failedCases.length > 0) {
      showToast(`❌ 仍有 ${failedCases.length} 条数据同步失败，请检查网络。`, 'error');
    }

    btn.textContent = originalText;
    btn.disabled = false;
  }


  // --- Database Renders ---
  async function renderAdminTasks(isSilent = false) {
    try {
      const { data, error } = await supabase.from('dispatch_tasks').select('*').order('created_at', { ascending: false });
      if(error) throw error;
      adminDispatchList.innerHTML = '';
      data.forEach((task) => {
        const li = document.createElement('li'); li.className = 'case-item';
        let statusHtml = task.status === 'pending' ? `<span class="status-badge" style="background:#fef08a; color:#854d0e;">待接单</span>` : `<span class="status-badge" style="background:#dcfce7; color:#166534;">运转中</span>`;
        if (task.status === 'completed') statusHtml = `<span class="status-badge" style="background:#f1f5f9; color:#64748b;">已结单归档</span>`;
        
        let equipHtml = task.equipment_requirements ? `<div style="margin-top:4px; padding:4px; background:#f8fafc; border-radius:4px; color:#c2410c;">📦 耗材指示: ${task.equipment_requirements}</div>` : '';
        let rmksHtml = task.remarks ? `<div style="margin-top:4px; padding:4px; background:#f8fafc; border-radius:4px; color:#475569;">📝 备忘留言: ${task.remarks}</div>` : '';

        li.innerHTML = `<div style="display:flex; justify-content:space-between; margin-bottom:6px;"><strong style="color:#0f172a; font-size:0.95rem;">${task.target_hospital}</strong>${statusHtml}</div><div style="font-size:0.8rem; color:#475569; display:flex; flex-direction:column; gap:4px;"><span>📌 指派给: ${task.engineer_name} | 🗓️ ${task.scheduled_time.replace('T', ' ')}</span><span>🩺 术式: ${task.procedure_type}</span><span>👨‍⚕️ 对接: ${task.target_doctor} ${task.contact_info ? `(📞 ${task.contact_info})` : ''}</span>${equipHtml}${rmksHtml}</div>`;
        adminDispatchList.appendChild(li);
      });
    } catch(e) { console.warn(e); }
  }

  async function renderPendingTasks(engineerName, isSilent = false) {
    try {
      const { data, error } = await supabase.from('dispatch_tasks').select('*').eq('engineer_name', engineerName).eq('status', 'pending');
      if(error) throw error;
      pendingTaskList.innerHTML = '';
      if (!data || data.length === 0) {
        pendingTaskList.innerHTML = `<p style="font-size:0.8rem; color:#888; text-align:center;">云端暂无待处理调度任务</p>`; return;
      }
      data.forEach((task) => {
        const li = document.createElement('li'); li.className = 'case-item'; li.style.borderColor = '#bae6fd';
        let equipHtml = task.equipment_requirements ? `<div style="font-size:0.8rem; margin:6px 0; padding:6px; background:#fff7ed; border-left:3px solid #f97316; border-radius:4px; color:#c2410c;"><strong>📦 携带物料战备单：</strong><br/>${task.equipment_requirements}</div>` : '';
        let rmksHtml = task.remarks ? `<div style="font-size:0.8rem; margin:6px 0; padding:6px; background:#f1f5f9; border-left:3px solid #64748b; border-radius:4px; color:#334155;"><strong>📝 调度附言：</strong><br/>${task.remarks}</div>` : '';

        li.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;"><strong style="color:#0369a1; font-size:0.9rem; flex:1;">${task.target_hospital}</strong><span style="font-size:0.75rem; background:#f0f9ff; color:#0c4a6e; padding:2px 6px; border-radius:4px; white-space:nowrap;">⏰ ${task.scheduled_time.replace('T', ' ')}</span></div><p style="color:#475569; font-size:0.85rem;"><strong>类型：</strong>${task.procedure_type}</p><p style="color:#475569; font-size:0.85rem;"><strong>医护：</strong>对接 ${task.target_doctor} ${task.contact_info ? `<a href="tel:${task.contact_info}" style="color:#0ea5e9; text-decoration:none;">📞 拨号: ${task.contact_info}</a>` : ''}</p>${equipHtml}${rmksHtml}<button class="primary-btn accept-task-btn" data-id="${task.id}" style="width:100%; margin-top:10px; padding: 8px; font-size:0.85rem;">接受任务并开启一键穿透表单</button>`;
        pendingTaskList.appendChild(li);
      });

      document.querySelectorAll('.accept-task-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const taskId = e.target.getAttribute('data-id');
          btn.textContent = '安全锁定中...';
          await supabase.from('dispatch_tasks').update({ status: 'started' }).eq('id', taskId);
          const taskData = data.find(t => t.id === taskId);
          
          currentStep = 1; updateStepper();
          hospitalSearch.value = taskData.target_hospital;
          doctorName.value = taskData.target_doctor;
          surgeryType.value = taskData.procedure_type;
          surgeryType.dispatchEvent(new Event('change')); // Trigger Param Engine
          
          document.getElementById('caseForm').setAttribute('data-bound-task', taskId);
          showView('caseFormView');
        });
      });
    } catch(e) { console.warn(e); }
  }

  safeBind(refreshAdminTasksBtn, 'click', () => {
    renderAdminTasks();
    loadEngineers();
  });

  // === Dispatching Form (Admin Create) ===
  if (dispatchForm) {
    dispatchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!dpEngineer.value || !dpHospital.value) { showToast("核心指令不完整！", "warning"); return; }
      const btn = dispatchForm.querySelector('button'); btn.textContent = '云穿透中...';
      try {
        const { error } = await supabase.from('dispatch_tasks').insert({
          admin_id: currentUser.id,
          engineer_name: dpEngineer.value.trim(),
          target_hospital: dpHospital.value.trim(),
          target_doctor: dpDoctor.value.trim() || '未定医生',
          contact_info: dpContact.value.trim(),
          procedure_type: dpSurgery.value,
          scheduled_time: dpTime.value,
          equipment_requirements: dpEquipment.value.trim(),
          remarks: dpRemarks.value.trim()
        });
        if(error) throw error;
        showToast(`🚀 单据已下发并推送到 ${dpEngineer.value} 手机端！`, 'success');
        dispatchForm.reset();
        renderAdminTasks();
      } catch(err){ showToast('派发异常:' + err.message, 'error'); }
      btn.textContent = '🚀 确认下达指令云穿透';
    });
  }


  // === Init App ===
  async function loadHospitals() {
    try {
      const resp = await fetch('./hospitals.json');
      if (resp.ok) {
        const data = await resp.json(); hospitalOptions.innerHTML = '';
        data.forEach(h => { const opt = document.createElement('option'); opt.value = h.name; hospitalOptions.appendChild(opt); });
      }
    } catch (e) {}
  }

  async function loadEngineers() {
    try {
      const { data, error } = await supabase.from('user_profiles').select('full_name, role').eq('role', 'engineer');
      if (error) {
        console.error('加载工程师列表失败:', error);
        dpEngineer.innerHTML = '<option value="" disabled selected>⚠️ 加载失败，请刷新</option>';
        return;
      }
      if (!data || data.length === 0) {
        dpEngineer.innerHTML = '<option value="" disabled selected>暂无注册工程师（请先用跟台人员身份注册账号）</option>';
        return;
      }
      dpEngineer.innerHTML = `<option value="" disabled selected>选择工程师（共 ${data.length} 人）</option>`;
      data.forEach(user => {
        const opt = document.createElement('option');
        opt.value = user.full_name;
        opt.textContent = user.full_name;
        dpEngineer.appendChild(opt);
      });
      console.log(`已加载 ${data.length} 名工程师`);
    } catch(e) {
      console.error('loadEngineers 异常:', e);
      dpEngineer.innerHTML = '<option value="" disabled selected>⚠️ 网络异常</option>';
    }
  }

  function initData() {
    loadHospitals();
    loadEngineers();
    deviceTypes.forEach(d => { const opt = document.createElement('option'); opt.value = d; opt.textContent = d; deviceModelSelect.appendChild(opt); });
    defaultSurgeries.forEach(s => { const opt = document.createElement('option'); opt.value = s; surgeryOptions.appendChild(opt); });
    startFallbackPolling(); // 开启心跳防御策略
    detectPWAInstallability(); // V2.1 启动安装检测
  }
  
  // === V3.0 PWA 美学引导与热升级拦截器 ===
  function detectPWAInstallability() {
    const banner = document.getElementById('pwaGlassOverlay');
    const msg = document.getElementById('pwaPromptMsg');
    const title = document.getElementById('pwaPromptTitle');
    const btn = document.getElementById('pwaActionBtn');
    const closeBtn = document.getElementById('pwaCancelBtn');
    
    function isStandalone() {
      return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || window.location.search.includes('source=pwa');
    }

    if (isStandalone()) {
      banner.classList.add('is-hidden');
    }

    let deferredPrompt = null;
    let hasPromptFired = false;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); 
      deferredPrompt = e;
      hasPromptFired = true;
      if (!isStandalone()) {
        title.textContent = "发现原生形态";
        msg.textContent = '原生加持：点击安装，体验零延迟、不掉线的独立 PWA 调度系统。';
        btn.style.display = 'block';
        banner.classList.remove('is-hidden');
      }
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      banner.classList.add('is-hidden');
      console.log('PWA 已成功安装到系统！');
    });

    btn.addEventListener('click', async () => {
      // 热更新动作拦截分支
      if (btn.getAttribute('data-action') === 'update') {
        const worker = window.pendingUpdateWorker;
        if (worker) worker.postMessage({ type: 'SKIP_WAITING' });
        return;
      }
      
      // 普通安装拦截分支
      if (!deferredPrompt) {
        showToast("当前环境拦截到系统不支持，请在浏览器菜单中手动添加到桌面。", "warning");
        return;
      }
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') banner.classList.add('is-hidden');
      deferredPrompt = null;
    });

    closeBtn.addEventListener('click', () => { banner.classList.add('is-hidden'); });

    // PWA 更新降临事件监听器
    window.addEventListener('pwaUpdateAvailable', (e) => {
      title.textContent = "✨ 发现新版本";
      msg.textContent = '指挥中枢已在后台下发了升级包。点击刷新，立即体验全新修补的内容，不会丢失当前数据。';
      btn.textContent = '立即更新';
      btn.setAttribute('data-action', 'update');
      window.pendingUpdateWorker = e.detail.worker;
      btn.style.display = 'block';
      banner.classList.remove('is-hidden');
    });

    // 监听 SKIP_WAITING 执行结束，立马刷新
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    // 平台防漏兜底
    const isIos = () => { return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()); };
    const isAndroid = () => { return /android/.test(window.navigator.userAgent.toLowerCase()); };
    
    setTimeout(() => {
      if (isStandalone() || hasPromptFired || btn.getAttribute('data-action') === 'update') return;
      
      if (isIos()) {
        title.textContent = "苹果系统拦截";
        msg.textContent = 'Safari 强权：请点击底部 ⬆️（分享）-> 找到 [添加到主屏幕] 从而获取全屏沉浸特权。';
        btn.style.display = 'none';
        banner.classList.remove('is-hidden');
      } else if (isAndroid()) {
        title.textContent = "安卓内核限制";
        msg.textContent = '检测到浏览器屏蔽了自动发牌：请点击右上角 ┇ 菜单 -> 找到 [添加到主屏幕] 赋予长驻运行权。';
        btn.style.display = 'none';
        banner.classList.remove('is-hidden');
      }
    }, 4500); 
  }

  initData();
  setTimeout(checkAuthSession, 300); // Start Auth Engine


  // === Stepper / Dynamic Params Engine ===
  surgeryType.addEventListener('change', (e) => {
    const val = e.target.value.trim();
    if (!val) return;
    for (const [key, device] of Object.entries(Surgery_Device_Mapping)) {
      if (val.includes(key)) { deviceModelSelect.value = device; break; }
    }
    renderSurgeryParams(val);
  });

  fabNewCase.addEventListener('click', () => {
    currentStep = 1; updateStepper(); document.getElementById('caseForm').reset();
    document.getElementById('caseForm').removeAttribute('data-bound-task');
    dynamicParameters.innerHTML = ''; showView('caseFormView');
  });
  btnBack.addEventListener('click', () => showView('dashboardView'));

  function renderParamsDOM(templateArray) {
    dynamicParameters.innerHTML = '';
    if(!templateArray || templateArray.length === 0) { dynamicParameters.innerHTML = `<p style="font-size:0.85rem; color:#888;">无核心模板，请自定或重新选择术式。</p>`; return; }
    for(let i=0; i<templateArray.length; i+=2) {
      const row = document.createElement('div'); row.className = 'field-group param-row';
      const col1 = `<div class="param-input"><label class="field-label param-label-text" contenteditable="true" style="border-bottom:1px dashed #ccc">${templateArray[i].label}</label><input type="text" class="field param-val" placeholder="..."></div>`;
      let col2 = '';
      if(i+1 < templateArray.length) { col2 = `<div class="param-input"><label class="field-label param-label-text" contenteditable="true" style="border-bottom:1px dashed #ccc">${templateArray[i+1].label}</label><input type="text" class="field param-val" placeholder="..."></div>`; }
      row.innerHTML = col1 + col2 + `<button type="button" class="param-delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>`;
      row.querySelector('.param-delete').addEventListener('click', () => row.remove());
      dynamicParameters.appendChild(row);
    }
  }

  function renderSurgeryParams(surgeryName) {
    let tplToRender = [];
    const cached = localStorage.getItem('TPL_' + surgeryName);
    if (cached) { try { tplToRender = JSON.parse(cached); } catch(e) {} } 
    else {
      tplToRender = Surgery_Param_Mapping[surgeryName] || null;
      if (!tplToRender) {
        for (const [key, val] of Object.entries(Surgery_Param_Mapping)) {
          if (surgeryName.includes(key) || key.includes(surgeryName)) { tplToRender = val; break; }
        }
      }
    }
    renderParamsDOM(tplToRender || []);
  }

  saveTemplateBtn.addEventListener('click', () => {
    const surgery = surgeryType.value.trim();
    if (!surgery) return;
    const labels = Array.from(dynamicParameters.querySelectorAll('.param-label-text')).map(el => { return { label: el.textContent.trim() || '未命名参数' }; });
    localStorage.setItem('TPL_' + surgery, JSON.stringify(labels));
    showToast(`✅ 已固化！`, 'success');
  });

  function updateStepper() {
    stepIndicators.forEach(indicator => { indicator.classList.toggle('is-active', parseInt(indicator.getAttribute('data-step'), 10) === currentStep); });
    formSteps.forEach(stepContent => { stepContent.classList.toggle('is-active', parseInt(stepContent.getAttribute('data-step'), 10) === currentStep); });
    btnPrev.style.visibility = (currentStep === 1) ? 'hidden' : 'visible';
    if (currentStep === totalSteps) { btnNext.classList.add('is-hidden'); btnSubmit.classList.remove('is-hidden'); } 
    else { btnNext.classList.remove('is-hidden'); btnSubmit.classList.add('is-hidden'); }
  }
  btnNext.addEventListener('click', () => { if (currentStep < totalSteps) { currentStep++; updateStepper(); } });
  btnPrev.addEventListener('click', () => { if (currentStep > 1) { currentStep--; updateStepper(); } });

  addParamBtn.addEventListener('click', () => {
    const row = document.createElement('div'); row.className = 'field-group param-row';
    row.innerHTML = `<div class="param-input"><label class="field-label param-label-text" contenteditable="true" style="border-bottom:1px dashed #ccc;">[命名字段]</label><input type="text" class="field param-val" placeholder="..."></div><button type="button" class="param-delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>`;
    row.querySelector('.param-delete').addEventListener('click', () => row.remove());
    dynamicParameters.appendChild(row);
  });

  qrScanInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const udi = Date.now().toString().slice(-8);
      const div = document.createElement('div'); div.className = 'consumable-row';
      div.innerHTML = `<strong>UDI:</strong> ${udi}`;
      div.setAttribute('data-udi', udi);
      consumableList.appendChild(div); e.target.value = '';
    }
  });

  function compressImage(file, maxSize = 1200) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas'); let w = img.width; let h = img.height;
          if (w > h && w > maxSize) { h *= maxSize / w; w = maxSize; } else if (h > maxSize) { w *= maxSize / h; h = maxSize; }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.8)); // Hard compression for DB JSONB
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  paperParamInput.addEventListener('change', async (e) => {
    if (e.target.files.length === 0) return;
    paperParamPreview.textContent = '解析与转码上传缓冲中...';
    capturedPaperImages = [];
    for (let i = 0; i < e.target.files.length; i++) {
        const base64 = await compressImage(e.target.files[i]);
        capturedPaperImages.push(base64);
        const img = document.createElement('img'); img.src = base64; img.style.cssText = 'width:100%; max-width:140px; border-radius:6px; margin:4px;';
        if (i === 0) paperParamPreview.innerHTML = ''; paperParamPreview.appendChild(img);
    }
  });

  mediaInput.addEventListener('change', async (e) => {
    if (e.target.files.length === 0) return;
    mediaPreview.textContent = '压片池处理中...';
    capturedMediaImages = [];
    for (let i = 0; i < e.target.files.length; i++) {
        const base64 = await compressImage(e.target.files[i]);
        capturedMediaImages.push(base64);
        const img = document.createElement('img'); img.src = base64; img.style.cssText = 'width:100%; max-width:140px; border-radius:8px; margin:4px;';
        if (i === 0) mediaPreview.innerHTML = ''; mediaPreview.appendChild(img);
    }
  });

  // SUBMIT CLINICAL CASE DIRECT TO SUPABASE
  document.getElementById('caseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!currentUser) { showToast('登录身份丢失，无法入库', 'error'); return; }
    const btn = document.getElementById('submitBtn');
    btn.textContent = '云端数据库收录封板中...';
    btn.disabled = true;

    // 1. Pack JSONB parameters
    let dynamicJsonb = [];
    const paramInputs = dynamicParameters.querySelectorAll('.param-input');
    paramInputs.forEach(node => {
      const label = node.querySelector('.param-label-text').textContent;
      const val = node.querySelector('.param-val').value;
      dynamicJsonb.push({ label, value: val });
    });

    // 2. Pack Consumables
    let qrUdis = [];
    consumableList.querySelectorAll('.consumable-row').forEach(row => { qrUdis.push(row.getAttribute('data-udi')); });

    // 3. Payload
    const taskId = e.target.getAttribute('data-bound-task') || null;
    const payload = {
      engineer_id: currentUser.id,
      engineer_name: localStorage.getItem('cachedName') || '工程师',
      task_id: taskId,
      hospital: hospitalSearch.value.trim(),
      doctor_name: doctorName.value.trim(),
      surgery_type: surgeryType.value.trim(),
      device_model: deviceModelSelect.value,
      dynamic_parameters: dynamicJsonb,
      paper_records: capturedPaperImages,
      media_photos: capturedMediaImages,
      consumable_qr_codes: qrUdis,
      is_abnormal: isAbnormal.checked,
      outcome_summary: outcome.value.trim(),
      complications: complications.value.trim()
    };

    try {
      const { error } = await supabase.from('clinical_cases').insert(payload);
      if(error) throw error;
      
      // Mark task as completed if any
      if(taskId) {
        await supabase.from('dispatch_tasks').update({ status: 'completed' }).eq('id', taskId);
      }
      
      showToast('🔒 云端确认！所有全链路表单、参数JSON、图像均已落存 Supabase，跟台圆满结束。', 'success');
      
      // Cleanup UI
      e.target.reset(); mediaPreview.textContent = '暂无文件'; paperParamPreview.textContent = '相机高压录原纸存档';
      dynamicParameters.innerHTML = ''; consumableList.innerHTML = ''; capturedPaperImages=[]; capturedMediaImages=[];
      showView('dashboardView');
      let td = parseInt(document.getElementById('statToday').textContent, 10) || 0;
      document.getElementById('statToday').textContent = td + 1;
    } catch(err) {
      console.warn('Direct upload failed, switching to offline mode:', err);
      saveOfflineCase(payload);
      
      // Cleanup UI anyway
      e.target.reset(); mediaPreview.textContent = '暂无文件'; paperParamPreview.textContent = '相机高压录原纸存档';
      dynamicParameters.innerHTML = ''; consumableList.innerHTML = ''; capturedPaperImages=[]; capturedMediaImages=[];
      showView('dashboardView');
    }
    btn.disabled = false;
    btn.textContent = '归卷终态全量落库';
  });

  // V4.8: 显式触发通知权限 (iOS 必须由点击触发)
  document.getElementById('enableNotificationsBtn').addEventListener('click', async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        const name = localStorage.getItem('cachedName') || (currentUser ? currentUser.email.split('@')[0] : '工程师');
        await subscribeToWebPush(name);
        document.getElementById('notificationBanner').classList.add('is-hidden');
        showToast('✅ 实时提醒已开启，请保持 App 在后台运行。', 'success');
      } else {
        showToast('❌ 权限未授予，您将无法收到离线推送。请在系统设置中允许本 App 的通知。', 'error');
      }
    } catch (e) {
      showToast('无法请求通知权限：' + e.message, 'error');
    }
  });
});
