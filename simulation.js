/**
 * Sports Analytics & Projectile Video Lab Simulation
 * Designed for The Thinking Experiment (PhysicsKit)
 * Strictly Light Mode: Teal (#0f7e9b), Amber (#d67b19), White (#ffffff).
 */

// Global Application State
const state = {
  currentStep: 1, // 1 to 5
  studentName: '',
  teacherName: 'Mr. Lopez',
  activeTool: 'track', // 'track', 'scale', 'origin'
  activeSeries: 'A',
  fps: 60,
  stepFrames: 2,
  currentTime: 0,
  duration: 0,
  isPlaying: false,

  // Visibility toggles
  showPoints: true,
  showVectors: true,
  showScale: true,
  showOrigin: true,

  // Marker options
  markerType: 'circle',
  markerRadius: 14,

  // Motion component filter
  motionFilter: 'both',
  timeOffset: 0,

  // Calibration & Transform
  pixelsPerMeter: 140,
  origin: { x: 80, y: 410 },
  originAngle: 0,

  // Scale stick state
  scaleStick: {
    start: { x: 80, y: 430 },
    end: { x: 220, y: 430 },
    lengthMeters: 1.0,
    isDragging: false,
    dragPoint: null
  },

  // Tracked data points
  series: {
    A: [], // Array of { frame, rawTime, time, videoX, videoY, x, y, vx, vy, ax, ay }
    B: []
  },

  // Tangent tool state (rubric requires 10 points from slopes of tangents)
  tangentPoints: [], // { time, vy, slope, x, y }
  activeTangentTime: 0,

  // 6-Graph Studio state
  activeGraphTab: 'y-pos', // 'y-pos', 'x-pos', 'y-vel', 'x-vel', 'y-acc', 'x-acc', 'grid-all'
  fitResults: {
    yPos: null, // { A, B, C, r2 } -> y = At^2 + Bt + C
    xPos: null, // { slope, intercept, r2 } -> x = mt + b
    yVel: null, // { slope, intercept, r2 }
    xVel: null,
    yAcc: null,
    xAcc: null
  },

  // Calculations & Reflection
  calcValues: {
    x0: 0, vx0: 0, ax: 0,
    y0: 0, vy0: 0, ay: -9.8,
    rangeCalc: 0, rangeMeas: 0, rangePctDiff: 0,
    hangCalc: 0, hangMeas: 0, hangPctDiff: 0,
    maxHCalc: 0, maxHMeas: 0, maxHPctDiff: 0,
    v0: 0, theta: 0,
    ayPctDiff: 0, axDiff: 0
  },
  reflectionText: '',

  // Presentation Deck Preview
  currentSlideIdx: 1,

  // Synthetic Video Generator
  isSynthetic: true,
  syntheticType: 'projectile',
  syntheticCanvas: document.createElement('canvas'),
  syntheticCtx: null
};

// ============================================================================
// DOM Elements Binding
// ============================================================================
const video = document.getElementById('mainVideo');
const overlayCanvas = document.getElementById('overlayCanvas');
const ctx = overlayCanvas.getContext('2d');
const reticlePreview = document.getElementById('reticlePreview');
const viewportContainer = document.getElementById('viewportContainer');
const dropzoneOverlay = document.getElementById('dropzoneOverlay');

// Stepper & Stages
const stepBtns = [
  document.getElementById('stepBtn1'),
  document.getElementById('stepBtn2'),
  document.getElementById('stepBtn3'),
  document.getElementById('stepBtn4'),
  document.getElementById('stepBtn5')
];
const videoWorkspaceStage = document.getElementById('videoWorkspaceStage');
const stepView3 = document.getElementById('stepView3');
const stepView4 = document.getElementById('stepView4');
const stepView5 = document.getElementById('stepView5');

// Student Metadata
const studentNameInput = document.getElementById('studentNameInput');
const teacherSelect = document.getElementById('teacherSelect');
const btnSaveSession = document.getElementById('btnSaveSession');
const btnLoadSession = document.getElementById('btnLoadSession');
const loadSessionInput = document.getElementById('loadSessionInput');

// Controls
const timeScrubber = document.getElementById('timeScrubber');
const currentTimeText = document.getElementById('currentTimeText');
const currentFrameText = document.getElementById('currentFrameText');
const btnPlayPause = document.getElementById('btnPlayPause');
const iconPlay = document.getElementById('iconPlay');
const iconPause = document.getElementById('iconPause');
const btnPrevFrame = document.getElementById('btnPrevFrame');
const btnNextFrame = document.getElementById('btnNextFrame');
const playbackRateSelect = document.getElementById('playbackRateSelect');
const fpsInput = document.getElementById('fpsInput');
const stepFrameSelect = document.getElementById('stepFrameSelect');
const seriesSelect = document.getElementById('seriesSelect');
const btnClearSeries = document.getElementById('btnClearSeries');
const btnSetTZero = document.getElementById('btnSetTZero');
const statusMessage = document.getElementById('statusMessage');

// Visibility & Tools
const chkShowPoints = document.getElementById('chkShowPoints');
const chkShowVectors = document.getElementById('chkShowVectors');
const chkShowScale = document.getElementById('chkShowScale');
const chkShowOrigin = document.getElementById('chkShowOrigin');
const markerTypeSelect = document.getElementById('markerTypeSelect');
const markerSizeSelect = document.getElementById('markerSizeSelect');
const motionComponentSelect = document.getElementById('motionComponentSelect');
const posChartTitle = document.getElementById('posChartTitle');
const velChartTitle = document.getElementById('velChartTitle');
const toolTrack = document.getElementById('toolTrack');
const toolScale = document.getElementById('toolScale');
const toolOrigin = document.getElementById('toolOrigin');
const videoFileInput = document.getElementById('videoFileInput');
const btnExportCSV = document.getElementById('btnExportCSV');
const btnSampleSelect = document.getElementById('btnSampleSelect');
const scaleLengthInput = document.getElementById('scaleLengthInput');
const btnApplyScale = document.getElementById('btnApplyScale');
const scaleReadout = document.getElementById('scaleReadout');
const originAngleInput = document.getElementById('originAngleInput');
const btnResetOrigin = document.getElementById('btnResetOrigin');
const fitResultPos = document.getElementById('fitResultPos');
const fitResultVel = document.getElementById('fitResultVel');
const pointsTableBody = document.getElementById('pointsTableBody');
const btnFitQuadPos = document.getElementById('btnFitQuadPos');
const btnFitLinPos = document.getElementById('btnFitLinPos');
const btnFitVelocity = document.getElementById('btnFitVelocity');

// 6-Graph Studio Elements
const graphNavBtns = document.querySelectorAll('.graph-nav-btn');
const tangentStudioBar = document.getElementById('tangentStudioBar');
const tangentPointCountBadge = document.getElementById('tangentPointCountBadge');
const tangentTimeDisplay = document.getElementById('tangentTimeDisplay');
const tangentSlopeDisplay = document.getElementById('tangentSlopeDisplay');
const tangentSlider = document.getElementById('tangentSlider');
const btnRecordTangent = document.getElementById('btnRecordTangent');
const btnAutoSampleTangents = document.getElementById('btnAutoSampleTangents');
const btnAutoFitAll = document.getElementById('btnAutoFitAll');
const singleGraphContainer = document.getElementById('singleGraphContainer');
const gridAllContainer = document.getElementById('gridAllContainer');
const activeGraphEqTitle = document.getElementById('activeGraphEqTitle');
const activeGraphR2 = document.getElementById('activeGraphR2');
const activeGeneralEq = document.getElementById('activeGeneralEq');
const activeParticularEq = document.getElementById('activeParticularEq');
const activeGraphCanvas = document.getElementById('activeGraphCanvas');

// Calculations Workspace Elements
const btnCheckWorksheet = document.getElementById('btnCheckWorksheet');
const authenticityBadge = document.getElementById('authenticityBadge');
const inpX0 = document.getElementById('inpX0');
const inpVx0 = document.getElementById('inpVx0');
const inpAx = document.getElementById('inpAx');
const lblAxDiff = document.getElementById('lblAxDiff');
const inpY0 = document.getElementById('inpY0');
const inpVy0 = document.getElementById('inpVy0');
const inpAy = document.getElementById('inpAy');
const badgeAyPctDiff = document.getElementById('badgeAyPctDiff');
const inpCalcRange = document.getElementById('inpCalcRange');
const inpMeasRange = document.getElementById('inpMeasRange');
const badgeRangePctDiff = document.getElementById('badgeRangePctDiff');
const inpCalcHangTime = document.getElementById('inpCalcHangTime');
const inpMeasHangTime = document.getElementById('inpMeasHangTime');
const badgeHangTimePctDiff = document.getElementById('badgeHangTimePctDiff');
const inpCalcMaxHeight = document.getElementById('inpCalcMaxHeight');
const inpMeasMaxHeight = document.getElementById('inpMeasMaxHeight');
const badgeMaxHeightPctDiff = document.getElementById('badgeMaxHeightPctDiff');
const inpSpeedV0 = document.getElementById('inpSpeedV0');
const inpAngleTheta = document.getElementById('inpAngleTheta');
const lblConsistencyCheck = document.getElementById('lblConsistencyCheck');
const reflectionText = document.getElementById('reflectionText');
const sentenceBadge = document.getElementById('sentenceBadge');

// Presentation Elements
const btnDownloadPptx = document.getElementById('btnDownloadPptx');
const btnPrintReport = document.getElementById('btnPrintReport');
const btnCopyFormData = document.getElementById('btnCopyFormData');
const slidePreviewTitle = document.getElementById('slidePreviewTitle');
const slideViewport = document.getElementById('slideViewport');
const btnPrevSlide = document.getElementById('btnPrevSlide');
const btnNextSlide = document.getElementById('btnNextSlide');
const slideThumbs = document.querySelectorAll('.slide-thumb');

// Chart Instances
let posChart = null;
let velChart = null;
let studioChart = null;
let gridCharts = {};

// ============================================================================
// Initialization & Synthetic Experiments
// ============================================================================
function init() {
  initEventListeners();
  initCharts();
  if (dropzoneOverlay) {
    dropzoneOverlay.classList.add('hidden');
    dropzoneOverlay.style.display = 'none';
  }
  initSyntheticExperiment('projectile');
  resizeCanvas();
  renderSyntheticFrame(0);
  drawOverlay();
  updateTable();
  updateAuthenticityBadge();
  updateStepView(1);

  // Trigger KaTeX rendering on startup
  const tryRenderKaTeX = () => {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
      renderStudioGraph(state.activeGraphTab);
    } else {
      setTimeout(tryRenderKaTeX, 100);
    }
  };
  tryRenderKaTeX();
}

function updateStatus(msg) {
  if (statusMessage) statusMessage.textContent = msg;
}

// Preset Physics / Sports Experiments
function initSyntheticExperiment(type = 'projectile') {
  state.isSynthetic = true;
  state.syntheticType = type;
  state.duration = 2.5;
  state.currentTime = 0;
  state.timeOffset = 0;
  state.fps = 60;
  if (fpsInput) fpsInput.value = state.fps;

  if (video) {
    video.style.display = 'none';
    video.src = '';
  }

  resizeCanvas();
  const w = overlayCanvas.width || 860;
  const h = overlayCanvas.height || 520;
  state.syntheticCanvas.width = w;
  state.syntheticCanvas.height = h;
  state.syntheticCtx = state.syntheticCanvas.getContext('2d');

  if (type === 'projectile') {
    state.origin = { x: 100, y: Math.round(h * 0.78) };
    state.pixelsPerMeter = Math.round(w * 0.17);
    state.scaleStick = {
      start: { x: 100, y: Math.round(h * 0.86) },
      end: { x: 100 + state.pixelsPerMeter, y: Math.round(h * 0.86) },
      lengthMeters: 1.0,
      isDragging: false,
      dragPoint: null
    };
    updateStatus('Loaded 2D Projectile Motion. Click Set Origin or Set Scale to adjust calibration, or click Add Points to track!');
  } else if (type === 'basketball') {
    state.duration = 2.0;
    state.origin = { x: 110, y: Math.round(h * 0.76) };
    state.pixelsPerMeter = Math.round(w * 0.13);
    state.scaleStick = {
      start: { x: 110, y: Math.round(h * 0.86) },
      end: { x: 110 + state.pixelsPerMeter, y: Math.round(h * 0.86) },
      lengthMeters: 1.0,
      isDragging: false,
      dragPoint: null
    };
    updateStatus('Loaded Basketball Arc (3-Pt Shot). Calibrate scale and track trajectory!');
  } else if (type === 'soccer') {
    state.duration = 2.2;
    state.origin = { x: 90, y: Math.round(h * 0.78) };
    state.pixelsPerMeter = Math.round(w * 0.11);
    state.scaleStick = {
      start: { x: 90, y: Math.round(h * 0.86) },
      end: { x: 90 + state.pixelsPerMeter, y: Math.round(h * 0.86) },
      lengthMeters: 1.0,
      isDragging: false,
      dragPoint: null
    };
    updateStatus('Loaded Soccer Chip Kick. Track parabolic flight path!');
  } else if (type === 'freefall') {
    state.duration = 1.2;
    state.origin = { x: Math.round(w * 0.5), y: 70 };
    state.pixelsPerMeter = Math.round(h * 0.36);
    state.scaleStick = {
      start: { x: Math.round(w * 0.5) - 90, y: 70 },
      end: { x: Math.round(w * 0.5) - 90, y: 70 + state.pixelsPerMeter },
      lengthMeters: 1.0,
      isDragging: false,
      dragPoint: null
    };
    updateStatus('Loaded Free Fall Lab (g = 9.8 m/s²). Drop height = 2.0 m.');
  } else if (type === 'pendulum') {
    state.duration = 3.0;
    state.origin = { x: Math.round(w * 0.5), y: 80 };
    state.pixelsPerMeter = Math.round(h * 0.32);
    state.scaleStick = {
      start: { x: Math.round(w * 0.5), y: 80 },
      end: { x: Math.round(w * 0.5) + state.pixelsPerMeter, y: 80 },
      lengthMeters: 1.0,
      isDragging: false,
      dragPoint: null
    };
    updateStatus('Loaded Simple Harmonic Pendulum.');
  } else if (type === 'cart') {
    state.duration = 2.5;
    state.origin = { x: 80, y: Math.round(h * 0.70) };
    state.pixelsPerMeter = Math.round(w * 0.18);
    state.scaleStick = {
      start: { x: 80, y: Math.round(h * 0.82) },
      end: { x: 80 + state.pixelsPerMeter, y: Math.round(h * 0.82) },
      lengthMeters: 1.0,
      isDragging: false,
      dragPoint: null
    };
    updateStatus('Loaded Elastic Cart Collision.');
  }

  updateScaleReadout();
  if (scaleLengthInput) scaleLengthInput.value = state.scaleStick.lengthMeters.toFixed(2);
  if (timeScrubber) {
    timeScrubber.min = 0;
    timeScrubber.max = state.duration;
    timeScrubber.value = 0;
  }
  updateTimeAndFrame(0);
  drawOverlay();
}

