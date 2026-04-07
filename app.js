/* ============================================
   CPU Scheduling Simulator — Application Logic
   ============================================ */

(() => {
  'use strict';

  // ========== DOM References ==========
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const algorithmSelect = $('#algorithmSelect');
  const quantumField = $('#quantumField');
  const quantumInput = $('#quantumInput');
  const processTableBody = $('#processTableBody');
  const addRowBtn = $('#addRowBtn');
  const runBtn = $('#runBtn');
  const compareBtn = $('#compareBtn');
  const clearBtn = $('#clearBtn');
  const fileInput = $('#fileInput');
  const fileUploadZone = $('#fileUploadZone');
  const fileInfo = $('#fileInfo');
  const fileNameSpan = $('#fileName');
  const removeFileBtn = $('#removeFile');
  const algoBadge = $('#algoBadge');
  const priorityHeader = $('#priorityHeader');
  const mobileToggle = $('#mobileToggle');
  const sidebar = $('#sidebar');
  const sidebarOverlay = $('#sidebarOverlay');
  const themeToggle = $('#themeToggle');

  // ========== State ==========
  let processCounter = 0;
  let currentResults = null;
  let comparisonResults = null;

  // ========== Process Colors ==========
  const PROCESS_COLORS = [
    '#6366f1', '#06b6d4', '#ec4899', '#10b981', '#f59e0b',
    '#f43f5e', '#8b5cf6', '#3b82f6', '#14b8a6', '#e11d48',
    '#a855f7', '#0ea5e9', '#d946ef', '#84cc16', '#f97316'
  ];

  const ALGO_NAMES = {
    'fcfs': 'FCFS',
    'sjf': 'SJF (Non-Preemptive)',
    'priority-np': 'Priority (Non-Preemptive)',
    'srtf': 'SRTF (Preemptive)',
    'priority-p': 'Priority (Preemptive)',
    'rr': 'Round Robin'
  };

  const ALGO_SHORT = {
    'fcfs': 'FCFS',
    'sjf': 'SJF',
    'priority-np': 'Priority NP',
    'srtf': 'SRTF',
    'priority-p': 'Priority P',
    'rr': 'Round Robin'
  };

  // ========== Initialization ==========
  function init() {
    initTheme();
    addProcessRow();
    addProcessRow();
    addProcessRow();
    setupEventListeners();
    updateAlgorithmUI();
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('cpu-sim-theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      updateThemeToggleIcon('light');
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    
    localStorage.setItem('cpu-sim-theme', newTheme);
    updateThemeToggleIcon(newTheme);
  }

  function updateThemeToggleIcon(theme) {
    if (!themeToggle) return;
    const iconLight = themeToggle.querySelector('.icon-light');
    const iconDark = themeToggle.querySelector('.icon-dark');
    if (theme === 'light') {
      iconLight.style.display = 'inline';
      iconDark.style.display = 'none';
    } else {
      iconLight.style.display = 'none';
      iconDark.style.display = 'inline';
    }
  }

  function setupEventListeners() {
    algorithmSelect.addEventListener('change', updateAlgorithmUI);
    addRowBtn.addEventListener('click', () => addProcessRow());
    runBtn.addEventListener('click', runSimulation);
    compareBtn.addEventListener('click', runComparison);
    clearBtn.addEventListener('click', clearAll);
    fileInput.addEventListener('change', handleFileUpload);
    removeFileBtn.addEventListener('click', removeFile);
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    // Drag & drop
    fileUploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileUploadZone.classList.add('dragover');
    });
    fileUploadZone.addEventListener('dragleave', () => {
      fileUploadZone.classList.remove('dragover');
    });
    fileUploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      fileUploadZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileUpload();
      }
    });

    // Tab navigation
    $$('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Mobile sidebar
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      sidebarOverlay.classList.toggle('active');
    });
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });

    // Event delegation for "Compare All" button inside empty state
    $('#comparisonContent').addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-compare-empty')) {
        runComparison();
      }
    });
  }

  // ========== UI Helpers ==========
  function updateAlgorithmUI() {
    const algo = algorithmSelect.value;
    const needsPriority = algo === 'priority-np' || algo === 'priority-p';
    const needsQuantum = algo === 'rr';
    const isPreemptive = ['srtf', 'priority-p', 'rr'].includes(algo);

    // Quantum field
    quantumField.classList.toggle('visible', needsQuantum);

    // Priority columns
    $$('.priority-header').forEach(el => el.classList.toggle('visible', needsPriority));
    $$('.priority-col').forEach(el => el.classList.toggle('visible', needsPriority));

    // Badge
    algoBadge.textContent = isPreemptive ? 'Preemptive' : 'Non-Preemptive';
    algoBadge.className = `algo-badge ${isPreemptive ? 'preemptive' : 'non-preemptive'}`;
  }

  function switchTab(tabId) {
    $$('.tab-btn').forEach(b => b.classList.remove('active'));
    $(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
    $$('.tab-panel').forEach(p => p.classList.remove('active'));
    $(`#panel-${tabId}`).classList.add('active');
  }

  function showToast(msg, type = 'success') {
    const existing = $('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ========== Process Table ==========
  function addProcessRow(data = null) {
    processCounter++;
    const pid = data?.pid || `P${processCounter}`;
    const arrival = data?.arrival ?? '';
    const burst = data?.burst ?? '';
    const priority = data?.priority ?? '';

    const tr = document.createElement('tr');
    tr.dataset.row = processCounter;
    tr.innerHTML = `
      <td class="input-cell">
        <input type="text" value="${pid}" data-field="pid" placeholder="P${processCounter}" />
      </td>
      <td class="input-cell">
        <input type="number" value="${arrival}" data-field="arrival" min="0" placeholder="0" />
      </td>
      <td class="input-cell">
        <input type="number" value="${burst}" data-field="burst" min="1" placeholder="e.g. 5" />
      </td>
      <td class="input-cell priority-col">
        <input type="number" value="${priority}" data-field="priority" min="0" placeholder="e.g. 1" />
      </td>
      <td class="action-cell">
        <button class="btn btn-icon btn-danger remove-row-btn" title="Remove process">✕</button>
      </td>
    `;

    tr.querySelector('.remove-row-btn').addEventListener('click', () => {
      if (processTableBody.children.length > 1) {
        tr.remove();
      } else {
        showToast('At least one process is required.', 'warning');
      }
    });

    processTableBody.appendChild(tr);
    updateAlgorithmUI();
  }

  function getProcesses() {
    const rows = processTableBody.querySelectorAll('tr');
    const processes = [];
    const errors = [];
    const pids = new Set();

    rows.forEach((row, idx) => {
      const pid = row.querySelector('[data-field="pid"]').value.trim();
      const arrivalVal = row.querySelector('[data-field="arrival"]').value.trim();
      const burstVal = row.querySelector('[data-field="burst"]').value.trim();
      const priorityVal = row.querySelector('[data-field="priority"]')?.value.trim() || '0';

      // Clear error styles
      row.querySelectorAll('input').forEach(i => i.classList.remove('error'));

      if (!pid) {
        errors.push(`Row ${idx + 1}: Process ID is required.`);
        row.querySelector('[data-field="pid"]').classList.add('error');
      }
      if (pids.has(pid)) {
        errors.push(`Row ${idx + 1}: Duplicate Process ID "${pid}".`);
        row.querySelector('[data-field="pid"]').classList.add('error');
      }
      pids.add(pid);

      if (arrivalVal === '' || isNaN(Number(arrivalVal)) || Number(arrivalVal) < 0) {
        errors.push(`Row ${idx + 1}: Arrival Time must be a non-negative number.`);
        row.querySelector('[data-field="arrival"]').classList.add('error');
      }

      if (burstVal === '' || isNaN(Number(burstVal)) || Number(burstVal) <= 0) {
        errors.push(`Row ${idx + 1}: Burst Time must be greater than zero.`);
        row.querySelector('[data-field="burst"]').classList.add('error');
      }

      const algo = algorithmSelect.value;
      if ((algo === 'priority-np' || algo === 'priority-p') && (priorityVal === '' || isNaN(Number(priorityVal)) || Number(priorityVal) < 0)) {
        errors.push(`Row ${idx + 1}: Priority must be a non-negative number.`);
        const priInput = row.querySelector('[data-field="priority"]');
        if (priInput) priInput.classList.add('error');
      }

      processes.push({
        pid,
        arrival: Number(arrivalVal),
        burst: Number(burstVal),
        priority: Number(priorityVal) || 0
      });
    });

    return { processes, errors };
  }

  // ========== File Handling ==========
  function handleFileUpload() {
    const file = fileInput.files[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.json')) {
      showToast('Please upload a CSV or JSON file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let data;
        if (name.endsWith('.csv')) {
          data = parseCSV(e.target.result);
        } else {
          data = JSON.parse(e.target.result);
          if (!Array.isArray(data)) {
            throw new Error('JSON must be an array of process objects.');
          }
        }

        // Validate and load
        if (data.length === 0) {
          showToast('File contains no process data.', 'error');
          return;
        }

        processTableBody.innerHTML = '';
        processCounter = 0;
        data.forEach(p => {
          addProcessRow({
            pid: p.pid || p.PID || p.process_id || `P${processCounter + 1}`,
            arrival: p.arrival ?? p.arrival_time ?? p.AT ?? 0,
            burst: p.burst ?? p.burst_time ?? p.BT ?? 1,
            priority: p.priority ?? p.Priority ?? 0
          });
        });

        fileInfo.style.display = 'flex';
        fileNameSpan.textContent = file.name;
        showToast(`Loaded ${data.length} processes from ${file.name}`, 'success');
      } catch (err) {
        showToast(`File error: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  }

  function parseCSV(text) {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).map((line, idx) => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i];
      });
      return {
        pid: obj.pid || obj.process_id || `P${idx + 1}`,
        arrival: Number(obj.arrival ?? obj.arrival_time ?? 0),
        burst: Number(obj.burst ?? obj.burst_time ?? 1),
        priority: Number(obj.priority ?? 0)
      };
    });
  }

  function removeFile() {
    fileInput.value = '';
    fileInfo.style.display = 'none';
    fileNameSpan.textContent = '';
  }

  // ========== Scheduling Algorithms ==========
  // Each algorithm takes an array of process objects {pid, arrival, burst, priority}
  // and returns {gantt[], results[], totalTime} for visualization.

  // --- FCFS (First Come First Served) ---
  // Simplest algorithm: processes execute in order of arrival time.
  // Non-preemptive — once a process starts, it runs to completion.
  function scheduleFCFS(procs) {
    // Sort by arrival time; tie-break by PID alphabetically
    const sorted = [...procs].sort((a, b) => a.arrival - b.arrival || a.pid.localeCompare(b.pid));
    const gantt = [];
    let time = 0;
    const results = [];

    sorted.forEach(p => {
      // If CPU is idle before next process arrives, insert idle block
      if (time < p.arrival) {
        gantt.push({ pid: 'idle', start: time, end: p.arrival });
        time = p.arrival;
      }
      const start = time;
      const end = time + p.burst;
      gantt.push({ pid: p.pid, start, end });
      results.push({
        pid: p.pid,
        arrival: p.arrival,
        burst: p.burst,
        priority: p.priority,
        startTime: start,
        completionTime: end,
        firstStart: start
      });
      time = end;
    });

    return { gantt, results: computeMetrics(results), totalTime: time };
  }

  // --- SJF (Shortest Job First — Non-Preemptive) ---
  // Picks the process with the shortest burst time from the ready queue.
  // Non-preemptive: once selected, runs to completion before picking next.
  function scheduleSJF(procs) {
    const remaining = procs.map(p => ({ ...p }));
    const gantt = [];
    const results = [];
    const done = new Set();
    let time = 0;

    while (done.size < procs.length) {
      // Get all processes that have arrived and are not yet completed
      const ready = remaining.filter(p => !done.has(p.pid) && p.arrival <= time);

      if (ready.length === 0) {
        // CPU idle — jump to next arrival
        const nextArrival = Math.min(...remaining.filter(p => !done.has(p.pid)).map(p => p.arrival));
        gantt.push({ pid: 'idle', start: time, end: nextArrival });
        time = nextArrival;
        continue;
      }

      // Sort by burst (shortest first), then arrival, then PID for tie-breaking
      ready.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival || a.pid.localeCompare(b.pid));
      const p = ready[0];
      const start = time;
      const end = time + p.burst;
      gantt.push({ pid: p.pid, start, end });
      results.push({
        pid: p.pid, arrival: p.arrival, burst: p.burst, priority: p.priority,
        startTime: start, completionTime: end, firstStart: start
      });
      done.add(p.pid);
      time = end;
    }

    return { gantt, results: computeMetrics(results), totalTime: time };
  }

  // --- Priority (Non-Preemptive) ---
  // Picks the process with the lowest priority number (highest priority).
  // If no priority is assigned, defaults to 0 — all processes are treated equally.
  function schedulePriorityNP(procs) {
    const remaining = procs.map(p => ({ ...p }));
    const gantt = [];
    const results = [];
    const done = new Set();
    let time = 0;

    while (done.size < procs.length) {
      const ready = remaining.filter(p => !done.has(p.pid) && p.arrival <= time);

      if (ready.length === 0) {
        const nextArrival = Math.min(...remaining.filter(p => !done.has(p.pid)).map(p => p.arrival));
        gantt.push({ pid: 'idle', start: time, end: nextArrival });
        time = nextArrival;
        continue;
      }

      ready.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival || a.pid.localeCompare(b.pid));
      const p = ready[0];
      const start = time;
      const end = time + p.burst;
      gantt.push({ pid: p.pid, start, end });
      results.push({
        pid: p.pid, arrival: p.arrival, burst: p.burst, priority: p.priority,
        startTime: start, completionTime: end, firstStart: start
      });
      done.add(p.pid);
      time = end;
    }

    return { gantt, results: computeMetrics(results), totalTime: time };
  }

  // --- SRTF (Shortest Remaining Time First — Preemptive SJF) ---
  // At every time unit, checks if a newly arrived process has shorter
  // remaining burst than the current one. If so, preempts (switches).
  function scheduleSRTF(procs) {
    // Track remaining burst, first start time, and completion for each process
    const pMap = {};
    procs.forEach(p => {
      pMap[p.pid] = { ...p, remaining: p.burst, firstStart: -1, completionTime: 0 };
    });

    const gantt = [];
    let time = 0;
    const maxTime = Math.max(...procs.map(p => p.arrival)) + procs.reduce((s, p) => s + p.burst, 0) + 10;
    let completed = 0;

    while (completed < procs.length && time < maxTime) {
      const ready = Object.values(pMap).filter(p => p.arrival <= time && p.remaining > 0);

      if (ready.length === 0) {
        const nextArr = Math.min(...Object.values(pMap).filter(p => p.remaining > 0).map(p => p.arrival));
        gantt.push({ pid: 'idle', start: time, end: nextArr });
        time = nextArr;
        continue;
      }

      ready.sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival || a.pid.localeCompare(b.pid));
      const p = ready[0];

      if (p.firstStart === -1) p.firstStart = time;

      // Run for 1 unit
      const start = time;
      p.remaining--;
      time++;

      if (p.remaining === 0) {
        p.completionTime = time;
        completed++;
      }

      // Merge gantt blocks
      if (gantt.length > 0 && gantt[gantt.length - 1].pid === p.pid && gantt[gantt.length - 1].end === start) {
        gantt[gantt.length - 1].end = time;
      } else {
        gantt.push({ pid: p.pid, start, end: time });
      }
    }

    const results = procs.map(p => ({
      pid: p.pid, arrival: p.arrival, burst: p.burst, priority: p.priority,
      startTime: pMap[p.pid].firstStart, completionTime: pMap[p.pid].completionTime,
      firstStart: pMap[p.pid].firstStart
    }));

    return { gantt, results: computeMetrics(results), totalTime: time };
  }

  // --- Priority (Preemptive) ---
  // Like Priority NP, but checks at every time unit — if a higher-priority
  // process arrives, the current process is preempted immediately.
  function schedulePriorityP(procs) {
    const pMap = {};
    procs.forEach(p => {
      pMap[p.pid] = { ...p, remaining: p.burst, firstStart: -1, completionTime: 0 };
    });

    const gantt = [];
    let time = 0;
    const maxTime = Math.max(...procs.map(p => p.arrival)) + procs.reduce((s, p) => s + p.burst, 0) + 10;
    let completed = 0;

    while (completed < procs.length && time < maxTime) {
      const ready = Object.values(pMap).filter(p => p.arrival <= time && p.remaining > 0);

      if (ready.length === 0) {
        const nextArr = Math.min(...Object.values(pMap).filter(p => p.remaining > 0).map(p => p.arrival));
        gantt.push({ pid: 'idle', start: time, end: nextArr });
        time = nextArr;
        continue;
      }

      ready.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival || a.pid.localeCompare(b.pid));
      const p = ready[0];

      if (p.firstStart === -1) p.firstStart = time;

      const start = time;
      p.remaining--;
      time++;

      if (p.remaining === 0) {
        p.completionTime = time;
        completed++;
      }

      if (gantt.length > 0 && gantt[gantt.length - 1].pid === p.pid && gantt[gantt.length - 1].end === start) {
        gantt[gantt.length - 1].end = time;
      } else {
        gantt.push({ pid: p.pid, start, end: time });
      }
    }

    const results = procs.map(p => ({
      pid: p.pid, arrival: p.arrival, burst: p.burst, priority: p.priority,
      startTime: pMap[p.pid].firstStart, completionTime: pMap[p.pid].completionTime,
      firstStart: pMap[p.pid].firstStart
    }));

    return { gantt, results: computeMetrics(results), totalTime: time };
  }

  // --- Round Robin ---
  // Each process gets a fixed time slice (quantum, default 2ms).
  // After its slice, the process goes to the back of the FIFO queue.
  // Ensures fairness — every process gets equal CPU time in rotation.
  function scheduleRR(procs, quantum) {
    const pMap = {};
    procs.forEach(p => {
      pMap[p.pid] = { ...p, remaining: p.burst, firstStart: -1, completionTime: 0 };
    });

    const gantt = [];
    const queue = [];  // FIFO ready queue
    let time = 0;
    const maxTime = Math.max(...procs.map(p => p.arrival)) + procs.reduce((s, p) => s + p.burst, 0) + 10;
    let completed = 0;
    const sortedProcs = [...procs].sort((a, b) => a.arrival - b.arrival || a.pid.localeCompare(b.pid));
    const arrived = new Set();

    // Add initial arrivals
    sortedProcs.forEach(p => {
      if (p.arrival <= time && !arrived.has(p.pid)) {
        queue.push(p.pid);
        arrived.add(p.pid);
      }
    });

    while (completed < procs.length && time < maxTime) {
      if (queue.length === 0) {
        const pending = Object.values(pMap).filter(p => p.remaining > 0);
        if (pending.length === 0) break;
        const nextArr = Math.min(...pending.map(p => p.arrival));
        gantt.push({ pid: 'idle', start: time, end: nextArr });
        time = nextArr;
        sortedProcs.forEach(p => {
          if (p.arrival <= time && !arrived.has(p.pid)) {
            queue.push(p.pid);
            arrived.add(p.pid);
          }
        });
        continue;
      }

      const pid = queue.shift();
      const p = pMap[pid];

      if (p.firstStart === -1) p.firstStart = time;

      const execTime = Math.min(quantum, p.remaining);
      const start = time;
      p.remaining -= execTime;
      time += execTime;

      // Merge gantt
      if (gantt.length > 0 && gantt[gantt.length - 1].pid === pid && gantt[gantt.length - 1].end === start) {
        gantt[gantt.length - 1].end = time;
      } else {
        gantt.push({ pid, start, end: time });
      }

      if (p.remaining === 0) {
        p.completionTime = time;
        completed++;
      }

      // Add newly arrived processes before re-adding current
      sortedProcs.forEach(pr => {
        if (pr.arrival <= time && !arrived.has(pr.pid)) {
          queue.push(pr.pid);
          arrived.add(pr.pid);
        }
      });

      // Re-add to queue if not done
      if (p.remaining > 0) {
        queue.push(pid);
      }
    }

    const results = procs.map(p => ({
      pid: p.pid, arrival: p.arrival, burst: p.burst, priority: p.priority,
      startTime: pMap[p.pid].firstStart, completionTime: pMap[p.pid].completionTime,
      firstStart: pMap[p.pid].firstStart
    }));

    return { gantt, results: computeMetrics(results), totalTime: time };
  }

  // ========== Metrics Computation ==========
  // TAT = Completion Time - Arrival Time (total time in system)
  // WT  = TAT - Burst Time (time spent waiting in ready queue)
  // RT  = First Start - Arrival Time (time before first CPU access)
  function computeMetrics(results) {
    return results.map(r => {
      const tat = r.completionTime - r.arrival;
      const wt = tat - r.burst;
      const rt = r.firstStart - r.arrival;
      return { ...r, turnaroundTime: tat, waitingTime: wt, responseTime: rt };
    });
  }

  function computeSummary(results, gantt, totalTime) {
    const n = results.length;
    const avgWT = results.reduce((s, r) => s + r.waitingTime, 0) / n;
    const avgTAT = results.reduce((s, r) => s + r.turnaroundTime, 0) / n;
    const avgRT = results.reduce((s, r) => s + r.responseTime, 0) / n;

    const idleTime = gantt.filter(g => g.pid === 'idle').reduce((s, g) => s + (g.end - g.start), 0);
    const busyTime = totalTime - idleTime;
    const cpuUtil = totalTime > 0 ? (busyTime / totalTime) * 100 : 0;
    const throughput = totalTime > 0 ? n / totalTime : 0;

    // Context switches = number of gantt blocks (excluding idle) - 1
    const nonIdleBlocks = gantt.filter(g => g.pid !== 'idle');
    const contextSwitches = Math.max(0, nonIdleBlocks.length - 1);

    return {
      avgWT: avgWT.toFixed(2),
      avgTAT: avgTAT.toFixed(2),
      avgRT: avgRT.toFixed(2),
      cpuUtil: cpuUtil.toFixed(1),
      throughput: throughput.toFixed(3),
      idleTime,
      contextSwitches
    };
  }

  // ========== Run Scheduling ==========
  function runAlgorithm(algo, procs, quantum) {
    switch (algo) {
      case 'fcfs': return scheduleFCFS(procs);
      case 'sjf': return scheduleSJF(procs);
      case 'priority-np': return schedulePriorityNP(procs);
      case 'srtf': return scheduleSRTF(procs);
      case 'priority-p': return schedulePriorityP(procs);
      case 'rr': return scheduleRR(procs, quantum);
      default: return scheduleFCFS(procs);
    }
  }

  function runSimulation() {
    const { processes, errors } = getProcesses();

    if (errors.length > 0) {
      showToast(errors[0], 'error');
      return;
    }

    const algo = algorithmSelect.value;
    const quantum = parseInt(quantumInput.value) || 2;

    if (algo === 'rr' && quantum < 1) {
      showToast('Time Quantum must be at least 1.', 'error');
      return;
    }

    if (algo === 'rr' && quantum < Math.min(...processes.map(p => p.burst)) * 0.5) {
      showToast('⚠ Very small quantum — expect high context switching.', 'warning');
    }

    const result = runAlgorithm(algo, processes, quantum);
    const summary = computeSummary(result.results, result.gantt, result.totalTime);

    currentResults = { ...result, summary, algorithm: algo };

    renderResults(currentResults);
    renderGantt(currentResults);
    switchTab('results');
    showToast(`${ALGO_NAMES[algo]} simulation complete!`);
  }

  function runComparison() {
    const { processes, errors } = getProcesses();

    if (errors.length > 0) {
      showToast(errors[0], 'error');
      return;
    }

    const quantum = parseInt(quantumInput.value) || 2;
    const algos = ['fcfs', 'sjf', 'priority-np', 'srtf', 'priority-p', 'rr'];
    const allResults = {};

    algos.forEach(algo => {
      const result = runAlgorithm(algo, processes, quantum);
      const summary = computeSummary(result.results, result.gantt, result.totalTime);
      allResults[algo] = { ...result, summary, algorithm: algo };
    });

    comparisonResults = allResults;
    renderComparison(allResults);
    renderInsights(allResults);
    switchTab('comparison');
    showToast('Comparison complete — all 6 algorithms evaluated!');
  }

  // ========== Render Results ==========
  function renderResults(data) {
    const container = $('#resultsContent');
    const summary = data.summary;

    container.innerHTML = `
      <div class="metrics-grid">
        <div class="metric-card cyan">
          <div class="metric-icon">⏱</div>
          <div class="metric-label">Avg Waiting Time</div>
          <div class="metric-value">${summary.avgWT} <span class="metric-unit">units</span></div>
        </div>
        <div class="metric-card purple">
          <div class="metric-icon">🔄</div>
          <div class="metric-label">Avg Turnaround Time</div>
          <div class="metric-value">${summary.avgTAT} <span class="metric-unit">units</span></div>
        </div>
        <div class="metric-card pink">
          <div class="metric-icon">⚡</div>
          <div class="metric-label">Avg Response Time</div>
          <div class="metric-value">${summary.avgRT} <span class="metric-unit">units</span></div>
        </div>
        <div class="metric-card emerald">
          <div class="metric-icon">📈</div>
          <div class="metric-label">CPU Utilization</div>
          <div class="metric-value">${summary.cpuUtil}<span class="metric-unit">%</span></div>
        </div>
        <div class="metric-card amber">
          <div class="metric-icon">🚀</div>
          <div class="metric-label">Throughput</div>
          <div class="metric-value">${summary.throughput} <span class="metric-unit">proc/unit</span></div>
        </div>
        <div class="metric-card rose">
          <div class="metric-icon">🔀</div>
          <div class="metric-label">Context Switches</div>
          <div class="metric-value">${summary.contextSwitches}</div>
        </div>
        <div class="metric-card blue">
          <div class="metric-icon">💤</div>
          <div class="metric-label">Total Idle Time</div>
          <div class="metric-value">${summary.idleTime} <span class="metric-unit">units</span></div>
        </div>
      </div>

      <div class="export-bar">
        <button class="btn-export" id="exportCsvBtn">📥 Download CSV</button>
      </div>

      <div class="glass-card">
        <div class="card-title"><span class="icon">📋</span> Process Results — ${ALGO_NAMES[data.algorithm]}</div>
        <div class="process-table-wrapper">
          <table class="results-table">
            <thead>
              <tr>
                <th>PID</th>
                <th>Arrival</th>
                <th>Burst</th>
                <th>Start</th>
                <th>Completion</th>
                <th>Turnaround</th>
                <th>Waiting</th>
                <th>Response</th>
              </tr>
            </thead>
            <tbody>
              ${data.results.map(r => `
                <tr>
                  <td class="pid-cell">${r.pid}</td>
                  <td>${r.arrival} units</td>
                  <td>${r.burst} units</td>
                  <td>${r.startTime} units</td>
                  <td>${r.completionTime} units</td>
                  <td>${r.turnaroundTime} units</td>
                  <td>${r.waitingTime} units</td>
                  <td>${r.responseTime} units</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // CSV Export handler
    container.querySelector('#exportCsvBtn').addEventListener('click', () => {
      const headers = ['PID','Arrival','Burst','Start','Completion','Turnaround','Waiting','Response'];
      const rows = data.results.map(r =>
        [r.pid, r.arrival, r.burst, r.startTime, r.completionTime, r.turnaroundTime, r.waitingTime, r.responseTime].join(',')
      );
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scheduling_results_${ALGO_SHORT[data.algorithm].replace(/\s/g,'_')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('CSV downloaded!');
    });
  }

  // ========== Render Gantt Chart with Playback ==========
  let ganttPlaybackTimer = null; // Track active playback interval

  function renderGantt(data) {
    const container = $('#ganttContent');
    const gantt = data.gantt;
    const totalTime = data.totalTime;

    // Clean up any previous playback
    if (ganttPlaybackTimer) { clearInterval(ganttPlaybackTimer); ganttPlaybackTimer = null; }

    if (totalTime === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><h3>No data</h3></div>';
      return;
    }

    const pidSet = [...new Set(data.results.map(r => r.pid))];
    const colorMap = {};
    pidSet.forEach((pid, i) => { colorMap[pid] = i % PROCESS_COLORS.length; });
    const pixelsPerUnit = Math.max(30, Math.min(80, 800 / totalTime));

    // Build player controls + chart HTML
    let ganttHTML = `
      <div class="gantt-player-controls">
        <button class="gantt-player-btn" id="ganttPlayBtn" title="Play">▶</button>
        <button class="gantt-player-btn" id="ganttPauseBtn" title="Pause">❚❚</button>
        <button class="gantt-player-btn" id="ganttResetBtn" title="Reset">↺</button>
        <span class="gantt-time-display" id="ganttTimeDisplay">t = 0</span>
        <div class="gantt-progress-bar"><div class="gantt-progress-fill" id="ganttProgressFill"></div></div>
        <span class="gantt-status" id="ganttStatus">Ready</span>
        <div class="gantt-speed-control">
          <label>Speed:</label>
          <select id="ganttSpeedSelect">
            <option value="800">0.5x</option>
            <option value="400" selected>1x</option>
            <option value="200">2x</option>
            <option value="100">4x</option>
          </select>
        </div>
      </div>
      <div class="glass-card">
        <div class="card-title"><span class="icon">📊</span> Gantt Chart — ${ALGO_NAMES[data.algorithm]}</div>
        <div class="gantt-container">
          <div class="gantt-chart">
            <div class="gantt-row">
              <div class="gantt-label" style="color: var(--text-muted); font-size: 0.75rem;">CPU</div>
              <div class="gantt-bars" style="height: 48px; min-width: ${totalTime * pixelsPerUnit}px;">
    `;

    gantt.forEach((block, idx) => {
      const left = block.start * pixelsPerUnit;
      const width = (block.end - block.start) * pixelsPerUnit;
      if (block.pid === 'idle') {
        ganttHTML += `<div class="gantt-block idle hidden" data-block-idx="${idx}" style="left:${left}px;width:${width}px;" title="Idle: ${block.start}–${block.end}">idle</div>`;
      } else {
        const ci = colorMap[block.pid];
        ganttHTML += `<div class="gantt-block gantt-color-${ci} hidden" data-block-idx="${idx}" style="left:${left}px;width:${width}px;" title="${block.pid}: ${block.start}–${block.end}">${block.pid}</div>`;
      }
    });

    ganttHTML += `</div></div>
            <div class="gantt-timeline-line" style="min-width: ${totalTime * pixelsPerUnit + 60}px;"></div>
            <div class="gantt-timeline" style="min-width: ${totalTime * pixelsPerUnit}px; height: 20px; position: relative;">`;

    const tickInterval = totalTime <= 20 ? 1 : totalTime <= 50 ? 2 : 5;
    for (let t = 0; t <= totalTime; t += tickInterval) {
      ganttHTML += `<div class="tick" style="left:${t * pixelsPerUnit}px;">${t}</div>`;
    }
    if (totalTime % tickInterval !== 0) {
      ganttHTML += `<div class="tick" style="left:${totalTime * pixelsPerUnit}px;">${totalTime}</div>`;
    }

    ganttHTML += `</div></div>
          <div class="gantt-legend">`;

    pidSet.forEach((pid, i) => {
      const ci = i % PROCESS_COLORS.length;
      ganttHTML += `<div class="gantt-legend-item"><div class="gantt-legend-color gantt-color-${ci}" style="background: ${PROCESS_COLORS[ci]};"></div><span>${pid}</span></div>`;
    });

    ganttHTML += `<div class="gantt-legend-item"><div class="gantt-legend-color" style="background: repeating-linear-gradient(45deg, rgba(100,116,139,0.4), rgba(100,116,139,0.4) 3px, transparent 3px, transparent 6px); border: 1px dashed var(--text-muted);"></div><span>Idle</span></div>
          </div></div></div>`;

    container.innerHTML = ganttHTML;

    // Playback logic
    let currentBlockIdx = 0;
    let currentTime = 0;
    let isPlaying = false;
    const blocks = container.querySelectorAll('.gantt-block');
    const timeDisplay = container.querySelector('#ganttTimeDisplay');
    const progressFill = container.querySelector('#ganttProgressFill');
    const statusEl = container.querySelector('#ganttStatus');
    const speedSelect = container.querySelector('#ganttSpeedSelect');

    function revealBlock(idx) {
      if (idx < blocks.length) {
        blocks[idx].classList.remove('hidden');
        blocks[idx].classList.add('revealing');
      }
    }

    function updateStatus(time) {
      const activeBlock = gantt.find(b => b.start <= time && b.end > time);
      if (activeBlock) {
        if (activeBlock.pid === 'idle') {
          statusEl.textContent = '💤 CPU Idle';
          statusEl.className = 'gantt-status idle';
        } else {
          statusEl.textContent = `▶ Executing ${activeBlock.pid}`;
          statusEl.className = 'gantt-status running';
        }
      }
    }

    function playStep() {
      if (currentBlockIdx < gantt.length) {
        const block = gantt[currentBlockIdx];
        if (currentTime >= block.start) {
          revealBlock(currentBlockIdx);
          currentTime = block.end;
          currentBlockIdx++;
        } else {
          currentTime++;
        }
        timeDisplay.textContent = `t = ${currentTime}`;
        progressFill.style.width = `${(currentTime / totalTime) * 100}%`;
        updateStatus(currentTime - 1);
      }
      if (currentBlockIdx >= gantt.length) {
        clearInterval(ganttPlaybackTimer);
        ganttPlaybackTimer = null;
        isPlaying = false;
        statusEl.textContent = '✅ Complete';
        statusEl.className = 'gantt-status finished';
        timeDisplay.textContent = `t = ${totalTime}`;
        progressFill.style.width = '100%';
      }
    }

    container.querySelector('#ganttPlayBtn').addEventListener('click', () => {
      if (isPlaying) return;
      if (currentBlockIdx >= gantt.length) { /* already done, reset first */ return; }
      isPlaying = true;
      const speed = parseInt(speedSelect.value);
      ganttPlaybackTimer = setInterval(playStep, speed);
    });

    container.querySelector('#ganttPauseBtn').addEventListener('click', () => {
      if (ganttPlaybackTimer) { clearInterval(ganttPlaybackTimer); ganttPlaybackTimer = null; }
      isPlaying = false;
      statusEl.textContent = '⏸ Paused';
      statusEl.className = 'gantt-status';
    });

    container.querySelector('#ganttResetBtn').addEventListener('click', () => {
      if (ganttPlaybackTimer) { clearInterval(ganttPlaybackTimer); ganttPlaybackTimer = null; }
      isPlaying = false;
      currentBlockIdx = 0;
      currentTime = 0;
      blocks.forEach(b => { b.classList.add('hidden'); b.classList.remove('revealing'); });
      timeDisplay.textContent = 't = 0';
      progressFill.style.width = '0%';
      statusEl.textContent = 'Ready';
      statusEl.className = 'gantt-status';
    });

    speedSelect.addEventListener('change', () => {
      if (isPlaying) {
        clearInterval(ganttPlaybackTimer);
        const speed = parseInt(speedSelect.value);
        ganttPlaybackTimer = setInterval(playStep, speed);
      }
    });

    // Auto-reveal all blocks immediately for viewing (user can reset + play)
    blocks.forEach(b => { b.classList.remove('hidden'); });
    timeDisplay.textContent = `t = ${totalTime}`;
    progressFill.style.width = '100%';
    statusEl.textContent = '✅ Complete — press ↺ then ▶ to simulate';
    statusEl.className = 'gantt-status finished';
  }

  // ========== Render Comparison ==========
  function renderComparison(allResults) {
    const container = $('#comparisonContent');
    const algos = Object.keys(allResults);

    // Compute summaries
    const summaries = {};
    algos.forEach(a => { summaries[a] = allResults[a].summary; });

    // Find best/worst values
    const metrics = ['avgWT', 'avgTAT', 'avgRT', 'cpuUtil', 'throughput', 'contextSwitches'];
    const best = {};
    const worst = {};

    metrics.forEach(m => {
      const vals = algos.map(a => parseFloat(summaries[a][m]));
      if (m === 'cpuUtil' || m === 'throughput') {
        best[m] = Math.max(...vals);
        worst[m] = Math.min(...vals);
      } else {
        best[m] = Math.min(...vals);
        worst[m] = Math.max(...vals);
      }
    });

    // Ranking by average of normalized scores
    const scores = {};
    algos.forEach(a => {
      let score = 0;
      // Lower WT, TAT, RT is better; higher CPU util, throughput is better; lower CS is better
      score += (1 - normalize(parseFloat(summaries[a].avgWT), algos.map(x => parseFloat(summaries[x].avgWT))));
      score += (1 - normalize(parseFloat(summaries[a].avgTAT), algos.map(x => parseFloat(summaries[x].avgTAT))));
      score += (1 - normalize(parseFloat(summaries[a].avgRT), algos.map(x => parseFloat(summaries[x].avgRT))));
      score += normalize(parseFloat(summaries[a].cpuUtil), algos.map(x => parseFloat(summaries[x].cpuUtil)));
      score += normalize(parseFloat(summaries[a].throughput), algos.map(x => parseFloat(summaries[x].throughput)));
      score += (1 - normalize(parseFloat(summaries[a].contextSwitches), algos.map(x => parseFloat(summaries[x].contextSwitches))));
      scores[a] = score;
    });

    const ranked = algos.sort((a, b) => scores[b] - scores[a]);

    function cellClass(metric, val) {
      const v = parseFloat(val);
      if (v === best[metric]) return 'best-value';
      if (v === worst[metric]) return 'worst-value';
      return '';
    }

    let html = `
      <div class="sub-tab-nav">
        <button class="sub-tab-btn active" data-subtab="table">📊 Table</button>
        <button class="sub-tab-btn" data-subtab="charts">📈 Charts</button>
      </div>

      <div class="sub-tab-panel active" id="subpanel-table">
        <div class="glass-card section-gap">
          <div class="card-title"><span class="icon">⚖️</span> Algorithm Comparison</div>
          <div class="process-table-wrapper">
            <table class="comparison-table">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>Rank</th>
                  <th>Avg WT</th>
                  <th>Avg TAT</th>
                  <th>Avg RT</th>
                  <th>CPU Util %</th>
                  <th>Throughput</th>
                  <th>Ctx Switches</th>
                </tr>
              </thead>
              <tbody>
                ${ranked.map((a, idx) => `
                  <tr>
                    <td>${ALGO_SHORT[a]}</td>
                    <td><span class="rank-badge ${idx < 3 ? `rank-${idx + 1}` : ''}">${idx + 1}</span></td>
                    <td class="${cellClass('avgWT', summaries[a].avgWT)}">${summaries[a].avgWT} units</td>
                    <td class="${cellClass('avgTAT', summaries[a].avgTAT)}">${summaries[a].avgTAT} units</td>
                    <td class="${cellClass('avgRT', summaries[a].avgRT)}">${summaries[a].avgRT} units</td>
                    <td class="${cellClass('cpuUtil', summaries[a].cpuUtil)}">${summaries[a].cpuUtil}%</td>
                    <td class="${cellClass('throughput', summaries[a].throughput)}">${summaries[a].throughput}</td>
                    <td class="${cellClass('contextSwitches', summaries[a].contextSwitches)}">${summaries[a].contextSwitches}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="sub-tab-panel" id="subpanel-charts">
        <div class="chart-grid">
          <div class="chart-card">
            <div class="chart-title">Average Waiting Time</div>
            <div class="chart-canvas-wrapper"><canvas id="chartWT"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-title">Average Turnaround Time</div>
            <div class="chart-canvas-wrapper"><canvas id="chartTAT"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-title">Average Response Time</div>
            <div class="chart-canvas-wrapper"><canvas id="chartRT"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-title">CPU Utilization %</div>
            <div class="chart-canvas-wrapper"><canvas id="chartCPU"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-title">Throughput</div>
            <div class="chart-canvas-wrapper"><canvas id="chartTP"></canvas></div>
          </div>
          <div class="chart-card">
            <div class="chart-title">Context Switches</div>
            <div class="chart-canvas-wrapper"><canvas id="chartCS"></canvas></div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Sub-tab event listeners
    container.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
        container.querySelectorAll('.sub-tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        container.querySelector(`#subpanel-${btn.dataset.subtab}`).classList.add('active');

        if (btn.dataset.subtab === 'charts') {
          setTimeout(() => renderCharts(algos, summaries), 50);
        }
      });
    });
  }

  function normalize(val, arr) {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    if (max === min) return 0.5;
    return (val - min) / (max - min);
  }

  // ========== Canvas Bar Charts ==========
  function renderCharts(algos, summaries) {
    const chartData = [
      { id: 'chartWT', metric: 'avgWT', label: 'Avg Waiting Time', color: '#06b6d4' },
      { id: 'chartTAT', metric: 'avgTAT', label: 'Avg Turnaround Time', color: '#8b5cf6' },
      { id: 'chartRT', metric: 'avgRT', label: 'Avg Response Time', color: '#ec4899' },
      { id: 'chartCPU', metric: 'cpuUtil', label: 'CPU Utilization', color: '#10b981' },
      { id: 'chartTP', metric: 'throughput', label: 'Throughput', color: '#f59e0b' },
      { id: 'chartCS', metric: 'contextSwitches', label: 'Context Switches', color: '#f43f5e' }
    ];

    chartData.forEach(cd => {
      const canvas = document.getElementById(cd.id);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const wrapper = canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = wrapper.clientWidth * dpr;
      canvas.height = wrapper.clientHeight * dpr;
      canvas.style.width = wrapper.clientWidth + 'px';
      canvas.style.height = wrapper.clientHeight + 'px';
      ctx.scale(dpr, dpr);

      const w = wrapper.clientWidth;
      const h = wrapper.clientHeight;

      const labels = algos.map(a => ALGO_SHORT[a]);
      const values = algos.map(a => parseFloat(summaries[a][cd.metric]));
      const maxVal = Math.max(...values) * 1.2 || 1;

      const padding = { top: 20, right: 20, bottom: 50, left: 60 };
      const chartW = w - padding.left - padding.right;
      const chartH = h - padding.top - padding.bottom;
      const barWidth = (chartW / labels.length) * 0.6;
      const gap = (chartW / labels.length) * 0.4;

      // Background
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + chartH - (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();

        // Y-axis labels
        ctx.fillStyle = '#64748b';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        const val = ((maxVal / 4) * i).toFixed(1);
        ctx.fillText(val, padding.left - 8, y + 4);
      }

      // Bars
      labels.forEach((label, i) => {
        const x = padding.left + i * (barWidth + gap) + gap / 2;
        const barH = (values[i] / maxVal) * chartH;
        const y = padding.top + chartH - barH;

        // Bar gradient
        const grad = ctx.createLinearGradient(x, y, x, padding.top + chartH);
        const baseColor = PROCESS_COLORS[i % PROCESS_COLORS.length];
        grad.addColorStop(0, baseColor);
        grad.addColorStop(1, baseColor + '60');
        ctx.fillStyle = grad;

        // Rounded bar
        const radius = 4;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, padding.top + chartH);
        ctx.lineTo(x, padding.top + chartH);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.fill();

        // Value on top
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '600 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(values[i], x + barWidth / 2, y - 6);

        // X-axis label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';

        // Multi-line label
        const parts = label.split(' ');
        parts.forEach((part, pi) => {
          ctx.fillText(part, x + barWidth / 2, padding.top + chartH + 16 + pi * 13);
        });
      });
    });
  }

  // ========== Render Insights (Diagnostic Engine) ==========
  function renderInsights(allResults) {
    const container = $('#insightsContent');
    const algos = ['fcfs', 'sjf', 'priority-np', 'srtf', 'priority-p', 'rr'];
    const summaries = {};
    const fullResults = {};
    algos.forEach(a => { 
      summaries[a] = allResults[a].summary; 
      fullResults[a] = allResults[a].results;
    });

    const insights = [];
    const allPrioritiesZero = fullResults['fcfs'].every(r => r.priority === 0);
    const quantum = parseInt($('#quantumInput').value) || 2;

    // 1. Convoy Effect Detected (FCFS)
    const fcfsRes = fullResults['fcfs'];
    if (fcfsRes.length >= 3) {
      // Find earlier process with large burst delaying shorter processes
      const firstfew = fcfsRes.slice(0, 2);
      const longProc = firstfew.reduce((max, p) => p.burst > max.burst ? p : max, firstfew[0]);
      const avgBurst = fcfsRes.reduce((s, p) => s + p.burst, 0) / fcfsRes.length;
      
      if (longProc.burst > avgBurst * 1.5) {
        const delayed = fcfsRes.filter(p => p.arrival > longProc.arrival && p.startTime >= longProc.startTime && p.burst < avgBurst);
        if (delayed.length > 0) {
          const avgDelayedWT = delayed.reduce((s, p) => s + p.waitingTime, 0) / delayed.length;
          insights.push({
            type: 'warning', icon: '🚛', title: 'Convoy Effect Detected — FCFS',
            text: `FCFS recorded an avg wait of ${summaries['fcfs'].avgWT} units. Process ${longProc.pid} (burst: ${longProc.burst}) blocked shorter jobs behind it, inflating their wait times to roughly ${avgDelayedWT.toFixed(1)} units each. This is the Convoy Effect — a core weakness of non-preemptive scheduling in mixed workloads.`
          });
        }
      }
    }

    // 2. Starvation Risk (Priority Preemptive)
    if (!allPrioritiesZero) {
      const prioP = fullResults['priority-p'];
      // Priority is 1 (highest) to N (lowest). Find process with max priority number
      const maxPriVal = Math.max(...prioP.map(p => p.priority));
      const starvedProc = prioP.find(p => p.priority === maxPriVal);
      const minPriVal = Math.min(...prioP.map(p => p.priority));
      const fastProc = prioP.find(p => p.priority === minPriVal);

      if (starvedProc && fastProc && starvedProc.waitingTime > fastProc.waitingTime * 3) {
        const diff = starvedProc.waitingTime - fastProc.waitingTime;
        insights.push({
          type: 'worst', icon: '☠️', title: 'Starvation Risk — Priority (Preemptive)',
          text: `Process ${starvedProc.pid} (priority: ${maxPriVal}, lowest) waited ${starvedProc.waitingTime} units before/during execution — ${diff} units longer than the highest-priority process (${fastProc.pid}). In a busier system, ${starvedProc.pid} would never finish. Aging mechanisms are needed to prevent indefinite starvation.`
        });
      }
    }

    // 3. Preemption Payoff (SRTF vs SJF)
    const srtfAvgWT = parseFloat(summaries['srtf'].avgWT);
    const sjfAvgWT = parseFloat(summaries['sjf'].avgWT);
    if (srtfAvgWT < sjfAvgWT) {
      const diff = (sjfAvgWT - srtfAvgWT).toFixed(2);
      insights.push({
        type: 'best', icon: '🚀', title: 'Preemption Payoff — SRTF vs SJF',
        text: `SRTF's avg wait was ${srtfAvgWT} units vs SJF's ${sjfAvgWT} units — a ${diff} unit improvement. This gain came from preempting longer running jobs when a new process arrived with a shorter remaining burst. Preemption directly rescued response time for late-arriving short processes.`
      });
    }

    // 4. Fairness vs Efficiency Tradeoff (Round Robin)
    const wtStdDevs = {};
    algos.forEach(a => {
      const wts = fullResults[a].map(r => r.waitingTime);
      const mean = wts.reduce((s, v) => s + v, 0) / wts.length;
      const variance = wts.reduce((s, v) => s + (v - mean) ** 2, 0) / wts.length;
      wtStdDevs[a] = Math.sqrt(variance);
    });
    
    // Check if RR is among the fairest
    const fairestAlgo = algos.reduce((a, b) => wtStdDevs[a] < wtStdDevs[b] ? a : b);
    if (fairestAlgo === 'rr' && parseInt(summaries['rr'].contextSwitches) > parseInt(summaries['sjf'].contextSwitches)) {
      const extraSwitches = parseInt(summaries['rr'].contextSwitches) - parseInt(summaries['sjf'].contextSwitches);
      insights.push({
        type: 'info', icon: '⚖️', title: 'Fairness vs Efficiency Tradeoff — Round Robin',
        text: `RR achieved the lowest wait-time standard deviation (σ = ${wtStdDevs['rr'].toFixed(2)}) — meaning no process was disproportionately delayed. But this fairness cost ${extraSwitches} extra context switches over SJF, adding scheduling overhead. Ideal for time-sharing systems, poor for CPU-bound batch workloads.`
      });
    }

    // 5. Priority Inversion Zone (Priority NP vs Priority P)
    if (!allPrioritiesZero) {
      const prioNP = fullResults['priority-np'];
      const prioP = fullResults['priority-p'];
      
      // Look for a high priority process (low num) that waited significantly longer in NP than P
      for (let i = 0; i < prioNP.length; i++) {
        let pNP = prioNP[i];
        let pP = prioP.find(p => p.pid === pNP.pid);
        // If it's a high priority process and it waited at least 2 units longer in NP
        if (pNP.priority < 3 && (pNP.waitingTime - pP.waitingTime > 2) && pNP.arrival > 0) {
          insights.push({
            type: 'warning', icon: '⏳', title: 'Priority Inversion Zone — Priority NP vs Priority P',
            text: `Priority NP forced ${pNP.pid} (high priority, late arrival) to wait behind a lower-priority running process for ${pNP.waitingTime} units — a classic priority inversion. Priority P eliminated this by preempting at arrival, reducing ${pNP.pid}'s wait to ${pP.waitingTime} units. This is exactly the problem NASA's Mars Pathfinder faced in 1997.`
          });
          break; // Show only once
        }
      }
    }

    // 6. Best Fit Verdict — Algorithm Recommendation Engine
    // Determine workload characteristics
    const bursts = fullResults['fcfs'].map(p => p.burst);
    const avgBurst = bursts.reduce((a, b) => a + b, 0) / bursts.length;
    const burstVariance = bursts.reduce((s, v) => s + (v - avgBurst) ** 2, 0) / bursts.length;
    const isMixedWorkload = burstVariance > avgBurst * 0.5; // High variance in bursts
    
    let winnerWait = algos.reduce((a, b) => parseFloat(summaries[a].avgWT) <= parseFloat(summaries[b].avgWT) ? a : b);
    let recommendation = '';
    
    if (isMixedWorkload && !allPrioritiesZero) {
        recommendation = `For this complex workload profile (mixed burst lengths, staggered arrivals, distinct priorities): **${ALGO_NAMES[winnerWait]}** minimizes avg wait, **Round Robin** maximizes fairness across distinct jobs, and **Priority P** strict-enforces rules. If this were a web server handling user requests → Round Robin. If this were a batch processing system → ${ALGO_NAMES[winnerWait]}.`;
    } else if (isMixedWorkload) {
        recommendation = `For this workload profile (mixed burst lengths, staggered arrivals): **${ALGO_NAMES[winnerWait]}** minimizes avg wait dramatically, **Round Robin** maximizes fairness, **FCFS** is simplest but suffers from convoys. If this were a web server → Round Robin. If this were a batch processing system → ${ALGO_NAMES[winnerWait]}.`;
    } else {
        recommendation = `For this uniform workload profile (similar burst lengths): the differences between algorithms diminish. **${ALGO_NAMES[winnerWait]}** mathematically wins, but FCFS is highly efficient due to low overhead (only ${summaries['fcfs'].contextSwitches} switches). Choose based on system constraints rather than theoretical wait times.`;
    }

    insights.push({
      type: 'best', icon: '🧠', title: 'Best Fit Verdict — Algorithm Recommendation Engine',
      text: recommendation
    });

    // Fallback if no specific anomalies were detected to ensure there's always UI
    if (insights.length < 3) {
      if (allPrioritiesZero) {
        insights.unshift({
          type: 'notice', icon: 'ℹ️', title: 'Input Defaults Applied',
          text: `Your input has no explicit priorities — all default to 0, making Priority algorithms identical to FCFS. Try adding distinct priorities to trigger deeper Priority-based diagnostics.`
        });
      }
      const genericBest = algos.reduce((a, b) => parseFloat(summaries[a].avgWT) <= parseFloat(summaries[b].avgWT) ? a : b);
      const genericWorst = algos.reduce((a, b) => parseFloat(summaries[a].avgWT) >= parseFloat(summaries[b].avgWT) ? a : b);
      if (!insights.some(i => i.title.includes('Best Fit Verdict'))) {
         insights.push({
            type: 'best', icon: '🏆', title: `Efficiency Leader: ${ALGO_NAMES[genericBest]}`,
            text: `${ALGO_NAMES[genericBest]} achieved the lowest avg wait of ${summaries[genericBest].avgWT} units mathematically.`
         });
      }
      insights.push({
        type: 'worst', icon: '⚠️', title: `Maximum Delay: ${ALGO_NAMES[genericWorst]}`,
        text: `${ALGO_NAMES[genericWorst]} struggled most with this specific sequence, yielding a wait time of ${summaries[genericWorst].avgWT} units.`
      });
    }

    // Render Insights Array to DOM
    container.innerHTML = `
      <div class="insights-container">
        ${insights.map(i => `
          <div class="insight-card ${i.type}">
            <div class="insight-icon">${i.icon}</div>
            <div class="insight-content">
              <h4>${i.title}</h4>
              <p>${i.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ========== Clear All ==========
  function clearAll() {
    processTableBody.innerHTML = '';
    processCounter = 0;
    addProcessRow();
    addProcessRow();
    addProcessRow();
    currentResults = null;
    comparisonResults = null;

    $('#resultsContent').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No Results Yet</h3>
        <p>Enter process data and run a simulation to see the results.</p>
      </div>
    `;
    $('#ganttContent').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>No Gantt Chart Yet</h3>
        <p>Run a simulation to visualize the scheduling timeline.</p>
      </div>
    `;
    $('#comparisonContent').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚖️</div>
        <h3>No Comparison Data</h3>
        <p>Click "Compare All Algorithms" to run all six algorithms on the same input data.</p>
      </div>
    `;
    $('#insightsContent').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💡</div>
        <h3>No Insights Available</h3>
        <p>Run a comparison to generate analytical insights and recommendations.</p>
      </div>
    `;

    removeFile();
    switchTab('input');
    showToast('All data cleared.', 'warning');
  }

  // ========== Start ==========
  init();
})();
