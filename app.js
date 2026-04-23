document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const viewLogin = document.getElementById('loginView');
  const viewDashboard = document.getElementById('dashboardView');
  const viewForm = document.getElementById('caseFormView');
  const topbar = document.querySelector('.topbar');
  const fabNewCase = document.getElementById('newCaseFab');
  
  // Auth Elements
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const toRegisterBtn = document.getElementById('toRegisterBtn');
  const toLoginBtn = document.getElementById('toLoginBtn');

  // Form Elements
  const btnBack = document.getElementById('backBtn');
  const btnNext = document.getElementById('nextStepBtn');
  const btnPrev = document.getElementById('prevStepBtn');
  const btnSubmit = document.getElementById('submitBtn');
  
  const stepIndicators = document.querySelectorAll('.stepper .step');
  const formSteps = document.querySelectorAll('.form-step');
  
  // Inputs
  const hospitalSearch = document.getElementById('hospitalSearch');
  const doctorName = document.getElementById('doctorName'); // User input target
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
  
  // Task UI
  const pendingTaskList = document.getElementById('pendingTaskList');

  // State
  let currentStep = 1;
  const totalSteps = 4;

  // -- V1.5 Configuration & Deep Industry Mapping Strategy --

  const deviceTypes = [
    'CT引导手术导航系统', 
    '陡脉冲治疗系统', 
    '射频消融系统', 
    '微波消融系统',
    '活检系统', 
    '静脉射频闭合系统', 
    '高频电刀',
    '达芬奇手术机器人'
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

  // V1.5 Heavy Industry Standard Procedure Dictionaries
  const Surgery_Param_Mapping = {
    'IRE(不可逆电穿孔)': [
      { label: '脉冲电压(V)' },
      { label: '脉冲宽度(μs)' },
      { label: '脉冲个数(N)' },
      { label: '电极针间距(cm)' },
      { label: '针尖暴露长度(cm)' },
      { label: '术中阻抗变化率(%)' },
      { label: '心脏同步(ECG)状态' },
      { label: '肌肉松弛监测等级' }
    ],
    '射频消融': [
      { label: '术前靶标最大径(cm)' },
      { label: '输出设定功率(W)' },
      { label: '消融持续时间(min)' },
      { label: '针尖暴露长度(cm)' },
      { label: '穿刺测温表现(℃)' },
      { label: '阻抗下降比例(%)' }
    ],
    '微波消融': [
      { label: '微波天线及规格型号' },
      { label: '术前靶向肿瘤大小(cm)' },
      { label: '输出微波功率(W)' },
      { label: '微波辐射持续时间(min)' },
      { label: '消融杀灭预期范围(cm)' }
    ],
    '机器人辅助手术': [
      { label: '机械臂套管布局耗时(min)' },
      { label: '空间注册配准误差(mm)' },
      { label: '各臂干涉预警拦截次数' },
      { label: '关键器械更替架次(次)' },
      { label: '控制台与患者车对接距离(cm)' },
      { label: '主控控制台重启及报错记录' }
    ],
    '大隐静脉曲张闭合': [
      { label: '静脉主干直径(mm)' },
      { label: '消融治疗节段长度(cm)' },
      { label: '设定闭合目标温度(℃)' },
      { label: '执行内实际平均温度(℃)' },
      { label: '导丝回撤速度(cm/s)' },
      { label: '系统释放总射频能量(J)' }
    ],
    '常规高频外科切除': [
      { label: '设备电切档位功率(W)' },
      { label: '设备电凝预设模式及功率' }
    ]
  };

  // Mock Task Assignments
  const pendingAssignments = [
    {
      id: 'TASK-1002',
      hospital: '北京协和医院',
      doctor: '张主任',
      surgery: 'IRE(不可逆电穿孔)',
      time: '今日 14:00',
      status: 'pending'
    },
    {
      id: 'TASK-1005',
      hospital: '武汉同济医院',
      doctor: '陈教授',
      surgery: '机器人辅助手术',
      time: '明日 08:30',
      status: 'pending'
    }
  ];

  // Async Fetch Hospitals
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
    } catch (e) {
      console.warn("Could not load hospitals JSON. Working offline.");
    }
  }

  // Render Pending Tasks
  function renderPendingTasks() {
    pendingTaskList.innerHTML = '';
    const activeTasks = pendingAssignments.filter(t => t.status === 'pending');
    
    if (activeTasks.length === 0) {
      pendingTaskList.innerHTML = `<p style="font-size:0.8rem; color:#888; text-align:center;">暂无指派的任务</p>`;
      return;
    }

    activeTasks.forEach((task, index) => {
      const li = document.createElement('li');
      li.className = 'case-item';
      li.style.borderColor = '#bae6fd';
      
      li.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <strong style="color:#0369a1; font-size:0.9rem;">${task.hospital}</strong>
          <span style="font-size:0.75rem; background:#f0f9ff; color:#0c4a6e; padding:2px 6px; border-radius:4px;">${task.time}</span>
        </div>
        <p style="color:#475569;"><strong>类型：</strong>${task.surgery}</p>
        <p style="color:#475569;"><strong>主刀：</strong>${task.doctor}</p>
        <button class="primary-btn accept-task-btn" data-index="${index}" style="width:100%; margin-top:10px; padding: 8px; font-size:0.85rem;">一键接单并录入</button>
      `;
      pendingTaskList.appendChild(li);
    });

    // Attach Listeners
    document.querySelectorAll('.accept-task-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-index');
        const task = activeTasks[idx];

        // Mark as started
        task.status = 'started';
        renderPendingTasks();

        // Data Penetration to Form Pipeline
        currentStep = 1;
        updateStepper();
        
        hospitalSearch.value = task.hospital;
        doctorName.value = task.doctor;
        surgeryType.value = task.surgery;

        // Force trigger mappings
        surgeryType.dispatchEvent(new Event('change'));

        showView('caseFormView');
      });
    });
  }

  // Generate HTML block given an array of param labels
  function renderParamsDOM(templateArray) {
    dynamicParameters.innerHTML = '';
    if(!templateArray || templateArray.length === 0) {
      dynamicParameters.innerHTML = `<p style="font-size:0.85rem; color:#888;">暂无内置模板，请通过下方按钮手动建立。</p>`;
      return;
    }
    for(let i=0; i<templateArray.length; i+=2) {
      const row = document.createElement('div');
      row.className = 'field-group param-row';
      const col1 = `
        <div class="param-input">
          <label class="field-label param-label-text" contenteditable="true" style="border-bottom:1px dashed #ccc">${templateArray[i].label}</label>
          <input type="text" class="field" placeholder="输入记录值...">
        </div>
      `;
      let col2 = '';
      if(i+1 < templateArray.length) {
        col2 = `
          <div class="param-input">
            <label class="field-label param-label-text" contenteditable="true" style="border-bottom:1px dashed #ccc">${templateArray[i+1].label}</label>
            <input type="text" class="field" placeholder="输入记录值...">
          </div>
        `;
      }
      row.innerHTML = col1 + col2 + `
        <button type="button" class="param-delete" title="移除该参数">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      `;
      row.querySelector('.param-delete').addEventListener('click', () => row.remove());
      dynamicParameters.appendChild(row);
    }
  }

  // Load Params
  function renderSurgeryParams(surgeryName) {
    let tplToRender = [];
    const cached = localStorage.getItem('TPL_' + surgeryName);
    if (cached) {
      try {
        tplToRender = JSON.parse(cached);
      } catch(e) {}
    } else {
      tplToRender = Surgery_Param_Mapping[surgeryName] || null;
      if (!tplToRender) {
        for (const [key, val] of Object.entries(Surgery_Param_Mapping)) {
          if (surgeryName.includes(key) || key.includes(surgeryName)) {
            tplToRender = val;
            break;
          }
        }
      }
    }
    renderParamsDOM(tplToRender || []);
  }

  function initData() {
    loadHospitals();
    
    deviceTypes.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      deviceModelSelect.appendChild(opt);
    });

    defaultSurgeries.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      surgeryOptions.appendChild(opt);
    });

    renderPendingTasks();
  }
  initData();

  // Cross-Linkage Logic
  surgeryType.addEventListener('change', (e) => {
    const val = e.target.value.trim();
    if (!val) return;
    for (const [key, device] of Object.entries(Surgery_Device_Mapping)) {
      if (val.includes(key)) {
        deviceModelSelect.value = device;
        break;
      }
    }
    renderSurgeryParams(val);
  });

  // Save Template
  saveTemplateBtn.addEventListener('click', () => {
    const surgery = surgeryType.value.trim();
    if (!surgery) {
      alert("请先填写或选择上方对应的『手术类型』！");
      return;
    }
    const labels = Array.from(dynamicParameters.querySelectorAll('.param-label-text')).map(el => {
      return { label: el.textContent.trim() || '未命名参数' };
    });
    localStorage.setItem('TPL_' + surgery, JSON.stringify(labels));
    alert(`✅ 已成功固化！\n本地的 ${surgery} 将直接调用您修改的高阶版本。`);
  });

  // Navigation Logic
  function showView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('is-active'));
    document.getElementById(viewId).classList.add('is-active');
    
    if (viewId === 'loginView') {
      topbar.style.display = 'none';
      fabNewCase.classList.add('is-hidden');
    } else {
      topbar.style.display = 'flex';
      if(viewId === 'caseFormView') {
        fabNewCase.classList.add('is-hidden');
      } else {
        fabNewCase.classList.remove('is-hidden');
      }
    }
  }

  // Auth
  toRegisterBtn.addEventListener('click', () => {
    loginForm.classList.add('is-hidden');
    registerForm.classList.remove('is-hidden');
  });
  toLoginBtn.addEventListener('click', () => {
    registerForm.classList.add('is-hidden');
    loginForm.classList.remove('is-hidden');
  });

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regUsername').value;
    if(name) {
      localStorage.setItem('currentUser', name);
      document.getElementById('welcomeText').textContent = `欢迎回来，${name}。`;
      showView('dashboardView');
    }
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('loginUsername').value;
    if(name) {
      localStorage.setItem('currentUser', name);
      document.getElementById('welcomeText').textContent = `欢迎回来，${name}。`;
      showView('dashboardView');
    }
  });

  const user = localStorage.getItem('currentUser');
  if(user) {
    document.getElementById('welcomeText').textContent = `欢迎回来，${user}。`;
    showView('dashboardView');
  } else {
    showView('loginView');
  }

  fabNewCase.addEventListener('click', () => {
    currentStep = 1;
    updateStepper();
    // Clear out
    document.getElementById('caseForm').reset();
    dynamicParameters.innerHTML = '';
    showView('caseFormView');
  });
  btnBack.addEventListener('click', () => {
    showView('dashboardView');
  });

  // Stepper
  function updateStepper() {
    stepIndicators.forEach(indicator => {
      const step = parseInt(indicator.getAttribute('data-step'), 10);
      indicator.classList.toggle('is-active', step === currentStep);
    });
    formSteps.forEach(stepContent => {
      const step = parseInt(stepContent.getAttribute('data-step'), 10);
      stepContent.classList.toggle('is-active', step === currentStep);
    });
    btnPrev.style.visibility = (currentStep === 1) ? 'hidden' : 'visible';
    if (currentStep === totalSteps) {
      btnNext.classList.add('is-hidden');
      btnSubmit.classList.remove('is-hidden');
    } else {
      btnNext.classList.remove('is-hidden');
      btnSubmit.classList.add('is-hidden');
    }
  }
  btnNext.addEventListener('click', () => {
    if (currentStep < totalSteps) { currentStep++; updateStepper(); }
  });
  btnPrev.addEventListener('click', () => {
    if (currentStep > 1) { currentStep--; updateStepper(); }
  });

  // Custom Param Button
  addParamBtn.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'field-group param-row';
    row.innerHTML = `
      <div class="param-input">
        <label class="field-label param-label-text" contenteditable="true" style="border-bottom:1px dashed #ccc; padding-bottom:2px;">[点此命名字段]</label>
        <input type="text" class="field" placeholder="记录参数数值...">
      </div>
      <button type="button" class="param-delete" title="移除该参数">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    `;
    row.querySelector('.param-delete').addEventListener('click', () => row.remove());
    dynamicParameters.appendChild(row);
  });

  // QR
  qrScanInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const div = document.createElement('div');
      div.className = 'consumable-row';
      div.innerHTML = `<strong>(设备包装条码解析)</strong> SN提取: ${Date.now().toString().slice(-8)}`;
      consumableList.appendChild(div);
      e.target.value = '';
    }
  });

  // Compress
  function compressImage(file, maxSize = 1280) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height && width > maxSize) { height *= maxSize / width; width = maxSize; } 
          else if (height > maxSize) { width *= maxSize / height; height = maxSize; }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = readerEvent.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Files
  paperParamInput.addEventListener('change', async (e) => {
    if (e.target.files.length === 0) return;
    paperParamPreview.textContent = '纸质单据处理中...';
    for (let i = 0; i < e.target.files.length; i++) {
        const base64 = await compressImage(e.target.files[i]);
        const img = document.createElement('img');
        img.src = base64;
        img.style.cssText = 'width:100%; max-width:140px; border-radius:6px; margin:4px; border:1px solid #e2c095;';
        if (i === 0) paperParamPreview.innerHTML = ''; 
        paperParamPreview.appendChild(img);
    }
  });

  mediaInput.addEventListener('change', async (e) => {
    if (e.target.files.length === 0) return (mediaPreview.textContent = '暂无现场图片');
    mediaPreview.textContent = '极速压缩中...';
    for (let i = 0; i < e.target.files.length; i++) {
        const base64 = await compressImage(e.target.files[i]);
        const img = document.createElement('img');
        img.src = base64;
        img.style.cssText = 'width:100%; max-width:140px; border-radius:8px; margin:4px;';
        if (i === 0) mediaPreview.innerHTML = ''; 
        mediaPreview.appendChild(img);
    }
  });

  // Submit
  document.getElementById('caseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('全部状态捕获！跟台记录归档完毕。');
    
    e.target.reset();
    mediaPreview.textContent = '暂无文件';
    paperParamPreview.textContent = '支持拍摄原纸单以替代手输入库';
    dynamicParameters.innerHTML = ''; 
    consumableList.innerHTML = '';
    
    showView('dashboardView');
    let currentToday = parseInt(document.getElementById('statToday').textContent, 10);
    document.getElementById('statToday').textContent = currentToday + 1;
  });
});