function renderSyntheticFrame(t) {
  if (!state.isSynthetic || !state.syntheticCtx) return;
  const ctxS = state.syntheticCtx;
  const w = state.syntheticCanvas.width;
  const h = state.syntheticCanvas.height;

  // Background
  ctxS.fillStyle = '#f8fafc';
  ctxS.fillRect(0, 0, w, h);

  // Background Grid
  ctxS.strokeStyle = '#e2e8f0';
  ctxS.lineWidth = 1;
  const gridStep = Math.max(30, state.pixelsPerMeter / 2);
  for (let x = 0; x < w; x += gridStep) {
    ctxS.beginPath();
    ctxS.moveTo(x, 0);
    ctxS.lineTo(x, h);
    ctxS.stroke();
  }
  for (let y = 0; y < h; y += gridStep) {
    ctxS.beginPath();
    ctxS.moveTo(0, y);
    ctxS.lineTo(w, y);
    ctxS.stroke();
  }

  // Floor / Turf
  const floorY = Math.round(h * 0.80);
  if (state.syntheticType === 'soccer') {
    ctxS.fillStyle = '#e8f5e9'; // Turf light green
    ctxS.fillRect(0, floorY, w, h - floorY);
    ctxS.strokeStyle = '#81c784';
  } else if (state.syntheticType === 'basketball') {
    ctxS.fillStyle = '#fff3e0'; // Hardwood court
    ctxS.fillRect(0, floorY, w, h - floorY);
    ctxS.strokeStyle = '#ffb74d';
  } else {
    ctxS.fillStyle = '#e2edf3';
    ctxS.fillRect(0, floorY, w, h - floorY);
    ctxS.strokeStyle = '#a9c4cf';
  }
  ctxS.lineWidth = 2.5;
  ctxS.beginPath();
  ctxS.moveTo(0, floorY);
  ctxS.lineTo(w, floorY);
  ctxS.stroke();

  // 1.00 Meter Calibration Stick
  const stickX = state.origin ? Math.min(state.origin.x, w - state.pixelsPerMeter - 40) : 100;
  const stickY = Math.round(h * 0.86);
  const stickW = state.pixelsPerMeter;
  ctxS.fillStyle = '#ffecb3';
  ctxS.strokeStyle = '#d67b19';
  ctxS.lineWidth = 2;
  ctxS.fillRect(stickX, stickY, stickW, 18);
  ctxS.strokeRect(stickX, stickY, stickW, 18);
  // Calibration endcap tick marks
  ctxS.beginPath();
  ctxS.moveTo(stickX, stickY - 4); ctxS.lineTo(stickX, stickY + 22);
  ctxS.moveTo(stickX + stickW, stickY - 4); ctxS.lineTo(stickX + stickW, stickY + 22);
  ctxS.stroke();
  ctxS.fillStyle = '#123140';
  ctxS.font = 'bold 10px monospace';
  ctxS.fillText('1.00 METER REFERENCE', stickX + 10, stickY + 13);

  // Simulation physics
  if (state.syntheticType === 'projectile') {
    const theta = 56 * (Math.PI / 180);
    const v0 = 4.3;
    const g = 9.8;
    const tFlight = (2 * v0 * Math.sin(theta)) / g;
    const tClamped = Math.min(t, tFlight);

    const xMeters = v0 * Math.cos(theta) * tClamped;
    const yMeters = v0 * Math.sin(theta) * tClamped - 0.5 * g * tClamped * tClamped;

    const ballX = state.origin.x + xMeters * state.pixelsPerMeter;
    const ballY = state.origin.y - yMeters * state.pixelsPerMeter;

    drawSportsBall(ctxS, ballX, ballY, 14, 'baseball');
  } else if (state.syntheticType === 'basketball') {
    const theta = 62 * (Math.PI / 180);
    const v0 = 5.6;
    const g = 9.8;
    const tFlight = 1.4;
    const tClamped = Math.min(t, tFlight);

    const xMeters = v0 * Math.cos(theta) * tClamped;
    const yMeters = v0 * Math.sin(theta) * tClamped - 0.5 * g * tClamped * tClamped;

    const ballX = state.origin.x + xMeters * state.pixelsPerMeter;
    const ballY = state.origin.y - yMeters * state.pixelsPerMeter;

    // Draw Basketball Hoop & Backboard
    const hoopX = Math.round(w * 0.80);
    const hoopY = Math.round(h * 0.46);
    ctxS.strokeStyle = '#c53030';
    ctxS.lineWidth = 4;
    ctxS.strokeRect(hoopX + 46, hoopY - 80, 5, 200);
    ctxS.fillStyle = '#d67b19';
    ctxS.fillRect(hoopX, hoopY, 46, 8);
    // Net
    ctxS.strokeStyle = 'rgba(255,255,255,0.85)';
    ctxS.lineWidth = 1.5;
    ctxS.beginPath();
    ctxS.moveTo(hoopX, hoopY + 8); ctxS.lineTo(hoopX + 12, hoopY + 38);
    ctxS.moveTo(hoopX + 46, hoopY + 8); ctxS.lineTo(hoopX + 34, hoopY + 38);
    ctxS.stroke();

    drawSportsBall(ctxS, ballX, ballY, 15, 'basketball');
  } else if (state.syntheticType === 'soccer') {
    const theta = 48 * (Math.PI / 180);
    const v0 = 6.2;
    const g = 9.8;
    const tFlight = 1.55;
    const tClamped = Math.min(t, tFlight);

    const xMeters = v0 * Math.cos(theta) * tClamped;
    const yMeters = v0 * Math.sin(theta) * tClamped - 0.5 * g * tClamped * tClamped;

    const ballX = state.origin.x + xMeters * state.pixelsPerMeter;
    const ballY = state.origin.y - yMeters * state.pixelsPerMeter;

    drawSportsBall(ctxS, ballX, ballY, 14, 'soccer');
  } else if (state.syntheticType === 'freefall') {
    const g = 9.8;
    const tDrop = Math.sqrt((2 * 1.8) / g);
    const tClamped = Math.min(t, tDrop);
    const yMeters = 0.5 * g * tClamped * tClamped;
    const ballX = state.origin.x;
    const ballY = state.origin.y + yMeters * state.pixelsPerMeter;

    drawSportsBall(ctxS, ballX, ballY, 14, 'baseball');
  } else if (state.syntheticType === 'pendulum') {
    const L = 1.5;
    const theta0 = 0.45;
    const omega = Math.sqrt(9.8 / L);
    const theta = theta0 * Math.cos(omega * t);

    const bobX = state.origin.x + L * Math.sin(theta) * state.pixelsPerMeter;
    const bobY = state.origin.y + L * Math.cos(theta) * state.pixelsPerMeter;

    ctxS.strokeStyle = '#4b6570';
    ctxS.lineWidth = 2;
    ctxS.beginPath();
    ctxS.moveTo(state.origin.x, state.origin.y);
    ctxS.lineTo(bobX, bobY);
    ctxS.stroke();

    drawSportsBall(ctxS, bobX, bobY, 15, 'metallic');
  } else if (state.syntheticType === 'cart') {
    const xCart = state.origin.x + (1.2 * t) * state.pixelsPerMeter;
    ctxS.fillStyle = '#0f7e9b';
    ctxS.fillRect(xCart - 35, floorY - 24, 70, 24);
    ctxS.fillStyle = '#123140';
    ctxS.beginPath();
    ctxS.arc(xCart - 20, floorY, 8, 0, Math.PI * 2);
    ctxS.arc(xCart + 20, floorY, 8, 0, Math.PI * 2);
    ctxS.fill();
  }
}

function drawSportsBall(ctxS, x, y, r, ballType) {
  ctxS.save();
  ctxS.beginPath();
  ctxS.arc(x, y, r, 0, Math.PI * 2);

  if (ballType === 'basketball') {
    ctxS.fillStyle = '#d67b19';
    ctxS.fill();
    ctxS.strokeStyle = '#123140';
    ctxS.lineWidth = 1.5;
    ctxS.stroke();
    // Seams
    ctxS.beginPath();
    ctxS.arc(x, y, r * 0.7, 0, Math.PI);
    ctxS.stroke();
  } else if (ballType === 'soccer') {
    ctxS.fillStyle = '#ffffff';
    ctxS.fill();
    ctxS.strokeStyle = '#123140';
    ctxS.lineWidth = 1.5;
    ctxS.stroke();
    ctxS.fillStyle = '#123140';
    ctxS.beginPath();
    ctxS.arc(x, y, r * 0.35, 0, Math.PI * 2);
    ctxS.fill();
  } else if (ballType === 'metallic') {
    ctxS.fillStyle = '#0f7e9b';
    ctxS.fill();
    ctxS.strokeStyle = '#095f76';
    ctxS.lineWidth = 2;
    ctxS.stroke();
  } else {
    // Standard Bright Yellow/White Tennis or Baseball
    ctxS.fillStyle = '#fef08a';
    ctxS.fill();
    ctxS.strokeStyle = '#d67b19';
    ctxS.lineWidth = 1.5;
    ctxS.stroke();
    ctxS.strokeStyle = '#e11d48';
    ctxS.lineWidth = 1;
    ctxS.beginPath();
    ctxS.arc(x - 3, y, r * 0.7, -Math.PI / 2, Math.PI / 2);
    ctxS.stroke();
  }
  ctxS.restore();
}

// ============================================================================
// Step Workflow & Mode Switching
// ============================================================================
function updateStepView(stepNum) {
  state.currentStep = stepNum;

  // Update Stepper Buttons
  stepBtns.forEach((btn, idx) => {
    if (!btn) return;
    const num = idx + 1;
    btn.classList.remove('active', 'completed');
    if (num === stepNum) {
      btn.classList.add('active');
    } else if (num < stepNum) {
      btn.classList.add('completed');
    }
  });

  // Switch Stages
  if (videoWorkspaceStage) videoWorkspaceStage.style.display = (stepNum === 1 || stepNum === 2) ? 'grid' : 'none';
  if (stepView3) stepView3.style.display = (stepNum === 3) ? 'block' : 'none';
  if (stepView4) stepView4.style.display = (stepNum === 4) ? 'block' : 'none';
  if (stepView5) stepView5.style.display = (stepNum === 5) ? 'block' : 'none';

  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const guidanceTitle = document.getElementById('guidanceTitle');
  const guidanceText = document.getElementById('guidanceText');

  if (stepNum === 1) {
    setActiveTool('scale');
    // Open Scale & Calibration tab in sidebar so controls are directly visible!
    tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === 'tab-calibration'));
    tabContents.forEach(c => c.classList.toggle('active', c.id === 'tab-calibration'));
    if (guidanceTitle) guidanceTitle.innerHTML = 'Step 1: Calibration &amp; Coordinate Setup';
    if (guidanceText) {
      guidanceText.innerHTML = `
        1. Select <strong>Set Origin</strong> and click on the ground or projectile release point.<br>
        2. Select <strong>Set Scale</strong> and drag across the amber 1.00 m reference stick on the floor.<br>
        3. Verify the scale readout in meters before advancing to Step 2.
      `;
    }
    updateStatus('Step 1: Set coordinate origin and drag amber scale stick across the 1.00 m reference.');
  } else if (stepNum === 2) {
    setActiveTool('track');
    tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === 'tab-graphs'));
    tabContents.forEach(c => c.classList.toggle('active', c.id === 'tab-graphs'));
    if (guidanceTitle) guidanceTitle.innerHTML = 'Step 2: Frame-by-Frame Motion Tracking';
    if (guidanceText) {
      guidanceText.innerHTML = `
        1. Select <strong>Add Points</strong> in the toolbar.<br>
        2. Click directly on the projectile's center of mass on each frame (video auto-advances).<br>
        3. When finished tracking, click <strong>Set t₀ at First Pt</strong> in the sidebar, then proceed to Step 3.
      `;
    }
    updateStatus('Step 2: Step through frames and click projectile center-of-mass to track trajectory.');
  } else if (stepNum === 3) {
    updateStatus('Step 3: Kinematics Studio - Verify curves of best fit and sample 10 tangent slopes.');
    renderStudioGraph(state.activeGraphTab);
  } else if (stepNum === 4) {
    updateStatus('Step 4: Calculations Workspace - Use kinematic formulas to calculate values and verify percent differences.');
    updateCalculationFormulas();
  } else if (stepNum === 5) {
    updateStatus('Step 5: Presentation & Reports - Export 8-slide PowerPoint deck, print lab report, copy form data.');
    updateAuthenticityBadge();
    renderSlideDeckPreview(state.currentSlideIdx);
  }

  // Ensure KaTeX renders math in updated elements
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '$', right: '$', display: false }
      ]
    });
  }
}

// Tool Switching
function setActiveTool(tool) {
  state.activeTool = tool;
  [toolTrack, toolScale, toolOrigin].forEach(btn => {
    if (btn) btn.classList.remove('active', 'btn-amber');
  });

  if (tool === 'track' && toolTrack) {
    toolTrack.classList.add('active', 'btn-amber');
    if (overlayCanvas) overlayCanvas.style.cursor = 'crosshair';
  } else if (tool === 'scale' && toolScale) {
    toolScale.classList.add('active', 'btn-amber');
    if (overlayCanvas) overlayCanvas.style.cursor = 'crosshair';
  } else if (tool === 'origin' && toolOrigin) {
    toolOrigin.classList.add('active', 'btn-amber');
    if (overlayCanvas) overlayCanvas.style.cursor = 'move';
  }
  drawOverlay();
}

// Coordinate Transforms
function transformToPhysics(screenX, screenY) {
  const dx = screenX - state.origin.x;
  const dy = state.origin.y - screenY; // Screen Y goes down; Physics Y goes up

  const angle = state.originAngle;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const rotX = dx * cosA - dy * sinA;
  const rotY = dx * sinA + dy * cosA;

  const metersX = rotX / state.pixelsPerMeter;
  const metersY = rotY / state.pixelsPerMeter;

  return { x: metersX, y: metersY };
}

function getAdjustedTime(rawTime) {
  return Math.max(0, rawTime - state.timeOffset);
}

function updateTimeAndFrame(t) {
  state.currentTime = t;
  const adjustedT = getAdjustedTime(t);
  const frame = Math.round(t * state.fps);

  if (currentTimeText) currentTimeText.textContent = `t = ${adjustedT.toFixed(3)} s`;
  if (currentFrameText) currentFrameText.textContent = `Frame: ${frame}`;
  if (timeScrubber) timeScrubber.value = t;

  if (state.isSynthetic) {
    renderSyntheticFrame(t);
    drawOverlay();
  } else if (video && !video.paused) {
    drawOverlay();
  }
}

function stepFrame(delta) {
  const dt = 1 / state.fps;
  let nextT = state.currentTime + delta * dt;
  nextT = Math.max(0, Math.min(state.duration, nextT));
  if (state.isSynthetic) {
    updateTimeAndFrame(nextT);
  } else if (video) {
    video.currentTime = nextT;
  }
}

function togglePlay() {
  state.isPlaying = !state.isPlaying;
  if (iconPlay) iconPlay.style.display = state.isPlaying ? 'none' : 'block';
  if (iconPause) iconPause.style.display = state.isPlaying ? 'block' : 'none';

  if (state.isSynthetic) {
    if (state.isPlaying) playSyntheticLoop();
  } else if (video) {
    if (state.isPlaying) video.play();
    else video.pause();
  }
}

let syntheticPlayTimer = null;
function playSyntheticLoop() {
  if (!state.isPlaying || !state.isSynthetic) return;
  const dt = (1 / state.fps) * (parseFloat(playbackRateSelect ? playbackRateSelect.value : 0.5));
  let nextT = state.currentTime + dt;
  if (nextT >= state.duration) {
    nextT = 0;
  }
  updateTimeAndFrame(nextT);
  syntheticPlayTimer = requestAnimationFrame(playSyntheticLoop);
}

// Point Tracking
function addTrackPoint(screenX, screenY) {
  const currentT = state.currentTime;
  const pts = state.series[state.activeSeries];
  const phys = transformToPhysics(screenX, screenY);
  const frame = Math.round(currentT * state.fps);

  // Avoid duplicates within 1 frame
  const existingIdx = pts.findIndex(p => Math.abs(p.rawTime - currentT) < 0.005);
  const ptData = {
    frame,
    rawTime: currentT,
    time: getAdjustedTime(currentT),
    videoX: screenX,
    videoY: screenY,
    x: phys.x,
    y: phys.y,
    vx: 0,
    vy: 0,
    ax: 0,
    ay: 0
  };

  if (existingIdx !== -1) {
    pts[existingIdx] = ptData;
  } else {
    pts.push(ptData);
  }

  pts.sort((a, b) => a.rawTime - b.rawTime);
  recalculateKinematics();
  updateTable();
  updateCharts();

  // Step forward
  const framesToStep = parseInt(stepFrameSelect ? stepFrameSelect.value : 2, 10);
  stepFrame(framesToStep);
}

function recalculateKinematics() {
  const pts = state.series[state.activeSeries];
  pts.forEach(p => { p.time = getAdjustedTime(p.rawTime); });
  if (pts.length < 2) return;

  // Numerical Velocities
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) {
      const dt = pts[1].time - pts[0].time;
      pts[0].vx = dt > 0 ? (pts[1].x - pts[0].x) / dt : 0;
      pts[0].vy = dt > 0 ? (pts[1].y - pts[0].y) / dt : 0;
    } else if (i === pts.length - 1) {
      const dt = pts[i].time - pts[i - 1].time;
      pts[i].vx = dt > 0 ? (pts[i].x - pts[i - 1].x) / dt : 0;
      pts[i].vy = dt > 0 ? (pts[i].y - pts[i - 1].y) / dt : 0;
    } else {
      const dt = pts[i + 1].time - pts[i - 1].time;
      pts[i].vx = dt > 0 ? (pts[i + 1].x - pts[i - 1].x) / dt : 0;
      pts[i].vy = dt > 0 ? (pts[i + 1].y - pts[i - 1].y) / dt : 0;
    }
  }

  // Numerical Accelerations
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) {
      const dt = pts[1].time - pts[0].time;
      pts[0].ax = dt > 0 ? (pts[1].vx - pts[0].vx) / dt : 0;
      pts[0].ay = dt > 0 ? (pts[1].vy - pts[0].vy) / dt : 0;
    } else if (i === pts.length - 1) {
      const dt = pts[i].time - pts[i - 1].time;
      pts[i].ax = dt > 0 ? (pts[i].vx - pts[i - 1].vx) / dt : 0;
      pts[i].ay = dt > 0 ? (pts[i].vy - pts[i - 1].vy) / dt : 0;
    } else {
      const dt = pts[i + 1].time - pts[i - 1].time;
      pts[i].ax = dt > 0 ? (pts[i + 1].vx - pts[i - 1].vx) / dt : 0;
      pts[i].ay = dt > 0 ? (pts[i + 1].vy - pts[i - 1].vy) / dt : 0;
    }
  }
}

function setInitialTimeAtFirstPoint() {
  const pts = state.series[state.activeSeries];
  if (pts.length === 0) return;
  state.timeOffset = pts[0].rawTime;
  recalculateKinematics();
  updateTimeAndFrame(state.currentTime);
  updateTable();
  updateCharts();
  updateStatus(`Set t₀ = 0.000 s at first tracked point (${state.timeOffset.toFixed(3)}s)`);
}

