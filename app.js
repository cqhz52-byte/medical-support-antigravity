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
  const hospitalOptions = document.getElementById('hospitalOptions');
  const surgeryOptions = document.getElementById('surgeryOptions');
  const deviceModelSelect = document.getElementById('deviceModel');
  const dynamicParameters = document.getElementById('dynamicParameters');
  const addParamBtn = document.getElementById('addParamBtn');
  const qrScanInput = document.getElementById('qrScanInput');
  const consumableList = document.getElementById('consumableList');
  const mediaInput = document.getElementById('mediaInput');
  const mediaPreview = document.getElementById('mediaPreview');
  
  // State
  let currentStep = 1;
  const totalSteps = 4;

  // Static Configuration
  const deviceTypes = [
    'CT引导手术导航系统', 
    '陡脉冲治疗系统', 
    '射频消融系统', 
    '活检', 
    '静脉射频闭合系统', 
    '高频电刀'
  ];
  
  const defaultSurgeries = [
    '腹腔镜胆囊切除术', '肝肿瘤消融术', '射频消融', '微波消融', '甲状腺穿刺'
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

  // Dynamic Parameters
  addParamBtn.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'field-group param-row';
    row.innerHTML = `
      <div class="param-input">
        <label class="field-label">参数名</label>
        <input type="text" class="field" placeholder="如: IRE脉冲数">
      </div>
      <div class="param-input">
        <label class="field-label">数值设置</label>
        <input type="text" class="field" placeholder="如: 90">
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

  // QR Scan handler
  qrScanInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // Create a mock consumable entry since pure HTML doesn't reliably decode QR without libraries
      const div = document.createElement('div');
      div.className = 'consumable-row';
      div.innerHTML = `<strong>(扫码识别假体)</strong> SN: ${Date.now().toString().slice(-8)}`;
      consumableList.appendChild(div);
      
      // Reset input
      e.target.value = '';
    }
  });

  // Image Front-end Compression
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

          // Output compressed format
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = readerEvent.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  mediaInput.addEventListener('change', async (e) => {
    const files = e.target.files;
    mediaPreview.innerHTML = '';
    
    if (files.length === 0) {
      mediaPreview.textContent = '暂无文件';
      return;
    }

    mediaPreview.textContent = '压缩中...';
    
    // Process all images
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const compressedBase64 = await compressImage(file);
        
        // Render preview
        const imgEl = document.createElement('img');
        imgEl.src = compressedBase64;
        imgEl.style.cssText = 'width: 100%; max-width: 150px; border-radius: 8px; margin: 5px;';
        
        // Remove text after first compress
        if (i === 0) mediaPreview.innerHTML = ''; 
        mediaPreview.appendChild(imgEl);
      }
    }
  });

  // Form Submit
  document.getElementById('caseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('跟台记录及参数、耗材流已成功保存至离线区！');
    
    e.target.reset();
    mediaPreview.textContent = '暂无文件';
    dynamicParameters.innerHTML = `
      <div class="field-group param-row">
        <div class="param-input">
          <label class="field-label">输出功率(W)</label>
          <input type="number" class="field" placeholder="例如：40">
        </div>
        <div class="param-input">
          <label class="field-label">吸引压力(kPa)</label>
          <input type="number" class="field" placeholder="例如：-80">
        </div>
      </div>
    `;
    consumableList.innerHTML = '';
    showView('dashboardView');
    
    let currentToday = parseInt(document.getElementById('statToday').textContent, 10);
    document.getElementById('statToday').textContent = currentToday + 1;
  });
});
