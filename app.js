document.addEventListener('DOMContentLoaded', () => {
  // === Supabase Initialization ===
  const SUPABASE_URL = 'https://rcdwxpckyeloqbwoggbq.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_PqGg_I2ElFiWkU1BHAY72w_0HlZQRcZ';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  
  const hospitalSearch = document.getElementById('hospitalSearch');
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
  const engineerList = document.getElementById('engineerList');
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
        fabNewCase.classList.remove('is-hidden');
      }
    }
  }

  // --- Supabase Authenticaton ---
  roleRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.querySelectorAll('.role-tab').forEach(lbl => lbl.style.color = '#64748b');
      e.target.parentNode.style.color = '#000';
    });
  });
  toRegisterBtn.addEventListener('click', () => { loginForm.classList.add('is-hidden'); registerForm.classList.remove('is-hidden'); });
  toLoginBtn.addEventListener('click', () => { registerForm.classList.add('is-hidden'); loginForm.classList.remove('is-hidden'); });

  function getEmailFromPhone(phone) { return `${phone}@antigravity.clinic`; } // Supabase Auth Mock Wrapper

  async function syncProfileRole() {
    try {
      const { data } = await supabase.from('user_profiles').select('role, full_name').eq('id', currentUser.id).single();
      if(data) {
        currentRole = data.role;
        localStorage.setItem('userRole', currentRole);
        localStorage.setItem('cachedName', data.full_name);
      }
    } catch(e) { console.warn('Pofile fetch fail', e); }
  }

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('regPhone').value;
    const name = document.getElementById('regUsername').value;
    const pwd = document.getElementById('regPassword').value;
    const role = document.querySelector('input[name="authRole"]:checked').value;
    if(!phone || !name || !pwd) return;

    const btn = registerForm.querySelector('button'); btn.textContent = '注册中...';
    try {
      const { data, error } = await supabase.auth.signUp({ email: getEmailFromPhone(phone), password: pwd });
      if(error) throw error;
      // Also init profile
      if(data.user) {
         await supabase.from('user_profiles').insert({ id: data.user.id, full_name: name, role: role });
      }
      alert('注册成功，请使用新身份登录！');
      registerForm.classList.add('is-hidden'); loginForm.classList.remove('is-hidden');
    } catch(err) {
      alert('注册失败: ' + err.message);
    }
    btn.textContent = '立即进站';
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('loginPhone').value;
    const pwd = document.getElementById('loginPassword').value;
    if(!phone || !pwd) return;

    const btn = loginForm.querySelector('button'); btn.textContent = '认证中...';
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: getEmailFromPhone(phone), password: pwd });
      if(error) throw error;
      checkAuthSession();
    } catch(err) {
       alert('登录失败: 请检查手机号或密码。如无账号请先注册。（错误:'+err.message+')');
    }
    btn.textContent = '确 认 登 录';
  });

  logoutBtn.addEventListener('click', async () => {
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
      } else {
        document.getElementById('welcomeText').textContent = `欢迎登入中台，${name}。`;
        showView('dashboardView');
        renderPendingTasks(name);
      }
    } else {
      showView('loginView');
    }
  }
  
  // Realtime Supabase Listeners (For instant cross-device drops)
  supabase.channel('public:dispatch_tasks').on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_tasks' }, () => {
    if (currentRole === 'admin') renderAdminTasks();
    else if (currentRole === 'engineer') renderPendingTasks(localStorage.getItem('cachedName'));
  }).subscribe();


  // --- Database Renders ---
  async function renderAdminTasks() {
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

  async function renderPendingTasks(engineerName) {
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

  refreshAdminTasksBtn.addEventListener('click', renderAdminTasks);

  // === Dispatching Form (Admin Create) ===
  dispatchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!dpEngineer.value || !dpHospital.value) { alert("核心指令不完整！"); return; }
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
      alert(`🚀 单据已下发并推送到 ${dpEngineer.value} 手机端！`);
      dispatchForm.reset();
      renderAdminTasks();
    } catch(err){ alert('派发异常:' + err.message); }
    btn.textContent = '🚀 确认下达指令云穿透';
  });


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
      const { data, error } = await supabase.from('user_profiles').select('full_name').eq('role', 'engineer');
      if (!error && data) {
        engineerList.innerHTML = '';
        data.forEach(user => {
          const opt = document.createElement('option'); opt.value = user.full_name; engineerList.appendChild(opt);
        });
      }
    } catch(e) {}
  }

  function initData() {
    loadHospitals();
    loadEngineers();
    deviceTypes.forEach(d => { const opt = document.createElement('option'); opt.value = d; opt.textContent = d; deviceModelSelect.appendChild(opt); });
    defaultSurgeries.forEach(s => { const opt = document.createElement('option'); opt.value = s; surgeryOptions.appendChild(opt); });
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
    alert(`✅ 已固化！`);
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
    if(!currentUser) { alert('登录身份丢失，无法入库'); return; }
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
      
      alert('🔒 云端确认！所有全链路表单、参数JSON、图像均已落存 Supabase，跟台圆满结束。');
      
      // Cleanup UI
      e.target.reset(); mediaPreview.textContent = '暂无文件'; paperParamPreview.textContent = '相机高压录原纸存档';
      dynamicParameters.innerHTML = ''; consumableList.innerHTML = ''; capturedPaperImages=[]; capturedMediaImages=[];
      showView('dashboardView');
      let td = parseInt(document.getElementById('statToday').textContent, 10) || 0;
      document.getElementById('statToday').textContent = td + 1;
    } catch(err) {
      alert('落库受阻，原因:' + err.message);
    }
    btn.disabled = false;
    btn.textContent = '归卷终态全量落库';
  });
});