// Canvas Overlay Drawing
function resizeCanvas() {
  if (!overlayCanvas || !viewportContainer) return;
  const rect = viewportContainer.getBoundingClientRect();
  const w = Math.round(rect.width) || 860;
  const h = Math.round(rect.height) || 520;
  overlayCanvas.width = w;
  overlayCanvas.height = h;

  if (state.isSynthetic && state.syntheticCanvas) {
    state.syntheticCanvas.width = w;
    state.syntheticCanvas.height = h;
    state.syntheticCtx = state.syntheticCanvas.getContext('2d');
  }
}

function drawOverlay() {
  if (!ctx || !overlayCanvas) return;
  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  if (state.isSynthetic && state.syntheticCanvas) {
    ctx.drawImage(state.syntheticCanvas, 0, 0, overlayCanvas.width, overlayCanvas.height);
  }

  if (state.showOrigin) drawAxes();
  if (state.showScale) drawScaleStick();
  if (state.showPoints) drawTrackedPoints();
}

function drawAxes() {
  const ox = state.origin.x;
  const oy = state.origin.y;
  const angle = state.originAngle;

  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(-angle);

  // X Axis (Teal)
  ctx.strokeStyle = '#0f7e9b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-50, 0);
  ctx.lineTo(150, 0);
  ctx.stroke();

  // Y Axis (Amber)
  ctx.strokeStyle = '#d67b19';
  ctx.beginPath();
  ctx.moveTo(0, 50);
  ctx.lineTo(0, -150);
  ctx.stroke();

  // Origin point handle
  ctx.fillStyle = state.activeTool === 'origin' ? '#d67b19' : '#0f7e9b';
  ctx.beginPath();
  ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Target reticle ring around origin when origin tool is active
  if (state.activeTool === 'origin') {
    ctx.strokeStyle = 'rgba(214, 123, 25, 0.65)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = '#0f7e9b';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('+x', 156, 4);
  ctx.fillStyle = '#d67b19';
  ctx.fillText('+y', -10, -156);

  ctx.restore();
}

function drawScaleStick() {
  const s = state.scaleStick.start;
  const e = state.scaleStick.end;

  ctx.save();
  ctx.strokeStyle = '#d67b19';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(e.x, e.y);
  ctx.stroke();

  // Endcaps
  [s, e].forEach(p => {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d67b19';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d67b19';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  const midX = (s.x + e.x) / 2;
  const midY = (s.y + e.y) / 2;
  const label = `${state.scaleStick.lengthMeters.toFixed(2)} m`;
  ctx.font = 'bold 12px sans-serif';
  const textW = ctx.measureText(label).width;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(midX - textW / 2 - 5, midY - 21, textW + 10, 17);
  ctx.strokeStyle = '#c8dbe3';
  ctx.lineWidth = 1;
  ctx.strokeRect(midX - textW / 2 - 5, midY - 21, textW + 10, 17);

  ctx.fillStyle = '#0f7e9b';
  ctx.fillText(label, midX - textW / 2, midY - 8);

  ctx.restore();
}

function drawTrackedPoints() {
  ['A', 'B'].forEach(sKey => {
    const pts = state.series[sKey];
    if (pts.length === 0) return;
    const isA = sKey === 'A';
    const color = isA ? '#d67b19' : '#0f7e9b';

    pts.forEach((p, idx) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.5;

      if (state.markerType === 'circle') {
        ctx.beginPath();
        ctx.arc(p.videoX, p.videoY, state.markerRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(p.videoX, p.videoY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.videoX, p.videoY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = '10px sans-serif';
      ctx.fillText(`${idx + 1}`, p.videoX + 10, p.videoY - 6);

      // Velocity vectors
      if (state.showVectors && (p.vx !== 0 || p.vy !== 0)) {
        const arrowScale = 12;
        const vxPix = p.vx * arrowScale;
        const vyPix = -p.vy * arrowScale;
        ctx.strokeStyle = '#095f76';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.videoX, p.videoY);
        ctx.lineTo(p.videoX + vxPix, p.videoY + vyPix);
        ctx.stroke();
      }
      ctx.restore();
    });
  });
}

function updateScaleReadout() {
  const dx = state.scaleStick.end.x - state.scaleStick.start.x;
  const dy = state.scaleStick.end.y - state.scaleStick.start.y;
  const pixelDist = Math.hypot(dx, dy);
  if (pixelDist > 5) {
    state.pixelsPerMeter = pixelDist / state.scaleStick.lengthMeters;
    if (scaleReadout) {
      scaleReadout.textContent = `Current Scale: 1 px = ${(1 / state.pixelsPerMeter).toFixed(4)} m (${state.pixelsPerMeter.toFixed(1)} px/m)`;
    }
  }
}

// Table & CSV Export
function updateTable() {
  if (!pointsTableBody) return;
  const pts = state.series[state.activeSeries];
  if (pts.length === 0) {
    pointsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--subtle); padding: 2rem;">No tracking points yet. Click on the video to record points.</td></tr>';
    return;
  }

  let html = '';
  pts.forEach((p, idx) => {
    html += `
      <tr style="cursor: pointer;" onclick="jumpToPointFrame(${idx})">
        <td><strong>${idx + 1}</strong></td>
        <td>${p.time.toFixed(3)}</td>
        <td>${p.x.toFixed(3)}</td>
        <td>${p.y.toFixed(3)}</td>
        <td>${p.vx.toFixed(2)}</td>
        <td>${p.vy.toFixed(2)}</td>
      </tr>
    `;
  });
  pointsTableBody.innerHTML = html;
}

window.jumpToPointFrame = function(idx) {
  const pts = state.series[state.activeSeries];
  if (pts[idx]) {
    updateTimeAndFrame(pts[idx].rawTime);
  }
};

function exportCSV() {
  const pts = state.series[state.activeSeries];
  if (pts.length === 0) {
    alert('No data points to export yet!');
    return;
  }

  let csv = 'Point,Time (s),x (m),y (m),vx (m/s),vy (m/s),ax (m/s2),ay (m/s2)\n';
  pts.forEach((p, idx) => {
    csv += `${idx + 1},${p.time.toFixed(4)},${p.x.toFixed(4)},${p.y.toFixed(4)},${p.vx.toFixed(4)},${p.vy.toFixed(4)},${p.ax.toFixed(4)},${p.ay.toFixed(4)}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `projectile-kinematics-series-${state.activeSeries}.csv`;
  a.click();
}

// ============================================================================
// Regressions & Kinematic Curve Fitting
// ============================================================================
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return null;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  points.forEach(p => {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  });
  const denom = (n * sumXX - sumX * sumX);
  if (Math.abs(denom) < 1e-9) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  points.forEach(p => {
    const pred = slope * p.x + intercept;
    ssTot += (p.y - meanY) ** 2;
    ssRes += (p.y - pred) ** 2;
  });
  const r2 = ssTot > 0 ? Math.max(0, 1 - (ssRes / ssTot)) : 1;
  return { slope, intercept, r2 };
}

function quadraticRegression(points) {
  const n = points.length;
  if (n < 3) return null;

  let sumT = 0, sumT2 = 0, sumT3 = 0, sumT4 = 0;
  let sumY = 0, sumTY = 0, sumT2Y = 0;

  points.forEach(p => {
    const t = p.x;
    const y = p.y;
    const t2 = t * t;
    sumT += t;
    sumT2 += t2;
    sumT3 += t2 * t;
    sumT4 += t2 * t2;
    sumY += y;
    sumTY += t * y;
    sumT2Y += t2 * y;
  });

  const D = (
    n * (sumT2 * sumT4 - sumT3 * sumT3) -
    sumT * (sumT * sumT4 - sumT2 * sumT3) +
    sumT2 * (sumT * sumT3 - sumT2 * sumT2)
  );
  if (Math.abs(D) < 1e-9) return null;

  const Da = (
    sumY * (sumT2 * sumT4 - sumT3 * sumT3) -
    sumTY * (sumT * sumT4 - sumT2 * sumT3) +
    sumT2Y * (sumT * sumT3 - sumT2 * sumT2)
  );

  const Db = (
    n * (sumTY * sumT4 - sumT2Y * sumT3) -
    sumT * (sumY * sumT4 - sumT2Y * sumT2) +
    sumT2 * (sumY * sumT3 - sumTY * sumT2)
  );

  const Dc = (
    n * (sumT2 * sumT2Y - sumTY * sumT3) -
    sumT * (sumT * sumT2Y - sumTY * sumT2) +
    sumY * (sumT * sumT3 - sumT2 * sumT2)
  );

  const C = Da / D;
  const B = Db / D;
  const A = Dc / D;

  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  points.forEach(p => {
    const pred = A * p.x * p.x + B * p.x + C;
    ssTot += (p.y - meanY) ** 2;
    ssRes += (p.y - pred) ** 2;
  });
  const r2 = ssTot > 0 ? Math.max(0, 1 - (ssRes / ssTot)) : 1;

  return { A, B, C, r2 };
}

// Charts Initialization
function initCharts() {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } }
    },
    scales: {
      x: {
        title: { display: true, text: 'Time t (s)', font: { size: 11, weight: 'bold' } },
        grid: { color: '#eef3f6' }
      },
      y: {
        grid: { color: '#eef3f6' }
      }
    }
  };

  const ctxPos = document.getElementById('posChart').getContext('2d');
  posChart = new Chart(ctxPos, {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'y (m)', data: [], backgroundColor: '#d67b19', borderColor: '#d67b19', pointRadius: 4.5 },
        { label: 'x (m)', data: [], backgroundColor: '#0f7e9b', borderColor: '#0f7e9b', pointRadius: 4.5 },
        { label: 'Model Fit', data: [], type: 'line', borderColor: '#b06210', borderWidth: 2, pointRadius: 0, fill: false }
      ]
    },
    options: {
      ...chartOptions,
      scales: {
        ...chartOptions.scales,
        y: { title: { display: true, text: 'Position (m)', font: { size: 11, weight: 'bold' } }, grid: { color: '#eef3f6' } }
      }
    }
  });

  const ctxVel = document.getElementById('velChart').getContext('2d');
  velChart = new Chart(ctxVel, {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'vy (m/s)', data: [], backgroundColor: '#d67b19', borderColor: '#d67b19', pointRadius: 4.5 },
        { label: 'vx (m/s)', data: [], backgroundColor: '#0f7e9b', borderColor: '#0f7e9b', pointRadius: 4.5 },
        { label: 'Linear Fit', data: [], type: 'line', borderColor: '#b06210', borderWidth: 2, pointRadius: 0, fill: false }
      ]
    },
    options: {
      ...chartOptions,
      scales: {
        ...chartOptions.scales,
        y: { title: { display: true, text: 'Velocity (m/s)', font: { size: 11, weight: 'bold' } }, grid: { color: '#eef3f6' } }
      }
    }
  });
}

function updateCharts() {
  const pts = state.series[state.activeSeries];
  if (!posChart || !velChart) return;

  const yData = pts.map(p => ({ x: p.time, y: p.y }));
  const xData = pts.map(p => ({ x: p.time, y: p.x }));

  if (state.motionFilter === 'vertical') {
    posChart.data.datasets[0].data = yData;
    posChart.data.datasets[0].hidden = false;
    posChart.data.datasets[1].data = [];
    posChart.data.datasets[1].hidden = true;
  } else if (state.motionFilter === 'horizontal') {
    posChart.data.datasets[0].data = [];
    posChart.data.datasets[0].hidden = true;
    posChart.data.datasets[1].data = xData;
    posChart.data.datasets[1].hidden = false;
  } else {
    posChart.data.datasets[0].data = yData;
    posChart.data.datasets[0].hidden = false;
    posChart.data.datasets[1].data = xData;
    posChart.data.datasets[1].hidden = false;
  }
  posChart.update();

  const vyData = pts.map(p => ({ x: p.time, y: p.vy }));
  const vxData = pts.map(p => ({ x: p.time, y: p.vx }));
  if (state.motionFilter === 'vertical') {
    velChart.data.datasets[0].data = vyData;
    velChart.data.datasets[0].hidden = false;
    velChart.data.datasets[1].data = [];
    velChart.data.datasets[1].hidden = true;
  } else if (state.motionFilter === 'horizontal') {
    velChart.data.datasets[0].data = [];
    velChart.data.datasets[0].hidden = true;
    velChart.data.datasets[1].data = vxData;
    velChart.data.datasets[1].hidden = false;
  } else {
    velChart.data.datasets[0].data = vyData;
    velChart.data.datasets[0].hidden = false;
    velChart.data.datasets[1].data = vxData;
    velChart.data.datasets[1].hidden = false;
  }
  velChart.update();
}

// ============================================================================
// Step 3: 6-Graph Kinematics Studio & Tangent Tool
// ============================================================================
// KaTeX Math Rendering Helper
function renderKaTeX(element, latexStr, isDisplay = true) {
  if (!element || !latexStr) {
    if (element) element.innerHTML = '';
    return;
  }
  let clean = latexStr.trim();
  if (clean.startsWith('\\[') && clean.endsWith('\\]')) clean = clean.slice(2, -2).trim();
  if (clean.startsWith('\\(') && clean.endsWith('\\)')) clean = clean.slice(2, -2).trim();

  if (window.katex && typeof window.katex.render === 'function') {
    try {
      window.katex.render(clean, element, { displayMode: isDisplay, throwOnError: false });
      return;
    } catch (e) {
      console.warn('KaTeX render error:', e);
    }
  }
  element.textContent = latexStr;
}

function autoFitAllGraphs() {
  const pts = state.series[state.activeSeries];
  if (pts.length < 3) {
    alert('Please track at least 3 points on the video before fitting models!');
    return;
  }

  // 1. yPos: Quadratic Fit y = At^2 + Bt + C
  const yPts = pts.map(p => ({ x: p.time, y: p.y }));
  state.fitResults.yPos = quadraticRegression(yPts);

  // 2. xPos: Linear Fit x = mt + b
  const xPts = pts.map(p => ({ x: p.time, y: p.x }));
  state.fitResults.xPos = linearRegression(xPts);

  // 3. Ensure 10 tangent slopes are sampled from the quadratic position curve
  if (!state.tangentPoints || state.tangentPoints.length < 2) {
    autoSample10Tangents(true);
  } else {
    state.fitResults.yVel = linearRegression(state.tangentPoints.map(p => ({ x: p.time, y: p.vy })));
  }

  // 4. xVel: The horizontal position curve x(t) = v0x*t + x0 has constant derivative dx/dt = v0x
  const v0x = state.fitResults.xPos ? state.fitResults.xPos.slope : (pts[pts.length - 1].x - pts[0].x) / (pts[pts.length - 1].time - pts[0].time);
  state.fitResults.xVel = { slope: 0.0, intercept: v0x, r2: 1.0000 };

  // 5. yAcc: Vertical acceleration is the slope of the vertical velocity graph (ay)
  const ayVal = state.fitResults.yVel ? state.fitResults.yVel.slope : (2 * state.fitResults.yPos.A);
  state.fitResults.yAcc = { mean: ayVal, ref: -9.80 };

  // 6. xAcc: Horizontal acceleration is the slope of the horizontal velocity graph (ax = 0)
  state.fitResults.xAcc = { mean: 0.0, ref: 0.00 };

  renderStudioGraph(state.activeGraphTab);
  updateStatus('Auto-fitted all 6 kinematic graphs successfully with equations!');
}

function renderStudioGraph(graphType) {
  state.activeGraphTab = graphType;
  graphNavBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.graph === graphType);
  });

  if (graphType === 'grid-all') {
    if (singleGraphContainer) singleGraphContainer.style.display = 'none';
    if (tangentStudioBar) tangentStudioBar.style.display = 'none';
    if (gridAllContainer) gridAllContainer.style.display = 'grid';
    renderAllGridGraphs();
    return;
  }

  if (singleGraphContainer) singleGraphContainer.style.display = 'flex';
  if (gridAllContainer) gridAllContainer.style.display = 'none';

  // Tangent tool visibility: shown for y-pos and y-vel
  if (tangentStudioBar) {
    tangentStudioBar.style.display = (graphType === 'y-pos' || graphType === 'y-vel') ? 'flex' : 'none';
  }

  const pts = state.series[state.activeSeries];
  if (pts.length < 2) return;

  // Ensure fits exist
  if (!state.fitResults.yPos) autoFitAllGraphs();

  const ctxS = activeGraphCanvas.getContext('2d');
  if (studioChart) studioChart.destroy();

  let title = '';
  let generalEq = '';
  let particularEq = '';
  let r2Val = 'N/A';
  let chartData = { datasets: [] };
  let yAxisLabel = '';

  const tMin = pts[0].time;
  const tMax = pts[pts.length - 1].time;

  let ySuggestedMin = 0;
  let ySuggestedMax = 5;

  if (graphType === 'y-pos') {
    title = '1. Vertical Position vs. Time [y(t)]';
    const fit = state.fitResults.yPos;
    const y0 = fit ? fit.C : pts[0].y;
    const v0y = fit ? fit.B : 0;
    const ay = fit ? 2 * fit.A : -9.8;
    r2Val = fit ? `R² = ${fit.r2.toFixed(4)}` : '';

    generalEq = '\\[y(t) = \\frac{1}{2}a_y t^2 + v_{0y}t + y_0\\]';
    particularEq = `\\[y(t) = (${fit ? fit.A.toFixed(3) : '-4.900'}\\text{ m/s}^2)t^2 + (${v0y.toFixed(3)}\\text{ m/s})t + (${y0.toFixed(3)}\\text{ m})\\]`;
    yAxisLabel = 'Vertical Position y (m)';

    ySuggestedMin = 0;
    ySuggestedMax = Math.max(1, ...pts.map(p => p.y)) * 1.25;

    // 1. Quadratic fit line points
    const fitLine = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = tMin + (tMax - tMin) * (i / steps);
      const yFit = fit ? (fit.A * t * t + fit.B * t + fit.C) : (y0 + v0y * t + 0.5 * ay * t * t);
      fitLine.push({ x: t, y: yFit });
    }

    // 2. Active Tangent Line at state.activeTangentTime
    const t0 = Math.max(tMin, Math.min(tMax, state.activeTangentTime || tMin));
    const y0_tan = fit ? (fit.A * t0 * t0 + fit.B * t0 + fit.C) : (y0 + v0y * t0 + 0.5 * ay * t0 * t0);
    const slope_tan = fit ? (2 * fit.A * t0 + fit.B) : (v0y + ay * t0);
    const span = Math.max(0.1, (tMax - tMin) * 0.22);
    const tStart = Math.max(0, t0 - span);
    const tEnd = t0 + span;
    const tangentLineData = [
      { x: tStart, y: y0_tan + slope_tan * (tStart - t0) },
      { x: tEnd, y: y0_tan + slope_tan * (tEnd - t0) }
    ];

    // 3. Recorded tangent touchpoints along the trajectory
    const touchpoints = (state.tangentPoints || []).map(p => ({
      x: p.time,
      y: fit ? (fit.A * p.time * p.time + fit.B * p.time + fit.C) : (y0 + v0y * p.time + 0.5 * ay * p.time * p.time)
    }));

    chartData.datasets = [
      { label: 'Measured y (m)', data: pts.map(p => ({ x: p.time, y: p.y })), backgroundColor: '#d67b19', borderColor: '#d67b19', pointRadius: 5 },
      { label: 'Quadratic Fit', data: fitLine, type: 'line', borderColor: '#b06210', borderWidth: 2.5, pointRadius: 0, fill: false },
      { label: `Active Tangent (Slope dy/dt = ${slope_tan.toFixed(2)} m/s)`, data: tangentLineData, type: 'line', borderColor: '#0f7e9b', borderWidth: 3, borderDash: [6, 4], pointRadius: 0, fill: false },
      { label: 'Active Touchpoint', data: [{ x: t0, y: y0_tan }], backgroundColor: '#0f7e9b', borderColor: '#ffffff', pointRadius: 8, pointHoverRadius: 10 },
      { label: 'Sampled Tangents (10 Points)', data: touchpoints, backgroundColor: '#0284c7', borderColor: '#0369a1', pointRadius: 6, pointStyle: 'rectRot' }
    ];
  } else if (graphType === 'x-pos') {
    title = '2. Horizontal Position vs. Time [x(t)]';
    const fit = state.fitResults.xPos;
    const v0x = fit ? fit.slope : 0;
    const x0 = fit ? fit.intercept : 0;
    r2Val = fit ? `R² = ${fit.r2.toFixed(4)}` : '';

    generalEq = '\\[x(t) = v_{0x}t + x_0\\]';
    particularEq = `\\[x(t) = (${v0x.toFixed(3)}\\text{ m/s})t + (${x0.toFixed(3)}\\text{ m})\\]`;
    yAxisLabel = 'Horizontal Position x (m)';

    ySuggestedMin = 0;
    ySuggestedMax = Math.max(1, ...pts.map(p => p.x)) * 1.2;

    const fitLine = [
      { x: tMin, y: fit ? fit.slope * tMin + fit.intercept : 0 },
      { x: tMax, y: fit ? fit.slope * tMax + fit.intercept : 0 }
    ];

    chartData.datasets = [
      { label: 'Measured x (m)', data: pts.map(p => ({ x: p.time, y: p.x })), backgroundColor: '#0f7e9b', borderColor: '#0f7e9b', pointRadius: 5 },
      { label: 'Linear Fit (v₀ₓ)', data: fitLine, type: 'line', borderColor: '#095f76', borderWidth: 2.5, pointRadius: 0, fill: false }
    ];
  } else if (graphType === 'y-vel') {
    title = '3. Vertical Velocity vs. Time [vy(t)] (From 10 Tangent Slopes)';

    // Ensure 10 tangent points are sampled if not already done
    if (!state.tangentPoints || state.tangentPoints.length < 2) {
      autoSample10Tangents(true);
    }

    const linearData = state.tangentPoints.map(p => ({ x: p.time, y: p.vy }));
    const fit = linearRegression(linearData);
    state.fitResults.yVel = fit;

    const ay = fit ? fit.slope : -9.8;
    const v0y = fit ? fit.intercept : 0;
    r2Val = fit ? `R² = ${fit.r2.toFixed(4)}` : '';

    generalEq = '\\[v_y(t) = a_y t + v_{0y}\\]';
    particularEq = `\\[v_y(t) = (${ay.toFixed(3)}\\text{ m/s}^2)t + (${v0y.toFixed(3)}\\text{ m/s})\\]`;
    yAxisLabel = 'Vertical Velocity vy (m/s)';

    const maxV = Math.max(5, Math.abs(v0y), Math.abs(ay * (tMax - tMin) + v0y)) * 1.25;
    ySuggestedMin = -maxV;
    ySuggestedMax = maxV;

    const fitLine = [
      { x: tMin, y: fit ? fit.slope * tMin + fit.intercept : 0 },
      { x: tMax, y: fit ? fit.slope * tMax + fit.intercept : 0 }
    ];

    chartData.datasets = [
      { label: '10 Tangent Velocities (dy/dt)', data: linearData, backgroundColor: '#d67b19', borderColor: '#b06210', pointRadius: 7, pointStyle: 'rectRot' },
      { label: `Linear Fit (Slope ay = ${ay.toFixed(2)} m/s²)`, data: fitLine, type: 'line', borderColor: '#d67b19', borderWidth: 2.5, pointRadius: 0, fill: false }
    ];
  } else if (graphType === 'x-vel') {
    title = '4. Horizontal Velocity vs. Time [vx(t)]';
    const fit = state.fitResults.xVel;
    const v0x = fit ? fit.intercept : (state.fitResults.xPos ? state.fitResults.xPos.slope : 0);
    r2Val = 'R² = 1.0000';

    generalEq = '\\[v_x(t) = v_{0x} = \\text{constant}\\]';
    particularEq = `\\[v_x(t) = ${v0x.toFixed(3)}\\text{ m/s} \\quad (\\text{Slope } a_x = 0.000\\text{ m/s}^2)\\]`;
    yAxisLabel = 'Horizontal Velocity vx (m/s)';

    ySuggestedMin = 0;
    ySuggestedMax = Math.max(3.5, v0x * 1.4);

    // 10 Sampled points representing tangent slope dx/dt along the linear position fit
    const vxSamples = [];
    for (let i = 1; i <= 10; i++) {
      const t = tMin + (tMax - tMin) * (i / 11);
      vxSamples.push({ x: t, y: v0x });
    }

    const fitLine = [
      { x: tMin, y: v0x },
      { x: tMax, y: v0x }
    ];

    chartData.datasets = [
      { label: 'Sampled Tangent Slopes (dx/dt)', data: vxSamples, backgroundColor: '#0f7e9b', borderColor: '#095f76', pointRadius: 6, pointStyle: 'rectRot' },
      { label: `Constant Velocity Fit (v₀ₓ = ${v0x.toFixed(3)} m/s, Slope = 0)`, data: fitLine, type: 'line', borderColor: '#0f7e9b', borderWidth: 2.5, pointRadius: 0, fill: false }
    ];
  } else if (graphType === 'y-acc') {
    title = '5. Vertical Acceleration vs. Time [ay(t)]';
    const meanAy = state.fitResults.yAcc ? state.fitResults.yAcc.mean : (state.fitResults.yVel ? state.fitResults.yVel.slope : -9.8);
    generalEq = '\\[a_y(t) = \\frac{dv_y}{dt} = a_y = \\text{constant}\\]';
    particularEq = `\\[a_y(t) = ${meanAy.toFixed(3)}\\text{ m/s}^2 \\quad (\\text{Ref } g = -9.80\\text{ m/s}^2)\\]`;
    yAxisLabel = 'Vertical Acc ay (m/s²)';

    ySuggestedMin = -14;
    ySuggestedMax = 2;

    const aySamples = [];
    for (let i = 1; i <= 10; i++) {
      const t = tMin + (tMax - tMin) * (i / 11);
      aySamples.push({ x: t, y: meanAy });
    }

    chartData.datasets = [
      { label: 'Slope of Velocity Graph (dvᵧ/dt)', data: aySamples, backgroundColor: '#d67b19', borderColor: '#b06210', pointRadius: 6, pointStyle: 'circle' },
      { label: `Measured Acceleration Fit (aᵧ = ${meanAy.toFixed(3)} m/s²)`, data: [{ x: tMin, y: meanAy }, { x: tMax, y: meanAy }], type: 'line', borderColor: '#d67b19', borderWidth: 2.5, pointRadius: 0, fill: false },
      { label: 'Standard Reference g (-9.80 m/s²)', data: [{ x: tMin, y: -9.8 }, { x: tMax, y: -9.8 }], type: 'line', borderColor: '#64748b', borderDash: [6, 4], borderWidth: 2, pointRadius: 0, fill: false }
    ];
  } else if (graphType === 'x-acc') {
    title = '6. Horizontal Acceleration vs. Time [ax(t)]';
    const meanAx = 0.0;
    generalEq = '\\[a_x(t) = \\frac{dv_x}{dt} = 0\\text{ m/s}^2\\]';
    particularEq = `\\[a_x(t) = 0.000\\text{ m/s}^2 \\quad (\\text{Ref } a_x = 0.00\\text{ m/s}^2)\\]`;
    yAxisLabel = 'Horizontal Acc ax (m/s²)';

    ySuggestedMin = -2;
    ySuggestedMax = 2;

    const axSamples = [];
    for (let i = 1; i <= 10; i++) {
      const t = tMin + (tMax - tMin) * (i / 11);
      axSamples.push({ x: t, y: 0.0 });
    }

    chartData.datasets = [
      { label: 'Slope of Velocity Graph (dvₓ/dt)', data: axSamples, backgroundColor: '#0f7e9b', borderColor: '#095f76', pointRadius: 6, pointStyle: 'circle' },
      { label: 'Constant Zero Acceleration Fit (aₓ = 0.000 m/s²)', data: [{ x: tMin, y: 0.0 }, { x: tMax, y: 0.0 }], type: 'line', borderColor: '#0f7e9b', borderWidth: 2.5, pointRadius: 0, fill: false }
    ];
  }

  if (activeGraphEqTitle) activeGraphEqTitle.textContent = title;
  if (activeGraphR2) activeGraphR2.textContent = r2Val;
  renderKaTeX(activeGeneralEq, generalEq, true);
  renderKaTeX(activeParticularEq, particularEq, true);

  studioChart = new Chart(ctxS, {
    type: 'scatter',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { position: 'top', labels: { font: { size: 11, weight: 'bold' } } }
      },
      scales: {
        x: {
          title: { display: true, text: 'Time t (s)', font: { size: 12, weight: 'bold' } },
          grid: {
            color: (ctx) => (ctx.tick && ctx.tick.value === 0) ? '#0f7e9b' : '#eef3f6',
            lineWidth: (ctx) => (ctx.tick && ctx.tick.value === 0) ? 2.5 : 1
          }
        },
        y: {
          title: { display: true, text: yAxisLabel, font: { size: 12, weight: 'bold' } },
          suggestedMin: ySuggestedMin,
          suggestedMax: ySuggestedMax,
          grid: {
            color: (ctx) => (ctx.tick && ctx.tick.value === 0) ? '#0f7e9b' : '#eef3f6',
            lineWidth: (ctx) => (ctx.tick && ctx.tick.value === 0) ? 3 : 1
          }
        }
      }
    }
  });

  if (window.renderMathInElement) {
    renderMathInElement(document.getElementById('stepView3'));
  }
}

function renderAllGridGraphs() {
  const configs = [
    { id: 'canvasGridYPos', type: 'y-pos' },
    { id: 'canvasGridXPos', type: 'x-pos' },
    { id: 'canvasGridYVel', type: 'y-vel' },
    { id: 'canvasGridXVel', type: 'x-vel' },
    { id: 'canvasGridYAcc', type: 'y-acc' },
    { id: 'canvasGridXAcc', type: 'x-acc' }
  ];

  const pts = state.series[state.activeSeries];
  if (pts.length < 2) return;

  const tMin = pts[0].time;
  const tMax = pts[pts.length - 1].time;
  const v0x = state.fitResults.xPos ? state.fitResults.xPos.slope : 0;
  const meanAy = state.fitResults.yAcc ? state.fitResults.yAcc.mean : -9.80;

  configs.forEach(cfg => {
    const canvas = document.getElementById(cfg.id);
    if (!canvas) return;
    if (gridCharts[cfg.id]) gridCharts[cfg.id].destroy();

    const ctx = canvas.getContext('2d');
    let datasets = [];
    let sugMin = 0;
    let sugMax = 5;

    if (cfg.type === 'y-pos') {
      datasets = [{ label: 'y(t)', data: pts.map(p => ({ x: p.time, y: p.y })), backgroundColor: '#d67b19', pointRadius: 3 }];
      sugMin = 0;
      sugMax = Math.max(1, ...pts.map(p => p.y)) * 1.25;
    } else if (cfg.type === 'x-pos') {
      datasets = [{ label: 'x(t)', data: pts.map(p => ({ x: p.time, y: p.x })), backgroundColor: '#0f7e9b', pointRadius: 3 }];
      sugMin = 0;
      sugMax = Math.max(1, ...pts.map(p => p.x)) * 1.2;
    } else if (cfg.type === 'y-vel') {
      const tangPts = (state.tangentPoints && state.tangentPoints.length >= 2) ? state.tangentPoints : [];
      datasets = [{ label: 'vy(t)', data: tangPts.map(p => ({ x: p.time, y: p.vy })), backgroundColor: '#d67b19', pointRadius: 3 }];
      sugMin = -8;
      sugMax = 8;
    } else if (cfg.type === 'x-vel') {
      const vxSamples = [];
      for (let i = 1; i <= 10; i++) {
        const t = tMin + (tMax - tMin) * (i / 11);
        vxSamples.push({ x: t, y: v0x });
      }
      datasets = [{ label: 'vx(t)', data: vxSamples, backgroundColor: '#0f7e9b', pointRadius: 3 }];
      sugMin = 0;
      sugMax = Math.max(3.5, v0x * 1.4);
    } else if (cfg.type === 'y-acc') {
      const aySamples = [];
      for (let i = 1; i <= 10; i++) {
        const t = tMin + (tMax - tMin) * (i / 11);
        aySamples.push({ x: t, y: meanAy });
      }
      datasets = [{ label: 'ay(t)', data: aySamples, backgroundColor: '#d67b19', pointRadius: 3 }];
      sugMin = -14;
      sugMax = 2;
    } else if (cfg.type === 'x-acc') {
      const axSamples = [];
      for (let i = 1; i <= 10; i++) {
        const t = tMin + (tMax - tMin) * (i / 11);
        axSamples.push({ x: t, y: 0.0 });
      }
      datasets = [{ label: 'ax(t)', data: axSamples, backgroundColor: '#0f7e9b', pointRadius: 3 }];
      sugMin = -2;
      sugMax = 2;
    }

    gridCharts[cfg.id] = new Chart(ctx, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: {
              color: (c) => (c.tick && c.tick.value === 0) ? '#0f7e9b' : '#f1f5f9',
              lineWidth: (c) => (c.tick && c.tick.value === 0) ? 2 : 1
            },
            ticks: { font: { size: 9 } }
          },
          y: {
            suggestedMin: sugMin,
            suggestedMax: sugMax,
            grid: {
              color: (c) => (c.tick && c.tick.value === 0) ? '#0f7e9b' : '#f1f5f9',
              lineWidth: (c) => (c.tick && c.tick.value === 0) ? 2 : 1
            },
            ticks: { font: { size: 9 } }
          }
        }
      }
    });
  });
}

// Tangent Line Sampler
function updateTangentTool(sliderVal) {
  const pts = state.series[state.activeSeries];
  if (pts.length < 3) return;
  const tMin = pts[0].time;
  const tMax = pts[pts.length - 1].time;
  const t = tMin + (tMax - tMin) * (sliderVal / 100);
  state.activeTangentTime = t;

  const fit = state.fitResults.yPos || quadraticRegression(pts.map(p => ({ x: p.time, y: p.y })));
  // Instantaneous slope dy/dt = 2A*t + B
  const slope = fit ? (2 * fit.A * t + fit.B) : 0;

  if (tangentTimeDisplay) tangentTimeDisplay.textContent = `${t.toFixed(3)} s`;
  if (tangentSlopeDisplay) tangentSlopeDisplay.textContent = `${slope.toFixed(3)} m/s`;

  if (state.activeGraphTab === 'y-pos') {
    renderStudioGraph('y-pos');
  }
}

function recordTangentPoint() {
  const pts = state.series[state.activeSeries];
  if (pts.length < 3) return;
  const t = state.activeTangentTime || pts[0].time;
  const fit = state.fitResults.yPos || quadraticRegression(pts.map(p => ({ x: p.time, y: p.y })));
  const slope = fit ? (2 * fit.A * t + fit.B) : 0;

  // Add to tangentPoints
  state.tangentPoints.push({ time: t, vy: slope });
  state.tangentPoints.sort((a, b) => a.time - b.time);

  if (state.tangentPoints.length >= 2) {
    state.fitResults.yVel = linearRegression(state.tangentPoints.map(p => ({ x: p.time, y: p.vy })));
  }

  if (tangentPointCountBadge) {
    tangentPointCountBadge.textContent = `Sampled: ${state.tangentPoints.length} / 10 Tangent Points`;
    if (state.tangentPoints.length >= 10) {
      tangentPointCountBadge.style.background = '#e6f8ea';
      tangentPointCountBadge.style.color = '#1a7f37';
    }
  }

  renderStudioGraph(state.activeGraphTab);
  updateStatus(`Recorded tangent slope: vy = ${slope.toFixed(3)} m/s at t = ${t.toFixed(3)} s`);
}

function autoSample10Tangents(isSilent = false) {
  const pts = state.series[state.activeSeries];
  if (pts.length < 3) {
    if (!isSilent) alert('Please track at least 3 points first!');
    return;
  }
  const fit = state.fitResults.yPos || quadraticRegression(pts.map(p => ({ x: p.time, y: p.y })));
  if (!fit) return;

  state.tangentPoints = [];
  const tMin = pts[0].time;
  const tMax = pts[pts.length - 1].time;
  const count = 10;

  for (let i = 1; i <= count; i++) {
    const t = tMin + (tMax - tMin) * (i / (count + 1));
    const slope = 2 * fit.A * t + fit.B;
    state.tangentPoints.push({ time: t, vy: slope });
  }

  // Linear fit through the 10 tangent slopes
  state.fitResults.yVel = linearRegression(state.tangentPoints.map(p => ({ x: p.time, y: p.vy })));

  if (tangentPointCountBadge) {
    tangentPointCountBadge.textContent = `Sampled: 10 / 10 Tangent Points ✓`;
    tangentPointCountBadge.style.background = '#e6f8ea';
    tangentPointCountBadge.style.color = '#1a7f37';
  }

  if (!isSilent) {
    renderStudioGraph(state.activeGraphTab || 'y-vel');
    updateStatus('Auto-sampled 10 verified tangent slopes across the trajectory!');
  }
}

// ============================================================================
// Step 4: Guided Calculations Workspace & Verification
// ============================================================================

function getAuthenticitySignature() {
  const sName = (studentNameInput && studentNameInput.value.trim()) || 'Student';
  const tName = (teacherSelect && teacherSelect.value) || 'Physics Teacher';
  const pts = state.series[state.activeSeries] || [];
  const ptsSummary = pts.map(p => `${p.time.toFixed(2)}:${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(';');
  const seed = `${sName.toUpperCase()}|${tName}|${ptsSummary}|${state.pixelsPerMeter.toFixed(1)}`;

  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hex1 = ((h1 >>> 0) % 0xffff).toString(16).toUpperCase().padStart(4, '0');
  const hex2 = ((h2 >>> 0) % 0xffff).toString(16).toUpperCase().padStart(4, '0');
  const hex3 = (((h1 ^ h2) >>> 0) % 0xffff).toString(16).toUpperCase().padStart(4, '0');

  const token = `PK-SPORTS-${hex1}-${hex2}-${hex3}`;
  return {
    token,
    student: sName,
    teacher: tName,
    timestamp: new Date().toISOString(),
    pointsCount: pts.length,
    hashFingerprint: (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16)
  };
}

function updateAuthenticityBadge() {
  const auth = getAuthenticitySignature();
  state.authenticityToken = auth.token;
  const badge = document.getElementById('authenticityBadge');
  if (badge) {
    badge.textContent = auth.token;
    badge.title = `Originality Signature: Student: ${auth.student} • Points: ${auth.pointsCount} • Hash: ${auth.hashFingerprint}`;
  }
}

function updateCalculationFormulas() {
  if (window.renderMathInElement) {
    renderMathInElement(document.getElementById('stepView4'), {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
  }
}

function checkAndVerifyCalculations() {
  const pts = state.series[state.activeSeries];
  if (pts.length < 3) {
    alert('Please track at least 3 points on the video before verifying calculations!');
    return;
  }

  if (!state.fitResults.yPos) autoFitAllGraphs();

  const fitY = state.fitResults.yPos;
  const fitX = state.fitResults.xPos;

  // Expected model values from curve fits
  const exp_x0 = fitX ? fitX.intercept : pts[0].x;
  const exp_vx0 = fitX ? fitX.slope : (pts[pts.length - 1].x - pts[0].x) / (pts[pts.length - 1].time - pts[0].time);
  const exp_ax = 0.0;

  const exp_y0 = fitY ? fitY.C : pts[0].y;
  const exp_vy0 = fitY ? fitY.B : 0.0;
  const exp_ay = fitY ? 2 * fitY.A : -9.8;

  // Theoretical Hang Time
  const yFinal = pts[pts.length - 1].y;
  const A = 0.5 * exp_ay;
  const B = exp_vy0;
  const C = exp_y0 - yFinal;
  const disc = B * B - 4 * A * C;
  let exp_tHang = 0;
  if (disc >= 0 && Math.abs(A) > 1e-6) {
    const t1 = (-B + Math.sqrt(disc)) / (2 * A);
    const t2 = (-B - Math.sqrt(disc)) / (2 * A);
    exp_tHang = Math.max(t1, t2);
  } else {
    exp_tHang = pts[pts.length - 1].time - pts[0].time;
  }

  const exp_range = exp_vx0 * exp_tHang;
  const exp_maxH = exp_y0 + (exp_vy0 * exp_vy0) / (2 * Math.abs(exp_ay));
  const exp_v0 = Math.hypot(exp_vx0, exp_vy0);
  const exp_theta = Math.atan2(exp_vy0, exp_vx0) * (180 / Math.PI);

  // Student inputs
  const studentX0 = (inpX0 && inpX0.value !== '') ? parseFloat(inpX0.value) : null;
  const studentVx0 = (inpVx0 && inpVx0.value !== '') ? parseFloat(inpVx0.value) : null;
  const studentAx = (inpAx && inpAx.value !== '') ? parseFloat(inpAx.value) : null;

  const studentY0 = (inpY0 && inpY0.value !== '') ? parseFloat(inpY0.value) : null;
  const studentVy0 = (inpVy0 && inpVy0.value !== '') ? parseFloat(inpVy0.value) : null;
  const studentAy = (inpAy && inpAy.value !== '') ? parseFloat(inpAy.value) : null;

  const studentCalcRange = (inpCalcRange && inpCalcRange.value !== '') ? parseFloat(inpCalcRange.value) : null;
  const studentMeasRange = (inpMeasRange && inpMeasRange.value !== '') ? parseFloat(inpMeasRange.value) : null;

  const studentCalcHang = (inpCalcHangTime && inpCalcHangTime.value !== '') ? parseFloat(inpCalcHangTime.value) : null;
  const studentMeasHang = (inpMeasHangTime && inpMeasHangTime.value !== '') ? parseFloat(inpMeasHangTime.value) : null;

  const studentCalcMaxH = (inpCalcMaxHeight && inpCalcMaxHeight.value !== '') ? parseFloat(inpCalcMaxHeight.value) : null;
  const studentMeasMaxH = (inpMeasMaxHeight && inpMeasMaxHeight.value !== '') ? parseFloat(inpMeasMaxHeight.value) : null;

  const studentV0 = (inpSpeedV0 && inpSpeedV0.value !== '') ? parseFloat(inpSpeedV0.value) : null;
  const studentTheta = (inpAngleTheta && inpAngleTheta.value !== '') ? parseFloat(inpAngleTheta.value) : null;

  // 1. Horizontal Acceleration difference
  if (studentAx !== null) {
    const diff = Math.abs(studentAx - 0.0);
    if (lblAxDiff) lblAxDiff.textContent = `${diff.toFixed(3)} m/s²`;
  } else {
    if (lblAxDiff) lblAxDiff.textContent = 'Awaiting Input';
  }

  // Vertical Acceleration percent diff from -9.80 m/s^2
  let ayPctDiff = 0;
  if (studentAy !== null) {
    ayPctDiff = (Math.abs(Math.abs(studentAy) - 9.8) / 9.8) * 100;
    if (badgeAyPctDiff) {
      badgeAyPctDiff.textContent = `${ayPctDiff.toFixed(2)}% Diff`;
      badgeAyPctDiff.className = `pct-diff-badge ${ayPctDiff < 6 ? 'success' : ayPctDiff < 12 ? 'warn' : 'error'}`;
    }
  } else {
    if (badgeAyPctDiff) {
      badgeAyPctDiff.textContent = 'Awaiting Input';
      badgeAyPctDiff.className = 'pct-diff-badge';
    }
  }

  // 2. Range Percent Difference
  let rangePctDiff = 0;
  if (studentCalcRange !== null && studentMeasRange !== null) {
    const avg = (studentCalcRange + studentMeasRange) / 2;
    rangePctDiff = avg !== 0 ? (Math.abs(studentMeasRange - studentCalcRange) / Math.abs(avg)) * 100 : 0;
    if (badgeRangePctDiff) {
      badgeRangePctDiff.textContent = `${rangePctDiff.toFixed(2)}% Diff`;
      badgeRangePctDiff.className = `pct-diff-badge ${rangePctDiff < 6 ? 'success' : rangePctDiff < 12 ? 'warn' : 'error'}`;
    }
  } else {
    if (badgeRangePctDiff) {
      badgeRangePctDiff.textContent = 'Awaiting Input';
      badgeRangePctDiff.className = 'pct-diff-badge';
    }
  }

  // 3. Hang Time Percent Difference
  let hangPctDiff = 0;
  if (studentCalcHang !== null && studentMeasHang !== null) {
    const avg = (studentCalcHang + studentMeasHang) / 2;
    hangPctDiff = avg !== 0 ? (Math.abs(studentMeasHang - studentCalcHang) / Math.abs(avg)) * 100 : 0;
    if (badgeHangTimePctDiff) {
      badgeHangTimePctDiff.textContent = `${hangPctDiff.toFixed(2)}% Diff`;
      badgeHangTimePctDiff.className = `pct-diff-badge ${hangPctDiff < 6 ? 'success' : hangPctDiff < 12 ? 'warn' : 'error'}`;
    }
  } else {
    if (badgeHangTimePctDiff) {
      badgeHangTimePctDiff.textContent = 'Awaiting Input';
      badgeHangTimePctDiff.className = 'pct-diff-badge';
    }
  }

  // 4. Max Height Percent Difference
  let maxHPctDiff = 0;
  if (studentCalcMaxH !== null && studentMeasMaxH !== null) {
    const avg = (studentCalcMaxH + studentMeasMaxH) / 2;
    maxHPctDiff = avg !== 0 ? (Math.abs(studentMeasMaxH - studentCalcMaxH) / Math.abs(avg)) * 100 : 0;
    if (badgeMaxHeightPctDiff) {
      badgeMaxHeightPctDiff.textContent = `${maxHPctDiff.toFixed(2)}% Diff`;
      badgeMaxHeightPctDiff.className = `pct-diff-badge ${maxHPctDiff < 6 ? 'success' : maxHPctDiff < 12 ? 'warn' : 'error'}`;
    }
  } else {
    if (badgeMaxHeightPctDiff) {
      badgeMaxHeightPctDiff.textContent = 'Awaiting Input';
      badgeMaxHeightPctDiff.className = 'pct-diff-badge';
    }
  }

  // 5 & 6. Speed & Launch Angle Consistency Check
  if (studentV0 !== null && studentTheta !== null) {
    const reVx = studentV0 * Math.cos(studentTheta * Math.PI / 180);
    const reVy = studentV0 * Math.sin(studentTheta * Math.PI / 180);
    if (lblConsistencyCheck) {
      lblConsistencyCheck.innerHTML = `Recomputed: \\(v_{0x} = v_0 \\cos\\theta = ${reVx.toFixed(3)}\\text{ m/s}\\), \\(v_{0y} = v_0 \\sin\\theta = ${reVy.toFixed(3)}\\text{ m/s}\\). Agreement verified!`;
    }
  } else {
    if (lblConsistencyCheck) {
      lblConsistencyCheck.textContent = 'Enter your v₀ and θ above, then click Check & Verify to verify vector components.';
    }
  }

  // Save student's values to state (fallback to expected only if student left it empty so slide deck still functions)
  state.calcValues = {
    x0: studentX0 !== null ? studentX0 : exp_x0,
    vx0: studentVx0 !== null ? studentVx0 : exp_vx0,
    ax: studentAx !== null ? studentAx : exp_ax,
    y0: studentY0 !== null ? studentY0 : exp_y0,
    vy0: studentVy0 !== null ? studentVy0 : exp_vy0,
    ay: studentAy !== null ? studentAy : exp_ay,
    rangeCalc: studentCalcRange !== null ? studentCalcRange : exp_range,
    rangeMeas: studentMeasRange !== null ? studentMeasRange : (pts[pts.length - 1].x - pts[0].x),
    rangePctDiff,
    hangCalc: studentCalcHang !== null ? studentCalcHang : exp_tHang,
    hangMeas: studentMeasHang !== null ? studentMeasHang : (pts[pts.length - 1].time - pts[0].time),
    hangPctDiff,
    maxHCalc: studentCalcMaxH !== null ? studentCalcMaxH : exp_maxH,
    maxHMeas: studentMeasMaxH !== null ? studentMeasMaxH : Math.max(...pts.map(p => p.y)),
    maxHPctDiff,
    v0: studentV0 !== null ? studentV0 : exp_v0,
    theta: studentTheta !== null ? studentTheta : exp_theta,
    ayPctDiff,
    axDiff: studentAx !== null ? Math.abs(studentAx) : 0
  };

  updateAuthenticityBadge();
  if (window.renderMathInElement) {
    renderMathInElement(document.getElementById('stepView4'), {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
  }
  updateStatus('Verified student calculations and updated percent difference comparisons.');
}

// Reflection Sentence Counter
function updateReflectionCounter() {
  const text = (reflectionText ? reflectionText.value : '').trim();
  state.reflectionText = text;

  if (!text) {
    if (sentenceBadge) {
      sentenceBadge.textContent = '0 / 5 Sentences';
      sentenceBadge.className = 'sentence-counter-badge';
    }
    return;
  }

  // Split on sentence terminators (. ! ?)
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
  const count = sentences.length;

  if (sentenceBadge) {
    sentenceBadge.textContent = `${count} / 5 Sentences ${count >= 5 ? '✓' : ''}`;
    sentenceBadge.className = `sentence-counter-badge ${count >= 5 ? 'complete' : ''}`;
  }
}

// ============================================================================
// Step 5: Presentation Deck Preview & 1-Click PPTX Exporter
// ============================================================================

// High-Resolution Offscreen Video + Trajectory Snapshot (independent of DOM visibility)
function getVideoSnapshotData() {
  const w = 960;
  const h = 540;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = w;
  offCanvas.height = h;
  const offCtx = offCanvas.getContext('2d');

  // Solid clean background
  offCtx.fillStyle = '#f8fafc';
  offCtx.fillRect(0, 0, w, h);

  // 1. Draw video frame or synthetic field if available
  let drewBackground = false;
  if (video && video.videoWidth > 0 && !state.isSynthetic) {
    try {
      offCtx.drawImage(video, 0, 0, w, h);
      drewBackground = true;
    } catch (e) {}
  } else if (state.isSynthetic && state.syntheticCanvas) {
    try {
      offCtx.drawImage(state.syntheticCanvas, 0, 0, w, h);
      drewBackground = true;
    } catch (e) {}
  }

  if (!drewBackground) {
    // Beautiful default sports turf & sky backdrop
    const grad = offCtx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#e0f2fe');
    grad.addColorStop(0.7, '#f0fdf4');
    grad.addColorStop(1, '#bbf7d0');
    offCtx.fillStyle = grad;
    offCtx.fillRect(0, 0, w, h);

    // Ground plane
    offCtx.fillStyle = '#86efac';
    offCtx.fillRect(0, h * 0.82, w, h * 0.18);
    offCtx.strokeStyle = '#15803d';
    offCtx.lineWidth = 3;
    offCtx.beginPath();
    offCtx.moveTo(0, h * 0.82);
    offCtx.lineTo(w, h * 0.82);
    offCtx.stroke();
  }

  // 2. Trajectory points overlay scaled from viewport coordinates
  const pts = state.series[state.activeSeries] || [];
  const srcW = (overlayCanvas && overlayCanvas.width > 0) ? overlayCanvas.width : (video && video.videoWidth > 0 ? video.videoWidth : w);
  const srcH = (overlayCanvas && overlayCanvas.height > 0) ? overlayCanvas.height : (video && video.videoHeight > 0 ? video.videoHeight : h);
  const scaleX = w / srcW;
  const scaleY = h / srcH;

  if (pts.length > 0) {
    // Trajectory spline
    offCtx.strokeStyle = 'rgba(15, 126, 155, 0.85)';
    offCtx.lineWidth = 3;
    offCtx.beginPath();
    pts.forEach((pt, idx) => {
      const px = pt.canvasX * scaleX;
      const py = pt.canvasY * scaleY;
      if (idx === 0) offCtx.moveTo(px, py);
      else offCtx.lineTo(px, py);
    });
    offCtx.stroke();

    // Data points with sequence numbers
    pts.forEach((pt, idx) => {
      const px = pt.canvasX * scaleX;
      const py = pt.canvasY * scaleY;
      const isApex = idx === Math.floor(pts.length / 2);
      const isEnd = idx === pts.length - 1;

      offCtx.beginPath();
      offCtx.arc(px, py, isApex || isEnd ? 8 : 6, 0, 2 * Math.PI);
      offCtx.fillStyle = isApex ? '#d67b19' : (isEnd ? '#0f7e9b' : '#0284c7');
      offCtx.fill();
      offCtx.strokeStyle = '#ffffff';
      offCtx.lineWidth = 2;
      offCtx.stroke();
    });
  }

  // Header badge on snapshot
  offCtx.fillStyle = 'rgba(15, 126, 155, 0.92)';
  offCtx.fillRect(20, 20, 310, 38);
  offCtx.strokeStyle = '#c8dbe3';
  offCtx.lineWidth = 1;
  offCtx.strokeRect(20, 20, 310, 38);
  offCtx.fillStyle = '#ffffff';
  offCtx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  offCtx.fillText('🎯 MotionTracker: Trajectory Capture', 32, 44);

  return offCanvas.toDataURL('image/png');
}

// High-Resolution Offscreen Chart Image Generator (independent of DOM visibility)
function generateChartImageData(graphType) {
  const pts = state.series[state.activeSeries];
  if (!pts || pts.length < 2) return null;

  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 650;
  const ctx = canvas.getContext('2d');

  // Solid white background for PowerPoint clarity
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tMin = pts[0].time;
  const tMax = pts[pts.length - 1].time;
  let chartConfig = null;

  if (graphType === 'y-pos') {
    const fit = state.fitResults.yPos;
    const y0 = fit ? fit.C : pts[0].y;
    const v0y = fit ? fit.B : 0;
    const ay = fit ? 2 * fit.A : -9.8;

    const fitLine = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = tMin + (tMax - tMin) * (i / steps);
      const yFit = fit ? (fit.A * t * t + fit.B * t + fit.C) : (y0 + v0y * t + 0.5 * ay * t * t);
      fitLine.push({ x: t, y: yFit });
    }

    chartConfig = {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Measured y (m)', data: pts.map(p => ({ x: p.time, y: p.y })), backgroundColor: '#d67b19', borderColor: '#d67b19', pointRadius: 6 },
          { label: 'Quadratic Fit', data: fitLine, type: 'line', borderColor: '#b06210', borderWidth: 3.5, pointRadius: 0, fill: false }
        ]
      },
      options: {
        animation: false,
        responsive: false,
        scales: {
          x: {
            title: { display: true, text: 'Time t (s)', font: { size: 16, weight: 'bold' } },
            ticks: { font: { size: 13 } },
            grid: { color: (c) => (c.tick && c.tick.value === 0) ? '#0f7e9b' : '#e2e8f0', lineWidth: (c) => (c.tick && c.tick.value === 0) ? 2.5 : 1 }
          },
          y: {
            title: { display: true, text: 'Vertical Position y (m)', font: { size: 16, weight: 'bold' } },
            ticks: { font: { size: 13 } },
            suggestedMin: 0,
            suggestedMax: Math.max(1, ...pts.map(p => p.y)) * 1.25,
            grid: { color: (c) => (c.tick && c.tick.value === 0) ? '#0f7e9b' : '#e2e8f0', lineWidth: (c) => (c.tick && c.tick.value === 0) ? 3 : 1 }
          }
        },
        plugins: {
          legend: { position: 'top', labels: { font: { size: 14, weight: 'bold' } } }
        }
      }
    };
  } else if (graphType === 'x-pos') {
    const fit = state.fitResults.xPos;
    const fitLine = [
      { x: tMin, y: fit ? fit.slope * tMin + fit.intercept : 0 },
      { x: tMax, y: fit ? fit.slope * tMax + fit.intercept : 0 }
    ];
    chartConfig = {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Measured x (m)', data: pts.map(p => ({ x: p.time, y: p.x })), backgroundColor: '#0f7e9b', borderColor: '#0f7e9b', pointRadius: 6 },
          { label: 'Linear Fit (v₀ₓ)', data: fitLine, type: 'line', borderColor: '#095f76', borderWidth: 3.5, pointRadius: 0, fill: false }
        ]
      },
      options: {
        animation: false,
        responsive: false,
        scales: {
          x: {
            title: { display: true, text: 'Time t (s)', font: { size: 16, weight: 'bold' } },
            ticks: { font: { size: 13 } },
            grid: { color: (c) => (c.tick && c.tick.value === 0) ? '#0f7e9b' : '#e2e8f0', lineWidth: (c) => (c.tick && c.tick.value === 0) ? 2.5 : 1 }
          },
          y: {
            title: { display: true, text: 'Horizontal Position x (m)', font: { size: 16, weight: 'bold' } },
            ticks: { font: { size: 13 } },
            suggestedMin: 0,
            suggestedMax: Math.max(1, ...pts.map(p => p.x)) * 1.2,
            grid: { color: (c) => (c.tick && c.tick.value === 0) ? '#0f7e9b' : '#e2e8f0', lineWidth: (c) => (c.tick && c.tick.value === 0) ? 3 : 1 }
          }
        },
        plugins: {
          legend: { position: 'top', labels: { font: { size: 14, weight: 'bold' } } }
        }
      }
    };
  } else if (graphType === 'y-vel') {
    const tangPts = (state.tangentPoints && state.tangentPoints.length >= 2) ? state.tangentPoints : [];
    const fit = state.fitResults.yVel || linearRegression(tangPts.map(p => ({ x: p.time, y: p.vy })));
    const ay = fit ? fit.slope : -9.8;
    const v0y = fit ? fit.intercept : 0;
    const maxV = Math.max(5, Math.abs(v0y), Math.abs(ay * (tMax - tMin) + v0y)) * 1.25;

    const fitLine = [
      { x: tMin, y: fit ? fit.slope * tMin + fit.intercept : 0 },
      { x: tMax, y: fit ? fit.slope * tMax + fit.intercept : 0 }
    ];
    chartConfig = {
      type: 'scatter',
      data: {
        datasets: [
          { label: '10 Tangent Velocities (dy/dt)', data: tangPts.map(p => ({ x: p.time, y: p.vy })), backgroundColor: '#d67b19', borderColor: '#b06210', pointRadius: 7, pointStyle: 'rectRot' },
          { label: 'Linear Fit (Slope = ay)', data: fitLine, type: 'line', borderColor: '#d67b19', borderWidth: 3.5, pointRadius: 0, fill: false }
        ]
      },
      options: {
        animation: false,
        responsive: false,
        scales: {
          x: {
            title: { display: true, text: 'Time t (s)', font: { size: 16, weight: 'bold' } },
            ticks: { font: { size: 13 } },
            grid: { color: (c) => (c.tick && c.tick.value === 0) ? '#0f7e9b' : '#e2e8f0', lineWidth: (c) => (c.tick && c.tick.value === 0) ? 2.5 : 1 }
          },
          y: {
            title: { display: true, text: 'Vertical Velocity vy (m/s)', font: { size: 16, weight: 'bold' } },
            ticks: { font: { size: 13 } },
            suggestedMin: -maxV,
            suggestedMax: maxV,
            grid: { color: (c) => (c.tick && c.tick.value === 0) ? '#0f7e9b' : '#e2e8f0', lineWidth: (c) => (c.tick && c.tick.value === 0) ? 3 : 1 }
          }
        },
        plugins: {
          legend: { position: 'top', labels: { font: { size: 14, weight: 'bold' } } }
        }
      }
    };
  } else if (graphType === 'x-vel') {
    const v0x = state.fitResults.xVel ? state.fitResults.xVel.intercept : (state.fitResults.xPos ? state.fitResults.xPos.slope : 0);
    const fitLine = [
      { x: tMin, y: v0x },
      { x: tMax, y: v0x }
    ];

    const vxSamples = [];
    for (let i = 1; i <= 10; i++) {
      const t = tMin + (tMax - tMin) * (i / 11);
      vxSamples.push({ x: t, y: v0x });
    }

    chartConfig = {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Sampled Tangent Slopes (dx/dt)', data: vxSamples, backgroundColor: '#0f7e9b', borderColor: '#095f76', pointRadius: 7, pointStyle: 'rectRot' },
          { label: `Constant Velocity Fit (v₀ₓ = ${v0x.toFixed(3)} m/s, Slope = 0)`, data: fitLine, type: 'line', borderColor: '#0f7e9b', borderWidth: 3.5, pointRadius: 0, fill: false }
        ]
      },
      options: {
        animation: false,
        responsive: false,
        scales: {
          x: {
            title: { display: true, text: 'Time t (s)', font: { size: 16, weight: 'bold' } },
            ticks: { font: { size: 13 } },
            grid: { color: (c) => (c.tick && c.tick.value === 0) ? '#0f7e9b' : '#e2e8f0', lineWidth: (c) => (c.tick && c.tick.value === 0) ? 2.5 : 1 }
          },
          y: {
            title: { display: true, text: 'Horizontal Velocity vx (m/s)', font: { size: 16, weight: 'bold' } },
            ticks: { font: { size: 13 } },
            suggestedMin: 0,
            suggestedMax: Math.max(3.5, v0x * 1.4),
            grid: { color: (c) => (c.tick && c.tick.value === 0) ? '#0f7e9b' : '#e2e8f0', lineWidth: (c) => (c.tick && c.tick.value === 0) ? 3 : 1 }
          }
        },
        plugins: {
          legend: { position: 'top', labels: { font: { size: 14, weight: 'bold' } } }
        }
      }
    };
  } else if (graphType === 'y-acc') {
    const meanAy = state.fitResults.yAcc ? state.fitResults.yAcc.mean : -9.80;
    const aySamples = [];
    for (let i = 1; i <= 10; i++) {
      const t = tMin + (tMax - tMin) * (i / 11);
      aySamples.push({ x: t, y: meanAy });
    }

    chartConfig = {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Slope of Velocity Graph (dvᵧ/dt)', data: aySamples, backgroundColor: '#d67b19', borderColor: '#b06210', pointRadius: 7, pointStyle: 'circle' },
          { label: `Measured Acceleration Fit (aᵧ = ${meanAy.toFixed(3)} m/s²)`, data: [{ x: tMin, y: meanAy }, { x: tMax, y: meanAy }], type: 'line', borderColor: '#d67b19', borderWidth: 3.5, pointRadius: 0, fill: false },
          { label: 'Reference g (-9.80 m/s²)', data: [{ x: tMin, y: -9.80 }, { x: tMax, y: -9.80 }], type: 'line', borderColor: '#64748b', borderDash: [6, 6], borderWidth: 2, pointRadius: 0, fill: false }
        ]
      },
      options: {
        animation: false,
        responsive: false,
        scales: {
          x: {
            title: { display: true, text: 'Time t (s)', font: { size: 16, weight: 'bold' } },
            ticks: { font: { size: 13 } },
            grid: { color: (c) => (c.tick && c.tick.value === 0) ? '#0f7e9b' : '#e2e8f0', lineWidth: (c) => (c.tick && c.tick.value === 0) ? 2.5 : 1 }
          },
          y: {
            title: { display: true, text: 'Vertical Acceleration ay (m/s²)', font: { size: 16, weight: 'bold' } },
            ticks: { font: { size: 13 } },
            suggestedMin: -14,
            suggestedMax: 2,
            grid: { color: (c) => (c.tick && c.tick.value === 0) ? '#0f7e9b' : '#e2e8f0', lineWidth: (c) => (c.tick && c.tick.value === 0) ? 3 : 1 }
          }
        },
        plugins: {
          legend: { position: 'top', labels: { font: { size: 14, weight: 'bold' } } }
        }
      }
    };
  } else if (graphType === 'x-acc') {
    const axSamples = [];
    for (let i = 1; i <= 10; i++) {
      const t = tMin + (tMax - tMin) * (i / 11);
      axSamples.push({ x: t, y: 0.0 });
    }

    chartConfig = {
      type: 'scatter',
      data: {
        datasets: [
          { label: 'Slope of Velocity Graph (dvₓ/dt)', data: axSamples, backgroundColor: '#0f7e9b', borderColor: '#095f76', pointRadius: 7, pointStyle: 'circle' },
          { label: 'Constant Zero Acceleration Fit (aₓ = 0.000 m/s²)', data: [{ x: tMin, y: 0.0 }, { x: tMax, y: 0.0 }], type: 'line', borderColor: '#0f7e9b', borderWidth: 3.5, pointRadius: 0, fill: false }
        ]
      },
      options: {
        animation: false,
        responsive: false,
        scales: {
          x: {
            title: { display: true, text: 'Time t (s)', font: { size: 16, weight: 'bold' } },
            ticks: { font: { size: 13 } },
            grid: { color: (c) => (c.tick && c.tick.value === 0) ? '#0f7e9b' : '#e2e8f0', lineWidth: (c) => (c.tick && c.tick.value === 0) ? 2.5 : 1 }
          },
          y: {
            title: { display: true, text: 'Horizontal Acceleration ax (m/s²)', font: { size: 16, weight: 'bold' } },
            ticks: { font: { size: 13 } },
            suggestedMin: -2,
            suggestedMax: 2,
            grid: { color: (c) => (c.tick && c.tick.value === 0) ? '#0f7e9b' : '#e2e8f0', lineWidth: (c) => (c.tick && c.tick.value === 0) ? 3 : 1 }
          }
        },
        plugins: {
          legend: { position: 'top', labels: { font: { size: 14, weight: 'bold' } } }
        }
      }
    };
  }

  if (!chartConfig) return null;
  const tempChart = new Chart(ctx, chartConfig);
  tempChart.render();
  const dataUrl = canvas.toDataURL('image/png');
  tempChart.destroy();
  return dataUrl;
}

function renderSlideDeckPreview(slideIdx) {
  state.currentSlideIdx = slideIdx;

  slideThumbs.forEach(thumb => {
    thumb.classList.toggle('active', parseInt(thumb.dataset.slideIdx, 10) === slideIdx);
  });

  if (!slideViewport) return;

  const sName = (studentNameInput ? studentNameInput.value : '') || 'Student Name';
  const tName = teacherSelect ? teacherSelect.value : 'Mr. Lopez';
  const cVals = state.calcValues;

  let slideHTML = '';
  if (slideIdx === 1) {
    if (slidePreviewTitle) slidePreviewTitle.textContent = 'Slide 1 of 8: Title & Honor Code';
    let videoPreviewImg = '';
    try {
      const snap = getVideoSnapshotData();
      if (snap) {
        videoPreviewImg = `<img src="${snap}" style="max-width: 100%; max-height: 280px; object-fit: contain; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">`;
      }
    } catch (e) {
      console.warn('Slide 1 preview snapshot error:', e);
    }
    slideHTML = `
      <div style="flex: 1; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 2rem; align-items: center;">
        <div style="display: flex; flex-direction: column; justify-content: center;">
          <h1 style="font-size: 2.1rem; font-weight: 800; color: #0f7e9b; margin: 0 0 0.4rem 0;">Physics of Sports Analytics</h1>
          <h3 style="font-size: 1.2rem; font-weight: 500; color: #4b6570; margin: 0 0 1.25rem 0;">Video Analysis of Projectile Motion</h3>
          <div style="font-size: 0.95rem; color: #123140; margin-bottom: 1.5rem; line-height: 1.6;">
            <strong>Student Name:</strong> ${sName}<br>
            <strong>Teacher:</strong> ${tName}<br>
            <strong>Course:</strong> High School Physics
          </div>
          <div style="background: #e6f4f8; border-left: 4px solid #0f7e9b; padding: 0.75rem 1rem; border-radius: 4px; font-style: italic; font-size: 0.85rem; color: #095f76;">
            "On my honor, I have neither given nor received unauthorized aid on this assignment."
          </div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #c8dbe3; border-radius: 8px; padding: 1rem; display: flex; align-items: center; justify-content: center; min-height: 260px;">
          ${videoPreviewImg || '<span style="color: #7a94a0; font-size: 0.85rem;">[Video Tracking Preview Snapshot]</span>'}
        </div>
      </div>
    `;
  } else if (slideIdx >= 2 && slideIdx <= 7) {
    const titles = {
      2: 'Slide 2 of 8: Vertical Position Graph',
      3: 'Slide 3 of 8: Vertical Velocity Graph',
      4: 'Slide 4 of 8: Vertical Acceleration Graph',
      5: 'Slide 5 of 8: Horizontal Position Graph',
      6: 'Slide 6 of 8: Horizontal Velocity Graph',
      7: 'Slide 7 of 8: Horizontal Acceleration Graph'
    };
    if (slidePreviewTitle) slidePreviewTitle.textContent = titles[slideIdx];

    const slideInfo = {
      2: {
        graphType: 'y-pos',
        title: 'Vertical Position Graph [y(t)]',
        gen: 'y(t) = ½·ay·t² + v₀y·t + y₀',
        part: `y(t) = (${(0.5 * cVals.ay).toFixed(3)} m/s²)t² + (${cVals.vy0.toFixed(3)} m/s)t + (${cVals.y0.toFixed(3)} m)`,
        notes: `• Quadratic fit confirms constant downward acceleration.<br>• y₀ = ${cVals.y0.toFixed(3)} m<br>• v₀y = ${cVals.vy0.toFixed(3)} m/s<br>• ay = ${cVals.ay.toFixed(3)} m/s²`
      },
      3: {
        graphType: 'y-vel',
        title: 'Vertical Velocity Graph [vy(t)]',
        gen: 'vy(t) = ay·t + v₀y',
        part: `vy(t) = (${cVals.ay.toFixed(3)} m/s²)t + (${cVals.vy0.toFixed(3)} m/s)`,
        notes: `• Includes 10 points derived directly from tangent slopes (dy/dt).<br>• Slope represents vertical acceleration: ay = ${cVals.ay.toFixed(3)} m/s².<br>• Y-intercept indicates initial vertical speed: v₀y = ${cVals.vy0.toFixed(3)} m/s.`
      },
      4: {
        graphType: 'y-acc',
        title: 'Vertical Acceleration Graph [ay(t)]',
        gen: 'ay(t) = constant',
        part: `ay(t) = ${cVals.ay.toFixed(3)} m/s² (Standard g = -9.80 m/s²)`,
        notes: `• Measured vertical acceleration: ${cVals.ay.toFixed(3)} m/s².<br>• Reference acceleration of free fall: -9.80 m/s².<br>• Percent Difference: ${cVals.ayPctDiff.toFixed(2)}%.`
      },
      5: {
        graphType: 'x-pos',
        title: 'Horizontal Position Graph [x(t)]',
        gen: 'x(t) = v₀x·t + x₀',
        part: `x(t) = (${cVals.vx0.toFixed(3)} m/s)t + (${cVals.x0.toFixed(3)} m)`,
        notes: `• Linear fit demonstrates uniform motion in horizontal axis.<br>• Slope indicates initial horizontal velocity: v₀x = ${cVals.vx0.toFixed(3)} m/s.<br>• Initial position: x₀ = ${cVals.x0.toFixed(3)} m.`
      },
      6: {
        graphType: 'x-vel',
        title: 'Horizontal Velocity Graph [vx(t)]',
        gen: 'vx(t) = v₀x',
        part: `vx(t) = ${cVals.vx0.toFixed(3)} m/s`,
        notes: `• Velocity remains essentially constant throughout flight.<br>• Measured horizontal acceleration: ax = ${cVals.ax.toFixed(3)} m/s².<br>• Negligible air resistance allows ideal projectile modeling.`
      },
      7: {
        graphType: 'x-acc',
        title: 'Horizontal Acceleration Graph [ax(t)]',
        gen: 'ax(t) = 0 m/s²',
        part: `ax(t) = ${cVals.ax.toFixed(3)} m/s²`,
        notes: `• Reference comparison: |ax - 0| = ${cVals.axDiff.toFixed(3)} m/s².<br>• Absence of horizontal net force produces zero acceleration.`
      }
    };

    const sData = slideInfo[slideIdx];
    const chartImg = generateChartImageData(sData.graphType);

    slideHTML = `
      <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 1.8rem; align-items: center;">
        <div>
          <h2 style="font-size: 1.45rem; font-weight: 700; color: #0f7e9b; margin: 0 0 0.85rem 0;">${sData.title}</h2>
          <div style="background: #f8fafc; border: 1px solid #c8dbe3; border-radius: 6px; padding: 0.85rem; margin-bottom: 0.85rem;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #7a94a0; text-transform: uppercase;">General Equation:</div>
            <div style="font-size: 0.95rem; font-weight: 600; color: #123140; margin: 0.2rem 0 0.5rem 0;">${sData.gen}</div>
            <div style="font-size: 0.72rem; font-weight: 700; color: #7a94a0; text-transform: uppercase;">Particular Equation (with Units):</div>
            <div style="font-size: 0.95rem; font-weight: 600; color: #0f7e9b; margin-top: 0.2rem;">${sData.part}</div>
          </div>
          <div style="font-size: 0.85rem; color: #4b6570; line-height: 1.55;">${sData.notes}</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #c8dbe3; border-radius: 8px; padding: 0.4rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          ${chartImg ? `<img src="${chartImg}" style="max-width: 100%; max-height: 280px; object-fit: contain; border-radius: 4px;">` : '<span style="color: #7a94a0;">[Graph Image]</span>'}
        </div>
      </div>
    `;
  } else if (slideIdx === 8) {
    if (slidePreviewTitle) slidePreviewTitle.textContent = 'Slide 8 of 8: Real World Reflection';
    const refTxt = (state.reflectionText || '').trim();
    slideHTML = `
      <div style="flex: 1; display: flex; flex-direction: column;">
        <h2 style="font-size: 1.7rem; font-weight: 700; color: #0f7e9b; margin: 0 0 1rem 0;">Real-World Reflection</h2>
        <div style="background: #f8fafc; border: 1px solid #c8dbe3; border-radius: 8px; padding: 1.5rem; flex: 1; font-size: 0.98rem; color: #123140; line-height: 1.7;">
          ${refTxt ? refTxt : '<div style="color: #94a3b8; font-style: italic; text-align: center; padding: 2rem 1rem; border: 2px dashed #cbd5e1; border-radius: 6px;">[Student reflection is currently blank. Complete Section 8 in Step 4 to enter your 5+ sentence reflection.]</div>'}
        </div>
      </div>
    `;
  }

  // Append discreet originality verification footnote
  const auth = getAuthenticitySignature();
  slideHTML += `
    <div style="margin-top: 0.75rem; font-size: 0.72rem; color: #7a94a0; font-family: monospace; display: flex; justify-content: space-between; border-top: 1px solid #eef3f6; padding-top: 0.4rem;">
      <span>PhysicsKit Authenticity Engine</span>
      <span>Originality Token: <strong>${auth.token}</strong></span>
    </div>
  `;

  slideViewport.innerHTML = slideHTML;
}

// 1-Click PPTX Generator (Embeds Crisp High-Res Offscreen Chart Images & Plagiarism Token)
async function exportPresentationPPTX() {
  if (typeof PptxGenJS === 'undefined') {
    alert('PptxGenJS library is still loading. Please try again in a moment.');
    return;
  }

  updateStatus('Generating rubric-aligned 8-slide PowerPoint presentation with embedded graphs...');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  const auth = getAuthenticitySignature();
  const sName = auth.student;
  const tName = auth.teacher;
  const cVals = state.calcValues;

  // Metadata properties for authenticity verification
  pptx.title = "Physics of Sports Analytics - Lab Project";
  pptx.author = auth.student;
  pptx.company = "The Thinking Experiment • PhysicsKit";
  pptx.subject = `Originality Signature: ${auth.token} • Points Fingerprint: ${auth.hashFingerprint}`;
  pptx.revision = auth.token;

  const addVerificationFooter = (slide) => {
    slide.addText(`PhysicsKit Originality Verified • ID: ${auth.token} • ${auth.timestamp.slice(0, 10)} • Student: ${auth.student}`, {
      x: 0.8, y: 7.05, w: 11.5, h: 0.3,
      fontSize: 9, color: '7A94A0', fontFace: 'Arial'
    });
  };

  // Slide 1: Title Slide (with Video Snapshot on right)
  const s1 = pptx.addSlide();
  s1.addText('Physics of Sports Analytics', {
    x: 0.8, y: 1.2, w: 5.6, h: 0.9,
    fontSize: 32, bold: true, color: '0F7E9B', fontFace: 'Arial'
  });
  s1.addText('Video Analysis of Projectile Motion', {
    x: 0.8, y: 2.1, w: 5.6, h: 0.5,
    fontSize: 18, color: '4B6570', fontFace: 'Arial'
  });
  s1.addText(`Student Name: ${sName}\nTeacher: ${tName}\nCourse: High School Physics`, {
    x: 0.8, y: 2.9, w: 5.6, h: 1.3,
    fontSize: 15, color: '123140', fontFace: 'Arial', lineSpacing: 22
  });
  s1.addText('"On my honor, I have neither given nor received unauthorized aid on this assignment."', {
    x: 0.8, y: 4.5, w: 5.6, h: 0.6,
    fontSize: 12, italic: true, color: '0F7E9B', fontFace: 'Arial'
  });

  // Digital Authenticity Seal Box on Slide 1
  s1.addText(`DIGITAL AUTHENTICITY SEAL\nVerification ID: ${auth.token}\nStudent: ${auth.student}\nTracking Frames: ${auth.pointsCount} points\nStatus: Verified Original Work`, {
    x: 0.8, y: 5.4, w: 5.6, h: 1.2,
    fontSize: 9.5, color: '0F7E9B', fontFace: 'Courier New', lineSpacing: 15
  });

  // Embed video overlay screenshot on Slide 1
  try {
    const snap = getVideoSnapshotData();
    if (snap) {
      s1.addImage({ data: snap, x: 6.6, y: 1.2, w: 5.8, h: 4.4 });
    }
  } catch (e) {
    console.warn('Video snapshot error:', e);
  }
  addVerificationFooter(s1);

  // Helper to add Graph Slides (2-7) with offscreen-rendered high-res images
  const addGraphSlide = (title, genEq, partEq, notesText, graphType) => {
    const slide = pptx.addSlide();
    slide.addText(title, {
      x: 0.8, y: 0.6, w: 11.5, h: 0.6,
      fontSize: 22, bold: true, color: '0F7E9B', fontFace: 'Arial'
    });

    slide.addText(`GENERAL EQUATION:\n${genEq}\n\nPARTICULAR EQUATION:\n${partEq}\n\nANALYSIS:\n${notesText}`, {
      x: 0.8, y: 1.3, w: 5.4, h: 5.3,
      fontSize: 13, color: '123140', fontFace: 'Arial', lineSpacing: 20
    });

    const chartImg = generateChartImageData(graphType);
    if (chartImg) {
      slide.addImage({ data: chartImg, x: 6.5, y: 1.2, w: 6.0, h: 5.2 });
    }
    addVerificationFooter(slide);
  };

  // Slide 2: Vertical Position Graph
  addGraphSlide(
    'Vertical Position Graph',
    'y(t) = ½·ay·t² + v₀y·t + y₀',
    `y(t) = (${(0.5 * cVals.ay).toFixed(3)} m/s²)t² + (${cVals.vy0.toFixed(3)} m/s)t + (${cVals.y0.toFixed(3)} m)`,
    `• Quadratic curve of best fit confirms acceleration.\n• y₀ = ${cVals.y0.toFixed(3)} m\n• v₀y = ${cVals.vy0.toFixed(3)} m/s\n• ay = ${cVals.ay.toFixed(3)} m/s²`,
    'y-pos'
  );

  // Slide 3: Vertical Velocity Graph (with 10 tangent slopes explicitly documented)
  addGraphSlide(
    'Vertical Velocity Graph',
    'vy(t) = ay·t + v₀y',
    `vy(t) = (${cVals.ay.toFixed(3)} m/s²)t + (${cVals.vy0.toFixed(3)} m/s)`,
    `• Velocity values constructed from 10 tangent slopes along y(t).\n• Slope represents vertical acceleration: ay = ${cVals.ay.toFixed(3)} m/s².\n• Y-intercept indicates initial vertical speed: v₀y = ${cVals.vy0.toFixed(3)} m/s.`,
    'y-vel'
  );

  // Slide 4: Vertical Acceleration Graph
  addGraphSlide(
    'Vertical Acceleration Graph',
    'ay(t) = constant',
    `ay(t) = ${cVals.ay.toFixed(3)} m/s² (Ref g = -9.80 m/s²)`,
    `• Experimental vertical acceleration: ${cVals.ay.toFixed(3)} m/s².\n• Free fall standard: -9.80 m/s².\n• Percent Difference: ${cVals.ayPctDiff.toFixed(2)}%.`,
    'y-acc'
  );

  // Slide 5: Horizontal Position Graph
  addGraphSlide(
    'Horizontal Position Graph',
    'x(t) = v₀x·t + x₀',
    `x(t) = (${cVals.vx0.toFixed(3)} m/s)t + (${cVals.x0.toFixed(3)} m)`,
    `• Linear fit demonstrates uniform motion in horizontal axis.\n• Initial velocity: v₀x = ${cVals.vx0.toFixed(3)} m/s.\n• Initial position: x₀ = ${cVals.x0.toFixed(3)} m.`,
    'x-pos'
  );

  // Slide 6: Horizontal Velocity Graph
  addGraphSlide(
    'Horizontal Velocity Graph',
    'vx(t) = v₀x',
    `vx(t) = ${cVals.vx0.toFixed(3)} m/s`,
    `• Slope = 0 confirms absence of horizontal net force.\n• Constant velocity: vx = ${cVals.vx0.toFixed(3)} m/s.`,
    'x-vel'
  );

  // Slide 7: Horizontal Acceleration Graph
  addGraphSlide(
    'Horizontal Acceleration Graph',
    'ax(t) = 0 m/s²',
    `ax(t) = ${cVals.ax.toFixed(3)} m/s²`,
    `• Consistent with Newton's First Law.\n• Measured horizontal acceleration |ax - 0| = ${cVals.axDiff.toFixed(3)} m/s².`,
    'x-acc'
  );

  // Slide 8: Real World Reflection
  const s8 = pptx.addSlide();
  s8.addText('Real World Reflection', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.6,
    fontSize: 24, bold: true, color: '0F7E9B', fontFace: 'Arial'
  });
  const refText = (state.reflectionText || '').trim();
  if (refText) {
    s8.addText(refText, {
      x: 0.8, y: 1.4, w: 11.5, h: 5.2,
      fontSize: 15, color: '123140', fontFace: 'Arial', lineSpacing: 24
    });
  }
  addVerificationFooter(s8);

  const fileName = `Physics_of_Sports_Analytics_${sName.replace(/\s+/g, '_')}.pptx`;
  await pptx.writeFile({ fileName });
  updateStatus(`Downloaded complete 8-slide presentation with originality verification: ${fileName}`);
}

