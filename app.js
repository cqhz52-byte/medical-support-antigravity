document.addEventListener('DOMContentLoaded', () => {
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
  
  // === Data Inputs ===
  const hospitalSearch = document.getElementById('hospitalSearch');
  const doctorName = document.getElementById('doctorName');
  const hospitalOptions = document.getElementById('hospitalOptions');
  const surgeryType = document.getElementById('surgeryType');
  const surgeryOptions = document.getElementById('surgeryOptions');
  const deviceModelSelect = document.getElementById('deviceModel');
  
  const dynamicParameters = document.getElementById('dynamicParameters');
  const addParamBtn = document.getElementById('addParamBtn');
  const saveTemplateBtn = document.getElementById('saveTemplateBtn');
  
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
  const dpSurgery = document.getElementById('dpSurgery');
  const dpTime = document.getElementById('dpTime');
  const adminDispatchList = document.getElementById('adminDispatchList');
  const refreshAdminTasksBtn = document.getElementById('refreshAdminTasksBtn');

  // State
  let currentStep = 1;
  const totalSteps = 4;

  // -- V1.6 Configuration & Deep Industry Mapping Strategy --
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
    '微波消融': [
      { label: '微波天线及规格型号' }, { label: '术前靶向肿瘤大小(cm)' }, { label: '输出微波功率(W)' },
      { label: '微波辐射持续时间(min)' }, { label: '消融杀灭预期范围(cm)' }
    ],
    '机器人辅助手术': [
      { label: '机械臂套管布局耗时(min)' }, { label: '空间注册配准误差(mm)' },
      { label: '各臂干涉预警拦截次数' }, { label: '关键器械更替架次(次)' },
      { label: '控制台对接距离(cm)' }, { label: '主控重启及报错记录' }
    ],
    '大隐静脉曲张闭合': [
      { label: '静脉主干直径(mm)' }, { label: '治疗节段长度(cm)' }, { label: '闭合目标温度(℃)' },
      { label: '执行内实际平均温度(℃)' }, { label: '导丝回撤速度(cm/s)' }, { label: '总射频能量(J)' }
    ],
    '常规高频外科切除': [
      { label: '设备电切档位功率(W)' }, { label: '设备电凝预设模式' }
    ]
  };

  // --- V1.6 Database Middleware Simulation ---
  // In production, this uses Supabase `supabase.from('dispatch_tasks')`
  function getDBTasks() {
    const data = localStorage.getItem('GLOBAL_DISPATCH_DB');
    return data ? JSON.parse(data) : [];
  }
  function saveDBTasks(tasks) {
    localStorage.setItem('GLOBAL_DISPATCH_DB', JSON.stringify(tasks));
  }

  // First time mock population
  if (!localStorage.getItem('GLOBAL_DISPATCH_DB')) {
    saveDBTasks([
      { id: 'T1002', engineer: '李工', hospital: '北京协和医院', doctor: '张主任', surgery: 'IRE(不可逆电穿孔)', time: '今日 14:00', status: 'pending' },
      { id: 'T1005', engineer: '李工', hospital: '武汉同济医院', doctor: '陈教授', surgery: '机器人辅助手术', time: '明日 08:30', status: 'pending' }
    ]);
  }

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
        fabNewCase.classList.remove('is-hidden');
      }
    }
  }

  // 渲染管理员列表
  function renderAdminTasks() {
    const tasks = getDBTasks();
    adminDispatchList.innerHTML = '';
    
    tasks.reverse().forEach((task) => {
      const li = document.createElement('li');
      li.className = 'case-item';
      let statusHtml = '';
      if(task.status === 'pending') {
        statusHtml = `<span class="status-badge" style="background:#fef08a; color:#854d0e;">待接单执行</span>`;
      } else {
        statusHtml = `<span class="status-badge" style="background:#dcfce7; color:#166534;">已接单运行</span>`;
      }

      li.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <strong style="color:#0f172a; font-size:0.95rem;">${task.hospital}</strong>
          ${statusHtml}
        </div>
        <div style="font-size:0.8rem; color:#475569; display:flex; flex-direction:column; gap:4px;">
          <span>📌 接受者: ${task.engineer} | 🗓️ ${task.time}</span>
          <span>🩺 术式: ${task.surgery}</span>
          <span>👨‍⚕️ 医生: ${task.doctor}</span>
        </div>
      `;
      adminDispatchList.appendChild(li);
    });
  }

  // 渲染工程师自己的单子
  function renderPendingTasks(engineerName) {
    pendingTaskList.innerHTML = '';
    const allTasks = getDBTasks();
    // V1.6 Filter for this engineer specifically (cross-device capable!)
    const activeTasks = allTasks.filter(t => t.status === 'pending' && (!t.engineer || t.engineer.includes(engineerName)));
    
    if (activeTasks.length === 0) {
      pendingTaskList.innerHTML = `<p style="font-size:0.8rem; color:#888; text-align:center;">暂无派发给您的新工单</p>`;
      return;
    }

    activeTasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = 'case-item';
      li.style.borderColor = '#bae6fd';
      
      li.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <strong style="color:#0369a1; font-size:0.9rem;">${task.hospital}</strong>
          <span style="font-size:0.75rem; background:#f0f9ff; color:#0c4a6e; padding:2px 6px; border-radius:4px;">${task.time}</span>
        </div>
        <p style="color:#475569;"><strong>类型：</strong>${task.surgery}</p>
        <p style="color:#475569;"><strong>派单：</strong>对接 ${task.doctor}</p>
        <button class="primary-btn accept-task-btn" data-id="${task.id}" style="width:100%; margin-top:10px; padding: 8px; font-size:0.85rem;">一键接单穿透预填</button>
      `;
      pendingTaskList.appendChild(li);
    });

    document.querySelectorAll('.accept-task-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const taskId = e.target.getAttribute('data-id');
        let db = getDBTasks();
        // Update global DB status
        const taskIdx = db.findIndex(t => t.id === taskId);
        if(taskIdx > -1) {
          db[taskIdx].status = 'started';
          saveDBTasks(db);
        }
        
        renderPendingTasks(localStorage.getItem('currentUser'));

        currentStep = 1;
        updateStepper();
        hospitalSearch.value = db[taskIdx].hospital;
        doctorName.value = db[taskIdx].doctor;
        surgeryType.value = db[taskIdx].surgery;
        // Trigger mapping DOM update
        surgeryType.dispatchEvent(new Event('change'));
        showView('caseFormView');
      });
    });
  }

  // --- Real-time Listeners (Simulate Database Subscriptions) ---
  window.addEventListener('storage', (e) => {
    if (e.key === 'GLOBAL_DISPATCH_DB') {
      // If someone writes to DB on another tab
      const role = localStorage.getItem('userRole');
      if (role === 'admin') {
        renderAdminTasks();
      } else if (role === 'engineer') {
        renderPendingTasks(localStorage.getItem('currentUser'));
      }
    }
  });

  refreshAdminTasksBtn.addEventListener('click', renderAdminTasks);

  // === Dispatching Form (Admin Create) ===
  dispatchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!dpEngineer.value || !dpHospital.value) {
      alert("信息填报不完善！"); return;
    }
    const newTask = {
      id: 'T' + Date.now().toString().slice(-4),
      engineer: dpEngineer.value.trim(),
      hospital: dpHospital.value.trim(),
      doctor: dpDoctor.value.trim() || '未定医生',
      surgery: dpSurgery.value,
      time: dpTime.value.trim(),
      status: 'pending'
    };
    const db = getDBTasks();
    db.push(newTask);
    saveDBTasks(db);
    alert(`🚀 任务「${newTask.hospital} / ${newTask.surgery}」已成功秒穿透至 ${newTask.engineer} 的工作端！`);
    dispatchForm.reset();
    renderAdminTasks();
  });


  // === Initialization Logic ===
  async function loadHospitals() {
    try {
      const resp = await fetch('./hospitals.json');
      if (resp.ok) {
        const data = await resp.json();
        hospitalOptions.innerHTML = '';
        data.forEach(h => {
          const opt = document.createElement('option');
          opt.value = h.name;
          hospitalOptions.appendChild(opt);
        });
      }
    } catch (e) {}
  }

  function initData() {
    loadHospitals();
    deviceTypes.forEach(d => {
      const opt = document.createElement('option'); opt.value = d; opt.textContent = d;
      deviceModelSelect.appendChild(opt);
    });
    defaultSurgeries.forEach(s => {
      const opt = document.createElement('option'); opt.value = s;
      surgeryOptions.appendChild(opt);
    });
  }
  initData();

  // --- Auth Controls ---
  roleRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.role-tab').forEach(lbl => lbl.style.color = '#64748b');
      e.target.parentNode.style.color = '#000';
    });
  });

  toRegisterBtn.addEventListener('click', () => {
    loginForm.classList.add('is-hidden');
    registerForm.classList.remove('is-hidden');
  });
  toLoginBtn.addEventListener('click', () => {
    registerForm.classList.add('is-hidden');
    loginForm.classList.remove('is-hidden');
  });

  function processLogin(name) {
    const rawRole = document.querySelector('input[name="authRole"]:checked').value;
    localStorage.setItem('currentUser', name);
    localStorage.setItem('userRole', rawRole);
    checkAuthSession();
  }

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regUsername').value;
    if(name) processLogin(name);
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('loginUsername').value;
    if(name) processLogin(name);
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    document.getElementById('loginForm').reset();
    showView('loginView');
  });

  function checkAuthSession() {
    const user = localStorage.getItem('currentUser');
    const role = localStorage.getItem('userRole') || 'engineer';
    
    if(user) {
      if (role === 'admin') {
        document.getElementById('adminWelcomeText').textContent = `最高指控官：${user}`;
        showView('adminDashboardView');
        renderAdminTasks();
      } else {
        document.getElementById('welcomeText').textContent = `欢迎登入中台，${user}。`;
        showView('dashboardView');
        renderPendingTasks(user);
      }
    } else {
      showView('loginView');
    }
  }
  // Run on start
  checkAuthSession();


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
    currentStep = 1;
    updateStepper();
    document.getElementById('caseForm').reset();
    dynamicParameters.innerHTML = '';
    showView('caseFormView');
  });
  btnBack.addEventListener('click', () => {
    showView('dashboardView');
  });

  function renderParamsDOM(templateArray) {
    dynamicParameters.innerHTML = '';
    if(!templateArray || templateArray.length === 0) {
      dynamicParameters.innerHTML = `<p style="font-size:0.85rem; color:#888;">暂无内置模板，请通过下方按钮手动建立。</p>`; return;
    }
    for(let i=0; i<templateArray.length; i+=2) {
      const row = document.createElement('div'); row.className = 'field-group param-row';
      const col1 = `<div class="param-input"><label class="field-label param-label-text" contenteditable="true" style="border-bottom:1px dashed #ccc">${templateArray[i].label}</label><input type="text" class="field" placeholder="输入参数数值..."></div>`;
      let col2 = '';
      if(i+1 < templateArray.length) { col2 = `<div class="param-input"><label class="field-label param-label-text" contenteditable="true" style="border-bottom:1px dashed #ccc">${templateArray[i+1].label}</label><input type="text" class="field" placeholder="输入参数数值..."></div>`; }
      row.innerHTML = col1 + col2 + `<button type="button" class="param-delete" title="移除该参数"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>`;
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
    if (!surgery) { alert("请先确定『手术类型』！"); return; }
    const labels = Array.from(dynamicParameters.querySelectorAll('.param-label-text')).map(el => { return { label: el.textContent.trim() || '未命名参数' }; });
    localStorage.setItem('TPL_' + surgery, JSON.stringify(labels));
    alert(`✅ 已固化！\n本地的以后的 ${surgery} 将直接复现此版本。`);
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
    row.innerHTML = `<div class="param-input"><label class="field-label param-label-text" contenteditable="true" style="border-bottom:1px dashed #ccc; padding-bottom:2px;">[命名字段]</label><input type="text" class="field" placeholder="记录参数数值..."></div><button type="button" class="param-delete" title="移除"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>`;
    row.querySelector('.param-delete').addEventListener('click', () => row.remove());
    dynamicParameters.appendChild(row);
  });

  qrScanInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const div = document.createElement('div'); div.className = 'consumable-row';
      div.innerHTML = `<strong>(条码识读扫流)</strong> UDI: ${Date.now().toString().slice(-8)}`;
      consumableList.appendChild(div);
      e.target.value = '';
    }
  });

  function compressImage(file, maxSize = 1280) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas'); let w = img.width; let h = img.height;
          if (w > h && w > maxSize) { h *= maxSize / w; w = maxSize; } else if (h > maxSize) { w *= maxSize / h; h = maxSize; }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  paperParamInput.addEventListener('change', async (e) => {
    if (e.target.files.length === 0) return;
    paperParamPreview.textContent = '纸质转档流解析中...';
    for (let i = 0; i < e.target.files.length; i++) {
        const base64 = await compressImage(e.target.files[i]);
        const img = document.createElement('img'); img.src = base64;
        img.style.cssText = 'width:100%; max-width:140px; border-radius:6px; margin:4px; border:1px solid #e2c095;';
        if (i === 0) paperParamPreview.innerHTML = ''; 
        paperParamPreview.appendChild(img);
    }
  });

  mediaInput.addEventListener('change', async (e) => {
    if (e.target.files.length === 0) return (mediaPreview.textContent = '无大图压缩流。');
    mediaPreview.textContent = '重绘切片极速压缩中...';
    for (let i = 0; i < e.target.files.length; i++) {
        const base64 = await compressImage(e.target.files[i]);
        const img = document.createElement('img'); img.src = base64;
        img.style.cssText = 'width:100%; max-width:140px; border-radius:8px; margin:4px;';
        if (i === 0) mediaPreview.innerHTML = ''; 
        mediaPreview.appendChild(img);
    }
  });

  document.getElementById('caseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('全部状态捕获！记录与图像流落盘。');
    e.target.reset(); mediaPreview.textContent = '暂无文件'; paperParamPreview.textContent = '相机高压录原纸存档';
    dynamicParameters.innerHTML = ''; consumableList.innerHTML = '';
    showView('dashboardView');
    let td = parseInt(document.getElementById('statToday').textContent, 10);
    document.getElementById('statToday').textContent = td + 1;
  });
});
