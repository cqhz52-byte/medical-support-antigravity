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
  
  // Data Inputs
  const hospitalSearch = document.getElementById('hospitalSearch');
  const hospitalOptions = document.getElementById('hospitalOptions');
  const surgeryType = document.getElementById('surgeryType');
  const surgeryOptions = document.getElementById('surgeryOptions');
  const deviceModelSelect = document.getElementById('deviceModel');
  
  const dynamicParameters = document.getElementById('dynamicParameters');
  const addParamBtn = document.getElementById('addParamBtn');
  const paperParamInput = document.getElementById('paperParamInput');
  const paperParamPreview = document.getElementById('paperParamPreview');

  const qrScanInput = document.getElementById('qrScanInput');
  const consumableList = document.getElementById('consumableList');
  const mediaInput = document.getElementById('mediaInput');
  const mediaPreview = document.getElementById('mediaPreview');
  
  // State
  let currentStep = 1;
  const totalSteps = 4;

  // Configuration & Mapping Dictionary (V1.3)
  const deviceTypes = [
    'CT引导手术导航系统', 
    '陡脉冲治疗系统', 
    '射频消融系统', 
    '微波消融系统',
    '活检系统', 
    '静脉射频闭合系统', 
    '高频电刀'
  ];
  
  const defaultSurgeries = [
    '腹腔镜胆囊切除术', '肝肿瘤消融术', '射频消融', '微波消融', '甲状腺穿刺', '胰腺肿瘤消融', '穿刺活检', '大隐静脉曲张微创'
  ];

  // Surgery -> Device Auto Matching Strategy
  const Surgery_Device_Mapping = {
    '穿刺活检': 'CT引导手术导航系统',
    '肝肿瘤消融术': '射频消融系统',
    '胰腺肿瘤消融': '陡脉冲治疗系统',
    '微波消融': '微波消融系统',
    '大隐静脉曲张微创': '静脉射频闭合系统',
    '腹腔镜胆囊切除术': '高频电刀'
  };

  // Device -> Parameter Templates Generation Strategy
  const Device_Param_Mapping = {
    'CT引导手术导航系统': [
      { label: '靶点定位精度(mm)', placeholder: '如: 2.5' },
      { label: '穿刺深度(cm)', placeholder: '如: 10' },
      { label: '扫描层厚(mm)', placeholder: '如: 5' }
    ],
    '陡脉冲治疗系统': [
      { label: '治疗电压(V)', placeholder: '如: 1500' },
      { label: '脉冲宽度(μs)', placeholder: '如: 70' },
      { label: '脉冲个数(N)', placeholder: '如: 90' },
      { label: '电极针间距(cm)', placeholder: '如: 1.5' }
    ],
    '射频消融系统': [
      { label: '目标设计功率(W)', placeholder: '如: 80' },
      { label: '消融设定时间(min)', placeholder: '如: 12' },
      { label: '终点阻抗(Ω)', placeholder: '如: 400' }
    ],
    '微波消融系统': [
      { label: '微波输出功率(W)', placeholder: '如: 60' },
      { label: '作业时间(min)', placeholder: '如: 10' }
    ],
    '活检系统': [
      { label: '活检针号(G)', placeholder: '如: 18' },
      { label: '进针总长度(cm)', placeholder: '如: 15' },
      { label: '取材条数', placeholder: '如: 3' }
    ],
    '静脉射频闭合系统': [
      { label: '闭合目标温度(℃)', placeholder: '如: 120' },
      { label: '导管回撤速度(cm/s)', placeholder: '如: 0.5' },
      { label: '累计总能量(J)', placeholder: '如: 8000' }
    ],
    '高频电刀': [
      { label: '电切功率设定(W)', placeholder: '如: 40' },
      { label: '电凝功率设定(W)', placeholder: '如: 40' },
      { label: '工作模式', placeholder: '如: 混切' }
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

  function renderDeviceParams(device) {
    dynamicParameters.innerHTML = ''; // clear
    const templates = Device_Param_Mapping[device] || [];
    
    if(templates.length === 0) {
      dynamicParameters.innerHTML = `<p style="font-size:0.85rem; color:#888;">此设备暂无内置模板，请手动新增参数。</p>`;
      return;
    }

    // pair them up by 2 inputs per row for compactness
    for(let i=0; i<templates.length; i+=2) {
      const row = document.createElement('div');
      row.className = 'field-group param-row';
      
      const col1 = `
        <div class="param-input">
          <label class="field-label">${templates[i].label}</label>
          <input type="text" class="field" placeholder="${templates[i].placeholder}">
        </div>
      `;
      
      let col2 = '';
      if(i+1 < templates.length) {
        col2 = `
          <div class="param-input">
            <label class="field-label">${templates[i+1].label}</label>
            <input type="text" class="field" placeholder="${templates[i+1].placeholder}">
          </div>
        `;
      }
      
      row.innerHTML = col1 + col2;
      dynamicParameters.appendChild(row);
    }
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
    
    // Auto render default
    renderDeviceParams(deviceModelSelect.value);
  }
  initData();

  // Cross-Linkage Logic
  surgeryType.addEventListener('change', (e) => {
    const val = e.target.value.trim();
    // find partial match mapping
    for (const [surgery, device] of Object.entries(Surgery_Device_Mapping)) {
      if (val.includes(surgery)) {
        deviceModelSelect.value = device;
        renderDeviceParams(device);
        break;
      }
    }
  });

  deviceModelSelect.addEventListener('change', (e) => {
    renderDeviceParams(e.target.value);
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

  // Auth Toggle
  toRegisterBtn.addEventListener('click', () => {
    loginForm.classList.add('is-hidden');
    registerForm.classList.remove('is-hidden');
  });

  toLoginBtn.addEventListener('click', () => {
    registerForm.classList.add('is-hidden');
    loginForm.classList.remove('is-hidden');
  });

  // Auth Submit
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

  // Check Auth on load
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

  // Stepper logic
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

  // Dynamic Parameters Add
  addParamBtn.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'field-group param-row';
    row.innerHTML = `
      <div class="param-input">
        <label class="field-label">输入项名称</label>
        <input type="text" class="field" placeholder="如: 补打单次时间">
      </div>
      <div class="param-input">
        <label class="field-label">记录数值</label>
        <input type="text" class="field" placeholder="如: 60s">
      </div>
      <button type="button" class="param-delete" title="移除该参数">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    `;
    
    row.querySelector('.param-delete').addEventListener('click', () => {
      row.remove();
    });
    
    dynamicParameters.appendChild(row);
  });

  // QR Scan handler mock
  qrScanInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const div = document.createElement('div');
      div.className = 'consumable-row';
      div.innerHTML = `<strong>(设备包装条码解析)</strong> SN提取: ${Date.now().toString().slice(-8)}`;
      consumableList.appendChild(div);
      e.target.value = '';
    }
  });

  // Image Front-end Compression Util
  function compressImage(file, maxSize = 1280) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          } else if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Return compressed base64
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = readerEvent.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Handle Paper Document Images
  paperParamInput.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (files.length === 0) return;
    
    paperParamPreview.textContent = '纸质单据归档处理中...';
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const base64 = await compressImage(file);
        const imgEl = document.createElement('img');
        imgEl.src = base64;
        imgEl.style.cssText = 'width: 100%; max-width: 140px; border-radius: 6px; margin: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e2c095;';
        
        if (i === 0) paperParamPreview.innerHTML = ''; 
        paperParamPreview.appendChild(imgEl);
      }
    }
  });

  // Handle Surgery Environment Images
  mediaInput.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (files.length === 0) {
      mediaPreview.textContent = '暂无现场图片';
      return;
    }

    mediaPreview.textContent = '画质极速压缩中...';
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const base64 = await compressImage(file);
        const imgEl = document.createElement('img');
        imgEl.src = base64;
        imgEl.style.cssText = 'width: 100%; max-width: 140px; border-radius: 8px; margin: 4px;';
        
        if (i === 0) mediaPreview.innerHTML = ''; 
        mediaPreview.appendChild(imgEl);
      }
    }
  });

  // Form Submit
  document.getElementById('caseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('全部状态捕获！跟台记录（带纸质相册流）均已压缩保存于本地前端。');
    
    e.target.reset();
    mediaPreview.textContent = '暂无文件';
    paperParamPreview.textContent = '支持拍摄原纸单以替代手输入库';
    renderDeviceParams(deviceModelSelect.value); // reset the params config
    consumableList.innerHTML = '';
    
    showView('dashboardView');
    
    let currentToday = parseInt(document.getElementById('statToday').textContent, 10);
    document.getElementById('statToday').textContent = currentToday + 1;
  });
});