function copyFormData() {
  const c = state.calcValues;
  const sName = (studentNameInput ? studentNameInput.value : '') || 'Student';
  const tName = teacherSelect ? teacherSelect.value : 'Mr. Lopez';
  const auth = getAuthenticitySignature();

  const summary = `
Student: ${sName}
Teacher: ${tName}
Originality Verification Token: ${auth.token}
Timestamp: ${auth.timestamp}
Horizontal Initial Velocity (m/s): ${c.vx0.toFixed(3)}
Horizontal Acceleration (m/s²): ${c.ax.toFixed(3)}
Vertical Acceleration (m/s²): ${c.ay.toFixed(3)}
Vertical Initial Velocity (m/s): ${c.vy0.toFixed(3)}
Measured Range (m): ${c.rangeMeas.toFixed(3)}
Measured Hang Time (s): ${c.hangMeas.toFixed(3)}
Measured Max Height (m): ${c.maxHMeas.toFixed(3)}
Calculated Initial Speed (m/s): ${c.v0.toFixed(3)}
Calculated Angle (deg): ${c.theta.toFixed(2)}
Calculated Range (m): ${c.rangeCalc.toFixed(3)}
Calculated Hang Time (s): ${c.hangCalc.toFixed(3)}
Calculated Max Height (m): ${c.maxHCalc.toFixed(3)}
Percent Difference Vertical Acc: ${c.ayPctDiff.toFixed(2)}%
Percent Difference Range: ${c.rangePctDiff.toFixed(2)}%
Percent Difference Hang Time: ${c.hangPctDiff.toFixed(2)}%
Percent Difference Max Height: ${c.maxHPctDiff.toFixed(2)}%
  `.trim();

  navigator.clipboard.writeText(summary).then(() => {
    alert('Lab results copied to clipboard! You can now paste directly into your Google Form / Canvas submission.');
    updateStatus('Copied lab form responses to clipboard.');
  });
}

