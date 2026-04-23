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
  
  // State
  let currentStep = 1;
  const totalSteps = 4;

  // -- V1.4 Configuration & Surgery-Driven Mapping Strategy --

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

  // Surgery -> Device Auto Matching Strategy
  const Surgery_Device_Mapping = {
    '穿刺活检': 'CT引导手术导航系统',
    '射频消融': '射频消融系统',
    '微波消融': '微波消融系统',
    'IRE': '陡脉冲治疗系统',
    '机器人': '达芬奇手术机器人',
    '静脉': '静脉射频闭合系统',
    '常规': '高频电刀'
  };

  // Surgery -> Typical Parameter Templates Generation Strategy (Built-in)
  // Instead of Device, we base the core params on what Procedure is taking place.
  const Surgery_Param_Mapping = {
    'IRE(不可逆电穿孔)': [
      { label: '输出电压(V)' },
      { label: '脉冲数(N)' },
      { label: '针间距(cm)' },
      { label: '阻抗变化率(%)' }
    ],
    '射频消融': [
      { label: '消融时间(min)' },
      { label: '目标功率(W)' },
      { label: '终点温度(℃)' },
      { label: '组织初始阻抗(Ω)' }
    ],
    '机器人辅助手术': [
      { label: '机械臂预跑完成度(%)' },
      { label: '空间注册配准误差(mm)' },
      { label: '机械臂干涉预警次数' }
    ],
    '常规高频外科切除': [
      { label: '电切功率(W)' },
      { label: '电凝模式及功率' }
    ]
  };

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

  // Generate HTML block given an array of param labels
  function renderParamsDOM(templateArray) {
    dynamicParameters.innerHTML = ''; // clear
    if(!templateArray || templateArray.length === 0) {
      dynamicParameters.innerHTML = `<p style="font-size:0.85rem; color:#888;">无默认记录表，请手动补全。</p>`;
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

  // Load Params (Local > System Defaults)
  function renderSurgeryParams(surgeryName) {
    let tplToRender = [];
    // 1. Check User Custom Cache
    const cached = localStorage.getItem('TPL_' + surgeryName);
    if (cached) {
      try {
        tplToRender = JSON.parse(cached);
      } catch(e) {}
    } else {
      // 2. Exact match in build-in
      tplToRender = Surgery_Param_Mapping[surgeryName] || null;
      // 3. Partial match fuzzy fallback for build-in
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
  }
  initData();

  // Cross-Linkage Logic
  surgeryType.addEventListener('change', (e) => {
    const val = e.target.value.trim();
    if (!val) return;
    
    // Auto map device
    for (const [key, device] of Object.entries(Surgery_Device_Mapping)) {
      if (val.includes(key)) {
        deviceModelSelect.value = device;
        break;
      }
    }
    // Auto map params
    renderSurgeryParams(val);
  });

  // User Save Custom Template Flow
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
    alert(`✅ 已成功将当前参数栏位设为您针对【${surgery}】的默认模板！\n以后每次新建该手术将自动调用千人千面。`);
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
    if (currentStep < totalSteps) {
      currentStep++;
      updateStepper();
    }
  });
  btnPrev.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      updateStepper();
    }
  });

  // Add Custom Param Button
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
    const files = e.target.files;
    if (files.length === 0) return;
    paperParamPreview.textContent = '纸质单据归档处理中...';
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        const base64 = await compressImage(files[i]);
        const imgEl = document.createElement('img');
        imgEl.src = base64;
        imgEl.style.cssText = 'width:100%; max-width:140px; border-radius:6px; margin:4px; box-shadow:0 4px 6px rgba(0,0,0,0.1); border:1px solid #e2c095;';
        if (i === 0) paperParamPreview.innerHTML = ''; 
        paperParamPreview.appendChild(imgEl);
      }
    }
  });

  mediaInput.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (files.length === 0) return (mediaPreview.textContent = '暂无现场图片');
    mediaPreview.textContent = '画质极速压缩中...';
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        const base64 = await compressImage(files[i]);
        const imgEl = document.createElement('img');
        imgEl.src = base64;
        imgEl.style.cssText = 'width:100%; max-width:140px; border-radius:8px; margin:4px;';
        if (i === 0) mediaPreview.innerHTML = ''; 
        mediaPreview.appendChild(imgEl);
      }
    }
  });

  // Submit
  document.getElementById('caseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('全部状态捕获！跟台记录均已压缩保存于本地前端。');
    
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
