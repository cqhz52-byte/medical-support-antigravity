document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const viewDashboard = document.getElementById('dashboardView');
  const viewForm = document.getElementById('caseFormView');
  const fabNewCase = document.getElementById('newCaseFab');
  const btnBack = document.getElementById('backBtn');
  const btnNext = document.getElementById('nextStepBtn');
  const btnPrev = document.getElementById('prevStepBtn');
  const btnSubmit = document.getElementById('submitBtn');
  
  const stepIndicators = document.querySelectorAll('.stepper .step');
  const formSteps = document.querySelectorAll('.form-step');
  const mediaInput = document.getElementById('mediaInput');
  const mediaPreview = document.getElementById('mediaPreview');
  const deviceModelSelect = document.getElementById('deviceModel');
  const hospitalOptions = document.getElementById('hospitalOptions');
  
  // State
  let currentStep = 1;
  const totalSteps = 4;

  // Mock Data
  const hospitals = ['北京协和医院', '上海静安区中心医院', '广州中山大学附属第一医院', '南京鼓楼医院'];
  const devices = ['超声高频外科集成系统 (US-100)', '内窥镜摄像系统 (Endo-X)', '高频电刀 (ESU-200)'];

  // Init Form Data
  hospitals.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h;
    hospitalOptions.appendChild(opt);
  });

  devices.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    deviceModelSelect.appendChild(opt);
  });

  // Navigation
  function showView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('is-active'));
    document.getElementById(viewId).classList.add('is-active');
    
    if(viewId === 'caseFormView') {
      fabNewCase.classList.add('is-hidden');
    } else {
      fabNewCase.classList.remove('is-hidden');
    }
  }

  fabNewCase.addEventListener('click', () => {
    currentStep = 1;
    updateStepper();
    showView('caseFormView');
  });

  btnBack.addEventListener('click', () => {
    // Optionally confirm before leaving
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

    // Update buttons
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
    // Basic validation could be done here before advancing
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

  // Media Preview
  mediaInput.addEventListener('change', (e) => {
    const files = e.target.files;
    mediaPreview.innerHTML = '';
    
    if (files.length === 0) {
      mediaPreview.textContent = '暂无文件';
      return;
    }

    Array.from(files).forEach(file => {
      const span = document.createElement('span');
      span.className = 'media-chip';
      span.textContent = file.name;
      mediaPreview.appendChild(span);
    });
  });

  // Form Submit
  document.getElementById('caseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('跟台记录已成功保存到本地！');
    
    // reset
    e.target.reset();
    mediaPreview.textContent = '暂无文件';
    showView('dashboardView');
    
    // Update stats mocked
    document.getElementById('statToday').textContent = '1';
  });

  // Init
  updateStepper();
});