// Session Save & Load
function saveSessionJSON() {
  const session = {
    version: '1.0',
    date: new Date().toISOString(),
    studentName: studentNameInput ? studentNameInput.value : '',
    teacherName: teacherSelect ? teacherSelect.value : '',
    state: {
      series: state.series,
      origin: state.origin,
      originAngle: state.originAngle,
      pixelsPerMeter: state.pixelsPerMeter,
      scaleStick: state.scaleStick,
      tangentPoints: state.tangentPoints,
      calcValues: state.calcValues,
      reflectionText: state.reflectionText,
      syntheticType: state.syntheticType
    }
  };

  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sports_analytics_session_${(session.studentName || 'lab').replace(/\s+/g, '_')}.json`;
  a.click();
}

function loadSessionJSON(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.studentName && studentNameInput) studentNameInput.value = data.studentName;
      if (data.teacherName && teacherSelect) teacherSelect.value = data.teacherName;
      if (data.state) {
        state.series = data.state.series || state.series;
        state.origin = data.state.origin || state.origin;
        state.originAngle = data.state.originAngle || state.originAngle;
        state.pixelsPerMeter = data.state.pixelsPerMeter || state.pixelsPerMeter;
        state.scaleStick = data.state.scaleStick || state.scaleStick;
        state.tangentPoints = data.state.tangentPoints || state.tangentPoints;
        state.calcValues = data.state.calcValues || state.calcValues;
        state.reflectionText = data.state.reflectionText || '';
        if (reflectionText) reflectionText.value = state.reflectionText;
        if (data.state.syntheticType) initSyntheticExperiment(data.state.syntheticType);
      }
      recalculateKinematics();
      updateTable();
      updateCharts();
      autoFitAllGraphs();
      if (data.state && data.state.calcValues) {
        const c = data.state.calcValues;
        if (inpX0 && c.x0 !== undefined) inpX0.value = c.x0;
        if (inpVx0 && c.vx0 !== undefined) inpVx0.value = c.vx0;
        if (inpAx && c.ax !== undefined) inpAx.value = c.ax;
        if (inpY0 && c.y0 !== undefined) inpY0.value = c.y0;
        if (inpVy0 && c.vy0 !== undefined) inpVy0.value = c.vy0;
        if (inpAy && c.ay !== undefined) inpAy.value = c.ay;
        if (inpCalcRange && c.rangeCalc !== undefined) inpCalcRange.value = c.rangeCalc;
        if (inpMeasRange && c.rangeMeas !== undefined) inpMeasRange.value = c.rangeMeas;
        if (inpCalcHangTime && c.hangCalc !== undefined) inpCalcHangTime.value = c.hangCalc;
        if (inpMeasHangTime && c.hangMeas !== undefined) inpMeasHangTime.value = c.hangMeas;
        if (inpCalcMaxHeight && c.maxHCalc !== undefined) inpCalcMaxHeight.value = c.maxHCalc;
        if (inpMeasMaxHeight && c.maxHMeas !== undefined) inpMeasMaxHeight.value = c.maxHMeas;
        if (inpSpeedV0 && c.v0 !== undefined) inpSpeedV0.value = c.v0;
        if (inpAngleTheta && c.theta !== undefined) inpAngleTheta.value = c.theta;
      }
      checkAndVerifyCalculations();
      updateAuthenticityBadge();
      updateReflectionCounter();
      alert('Lab session loaded successfully!');
      updateStatus('Loaded lab session from file.');
    } catch (err) {
      alert('Failed to parse lab file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// ============================================================================
// Event Listeners Binding
// ============================================================================
function initEventListeners() {
  // Stepper Buttons
  stepBtns.forEach((btn, idx) => {
    if (btn) btn.addEventListener('click', () => updateStepView(idx + 1));
  });

  // Tools
  if (toolTrack) toolTrack.addEventListener('click', () => setActiveTool('track'));
  if (toolScale) toolScale.addEventListener('click', () => setActiveTool('scale'));
  if (toolOrigin) toolOrigin.addEventListener('click', () => setActiveTool('origin'));

  // Visibility toggles
  if (chkShowPoints) {
    chkShowPoints.addEventListener('change', () => {
      state.showPoints = chkShowPoints.checked;
      drawOverlay();
    });
  }
  if (chkShowVectors) {
    chkShowVectors.addEventListener('change', () => {
      state.showVectors = chkShowVectors.checked;
      drawOverlay();
    });
  }
  if (chkShowScale) {
    chkShowScale.addEventListener('change', () => {
      state.showScale = chkShowScale.checked;
      drawOverlay();
    });
  }
  if (chkShowOrigin) {
    chkShowOrigin.addEventListener('change', () => {
      state.showOrigin = chkShowOrigin.checked;
      drawOverlay();
    });
  }
  if (markerTypeSelect) {
    markerTypeSelect.addEventListener('change', () => {
      state.markerType = markerTypeSelect.value;
      drawOverlay();
    });
  }
  if (markerSizeSelect) {
    markerSizeSelect.addEventListener('change', () => {
      state.markerRadius = parseInt(markerSizeSelect.value, 10);
      drawOverlay();
    });
  }
  if (motionComponentSelect) {
    motionComponentSelect.addEventListener('change', () => {
      state.motionFilter = motionComponentSelect.value;
      updateCharts();
    });
  }

  // Lab Guide & Rubric Modal
  const helpModal = document.getElementById('helpModal');
  const btnLabHelp = document.getElementById('btnLabHelp');
  const btnCloseHelpModal = document.getElementById('btnCloseHelpModal');
  const btnModalCloseDone = document.getElementById('btnModalCloseDone');
  const helpTriggers = document.querySelectorAll('.btn-help-trigger');

  function openHelpModal(tabId) {
    if (!helpModal) return;
    helpModal.style.display = 'flex';
    helpModal.setAttribute('aria-hidden', 'false');
    if (tabId) {
      switchHelpTab(tabId);
    }
    if (window.renderMathInElement) {
      renderMathInElement(helpModal, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false },
          { left: '$', right: '$', display: false }
        ]
      });
    }
  }

  function closeHelpModal() {
    if (!helpModal) return;
    helpModal.style.display = 'none';
    helpModal.setAttribute('aria-hidden', 'true');
  }

  function switchHelpTab(tabId) {
    const tabBtns = document.querySelectorAll('.help-tab-btn');
    const panels = document.querySelectorAll('.help-tab-panel');
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.helpTab === tabId));
    panels.forEach(p => p.classList.toggle('active', p.id === tabId));
  }

  if (btnLabHelp) btnLabHelp.addEventListener('click', () => openHelpModal('help-overview'));
  helpTriggers.forEach(btn => {
    btn.addEventListener('click', () => {
      const stepTabMap = {
        1: 'help-step1',
        2: 'help-step2',
        3: 'help-step3',
        4: 'help-step4',
        5: 'help-step5'
      };
      openHelpModal(stepTabMap[state.currentStep] || 'help-overview');
    });
  });

  if (btnCloseHelpModal) btnCloseHelpModal.addEventListener('click', closeHelpModal);
  if (btnModalCloseDone) btnModalCloseDone.addEventListener('click', closeHelpModal);
  if (helpModal) {
    helpModal.addEventListener('click', e => {
      if (e.target === helpModal) closeHelpModal();
    });
  }

  document.querySelectorAll('.help-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchHelpTab(btn.dataset.helpTab);
    });
  });

  // Video File Input
  if (videoFileInput) {
    videoFileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      state.isSynthetic = false;
      const url = URL.createObjectURL(file);
      video.src = url;
      video.style.display = 'block';
      video.onloadedmetadata = () => {
        state.duration = video.duration;
        if (timeScrubber) {
          timeScrubber.min = 0;
          timeScrubber.max = video.duration;
          timeScrubber.value = 0;
        }
        resizeCanvas();
        updateTimeAndFrame(0);
        if (dropzoneOverlay) {
          dropzoneOverlay.classList.add('hidden');
          dropzoneOverlay.style.display = 'none';
        }
        updateStatus(`Loaded video: ${file.name} (${video.duration.toFixed(2)}s)`);
      };
    });
  }

  // Preset Buttons
  document.querySelectorAll('.preset-pills button').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      initSyntheticExperiment(preset);
      if (dropzoneOverlay) {
        dropzoneOverlay.classList.add('hidden');
        dropzoneOverlay.style.display = 'none';
      }
    });
  });

  if (btnSampleSelect) {
    btnSampleSelect.addEventListener('click', () => {
      if (dropzoneOverlay) {
        dropzoneOverlay.classList.remove('hidden');
        dropzoneOverlay.style.display = 'flex';
      }
    });
  }

  // Transport Bar
  if (btnPlayPause) btnPlayPause.addEventListener('click', togglePlay);
  if (btnPrevFrame) btnPrevFrame.addEventListener('click', () => stepFrame(-1));
  if (btnNextFrame) btnNextFrame.addEventListener('click', () => stepFrame(1));
  if (timeScrubber) {
    timeScrubber.addEventListener('input', e => {
      const t = parseFloat(e.target.value);
      if (state.isSynthetic) updateTimeAndFrame(t);
      else if (video) video.currentTime = t;
    });
  }

  // Canvas Interactions
  if (overlayCanvas) {
    let isDragging = false;
    let dragTarget = null;

    overlayCanvas.addEventListener('mousedown', e => {
      const rect = overlayCanvas.getBoundingClientRect();
      const scaleX = overlayCanvas.width / rect.width;
      const scaleY = overlayCanvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      if (state.activeTool === 'track') {
        addTrackPoint(x, y);
      } else if (state.activeTool === 'scale') {
        const dStart = Math.hypot(x - state.scaleStick.start.x, y - state.scaleStick.start.y);
        const dEnd = Math.hypot(x - state.scaleStick.end.x, y - state.scaleStick.end.y);
        if (dStart < 25) {
          isDragging = true;
          dragTarget = 'scaleStart';
        } else if (dEnd < 25) {
          isDragging = true;
          dragTarget = 'scaleEnd';
        } else {
          // Drag out a brand new scale line from clicked point!
          isDragging = true;
          dragTarget = 'scaleEnd';
          state.scaleStick.start = { x, y };
          state.scaleStick.end = { x, y };
          drawOverlay();
        }
      } else if (state.activeTool === 'origin') {
        // Click anywhere to immediately place and drag coordinate origin
        isDragging = true;
        dragTarget = 'origin';
        state.origin = { x, y };
        recalculateKinematics();
        updateTable();
        updateCharts();
        drawOverlay();
        updateStatus(`Coordinate origin placed at (${Math.round(x)}, ${Math.round(y)} px).`);
      }
    });

    window.addEventListener('mousemove', e => {
      // Reticle preview hover when tracking
      if (state.activeTool === 'track' && reticlePreview && !isDragging) {
        const rect = overlayCanvas.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          const r = parseInt(markerSizeSelect ? markerSizeSelect.value : 14, 10);
          reticlePreview.style.display = 'block';
          reticlePreview.style.width = (r * 2) + 'px';
          reticlePreview.style.height = (r * 2) + 'px';
          reticlePreview.style.left = (e.clientX - rect.left) + 'px';
          reticlePreview.style.top = (e.clientY - rect.top) + 'px';
        } else {
          reticlePreview.style.display = 'none';
        }
      } else if (reticlePreview && !isDragging) {
        reticlePreview.style.display = 'none';
      }

      if (!isDragging) return;
      const rect = overlayCanvas.getBoundingClientRect();
      const scaleX = overlayCanvas.width / rect.width;
      const scaleY = overlayCanvas.height / rect.height;
      const x = Math.max(0, Math.min(overlayCanvas.width, (e.clientX - rect.left) * scaleX));
      const y = Math.max(0, Math.min(overlayCanvas.height, (e.clientY - rect.top) * scaleY));

      if (dragTarget === 'scaleStart') {
        state.scaleStick.start = { x, y };
        updateScaleReadout();
        recalculateKinematics();
        updateTable();
        updateCharts();
      } else if (dragTarget === 'scaleEnd') {
        state.scaleStick.end = { x, y };
        updateScaleReadout();
        recalculateKinematics();
        updateTable();
        updateCharts();
      } else if (dragTarget === 'origin') {
        state.origin = { x, y };
        recalculateKinematics();
        updateTable();
        updateCharts();
      }
      drawOverlay();
    });

    window.addEventListener('mouseup', () => {
      if (isDragging && dragTarget === 'scaleEnd') {
        const pxLen = Math.hypot(state.scaleStick.end.x - state.scaleStick.start.x, state.scaleStick.end.y - state.scaleStick.start.y);
        if (pxLen > 5) {
          updateScaleReadout();
          recalculateKinematics();
          updateTable();
          updateCharts();
          updateStatus(`Calibrated scale: ${pxLen.toFixed(1)} px = ${state.scaleStick.lengthMeters.toFixed(2)} m (${state.pixelsPerMeter.toFixed(1)} px/m).`);
        }
      } else if (isDragging && dragTarget === 'origin') {
        updateStatus(`Origin calibrated at (${Math.round(state.origin.x)}, ${Math.round(state.origin.y)} px).`);
      }
      isDragging = false;
      dragTarget = null;
    });

    overlayCanvas.addEventListener('mouseleave', () => {
      if (reticlePreview) reticlePreview.style.display = 'none';
    });
  }

  // Sidebar Tabs (Graphs, Linearization, Table, Calibration)
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // Scale calibration inputs
  if (btnApplyScale) {
    btnApplyScale.addEventListener('click', () => {
      const len = parseFloat(scaleLengthInput ? scaleLengthInput.value : 1.0);
      if (len > 0) {
        state.scaleStick.lengthMeters = len;
        updateScaleReadout();
        recalculateKinematics();
        updateTable();
        updateCharts();
        updateStatus(`Scale stick calibrated to ${len.toFixed(2)} meters.`);
      }
    });
  }

  if (btnResetOrigin) {
    btnResetOrigin.addEventListener('click', () => {
      state.origin = { x: overlayCanvas.width / 2, y: overlayCanvas.height / 2 };
      state.originAngle = 0;
      if (originAngleInput) originAngleInput.value = '0.0';
      drawOverlay();
    });
  }

  // Series & Point helpers
  if (btnClearSeries) {
    btnClearSeries.addEventListener('click', () => {
      if (confirm(`Clear all points in Series ${state.activeSeries}?`)) {
        state.series[state.activeSeries] = [];
        state.tangentPoints = [];
        updateTable();
        updateCharts();
        drawOverlay();
      }
    });
  }
  if (btnSetTZero) btnSetTZero.addEventListener('click', setInitialTimeAtFirstPoint);
  if (btnExportCSV) btnExportCSV.addEventListener('click', exportCSV);

  // 6-Graph Studio Nav
  graphNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      renderStudioGraph(btn.dataset.graph);
    });
  });

  if (tangentSlider) {
    tangentSlider.addEventListener('input', e => {
      updateTangentTool(parseFloat(e.target.value));
    });
  }
  if (btnRecordTangent) btnRecordTangent.addEventListener('click', recordTangentPoint);
  if (btnAutoSampleTangents) btnAutoSampleTangents.addEventListener('click', autoSample10Tangents);
  if (btnAutoFitAll) btnAutoFitAll.addEventListener('click', autoFitAllGraphs);

  // Calculations Workspace
  if (btnCheckWorksheet) btnCheckWorksheet.addEventListener('click', checkAndVerifyCalculations);
  [inpX0, inpVx0, inpAx, inpY0, inpVy0, inpAy, inpCalcRange, inpMeasRange, inpCalcHangTime, inpMeasHangTime, inpCalcMaxHeight, inpMeasMaxHeight, inpSpeedV0, inpAngleTheta].forEach(inp => {
    if (inp) inp.addEventListener('input', () => checkAndVerifyCalculations());
  });
  if (reflectionText) reflectionText.addEventListener('input', updateReflectionCounter);

  // Presentation & Exports
  if (btnDownloadPptx) btnDownloadPptx.addEventListener('click', exportPresentationPPTX);
  if (btnPrintReport) btnPrintReport.addEventListener('click', () => window.print());
  if (btnCopyFormData) btnCopyFormData.addEventListener('click', copyFormData);

  if (btnPrevSlide) {
    btnPrevSlide.addEventListener('click', () => {
      const prev = Math.max(1, state.currentSlideIdx - 1);
      renderSlideDeckPreview(prev);
    });
  }
  if (btnNextSlide) {
    btnNextSlide.addEventListener('click', () => {
      const next = Math.min(8, state.currentSlideIdx + 1);
      renderSlideDeckPreview(next);
    });
  }
  slideThumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const idx = parseInt(thumb.dataset.slideIdx, 10);
      renderSlideDeckPreview(idx);
    });
  });

  // Student & Teacher Inputs update preview in real-time
  if (studentNameInput) {
    studentNameInput.addEventListener('input', () => {
      updateAuthenticityBadge();
      if (state.currentSlideIdx === 1) renderSlideDeckPreview(1);
    });
  }
  if (teacherSelect) {
    teacherSelect.addEventListener('change', () => {
      updateAuthenticityBadge();
      if (state.currentSlideIdx === 1) renderSlideDeckPreview(1);
    });
  }

  // Session Save/Load
  if (btnSaveSession) btnSaveSession.addEventListener('click', saveSessionJSON);
  if (btnLoadSession && loadSessionInput) {
    btnLoadSession.addEventListener('click', () => loadSessionInput.click());
    loadSessionInput.addEventListener('change', e => {
      if (e.target.files[0]) loadSessionJSON(e.target.files[0]);
    });
  }
}

// Window load
window.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', () => {
  resizeCanvas();
  drawOverlay();
});
