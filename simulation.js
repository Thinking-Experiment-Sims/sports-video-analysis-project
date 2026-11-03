/**
 * Projectile Video Project Lab — Guided 3-Step Activity
 * Designed for The Thinking Experiment (PhysicsKit)
 * Strictly Light Mode: Teal (#0f7e9b), Amber (#d67b19), White (#ffffff).
 *
 * Three App Steps:
 *   Step 1: Track the Flight (Record, Calibrate, Track)
 *   Step 2: Explain the Motion (Save Predictions Before Reveal, Two-Column Six-Graph Panel,
 *           Calculations 5a–5f with fixed ay,ref = -9.8 m/s², Signed-Area Check, Intervals & Apex Reasoning)
 *   Step 3: Submit Report (One complete, non-truncated lab report + .json progress backup)
 */

const FIXED_AY_REF = -9.8; // Fixed reference vertical acceleration for lab predictions (m/s^2)

// ============================================================================
// Global Application State
// ============================================================================
const state = {
  schemaVersion: '2.0',
  currentStep: 1, // 1: Track the Flight, 2: Explain the Motion, 3: Submit Report
  studentName: '',
  teacherName: 'Mr. Lopez',

  // Video & Synthetic Model State
  isSynthetic: true,
  syntheticType: 'basketball', // 'basketball', 'projectile', 'soccer'
  videoFileName: '',
  fps: 60,
  stepFrames: 5,
  currentTime: 0,
  duration: 1.4,
  isPlaying: false,
  timeOffset: 0,

  // Active Tool & Visibility Toggles
  activeTool: 'track', // 'track', 'scale', 'origin'
  activeSeries: 'A',
  showPoints: true,
  showVectors: false, // Optional diagnostic finite-difference vectors
  showScale: true,
  showOrigin: true,
  markerType: 'circle',
  markerRadius: 14,
  motionFilter: 'both',

  // Calibration & Coordinate Transform (y = 0 at ground reference, x = 0 below release)
  pixelsPerMeter: 112,
  origin: { x: 110, y: 426 },
  originAngle: 0,
  scaleStick: {
    start: { x: 110, y: 465 },
    end: { x: 222, y: 465 },
    lengthMeters: 1.00,
    isDragging: false,
    dragPoint: null
  },

  // Tracked Airborne Coordinates
  series: {
    A: [], // Array of { frame, rawTime, time, videoX, videoY, x, y, vx, vy, ax, ay }
    B: []
  },

  // Observed rise time from first tracked frame to apex read from video (s)
  observedTUp: '',

  // Coverage & Honest Turnaround Diagnostics
  coverageStatus: {
    hasEnoughPoints: false,
    hasInteriorPeak: false,
    isConcaveDown: false,
    hasValidTurnaround: false,
    tMin: 0,
    tMax: 0,
    T: 0,
    y0: null,
    x0: null,
    xFinal: null,
    yFinal: null,
    dxTrack: null,
    dyTrack: null,
    peakPoint: null,
    tZero: null,
    message: 'No points tracked yet.'
  },

  // Fitted Position Models & Derived Kinematics (One fit per axis; no redundant refitting)
  fitResults: {
    xPos: null, // { slope: m, intercept: c, r2 } -> x(t) = m*t + c
    yPos: null, // { A, B, C, r2 } -> y(t) = A*t^2 + B*t + C
    xVel: null, // Derived: { vx: m }
    yVel: null, // Derived: { slope: 2A, intercept: B, tZero }
    xAcc: null, // Derived: { ax: 0 } (follows from linear x model)
    yAcc: null  // Derived: { ay: 2A, ref: -9.8 }
  },

  // Step 2A: First-Attempt Prediction (Locked before revealing derived velocity & acceleration plots)
  firstAttemptPrediction: {
    isSaved: false,
    isLegacyMissing: false,
    savedAt: null,
    vxShape: '',
    vyShape: '',
    axShape: '',
    ayShape: '',
    initialNotes: ''
  },

  // Step 2B: Separate Reasoned Revision & Graph Connections Explanation
  predictionRevision: '',
  graphConnections: '',

  // Optional Tangent Explorer State (Never blocks completion)
  showSignedArea: true,
  activeTangentTime: null,

  // Step 2C: Student Submitted Responses (Raw strings; NEVER auto-filled with model answers)
  studentResponses: {
    // 5a: Horizontal velocity slope on fitted x-t line
    inp5aPt1: '',
    inp5aPt2: '',
    inpVx0: '',
    work5aVx: '',
    // 5b: Vertical acceleration slope on derived vy-t line
    inp5bPt1: '',
    inp5bPt2: '',
    inpAy: '',
    work5bAy: '',
    // 5c: Predicted initial vertical velocity from fixed ay,ref = -9.8 m/s^2 and observed t_up
    inpVy0Pred: '',
    work5cVy0: '',
    // 5d: Predicted displacements at T and final height y_final = y0 + dy
    inpCalcRange: '',
    inpPredDy: '',
    inpPredYFinal: '',
    work5dDisp: '',
    // 5e: Predicted maximum height using t_up (not T) and measured y0
    inpPredDyUp: '',
    inpCalcMaxHeight: '',
    workMaxHeight: '',
    // 5f: Initial speed and launch angle at first tracked instant
    inpSpeedV0: '',
    inpAngleTheta: '',
    workVector: '',
    // Signed-area check on fitted vy-t + fitted C
    inpZeroCrossT: '',
    inpAreaUp: '',
    inpAreaDown: '',
    inpNetDyArea: '',
    inpYFinalFromArea: '',
    workSignedArea: '',
    // Direction intervals (excluding zero crossing), apex 2D rest, and negative ay reasoning
    inpPosDirStart: '',
    inpPosDirEnd: '',
    inpNegDirStart: '',
    inpNegDirEnd: '',
    txtStopExplanation: '',
    inpNegAccStart: '',
    inpNegAccEnd: '',
    txtAccSignExplanation: '',
    // Specific measurement limitation tied to a reported result
    reflectionText: ''
  },

  // Practice Feedback State (Saved separately from student responses)
  feedbackState: {
    checkedAt: null,
    fb5a: { status: 'unchecked', text: '' },
    fb5b: { status: 'unchecked', text: '' },
    fb5c: { status: 'unchecked', text: '' },
    fb5d: { status: 'unchecked', text: '' },
    fb5e: { status: 'unchecked', text: '' },
    fb5f: { status: 'unchecked', text: '' },
    fbSignedArea: { status: 'unchecked', text: '' },
    fbIntervals: { status: 'unchecked', text: '' }
  },

  // Synthetic Canvas Buffer
  syntheticCanvas: document.createElement('canvas'),
  syntheticCtx: null
};

// Synthetic Model Definitions (y = 0 at floor, y0 > 0 at release, clip ends before ground impact so T != 2*t_up)
const SYNTHETIC_MODELS = {
  basketball: {
    label: 'SYNTHETIC MODEL CLIP: Basketball Launch (Practice)',
    ballType: 'basketball',
    y0: 1.20,       // Released 1.20 m above floor
    vx0: 2.65,      // Horizontal velocity (m/s)
    vy0: 4.90,      // Initial upward velocity -> t_up = 4.90 / 9.8 = 0.500 s
    g: 9.80,
    duration: 1.15, // Ends at t = 1.15 s (y ≈ 0.355 m above floor, before landing; T != 2*t_up)
    sampleTimes: [0.05, 0.13, 0.21, 0.30, 0.38, 0.46, 0.55, 0.63, 0.72, 0.80, 0.88, 0.97, 1.05]
  },
  projectile: {
    label: 'SYNTHETIC MODEL CLIP: Ball Toss Arc (Practice)',
    ballType: 'baseball',
    y0: 1.00,       // Released 1.00 m above floor
    vx0: 2.40,
    vy0: 4.41,      // t_up = 4.41 / 9.8 = 0.450 s
    g: 9.80,
    duration: 1.05, // Ends above floor with unequal endpoint heights
    sampleTimes: [0.04, 0.12, 0.20, 0.28, 0.36, 0.44, 0.49, 0.57, 0.65, 0.73, 0.81, 0.89, 0.97]
  },
  soccer: {
    label: 'SYNTHETIC MODEL CLIP: Soccer Chip Kick (Practice)',
    ballType: 'soccer',
    y0: 0.45,       // Chipped from elevated ramp/platform 0.45 m above turf reference
    vx0: 3.40,
    vy0: 5.39,      // t_up = 5.39 / 9.8 = 0.550 s
    g: 9.80,
    duration: 1.15,
    sampleTimes: [0.03, 0.11, 0.20, 0.28, 0.37, 0.45, 0.54, 0.62, 0.71, 0.79, 0.88, 0.96, 1.05]
  }
};

// Chart.js Instances
let posChart = null;
const gridCharts = {};

// ============================================================================
// DOM Element References
// ============================================================================
const el = (id) => document.getElementById(id);

const video = el('mainVideo');
const overlayCanvas = el('overlayCanvas');
const ctx = overlayCanvas ? overlayCanvas.getContext('2d') : null;
const reticlePreview = el('reticlePreview');
const viewportContainer = el('viewportContainer');
const dropzoneOverlay = el('dropzoneOverlay');

// Stepper & Step Views
const stepBtns = [el('stepBtn1'), el('stepBtn2'), el('stepBtn3')];
const stepViews = [el('stepView1'), el('stepView2'), el('stepView3')];

// ============================================================================
// Initialization
// ============================================================================
function init() {
  initEventListeners();
  initPosChart();
  initSyntheticExperiment('basketball');
  loadSamplePointsForActivePreset(); // Provide a ready-to-explore synthetic trajectory out of the box
  updateStepView(1);
  triggerKaTeXRender(document.body);
}

function triggerKaTeXRender(container) {
  if (!container) return;
  const runRender = () => {
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(container, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } catch (e) {
        console.warn('KaTeX auto-render warning:', e);
      }
    }
  };
  if (window.renderMathInElement) {
    runRender();
  } else {
    setTimeout(runRender, 180);
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================================
// Step Navigation (3 Steps: Track the Flight, Explain the Motion, Submit Report)
// ============================================================================
function updateStepView(stepNum) {
  state.currentStep = stepNum;

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

  if (stepViews[0]) stepViews[0].style.display = (stepNum === 1) ? 'grid' : 'none';
  if (stepViews[1]) stepViews[1].style.display = (stepNum === 2) ? 'block' : 'none';
  if (stepViews[2]) stepViews[2].style.display = (stepNum === 3) ? 'block' : 'none';

  if (stepNum === 1) {
    resizeCanvas();
    if (state.isSynthetic) renderSyntheticFrame(state.currentTime);
    drawOverlay();
    updateSetupAndCoverageReadouts();
  } else if (stepNum === 2) {
    autoFitAndDeriveAllGraphs();
    updatePosChart();
    updatePredictionGateUI();
    updateReferenceQuantitiesBar();
    updateWrittenStatusBadges();
    if (state.firstAttemptPrediction.isSaved) {
      renderSixGraphPanel();
    }
  } else if (stepNum === 3) {
    autoFitAndDeriveAllGraphs();
    updateRubricChecklistUI();
    preparePrintableReport();
  }

  triggerKaTeXRender(stepViews[stepNum - 1] || document.body);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// Synthetic Model Clips & Real Video File Loading
// ============================================================================
function initSyntheticExperiment(type = 'basketball') {
  const modelKey = SYNTHETIC_MODELS[type] ? type : 'basketball';
  const model = SYNTHETIC_MODELS[modelKey];

  state.isSynthetic = true;
  state.syntheticType = modelKey;
  state.videoFileName = '';
  state.duration = model.duration;
  state.currentTime = 0;
  state.timeOffset = 0;
  state.fps = 60;

  if (el('fpsInput')) el('fpsInput').value = state.fps;
  if (el('presetModelSelect')) el('presetModelSelect').value = modelKey;
  if (el('reopenVideoNotice')) el('reopenVideoNotice').style.display = 'none';

  const badge = el('clipSourceTypeBadge');
  if (badge) {
    badge.textContent = model.label;
    badge.style.background = '#fff7ed';
    badge.style.color = '#b06210';
    badge.style.borderColor = '#f5d0a9';
  }

  if (video) {
    video.pause();
    video.style.display = 'none';
    video.src = '';
  }

  resizeCanvas();
  const w = (overlayCanvas && overlayCanvas.width) ? overlayCanvas.width : 860;
  const h = (overlayCanvas && overlayCanvas.height) ? overlayCanvas.height : 520;
  state.syntheticCanvas.width = w;
  state.syntheticCanvas.height = h;
  state.syntheticCtx = state.syntheticCanvas.getContext('2d');

  // Ground reference at floorY; x = 0 directly below release point
  const floorY = Math.round(h * 0.82);
  const releaseX = 110;
  const ppm = Math.round(w * 0.14);

  state.origin = { x: releaseX, y: floorY };
  state.originAngle = 0;
  if (el('originAngleInput')) el('originAngleInput').value = '0.0';

  state.pixelsPerMeter = ppm;
  state.scaleStick = {
    start: { x: releaseX, y: Math.round(h * 0.90) },
    end: { x: releaseX + ppm, y: Math.round(h * 0.90) },
    lengthMeters: 1.00,
    isDragging: false,
    dragPoint: null
  };

  if (el('scaleLengthInput')) el('scaleLengthInput').value = '1.00';
  updateScaleReadout();

  const scrubber = el('timeScrubber');
  if (scrubber) {
    scrubber.min = 0;
    scrubber.max = state.duration;
    scrubber.step = 1 / state.fps;
    scrubber.value = 0;
  }

  updateTimeAndFrame(0);
}

function getSyntheticBallMetersAtTime(t) {
  const model = SYNTHETIC_MODELS[state.syntheticType] || SYNTHETIC_MODELS.basketball;
  const tc = Math.max(0, Math.min(model.duration, t));
  const xMeters = model.vx0 * tc;
  const yMeters = model.y0 + model.vy0 * tc - 0.5 * model.g * tc * tc;
  return { xMeters, yMeters };
}

function renderSyntheticFrame(t) {
  if (!state.isSynthetic || !state.syntheticCtx) return;
  const ctxS = state.syntheticCtx;
  const w = state.syntheticCanvas.width;
  const h = state.syntheticCanvas.height;
  const model = SYNTHETIC_MODELS[state.syntheticType] || SYNTHETIC_MODELS.basketball;

  // Clean light background
  ctxS.fillStyle = '#f8fafc';
  ctxS.fillRect(0, 0, w, h);

  // Subtle metric background grid
  ctxS.strokeStyle = '#e2e8f0';
  ctxS.lineWidth = 1;
  const gridStep = Math.max(28, state.pixelsPerMeter / 2);
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

  // Visible Ground Reference Plane (y = 0)
  const floorY = Math.round(h * 0.82);
  if (state.syntheticType === 'soccer') {
    ctxS.fillStyle = '#e8f5e9';
    ctxS.fillRect(0, floorY, w, h - floorY);
    ctxS.strokeStyle = '#4caf50';
  } else if (state.syntheticType === 'basketball') {
    ctxS.fillStyle = '#fff3e0';
    ctxS.fillRect(0, floorY, w, h - floorY);
    ctxS.strokeStyle = '#d67b19';
  } else {
    ctxS.fillStyle = '#e2edf3';
    ctxS.fillRect(0, floorY, w, h - floorY);
    ctxS.strokeStyle = '#0f7e9b';
  }
  ctxS.lineWidth = 2.5;
  ctxS.beginPath();
  ctxS.moveTo(0, floorY);
  ctxS.lineTo(w, floorY);
  ctxS.stroke();

  ctxS.fillStyle = '#4b6570';
  ctxS.font = 'bold 11px sans-serif';
  ctxS.fillText('GROUND REFERENCE LEVEL (y = 0.00 m)', w - 265, floorY - 7);

  // Known 1.00 m Reference Calibration Bar in the Plane of Motion
  const stickX = 110;
  const stickY = Math.round(h * 0.89);
  const stickW = state.pixelsPerMeter;
  ctxS.fillStyle = '#ffecb3';
  ctxS.strokeStyle = '#d67b19';
  ctxS.lineWidth = 2;
  ctxS.fillRect(stickX, stickY, stickW, 16);
  ctxS.strokeRect(stickX, stickY, stickW, 16);
  ctxS.fillStyle = '#123140';
  ctxS.font = 'bold 10px monospace';
  ctxS.fillText('1.00 m CALIBRATION BAR', stickX + 6, stickY + 12);

  // Draw Release Height Reference Stand at x = 0
  const releaseScreenY = floorY - model.y0 * state.pixelsPerMeter;
  ctxS.strokeStyle = '#94a3b8';
  ctxS.lineWidth = 2;
  ctxS.setLineDash([4, 3]);
  ctxS.beginPath();
  ctxS.moveTo(110, floorY);
  ctxS.lineTo(110, releaseScreenY);
  ctxS.stroke();
  ctxS.setLineDash([]);

  // Draw Basketball Hoop for context on basketball model
  if (state.syntheticType === 'basketball') {
    const hoopX = Math.round(w * 0.82);
    const hoopY = Math.round(h * 0.36);
    ctxS.strokeStyle = '#64748b';
    ctxS.lineWidth = 4;
    ctxS.strokeRect(hoopX + 42, hoopY - 65, 5, 110);
    ctxS.fillStyle = '#d67b19';
    ctxS.fillRect(hoopX, hoopY, 42, 7);
  }

  // Ball position at time t
  const { xMeters, yMeters } = getSyntheticBallMetersAtTime(t);
  const ballX = 110 + xMeters * state.pixelsPerMeter;
  const ballY = floorY - yMeters * state.pixelsPerMeter;

  drawSportsBall(ctxS, ballX, ballY, 14, model.ballType);

  // Watermark label inside synthetic canvas so screenshots clearly identify it as a synthetic model
  ctxS.fillStyle = 'rgba(255, 247, 237, 0.92)';
  ctxS.fillRect(14, 14, 330, 24);
  ctxS.strokeStyle = '#d67b19';
  ctxS.lineWidth = 1;
  ctxS.strokeRect(14, 14, 330, 24);
  ctxS.fillStyle = '#b06210';
  ctxS.font = 'bold 11px sans-serif';
  ctxS.fillText(model.label, 22, 30);
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
  } else {
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

function loadSamplePointsForActivePreset() {
  if (!state.isSynthetic) return;
  const model = SYNTHETIC_MODELS[state.syntheticType] || SYNTHETIC_MODELS.basketball;
  const h = (overlayCanvas && overlayCanvas.height) ? overlayCanvas.height : 520;
  const floorY = Math.round(h * 0.82);
  const releaseX = 110;

  state.origin = { x: releaseX, y: floorY };
  state.originAngle = 0;

  const sampleTimes = model.sampleTimes;
  state.timeOffset = sampleTimes[0]; // Set t = 0 at the first tracked airborne frame

  const pts = sampleTimes.map((rawT) => {
    const { xMeters, yMeters } = getSyntheticBallMetersAtTime(rawT);
    const screenX = releaseX + xMeters * state.pixelsPerMeter;
    const screenY = floorY - yMeters * state.pixelsPerMeter;
    const phys = transformToPhysics(screenX, screenY);
    return {
      frame: Math.round(rawT * state.fps),
      rawTime: rawT,
      time: Math.max(0, rawT - state.timeOffset),
      videoX: screenX,
      videoY: screenY,
      x: phys.x,
      y: phys.y,
      vx: 0,
      vy: 0,
      ax: 0,
      ay: 0
    };
  });

  state.series.A = pts;

  // Set observed video rise time t_up from the highest tracked point
  let peakPt = pts[0];
  pts.forEach(p => {
    if (p.y > peakPt.y) peakPt = p;
  });
  state.observedTUp = peakPt.time.toFixed(3);
  if (el('inpObservedTUp')) el('inpObservedTUp').value = state.observedTUp;
  if (el('inpCalcTUp')) el('inpCalcTUp').value = state.observedTUp;

  recalculateKinematics();
  autoFitAndDeriveAllGraphs();
  updateTable();
  updateSetupAndCoverageReadouts();
  updatePosChart();
  drawOverlay();
}

// ============================================================================
// Coordinate Transform, Tracking & Honest Coverage / Apex Detection
// ============================================================================
function setActiveTool(tool) {
  state.activeTool = tool;
  ['toolTrack', 'toolScale', 'toolOrigin'].forEach(id => {
    const btn = el(id);
    if (btn) btn.classList.remove('active', 'btn-amber');
  });

  const activeBtn = tool === 'track' ? el('toolTrack') : (tool === 'scale' ? el('toolScale') : el('toolOrigin'));
  if (activeBtn) activeBtn.classList.add('active', 'btn-amber');
  if (overlayCanvas) {
    overlayCanvas.style.cursor = tool === 'origin' ? 'move' : 'crosshair';
  }
  drawOverlay();
}

function transformToPhysics(screenX, screenY) {
  const dx = screenX - state.origin.x;
  const dy = state.origin.y - screenY; // Screen Y down -> Physics Y up (+y upward)
  const angle = state.originAngle || 0;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const rotX = dx * cosA - dy * sinA;
  const rotY = dx * sinA + dy * cosA;

  return {
    x: rotX / state.pixelsPerMeter,
    y: rotY / state.pixelsPerMeter
  };
}

function getAdjustedTime(rawTime) {
  return Math.max(0, rawTime - state.timeOffset);
}

function updateTimeAndFrame(t) {
  state.currentTime = t;
  const adjustedT = getAdjustedTime(t);
  const frame = Math.round(t * state.fps);

  if (el('currentTimeText')) el('currentTimeText').textContent = `t = ${adjustedT.toFixed(3)} s`;
  if (el('currentFrameText')) el('currentFrameText').textContent = `Frame: ${frame}`;
  if (el('timeScrubber')) el('timeScrubber').value = t;

  if (state.isSynthetic) {
    renderSyntheticFrame(t);
  }
  drawOverlay();
}

function stepFrame(delta) {
  if (state.isPlaying) togglePlay();
  const dt = 1 / state.fps;
  const maxDur = (state.duration > 0)
    ? state.duration
    : (video && Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 10);
  const nextT = Math.max(0, Math.min(maxDur, state.currentTime + delta * dt));

  updateTimeAndFrame(nextT);
  if (!state.isSynthetic && video) {
    video.currentTime = nextT;
  }
}

let syntheticPlayTimer = null;
function togglePlay() {
  state.isPlaying = !state.isPlaying;
  if (el('iconPlay')) el('iconPlay').style.display = state.isPlaying ? 'none' : 'block';
  if (el('iconPause')) el('iconPause').style.display = state.isPlaying ? 'block' : 'none';

  if (state.isSynthetic) {
    if (state.isPlaying) playSyntheticLoop();
  } else if (video) {
    if (state.isPlaying) {
      const rate = parseFloat(el('playbackRateSelect') ? el('playbackRateSelect').value : 0.5) || 0.5;
      video.playbackRate = rate;
      video.play().catch(() => {
        state.isPlaying = false;
        if (el('iconPlay')) el('iconPlay').style.display = 'block';
        if (el('iconPause')) el('iconPause').style.display = 'none';
      });
    } else {
      video.pause();
    }
  }
}

function playSyntheticLoop() {
  if (!state.isPlaying || !state.isSynthetic) return;
  const rate = parseFloat(el('playbackRateSelect') ? el('playbackRateSelect').value : 0.5) || 0.5;
  let nextT = state.currentTime + (1 / state.fps) * rate;
  if (nextT >= state.duration) nextT = 0;
  updateTimeAndFrame(nextT);
  syntheticPlayTimer = requestAnimationFrame(playSyntheticLoop);
}

function addTrackPoint(screenX, screenY) {
  if (state.isPlaying) togglePlay();

  const currentT = (!state.isSynthetic && video && Number.isFinite(video.currentTime))
    ? video.currentTime
    : state.currentTime;
  state.currentTime = currentT;

  const pts = state.series[state.activeSeries];
  // If this is the very first tracked point, automatically set t = 0 at this frame
  if (pts.length === 0) {
    state.timeOffset = currentT;
  }

  const phys = transformToPhysics(screenX, screenY);
  const frame = Math.round(currentT * state.fps);
  const frameThreshold = 0.4 / state.fps;
  const existingIdx = pts.findIndex(p => Math.abs(p.rawTime - currentT) < frameThreshold || p.frame === frame);

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
  // Ensure t = 0 stays anchored at the first tracked airborne frame unless manually adjusted
  state.timeOffset = pts[0].rawTime;

  recalculateKinematics();
  autoFitAndDeriveAllGraphs();
  updateTable();
  updateSetupAndCoverageReadouts();
  updatePosChart();
  drawOverlay();

  const stepCount = parseInt(el('stepFrameSelect') ? el('stepFrameSelect').value : 5, 10) || 5;
  stepFrame(stepCount);
}

function recalculateKinematics() {
  ['A', 'B'].forEach(seriesKey => {
    const pts = state.series[seriesKey];
    pts.forEach(p => {
      const phys = transformToPhysics(p.videoX, p.videoY);
      p.x = phys.x;
      p.y = phys.y;
      p.time = getAdjustedTime(p.rawTime);
    });
    if (pts.length < 2) return;

    // Optional finite-difference velocity & acceleration (labeled strictly as diagnostic)
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
  });
}

function setInitialTimeAtFirstPoint() {
  const pts = state.series[state.activeSeries];
  if (!pts || pts.length === 0) return;
  state.timeOffset = pts[0].rawTime;
  recalculateKinematics();
  autoFitAndDeriveAllGraphs();
  updateTimeAndFrame(state.currentTime);
  updateTable();
  updateSetupAndCoverageReadouts();
  updatePosChart();
}

function updateScaleReadout() {
  const dx = state.scaleStick.end.x - state.scaleStick.start.x;
  const dy = state.scaleStick.end.y - state.scaleStick.start.y;
  const pixelDist = Math.hypot(dx, dy);
  if (pixelDist > 5) {
    state.pixelsPerMeter = pixelDist / state.scaleStick.lengthMeters;
    if (el('scaleReadout')) {
      el('scaleReadout').textContent = `Current Scale: ${state.pixelsPerMeter.toFixed(1)} px/m (${state.scaleStick.lengthMeters.toFixed(2)} m reference)`;
    }
  }
}

// ============================================================================
// Canvas Overlay Rendering
// ============================================================================
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
  const angle = state.originAngle || 0;

  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(-angle);

  // +x axis (Teal)
  ctx.strokeStyle = '#0f7e9b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-45, 0);
  ctx.lineTo(155, 0);
  ctx.stroke();

  // +y axis (Amber)
  ctx.strokeStyle = '#d67b19';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 45);
  ctx.lineTo(0, -155);
  ctx.stroke();

  // Origin handle
  ctx.fillStyle = state.activeTool === 'origin' ? '#d67b19' : '#0f7e9b';
  ctx.beginPath();
  ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#0f7e9b';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('+x (m)', 160, 4);
  ctx.fillStyle = '#d67b19';
  ctx.fillText('+y (m)', -16, -162);

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

  [s, e].forEach(p => {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d67b19';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
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
    if (!pts || pts.length === 0) return;
    const color = sKey === 'A' ? '#d67b19' : '#0f7e9b';

    pts.forEach((p, idx) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.6;

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

      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`${idx + 1}`, p.videoX + 10, p.videoY - 6);

      // Optional finite-difference velocity vectors (clearly diagnostic)
      if (state.showVectors && (p.vx !== 0 || p.vy !== 0)) {
        const arrowScale = 10;
        const vxPix = p.vx * arrowScale;
        const vyPix = -p.vy * arrowScale;
        ctx.strokeStyle = '#095f76';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(p.videoX, p.videoY);
        ctx.lineTo(p.videoX + vxPix, p.videoY + vyPix);
        ctx.stroke();
      }
      ctx.restore();
    });
  });
}

// ============================================================================
// Table, Setup Readouts & Honest Turnaround / Coverage Check
// ============================================================================
function updateTable() {
  const tbody = el('pointsTableBody');
  if (!tbody) return;
  const pts = state.series[state.activeSeries];
  if (!pts || pts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--subtle); padding: 1.5rem;">No points tracked yet. Click on the ball in the video (or click "⚡ Load Sample Points" to practice).</td></tr>';
    return;
  }

  let html = '';
  pts.forEach((p, idx) => {
    html += `
      <tr style="cursor: pointer;" onclick="window.jumpToPointFrame(${idx})">
        <td><strong>${idx + 1}</strong></td>
        <td>${p.frame}</td>
        <td>${p.time.toFixed(3)}</td>
        <td>${p.x.toFixed(3)}</td>
        <td>${p.y.toFixed(3)}</td>
        <td><button class="btn-delete-pt" onclick="event.stopPropagation(); window.deleteTrackedPoint(${idx});" title="Delete point ${idx + 1}" style="border:none; background:transparent; color:#dc2626; cursor:pointer; font-weight:700;">✕</button></td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

window.jumpToPointFrame = function(idx) {
  const pts = state.series[state.activeSeries];
  if (pts && pts[idx]) {
    updateTimeAndFrame(pts[idx].rawTime);
    if (!state.isSynthetic && video) {
      video.currentTime = pts[idx].rawTime;
    }
  }
};

window.deleteTrackedPoint = function(idx) {
  const pts = state.series[state.activeSeries];
  if (!pts || !pts[idx]) return;
  pts.splice(idx, 1);
  if (pts.length > 0) {
    state.timeOffset = pts[0].rawTime;
  }
  recalculateKinematics();
  autoFitAndDeriveAllGraphs();
  updateTable();
  updateSetupAndCoverageReadouts();
  updatePosChart();
  drawOverlay();
};

function updateSetupAndCoverageReadouts() {
  const cov = state.coverageStatus;
  if (el('setupReadoutY0')) {
    el('setupReadoutY0').textContent = cov.y0 !== null ? `${cov.y0.toFixed(3)} m` : 'Not tracked yet';
  }
  if (el('setupReadoutT')) {
    el('setupReadoutT').textContent = `${cov.T.toFixed(3)} s`;
  }
  const pts = state.series[state.activeSeries] || [];
  if (el('setupReadoutPts')) {
    el('setupReadoutPts').textContent = `${pts.length} (Aim for 10–15)`;
  }
  if (el('setupReadoutYMax')) {
    el('setupReadoutYMax').textContent = cov.peakPoint
      ? `${cov.peakPoint.y.toFixed(3)} m (at t = ${cov.peakPoint.time.toFixed(3)} s)`
      : '—';
  }

  const alertBox1 = el('trackingCoverageAlert');
  const alertBox2 = el('step2CoverageWarning');

  if (pts.length === 0) {
    if (alertBox1) alertBox1.style.display = 'none';
    if (alertBox2) alertBox2.style.display = 'none';
    return;
  }

  if (!cov.hasValidTurnaround) {
    if (alertBox1) {
      alertBox1.style.display = 'block';
      alertBox1.style.background = '#fef2f2';
      alertBox1.style.border = '1px solid #dc2626';
      alertBox1.style.color = '#991b1b';
      alertBox1.innerHTML = `<strong>⚠️ Incomplete Flight Coverage:</strong> ${escapeHtml(cov.message)}`;
    }
    if (alertBox2) {
      alertBox2.style.display = 'block';
      alertBox2.innerHTML = `<strong>⚠️ Incomplete Trajectory / Missing Turnaround:</strong> ${escapeHtml(cov.message)} The app will <em>not</em> fabricate an endpoint apex. Return to Step 1 and track airborne frames across both ascent and descent (including near the highest point).`;
    }
  } else {
    if (alertBox1) {
      alertBox1.style.display = 'block';
      alertBox1.style.background = '#e6f8ea';
      alertBox1.style.border = '1px solid #1a7f37';
      alertBox1.style.color = '#14532d';
      alertBox1.innerHTML = `<strong>✓ Ascent, Apex &amp; Descent Captured:</strong> ${pts.length} airborne points tracked over [0.000 s, ${cov.T.toFixed(3)} s]. Highest tracked position is ${cov.peakPoint.y.toFixed(3)} m at t = ${cov.peakPoint.time.toFixed(3)} s.`;
    }
    if (alertBox2) {
      alertBox2.style.display = 'none';
    }
  }
}

// ============================================================================
// Regressions & One-Fit-Per-Axis Derivation (No Redundant Fitting or Clamping)
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
  if (Math.abs(D) < 1e-11) return null;

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

function autoFitAndDeriveAllGraphs() {
  const pts = state.series[state.activeSeries] || [];
  if (pts.length < 3) {
    state.fitResults = { xPos: null, yPos: null, xVel: null, yVel: null, xAcc: null, yAcc: null };
    state.coverageStatus = {
      hasEnoughPoints: false,
      hasInteriorPeak: false,
      isConcaveDown: false,
      hasValidTurnaround: false,
      tMin: 0,
      tMax: pts.length > 0 ? pts[pts.length - 1].time : 0,
      T: pts.length > 0 ? pts[pts.length - 1].time - pts[0].time : 0,
      y0: pts.length > 0 ? pts[0].y : null,
      x0: pts.length > 0 ? pts[0].x : null,
      xFinal: pts.length > 0 ? pts[pts.length - 1].x : null,
      yFinal: pts.length > 0 ? pts[pts.length - 1].y : null,
      dxTrack: pts.length > 1 ? pts[pts.length - 1].x - pts[0].x : null,
      dyTrack: pts.length > 1 ? pts[pts.length - 1].y - pts[0].y : null,
      peakPoint: pts.length > 0 ? pts[0] : null,
      tZero: null,
      message: `Only ${pts.length} point(s) tracked. Track at least 10–15 airborne points across ascent, near the apex, and descent.`
    };
    return;
  }

  const tMin = pts[0].time;
  const tMax = pts[pts.length - 1].time;
  const T = Math.max(0, tMax - tMin);

  // 1. Fit x(t) = m*t + c once
  const xFit = linearRegression(pts.map(p => ({ x: p.time, y: p.x })));
  // 2. Fit y(t) = A*t^2 + B*t + C once
  const yFit = quadraticRegression(pts.map(p => ({ x: p.time, y: p.y })));

  state.fitResults.xPos = xFit;
  state.fitResults.yPos = yFit;

  // Find highest tracked point and check whether it is strictly inside the tracked window
  let peakIdx = 0;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].y > pts[peakIdx].y) peakIdx = i;
  }
  const hasInteriorPeak = peakIdx > 0 && peakIdx < pts.length - 1;
  const isConcaveDown = Boolean(yFit && yFit.A < -0.05);

  // Compute raw fitted zero crossing t_zero = -B / (2A) WITHOUT clamping to endpoints
  let rawTZero = null;
  let hasValidTurnaround = false;
  let covMessage = '';

  if (!isConcaveDown) {
    covMessage = 'The vertical position fit y = At² + Bt + C does not open downward (A ≥ 0). Verify that +y points upward and track an airborne projectile across ascent and descent.';
  } else {
    rawTZero = -yFit.B / (2 * yFit.A);
    const isZeroInsideWindow = rawTZero > tMin + 1e-4 && rawTZero < tMax - 1e-4;
    if (!hasInteriorPeak || !isZeroInsideWindow) {
      covMessage = `Tracked points cover [${tMin.toFixed(3)} s, ${tMax.toFixed(3)} s], but do not include a complete turnaround (apex) inside the tracked interval. Please track frames before AND after the highest point.`;
      hasValidTurnaround = false;
      rawTZero = null; // Never fabricate or clamp an out-of-window apex to an endpoint
    } else {
      hasValidTurnaround = true;
      covMessage = `Valid turnaround inside [${tMin.toFixed(3)} s, ${tMax.toFixed(3)} s]: fitted vᵧ = 0 at t_zero = ${rawTZero.toFixed(3)} s.`;
    }
  }

  state.coverageStatus = {
    hasEnoughPoints: pts.length >= 8,
    hasInteriorPeak,
    isConcaveDown,
    hasValidTurnaround,
    tMin,
    tMax,
    T,
    y0: pts[0].y,
    x0: pts[0].x,
    xFinal: pts[pts.length - 1].x,
    yFinal: pts[pts.length - 1].y,
    dxTrack: pts[pts.length - 1].x - pts[0].x,
    dyTrack: pts[pts.length - 1].y - pts[0].y,
    peakPoint: pts[peakIdx],
    tZero: rawTZero,
    message: covMessage
  };

  // Derive vx, ax, vy, ay directly from the position fits
  state.fitResults.xVel = xFit ? { vx: xFit.slope } : null;
  state.fitResults.xAcc = xFit ? { ax: 0.0 } : null;
  state.fitResults.yVel = yFit ? { slope: 2 * yFit.A, intercept: yFit.B, tZero: rawTZero } : null;
  state.fitResults.yAcc = yFit ? { ay: 2 * yFit.A, ref: FIXED_AY_REF } : null;
}

// ============================================================================
// Step 2A: Position Preview Chart & Mandatory Prediction Gate Before Reveal
// ============================================================================
function initPosChart() {
  const canvas = el('posChart');
  if (!canvas) return;
  posChart = new Chart(canvas.getContext('2d'), {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'Tracked x(t) (m)', data: [], backgroundColor: '#0f7e9b', borderColor: '#0f7e9b', pointRadius: 5 },
        { label: 'Tracked y(t) (m)', data: [], backgroundColor: '#d67b19', borderColor: '#d67b19', pointRadius: 5 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11, weight: 'bold' } } }
      },
      scales: {
        x: {
          title: { display: true, text: 'Time t (s)', font: { size: 11, weight: 'bold' } },
          grid: {
            color: (c) => (c.tick && Math.abs(c.tick.value) < 1e-6) ? '#0f7e9b' : '#eef3f6',
            lineWidth: (c) => (c.tick && Math.abs(c.tick.value) < 1e-6) ? 2 : 1
          }
        },
        y: {
          title: { display: true, text: 'Position (m)', font: { size: 11, weight: 'bold' } },
          grid: {
            color: (c) => (c.tick && Math.abs(c.tick.value) < 1e-6) ? '#0f7e9b' : '#eef3f6',
            lineWidth: (c) => (c.tick && Math.abs(c.tick.value) < 1e-6) ? 2.5 : 1
          }
        }
      }
    }
  });
}

function updatePosChart() {
  if (!posChart) return;
  const pts = state.series[state.activeSeries] || [];
  const xData = pts.map(p => ({ x: p.time, y: p.x }));
  const yData = pts.map(p => ({ x: p.time, y: p.y }));

  if (state.motionFilter === 'horizontal') {
    posChart.data.datasets[0].data = xData;
    posChart.data.datasets[0].hidden = false;
    posChart.data.datasets[1].data = [];
    posChart.data.datasets[1].hidden = true;
  } else if (state.motionFilter === 'vertical') {
    posChart.data.datasets[0].data = [];
    posChart.data.datasets[0].hidden = true;
    posChart.data.datasets[1].data = yData;
    posChart.data.datasets[1].hidden = false;
  } else {
    posChart.data.datasets[0].data = xData;
    posChart.data.datasets[0].hidden = false;
    posChart.data.datasets[1].data = yData;
    posChart.data.datasets[1].hidden = false;
  }
  posChart.update();
}

function saveInitialPredictionAndReveal() {
  if (state.firstAttemptPrediction.isSaved) {
    // Already locked; just ensure the 6-graph section is visible
    if (el('sixGraphRevealSection')) el('sixGraphRevealSection').style.display = 'block';
    renderSixGraphPanel();
    return;
  }

  const vxShape = el('predShapeVx') ? el('predShapeVx').value.trim() : '';
  const vyShape = el('predShapeVy') ? el('predShapeVy').value.trim() : '';
  const axShape = el('predShapeAx') ? el('predShapeAx').value.trim() : '';
  const ayShape = el('predShapeAy') ? el('predShapeAy').value.trim() : '';
  const initialNotes = el('predInitialNotes') ? el('predInitialNotes').value.trim() : '';

  if (!vxShape || !vyShape || !axShape || !ayShape) {
    alert('Please select your predicted shape for all four graphs (vx, vy, ax, and ay) before revealing the six-graph panel.');
    return;
  }
  if (initialNotes.length < 10) {
    alert('Please write a brief note describing your predicted velocity and acceleration graphs (at least one sentence) before revealing the generated plots.');
    return;
  }

  state.firstAttemptPrediction = {
    isSaved: true,
    isLegacyMissing: false,
    savedAt: new Date().toISOString(),
    vxShape,
    vyShape,
    axShape,
    ayShape,
    initialNotes
  };

  updatePredictionGateUI();
  renderSixGraphPanel();
  if (el('sixGraphRevealSection')) {
    el('sixGraphRevealSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function updatePredictionGateUI() {
  const pred = state.firstAttemptPrediction;
  const badge = el('badgePredictionGate');
  const btn = el('btnSavePredictionAndReveal');
  const revealSec = el('sixGraphRevealSection');
  const summaryBox = el('savedPredictionSummaryBox');

  const controls = ['predShapeVx', 'predShapeVy', 'predShapeAx', 'predShapeAy', 'predInitialNotes'];

  if (pred.isSaved) {
    if (!pred.isLegacyMissing) {
      if (el('predShapeVx')) el('predShapeVx').value = pred.vxShape;
      if (el('predShapeVy')) el('predShapeVy').value = pred.vyShape;
      if (el('predShapeAx')) el('predShapeAx').value = pred.axShape;
      if (el('predShapeAy')) el('predShapeAy').value = pred.ayShape;
      if (el('predInitialNotes')) el('predInitialNotes').value = pred.initialNotes;
    }

    // Lock first-attempt inputs so later revisions never erase or overwrite them
    controls.forEach(id => {
      const node = el(id);
      if (node) node.disabled = true;
    });

    if (badge) {
      badge.textContent = pred.isLegacyMissing ? 'Legacy v1.0 Session (Revealed)' : '✓ First Prediction Saved & Locked';
      badge.className = 'pct-diff-badge good';
    }
    if (btn) {
      btn.textContent = '✓ Initial Prediction Locked (Six-Graph Panel Revealed Below)';
      btn.disabled = true;
    }
    if (revealSec) {
      revealSec.style.display = 'block';
    }
    if (summaryBox) {
      if (pred.isLegacyMissing) {
        summaryBox.innerHTML = '<em>First prediction was not recorded in this legacy v1.0 session file.</em>';
      } else {
        summaryBox.innerHTML = `
          <div><strong>• Predicted vₓ(t):</strong> ${escapeHtml(pred.vxShape)}</div>
          <div><strong>• Predicted vᵧ(t):</strong> ${escapeHtml(pred.vyShape)}</div>
          <div><strong>• Predicted aₓ(t):</strong> ${escapeHtml(pred.axShape)}</div>
          <div><strong>• Predicted aᵧ(t):</strong> ${escapeHtml(pred.ayShape)}</div>
          <div style="margin-top:0.3rem;"><strong>• Initial Notes:</strong> ${escapeHtml(pred.initialNotes)}</div>
        `;
      }
    }
  } else {
    controls.forEach(id => {
      const node = el(id);
      if (node) node.disabled = false;
    });
    if (badge) {
      badge.textContent = 'Prediction Required Before Reveal';
      badge.className = 'pct-diff-badge';
    }
    if (btn) {
      btn.textContent = '💾 Save Initial Prediction & Reveal Six-Graph Panel';
      btn.disabled = false;
    }
    if (revealSec) {
      revealSec.style.display = 'none';
    }
    if (summaryBox) {
      summaryBox.innerHTML = '<em>First prediction not saved yet.</em>';
    }
  }
}

// ============================================================================
// Step 2B: Two-Column Six-Graph Panel (Horizontal Left | Vertical Right)
// ============================================================================
function getSixGraphEquationsText() {
  const xFit = state.fitResults.xPos;
  const yFit = state.fitResults.yPos;
  if (!xFit || !yFit) {
    return {
      xPos: 'Track ≥ 3 points to fit x(t)',
      yPos: 'Track ≥ 3 points to fit y(t)',
      xVel: '—',
      yVel: '—',
      xAcc: 'aₓ(t) = 0.000 m/s²',
      yAcc: '—'
    };
  }
  const m = xFit.slope;
  const c = xFit.intercept;
  const A = yFit.A;
  const B = yFit.B;
  const C = yFit.C;
  const ay = 2 * A;

  const signStr = (val) => (val >= 0 ? `+ ${val.toFixed(3)}` : `- ${Math.abs(val).toFixed(3)}`);

  return {
    xPos: `x(t) = (${m.toFixed(3)} m/s)t ${signStr(c)} m   [R² = ${xFit.r2.toFixed(4)}]`,
    yPos: `y(t) = (${A.toFixed(3)} m/s²)t² ${signStr(B)} m/s·t ${signStr(C)} m   [R² = ${yFit.r2.toFixed(4)}]`,
    xVel: `vₓ(t) = ${m.toFixed(3)} m/s   (Derived constant slope from linear x fit)`,
    yVel: `vᵧ(t) = (${ay.toFixed(3)} m/s²)t ${signStr(B)} m/s   (Derived from quadratic y fit)`,
    xAcc: `aₓ(t) = 0.000 m/s²   (Zero in chosen linear x model)`,
    yAcc: `aᵧ(t) = ${ay.toFixed(3)} m/s²   (Derived 2A; Ref aᵧ,ref = -9.8 m/s²)`
  };
}

function buildChartConfigForGraph(type, isExportImage = false) {
  const pts = state.series[state.activeSeries] || [];
  const cov = state.coverageStatus;
  const xFit = state.fitResults.xPos;
  const yFit = state.fitResults.yPos;

  const tMin = cov.tMin || 0;
  const tMax = cov.tMax > tMin ? cov.tMax : 1.0;

  const m = xFit ? xFit.slope : 0;
  const c = xFit ? xFit.intercept : 0;
  const A = yFit ? yFit.A : -4.9;
  const B = yFit ? yFit.B : 0;
  const C = yFit ? yFit.C : 0;
  const ay = 2 * A;

  let datasets = [];
  let yAxisTitle = '';
  let sugMin = 0;
  let sugMax = 2;

  if (type === 'x-pos') {
    yAxisTitle = 'Horizontal Position x (m)';
    const fitLine = [
      { x: tMin, y: m * tMin + c },
      { x: tMax, y: m * tMax + c }
    ];
    datasets = [
      {
        label: 'Tracked x (m)',
        data: pts.map(p => ({ x: p.time, y: p.x })),
        backgroundColor: '#0f7e9b',
        borderColor: '#0f7e9b',
        pointRadius: isExportImage ? 5 : 4
      },
      {
        label: 'Linear Fit x = mt + c',
        data: fitLine,
        type: 'line',
        borderColor: '#095f76',
        borderWidth: isExportImage ? 3 : 2.2,
        pointRadius: 0,
        fill: false
      }
    ];
    const allX = pts.map(p => p.x);
    sugMin = Math.min(0, ...allX);
    sugMax = Math.max(1.0, ...allX) * 1.18;
  } else if (type === 'y-pos') {
    yAxisTitle = 'Vertical Position y (m)';
    const fitLine = [];
    const steps = 45;
    for (let i = 0; i <= steps; i++) {
      const t = tMin + (tMax - tMin) * (i / steps);
      fitLine.push({ x: t, y: A * t * t + B * t + C });
    }
    datasets = [
      {
        label: 'Tracked y (m)',
        data: pts.map(p => ({ x: p.time, y: p.y })),
        backgroundColor: '#d67b19',
        borderColor: '#d67b19',
        pointRadius: isExportImage ? 5 : 4
      },
      {
        label: 'Quadratic Fit y = At² + Bt + C',
        data: fitLine,
        type: 'line',
        borderColor: '#b06210',
        borderWidth: isExportImage ? 3 : 2.2,
        pointRadius: 0,
        fill: false
      }
    ];

    // Optional tangent line if student moved the optional tangent slider
    if (!isExportImage && state.activeTangentTime !== null && yFit) {
      const t0 = Math.max(tMin, Math.min(tMax, state.activeTangentTime));
      const y0Tan = A * t0 * t0 + B * t0 + C;
      const slopeTan = 2 * A * t0 + B;
      const span = Math.max(0.08, (tMax - tMin) * 0.2);
      const t1 = Math.max(tMin, t0 - span);
      const t2 = Math.min(tMax, t0 + span);
      datasets.push({
        label: `Optional Tangent (Slope = ${slopeTan.toFixed(2)} m/s)`,
        data: [
          { x: t1, y: y0Tan + slopeTan * (t1 - t0) },
          { x: t2, y: y0Tan + slopeTan * (t2 - t0) }
        ],
        type: 'line',
        borderColor: '#0f7e9b',
        borderDash: [5, 4],
        borderWidth: 2,
        pointRadius: 3,
        fill: false
      });
    }

    const allY = pts.map(p => p.y);
    sugMin = Math.min(0, ...allY);
    sugMax = Math.max(1.0, ...allY) * 1.22;
  } else if (type === 'x-vel') {
    yAxisTitle = 'Horizontal Velocity vₓ (m/s)';
    datasets = [
      {
        label: `Derived vₓ = ${m.toFixed(3)} m/s`,
        data: [{ x: tMin, y: m }, { x: tMax, y: m }],
        type: 'line',
        borderColor: '#0f7e9b',
        borderWidth: isExportImage ? 3 : 2.5,
        pointRadius: 0,
        fill: false
      }
    ];
    sugMin = Math.min(0, m * 1.2);
    sugMax = Math.max(2.0, m * 1.35);
  } else if (type === 'y-vel') {
    yAxisTitle = 'Vertical Velocity vᵧ (m/s)';
    const vStart = ay * tMin + B;
    const vEnd = ay * tMax + B;
    datasets = [
      {
        label: 'Derived vᵧ = 2At + B',
        data: [{ x: tMin, y: vStart }, { x: tMax, y: vEnd }],
        type: 'line',
        borderColor: '#d67b19',
        borderWidth: isExportImage ? 3 : 2.5,
        pointRadius: 0,
        fill: false
      }
    ];

    // Shade signed ascent and descent areas ONLY if a valid turnaround exists inside (tMin, tMax)
    if (state.showSignedArea && cov.hasValidTurnaround && cov.tZero !== null) {
      const tz = cov.tZero;
      const areaUp = 0.5 * vStart * (tz - tMin);
      const areaDown = 0.5 * vEnd * (tMax - tz);
      datasets.push(
        {
          label: `+Area_up (+${areaUp.toFixed(3)} m)`,
          data: [{ x: tMin, y: vStart }, { x: tz, y: 0 }],
          type: 'line',
          borderColor: 'rgba(15, 126, 155, 0.7)',
          backgroundColor: 'rgba(15, 126, 155, 0.22)',
          borderWidth: 1.5,
          pointRadius: 3,
          fill: 'origin'
        },
        {
          label: `Area_down (${areaDown.toFixed(3)} m)`,
          data: [{ x: tz, y: 0 }, { x: tMax, y: vEnd }],
          type: 'line',
          borderColor: 'rgba(214, 123, 25, 0.7)',
          backgroundColor: 'rgba(214, 123, 25, 0.22)',
          borderWidth: 1.5,
          pointRadius: 3,
          fill: 'origin'
        }
      );
    }

    const maxAbsV = Math.max(4, Math.abs(vStart), Math.abs(vEnd)) * 1.25;
    sugMin = -maxAbsV;
    sugMax = maxAbsV;
  } else if (type === 'x-acc') {
    yAxisTitle = 'Horizontal Acc. aₓ (m/s²)';
    datasets = [
      {
        label: 'Derived aₓ = 0.000 m/s² (Linear x Model)',
        data: [{ x: tMin, y: 0 }, { x: tMax, y: 0 }],
        type: 'line',
        borderColor: '#0f7e9b',
        borderWidth: isExportImage ? 3 : 2.5,
        pointRadius: 0,
        fill: false
      }
    ];
    sugMin = -2;
    sugMax = 2;
  } else if (type === 'y-acc') {
    yAxisTitle = 'Vertical Acc. aᵧ (m/s²)';
    datasets = [
      {
        label: `Derived aᵧ = 2A (${ay.toFixed(3)} m/s²)`,
        data: [{ x: tMin, y: ay }, { x: tMax, y: ay }],
        type: 'line',
        borderColor: '#d67b19',
        borderWidth: isExportImage ? 3 : 2.5,
        pointRadius: 0,
        fill: false
      },
      {
        label: 'Fixed Reference aᵧ,ref = -9.8 m/s²',
        data: [{ x: tMin, y: FIXED_AY_REF }, { x: tMax, y: FIXED_AY_REF }],
        type: 'line',
        borderColor: '#4b6570',
        borderDash: [6, 4],
        borderWidth: 1.8,
        pointRadius: 0,
        fill: false
      }
    ];
    sugMin = Math.min(-13, ay * 1.25);
    sugMax = Math.max(2, ay + 2);
  }

  const fontSize = isExportImage ? 12 : 10;

  return {
    type: 'scatter',
    data: { datasets },
    options: {
      responsive: !isExportImage,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { boxWidth: 12, font: { size: fontSize, weight: 'bold' } }
        }
      },
      scales: {
        x: {
          type: 'linear',
          min: tMin,
          max: tMax,
          title: { display: true, text: 'Time t (s)', font: { size: fontSize, weight: 'bold' } },
          ticks: { font: { size: fontSize - 1 } },
          grid: {
            color: (c) => (c.tick && Math.abs(c.tick.value) < 1e-6) ? '#0f7e9b' : '#eef3f6',
            lineWidth: (c) => (c.tick && Math.abs(c.tick.value) < 1e-6) ? 2 : 1
          }
        },
        y: {
          title: { display: true, text: yAxisTitle, font: { size: fontSize, weight: 'bold' } },
          suggestedMin: sugMin,
          suggestedMax: sugMax,
          ticks: { font: { size: fontSize - 1 } },
          grid: {
            color: (c) => (c.tick && Math.abs(c.tick.value) < 1e-6) ? '#0f7e9b' : '#eef3f6',
            lineWidth: (c) => (c.tick && Math.abs(c.tick.value) < 1e-6) ? 2.5 : 1
          }
        }
      }
    }
  };
}

function renderSixGraphPanel() {
  autoFitAndDeriveAllGraphs();
  const eqs = getSixGraphEquationsText();
  const cov = state.coverageStatus;

  if (el('panelTimeIntervalBadge')) {
    el('panelTimeIntervalBadge').textContent = `Aligned Interval: [${cov.tMin.toFixed(3)} s, ${cov.tMax.toFixed(3)} s] (T = ${cov.T.toFixed(3)} s)`;
  }

  // Update Equation Table & Card Footers
  if (el('eqTableXPos')) el('eqTableXPos').textContent = eqs.xPos;
  if (el('eqTableYPos')) el('eqTableYPos').textContent = eqs.yPos;
  if (el('eqTableXVel')) el('eqTableXVel').textContent = eqs.xVel;
  if (el('eqTableYVel')) el('eqTableYVel').textContent = eqs.yVel;
  if (el('eqTableXAcc')) el('eqTableXAcc').textContent = eqs.xAcc;
  if (el('eqTableYAcc')) el('eqTableYAcc').textContent = eqs.yAcc;

  if (el('gridPartXPos')) el('gridPartXPos').textContent = eqs.xPos;
  if (el('gridPartYPos')) el('gridPartYPos').textContent = eqs.yPos;
  if (el('gridPartXVel')) el('gridPartXVel').textContent = eqs.xVel;
  if (el('gridPartYVel')) el('gridPartYVel').textContent = eqs.yVel;
  if (el('gridPartXAcc')) el('gridPartXAcc').textContent = eqs.xAcc;
  if (el('gridPartYAcc')) el('gridPartYAcc').textContent = eqs.yAcc;

  const panelSpecs = [
    { id: 'canvasGridXPos', type: 'x-pos' },
    { id: 'canvasGridYPos', type: 'y-pos' },
    { id: 'canvasGridXVel', type: 'x-vel' },
    { id: 'canvasGridYVel', type: 'y-vel' },
    { id: 'canvasGridXAcc', type: 'x-acc' },
    { id: 'canvasGridYAcc', type: 'y-acc' }
  ];

  panelSpecs.forEach(spec => {
    const canvas = el(spec.id);
    if (!canvas) return;
    if (gridCharts[spec.id]) {
      gridCharts[spec.id].destroy();
    }
    const cfg = buildChartConfigForGraph(spec.type, false);
    gridCharts[spec.id] = new Chart(canvas.getContext('2d'), cfg);
  });
}

// ============================================================================
// Step 2C: Reference Readouts, Student Work Sync & Practice Feedback
// ============================================================================
function getExpectedPhysicsValues() {
  const cov = state.coverageStatus;
  const xFit = state.fitResults.xPos;
  const yFit = state.fitResults.yPos;
  if (!xFit || !yFit || !cov || cov.y0 === null) return null;

  const T = cov.T;
  const y0 = cov.y0;
  const m = xFit.slope;
  const c = xFit.intercept;
  const A = yFit.A;
  const B = yFit.B;
  const C = yFit.C;
  const ayFit = 2 * A;

  const tUpParsed = parseFloat(state.observedTUp);
  const hasObservedTUp = Number.isFinite(tUpParsed) && tUpParsed > 0;
  const tUp = hasObservedTUp ? tUpParsed : null;

  // Predictions using fixed reference acceleration ay,ref = -9.8 m/s^2 and observed video t_up
  const vy0Pred = tUp !== null ? -FIXED_AY_REF * tUp : null; // 9.8 * t_up
  const dxPred = m * T;
  const dyPred = vy0Pred !== null ? (vy0Pred * T + 0.5 * FIXED_AY_REF * T * T) : null;
  const yFinalPred = dyPred !== null ? (y0 + dyPred) : null;
  const dyUpPred = (vy0Pred !== null && tUp !== null)
    ? (vy0Pred * tUp + 0.5 * FIXED_AY_REF * tUp * tUp)
    : null;
  const yMaxPred = dyUpPred !== null ? (y0 + dyUpPred) : null;

  const v0Pred = vy0Pred !== null ? Math.hypot(m, vy0Pred) : null;
  const thetaPred = (vy0Pred !== null && Math.abs(m) > 1e-6)
    ? (Math.atan2(vy0Pred, m) * 180 / Math.PI)
    : null;

  // Fitted signed-area check values (using derived vy = 2At + B and fitted initial height C)
  const hasTurnaround = cov.hasValidTurnaround && cov.tZero !== null;
  const tZero = hasTurnaround ? cov.tZero : null;
  const areaUp = tZero !== null ? 0.5 * B * tZero : null;
  const vFinalFit = ayFit * T + B;
  const areaDown = tZero !== null ? 0.5 * vFinalFit * (T - tZero) : null;
  const netDyArea = (areaUp !== null && areaDown !== null) ? (areaUp + areaDown) : null;
  const yFinalFromArea = netDyArea !== null ? (C + netDyArea) : null;
  const yFitAtT = A * T * T + B * T + C;

  return {
    T,
    tUp,
    y0,
    x0Track: cov.x0,
    xFinalTrack: cov.xFinal,
    yFinalTrack: cov.yFinal,
    dxTrack: cov.dxTrack,
    dyTrack: cov.dyTrack,
    yMaxTrack: cov.peakPoint ? cov.peakPoint.y : null,
    tPeakTrack: cov.peakPoint ? cov.peakPoint.time : null,
    m,
    c,
    A,
    B,
    C,
    ayFit,
    vy0Pred,
    dxPred,
    dyPred,
    yFinalPred,
    dyUpPred,
    yMaxPred,
    v0Pred,
    thetaPred,
    hasTurnaround,
    tZero,
    areaUp,
    areaDown,
    netDyArea,
    yFinalFromArea,
    yFitAtT
  };
}

function updateReferenceQuantitiesBar() {
  const exp = getExpectedPhysicsValues();
  if (!exp) return;

  if (el('refReadoutT')) el('refReadoutT').textContent = `${exp.T.toFixed(3)} s`;
  if (el('inpCalcTUp') && document.activeElement !== el('inpCalcTUp')) {
    el('inpCalcTUp').value = state.observedTUp || '';
  }
  if (el('refReadoutY0')) el('refReadoutY0').textContent = `y₀ = ${exp.y0.toFixed(3)} m`;
  if (el('refReadoutFitC')) el('refReadoutFitC').textContent = `C = ${exp.C.toFixed(3)} m`;
  if (el('refReadoutEndpoints')) {
    el('refReadoutEndpoints').textContent = `Δx = ${exp.dxTrack.toFixed(3)} m, Δy = ${exp.dyTrack.toFixed(3)} m`;
  }
  if (el('refReadoutYFinal')) {
    el('refReadoutYFinal').textContent = `y(T) = ${exp.yFinalTrack.toFixed(3)} m`;
  }
  if (el('refReadoutYMaxTrack')) {
    el('refReadoutYMaxTrack').textContent = `y_max = ${exp.yMaxTrack.toFixed(3)} m`;
  }
  if (el('refReadoutFitB')) {
    el('refReadoutFitB').textContent = `B = ${exp.B.toFixed(3)} m/s`;
  }
}

function syncStudentInputsFromDOM() {
  const keys = Object.keys(state.studentResponses);
  keys.forEach(k => {
    const node = el(k);
    if (node) {
      state.studentResponses[k] = node.value;
    }
  });
  if (el('txtPredictionRevision')) {
    state.predictionRevision = el('txtPredictionRevision').value;
  }
  if (el('txtGraphConnections')) {
    state.graphConnections = el('txtGraphConnections').value;
  }
  if (el('studentNameInput')) {
    state.studentName = el('studentNameInput').value;
  }
  if (el('teacherSelect')) {
    state.teacherName = el('teacherSelect').value;
  }
  updateWrittenStatusBadges();
}

function populateDOMFromStudentState() {
  Object.keys(state.studentResponses).forEach(k => {
    const node = el(k);
    if (node && state.studentResponses[k] !== undefined) {
      node.value = state.studentResponses[k];
    }
  });
  if (el('txtPredictionRevision')) el('txtPredictionRevision').value = state.predictionRevision || '';
  if (el('txtGraphConnections')) el('txtGraphConnections').value = state.graphConnections || '';
  if (el('studentNameInput')) el('studentNameInput').value = state.studentName || '';
  if (el('teacherSelect') && state.teacherName) el('teacherSelect').value = state.teacherName;
  if (el('inpObservedTUp')) el('inpObservedTUp').value = state.observedTUp || '';
  if (el('inpCalcTUp')) el('inpCalcTUp').value = state.observedTUp || '';
  updateWrittenStatusBadges();
}

function updateWrittenStatusBadges() {
  const revBadge = el('statusRevisionBadge');
  if (revBadge) {
    const hasRev = (state.predictionRevision || '').trim().length >= 10;
    revBadge.textContent = hasRev ? 'Submitted for teacher review' : 'Not submitted';
    revBadge.className = hasRev ? 'pct-diff-badge' : 'pct-diff-badge';
  }

  const connBadge = el('statusConnectionsBadge');
  if (connBadge) {
    const hasConn = (state.graphConnections || '').trim().length >= 15;
    connBadge.textContent = hasConn ? 'Submitted for teacher review' : 'Not submitted';
  }

  const reasonBadge = el('badgeMotionReasoning');
  if (reasonBadge) {
    const sr = state.studentResponses;
    const hasWritten = (sr.txtStopExplanation || '').trim().length >= 10 &&
      (sr.txtAccSignExplanation || '').trim().length >= 10 &&
      (sr.reflectionText || '').trim().length >= 10;
    reasonBadge.textContent = hasWritten ? 'Submitted for teacher review' : 'Not submitted';
  }
}

function setFeedbackBox(boxId, status, message) {
  state.feedbackState[boxId] = { status, text: message };
  const node = el(boxId);
  if (!node) return;
  if (!message) {
    node.style.display = 'none';
    node.textContent = '';
    return;
  }
  node.style.display = 'block';
  node.className = `practice-feedback-msg ${status}`;
  node.innerHTML = message;
}

function checkNumbersForPracticeFeedback() {
  syncStudentInputsFromDOM();
  autoFitAndDeriveAllGraphs();
  const exp = getExpectedPhysicsValues();
  if (!exp) {
    alert('Please track at least 5 airborne points in Step 1 before checking numbers.');
    return;
  }

  const sr = state.studentResponses;
  const parseNum = (str) => {
    if (str === undefined || str === null || String(str).trim() === '') return null;
    const v = parseFloat(str);
    return Number.isFinite(v) ? v : null;
  };
  const withinTol = (val, target, relTol = 0.06, absTol = 0.06) => {
    if (val === null || target === null) return false;
    return Math.abs(val - target) <= Math.max(absTol, Math.abs(target) * relTol);
  };

  // --- 5a: Horizontal velocity v0x = dx / dt ---
  const v0xVal = parseNum(sr.inpVx0);
  let ok5a = false;
  if (v0xVal === null) {
    setFeedbackBox('fb5a', 'hint', 'Enter your calculated horizontal slope v₀ₓ = Δx / Δt (m/s).');
  } else if (withinTol(v0xVal, exp.m)) {
    ok5a = true;
    setFeedbackBox('fb5a', 'good', `✓ Numbers checked: v₀ₓ = ${v0xVal.toFixed(3)} m/s matches the fitted x–t slope (${exp.m.toFixed(3)} m/s). Make sure your written work shows two points and explains why v₀ₓ is constant.`);
  } else {
    setFeedbackBox('fb5a', 'warn', `Check your slope calculation Δx / Δt using two points on the fitted x–t line. Expected slope is near ${exp.m.toFixed(3)} m/s.`);
  }

  // --- 5b: Vertical acceleration ay,fit = dvy / dt ---
  const ayVal = parseNum(sr.inpAy);
  let ok5b = false;
  if (ayVal === null) {
    setFeedbackBox('fb5b', 'hint', 'Enter your calculated slope aᵧ,fit = Δvᵧ / Δt (m/s²) from two points on the derived vᵧ–t line.');
  } else if (ayVal > 0 && withinTol(-ayVal, exp.ayFit)) {
    setFeedbackBox('fb5b', 'warn', 'Check the sign of your vertical acceleration slope: vᵧ decreases over time, so Δvᵧ / Δt must be negative.');
  } else if (withinTol(ayVal, exp.ayFit)) {
    ok5b = true;
    setFeedbackBox('fb5b', 'good', `✓ Numbers checked: aᵧ,fit = ${ayVal.toFixed(3)} m/s² matches the derived vᵧ–t slope (${exp.ayFit.toFixed(3)} m/s²). Remember to compare it with aᵧ,ref = −9.8 m/s² in your written work.`);
  } else {
    setFeedbackBox('fb5b', 'warn', `Check your two-point slope (vᵧ₂ − vᵧ₁)/(t₂ − t₁) on the derived vᵧ–t line (expected near ${exp.ayFit.toFixed(3)} m/s²).`);
  }

  const badgeAB = el('badgeSlopesAB');
  if (badgeAB) {
    badgeAB.textContent = (ok5a && ok5b) ? 'Numbers checked' : 'Check hints below';
    badgeAB.className = `pct-diff-badge ${(ok5a && ok5b) ? 'good' : 'warn'}`;
  }

  // --- 5c: Predicted v0y,pred = -ay,ref * t_up ---
  const vy0PredVal = parseNum(sr.inpVy0Pred);
  let ok5c = false;
  if (exp.tUp === null) {
    setFeedbackBox('fb5c', 'warn', 'First enter your observed video rise time t_up (s) from Step 1.');
  } else if (vy0PredVal === null) {
    setFeedbackBox('fb5c', 'hint', 'Calculate v₀ᵧ,pred = −aᵧ,ref · t_up using aᵧ,ref = −9.8 m/s² and your observed t_up.');
  } else if (vy0PredVal < 0 && withinTol(Math.abs(vy0PredVal), exp.vy0Pred)) {
    setFeedbackBox('fb5c', 'warn', 'Check the sign: at the first tracked frame (t = 0), the ball is moving upward (+y), so v₀ᵧ,pred = −(−9.8 m/s²)·t_up is positive.');
  } else if (withinTol(vy0PredVal, exp.B, 0.01, 0.01) && !withinTol(exp.vy0Pred, exp.B, 0.02, 0.02)) {
    setFeedbackBox('fb5c', 'warn', 'Use v₀ᵧ,pred = −(−9.8 m/s²)·t_up from your observed video rise time t_up rather than copying B directly from the fit; then compare v₀ᵧ,pred with B.');
  } else if (withinTol(vy0PredVal, exp.vy0Pred)) {
    ok5c = true;
    setFeedbackBox('fb5c', 'good', `✓ Numbers checked: v₀ᵧ,pred = ${vy0PredVal.toFixed(3)} m/s (using t_up = ${exp.tUp.toFixed(3)} s and aᵧ,ref = −9.8 m/s²). Compare this with fitted B = ${exp.B.toFixed(3)} m/s in your notes.`);
  } else {
    setFeedbackBox('fb5c', 'warn', `Check your multiplication: v₀ᵧ,pred = −(−9.8 m/s²)(${exp.tUp.toFixed(3)} s) ≈ ${exp.vy0Pred.toFixed(3)} m/s.`);
  }

  // --- 5d: Displacements dx, dy at T and final height y_final = y0 + dy ---
  const dxVal = parseNum(sr.inpCalcRange);
  const dyVal = parseNum(sr.inpPredDy);
  const yfVal = parseNum(sr.inpPredYFinal);
  let ok5d = false;
  if (dxVal === null || dyVal === null || yfVal === null) {
    setFeedbackBox('fb5d', 'hint', 'Enter all three values for 5d: predicted Δx, predicted Δy over duration T, and predicted final height y_final = y₀ + Δy.');
  } else {
    // Allow student to use either their entered v0x/vy0Pred or the exact expected ones
    const usedVx = v0xVal !== null ? v0xVal : exp.m;
    const usedVy0 = vy0PredVal !== null ? vy0PredVal : (exp.vy0Pred || exp.B);
    const targetDx = usedVx * exp.T;
    const targetDy = usedVy0 * exp.T + 0.5 * FIXED_AY_REF * exp.T * exp.T;
    const targetYf = exp.y0 + targetDy;

    const dxMatch = withinTol(dxVal, targetDx) || withinTol(dxVal, exp.dxPred);
    const dyMatch = withinTol(dyVal, targetDy) || withinTol(dyVal, exp.dyPred);
    const yfMatch = withinTol(yfVal, targetYf) || withinTol(yfVal, exp.yFinalPred);

    if (dxMatch && dyMatch && !yfMatch && withinTol(yfVal, dyVal, 0.02, 0.02)) {
      setFeedbackBox('fb5d', 'warn', `Don't forget to add the first tracked height y₀ (${exp.y0.toFixed(3)} m) to Δy to find the final height y_final = y₀ + Δy.`);
    } else if (dxMatch && dyMatch && yfMatch) {
      ok5d = true;
      setFeedbackBox('fb5d', 'good', `✓ Numbers checked: Δx = ${dxVal.toFixed(3)} m, Δy = ${dyVal.toFixed(3)} m, and y_final = ${yfVal.toFixed(3)} m. Make sure your written work compares these with the tracked endpoint changes.`);
    } else {
      setFeedbackBox('fb5d', 'warn', `Check your substitutions over total tracked duration T = ${exp.T.toFixed(3)} s: Δx = v₀ₓT, Δy = v₀ᵧ,pred·T + ½(−9.8)T², and y_final = y₀ + Δy.`);
    }
  }

  // --- 5e: Maximum height using t_up (not T) and measured y0 ---
  const dyUpVal = parseNum(sr.inpPredDyUp);
  const yMaxVal = parseNum(sr.inpCalcMaxHeight);
  let ok5e = false;
  if (exp.tUp === null) {
    setFeedbackBox('fb5e', 'warn', 'Enter observed video t_up first.');
  } else if (dyUpVal === null || yMaxVal === null) {
    setFeedbackBox('fb5e', 'hint', 'Enter both upward displacement Δy_up and maximum height y_max = y₀ + Δy_up.');
  } else {
    const usedVy0 = vy0PredVal !== null ? vy0PredVal : exp.vy0Pred;
    const targetDyUp = usedVy0 * exp.tUp + 0.5 * FIXED_AY_REF * exp.tUp * exp.tUp;
    const targetYMax = exp.y0 + targetDyUp;
    const wrongT_Dy = usedVy0 * exp.T + 0.5 * FIXED_AY_REF * exp.T * exp.T;

    if (withinTol(dyUpVal, wrongT_Dy) && Math.abs(exp.T - exp.tUp) > 0.08) {
      setFeedbackBox('fb5e', 'warn', `Use observed rise time t_up (${exp.tUp.toFixed(3)} s) — NOT total tracked duration T (${exp.T.toFixed(3)} s) — when calculating upward displacement to the apex!`);
    } else if (withinTol(dyUpVal, targetDyUp) && withinTol(yMaxVal, dyUpVal, 0.02, 0.02)) {
      setFeedbackBox('fb5e', 'warn', `Remember to add your first tracked height y₀ (${exp.y0.toFixed(3)} m) to Δy_up to get y_max = y₀ + Δy_up.`);
    } else if ((withinTol(dyUpVal, targetDyUp) || withinTol(dyUpVal, exp.dyUpPred)) &&
               (withinTol(yMaxVal, targetYMax) || withinTol(yMaxVal, exp.yMaxPred))) {
      ok5e = true;
      setFeedbackBox('fb5e', 'good', `✓ Numbers checked: Δy_up = ${dyUpVal.toFixed(3)} m and y_max = ${yMaxVal.toFixed(3)} m (highest tracked point is ${exp.yMaxTrack.toFixed(3)} m).`);
    } else {
      setFeedbackBox('fb5e', 'warn', `Check Δy_up = v₀ᵧ,pred·t_up + ½(−9.8)t_up² using t_up = ${exp.tUp.toFixed(3)} s, then add y₀ = ${exp.y0.toFixed(3)} m.`);
    }
  }

  // --- 5f: Initial speed v0 and launch angle theta ---
  const v0Val = parseNum(sr.inpSpeedV0);
  const thetaVal = parseNum(sr.inpAngleTheta);
  let ok5f = false;
  if (v0Val === null || thetaVal === null) {
    setFeedbackBox('fb5f', 'hint', 'Enter both initial speed v₀ (m/s) and launch angle θ (degrees above +x).');
  } else {
    const usedVx = v0xVal !== null ? v0xVal : exp.m;
    const usedVy0 = vy0PredVal !== null ? vy0PredVal : (exp.vy0Pred || exp.B);
    const targetV0 = Math.hypot(usedVx, usedVy0);
    const targetTheta = Math.atan2(usedVy0, usedVx) * 180 / Math.PI;

    if ((withinTol(v0Val, targetV0) || withinTol(v0Val, exp.v0Pred)) &&
        (withinTol(thetaVal, targetTheta, 0.06, 1.5) || withinTol(thetaVal, exp.thetaPred, 0.06, 1.5))) {
      ok5f = true;
      setFeedbackBox('fb5f', 'good', `✓ Numbers checked: v₀ = ${v0Val.toFixed(3)} m/s at θ = ${thetaVal.toFixed(2)}° above +x.`);
    } else {
      setFeedbackBox('fb5f', 'warn', 'Check v₀ = √(v₀ₓ² + v₀ᵧ,pred²) and θ = tan⁻¹(v₀ᵧ,pred / v₀ₓ) in degrees.');
    }
  }

  const badgeCF = el('badgePredictionsCF');
  if (badgeCF) {
    const allCF = ok5c && ok5d && ok5e && ok5f;
    badgeCF.textContent = allCF ? 'Numbers checked' : 'Check hints below';
    badgeCF.className = `pct-diff-badge ${allCF ? 'good' : 'warn'}`;
  }

  // --- Signed-Area Check on Fitted vy-t & Fitted C ---
  const tzVal = parseNum(sr.inpZeroCrossT);
  const aUpVal = parseNum(sr.inpAreaUp);
  const aDownVal = parseNum(sr.inpAreaDown);
  const netAreaVal = parseNum(sr.inpNetDyArea);
  const yfAreaVal = parseNum(sr.inpYFinalFromArea);
  let okArea = false;

  if (!exp.hasTurnaround) {
    setFeedbackBox('fbSignedArea', 'warn', 'Signed-area split requires a valid turnaround inside [0, T]. Track both ascent and descent in Step 1.');
  } else if (tzVal === null || aUpVal === null || aDownVal === null || netAreaVal === null || yfAreaVal === null) {
    setFeedbackBox('fbSignedArea', 'hint', 'Complete all five signed-area fields: t_zero, +Area_up, Area_down, Δy_area, and C + Δy_area.');
  } else if (aDownVal > 0 && withinTol(-aDownVal, exp.areaDown)) {
    setFeedbackBox('fbSignedArea', 'warn', 'Check the sign of the area below zero — during descent (t > t_zero), vᵧ < 0 so Area_down must be negative!');
  } else if (withinTol(tzVal, exp.tZero) &&
             withinTol(aUpVal, exp.areaUp) &&
             withinTol(aDownVal, exp.areaDown) &&
             withinTol(netAreaVal, exp.netDyArea, 0.08, 0.05) &&
             withinTol(yfAreaVal, exp.yFinalFromArea, 0.08, 0.05)) {
    okArea = true;
    setFeedbackBox('fbSignedArea', 'good', `✓ Numbers checked: C + Δy_area = ${yfAreaVal.toFixed(3)} m matches the fitted vertical position y_fit(T) = ${exp.yFitAtT.toFixed(3)} m.`);
  } else {
    setFeedbackBox('fbSignedArea', 'warn', `Check your triangle areas on the fitted vᵧ–t line: t_zero = −B/(2A) ≈ ${exp.tZero.toFixed(3)} s, +Area_up = ½·B·t_zero, Area_down = ½·vᵧ(T)·(T − t_zero) (negative!), and add fitted C = ${exp.C.toFixed(3)} m.`);
  }

  const badgeArea = el('badgeSignedAreaVerify');
  if (badgeArea) {
    badgeArea.textContent = okArea ? 'Numbers checked' : 'Check hints below';
    badgeArea.className = `pct-diff-badge ${okArea ? 'good' : 'warn'}`;
  }

  // --- Direction Intervals & Negative Acceleration Interval ---
  const pStart = parseNum(sr.inpPosDirStart);
  const pEnd = parseNum(sr.inpPosDirEnd);
  const nStart = parseNum(sr.inpNegDirStart);
  const nEnd = parseNum(sr.inpNegDirEnd);
  const accStart = parseNum(sr.inpNegAccStart);
  const accEnd = parseNum(sr.inpNegAccEnd);

  if (!exp.hasTurnaround) {
    setFeedbackBox('fbIntervals', 'warn', 'Cannot verify upward/downward intervals until the tracked trajectory includes an interior apex.');
  } else if (pStart === null || pEnd === null || nStart === null || nEnd === null) {
    setFeedbackBox('fbIntervals', 'hint', 'Enter the time bounds for both the upward interval (vᵧ > 0) and downward interval (vᵧ < 0), excluding the instant t_zero where vᵧ = 0.');
  } else if (withinTol(pStart, 0, 0.05, 0.03) &&
             withinTol(pEnd, exp.tZero, 0.06, 0.04) &&
             withinTol(nStart, exp.tZero, 0.06, 0.04) &&
             withinTol(nEnd, exp.T, 0.06, 0.04)) {
    const accOk = accStart !== null && accEnd !== null &&
      withinTol(accStart, 0, 0.05, 0.03) && withinTol(accEnd, exp.T, 0.06, 0.04);
    if (accOk) {
      setFeedbackBox('fbIntervals', 'good', `✓ Interval bounds checked: Upward on (0.000 s, ${exp.tZero.toFixed(3)} s), downward on (${exp.tZero.toFixed(3)} s, ${exp.T.toFixed(3)} s) excluding the turnaround instant t_zero, and aᵧ < 0 throughout [0.000 s, ${exp.T.toFixed(3)} s]. Written explanations are submitted for teacher review.`);
    } else {
      setFeedbackBox('fbIntervals', 'warn', `Upward and downward intervals match! Check the interval where aᵧ < 0 (gravity acts downward throughout the entire airborne flight [0, ${exp.T.toFixed(3)} s]).`);
    }
  } else {
    setFeedbackBox('fbIntervals', 'warn', `Check your direction intervals: upward motion (vᵧ > 0) is from 0 to t_zero (${exp.tZero.toFixed(3)} s), and downward motion (vᵧ < 0) is from t_zero (${exp.tZero.toFixed(3)} s) to T (${exp.T.toFixed(3)} s), excluding the turnaround instant.`);
  }

  state.feedbackState.checkedAt = new Date().toISOString();
  updateWrittenStatusBadges();
}

// ============================================================================
// Step 3: 10-Point Rubric Status & Non-Truncated Printable Report
// ============================================================================
function updateRubricChecklistUI() {
  syncStudentInputsFromDOM();
  autoFitAndDeriveAllGraphs();
  const cov = state.coverageStatus;
  const sr = state.studentResponses;
  const hasVal = (v) => v !== undefined && v !== null && String(v).trim() !== '';

  // Criterion 1 (2 pts): Calibration & tracking evidence
  const c1Ok = cov.hasEnoughPoints && cov.hasValidTurnaround && hasVal(state.observedTUp);
  if (el('chkStatus1')) {
    el('chkStatus1').innerHTML = c1Ok
      ? '<span class="pct-diff-badge good">Ready (Tracked + t_up)</span>'
      : '<span class="pct-diff-badge warn">Needs ≥8 pts + apex + t_up</span>';
  }

  // Criterion 2 (2 pts): Saved predictions, reasoned revision & graph connections
  const c2Ok = state.firstAttemptPrediction.isSaved &&
    hasVal(state.predictionRevision) &&
    hasVal(state.graphConnections);
  if (el('chkStatus2')) {
    el('chkStatus2').innerHTML = c2Ok
      ? '<span class="pct-diff-badge good">Included in Report</span>'
      : '<span class="pct-diff-badge warn">Save prediction + revision + connections</span>';
  }

  // Criterion 3 (2 pts): Shown slopes & 5c–5f calculations
  const c3Ok = hasVal(sr.inpVx0) && hasVal(sr.work5aVx) &&
    hasVal(sr.inpAy) && hasVal(sr.work5bAy) &&
    hasVal(sr.inpVy0Pred) && hasVal(sr.work5cVy0) &&
    hasVal(sr.inpCalcRange) && hasVal(sr.inpPredDy) && hasVal(sr.inpPredYFinal) && hasVal(sr.work5dDisp) &&
    hasVal(sr.inpPredDyUp) && hasVal(sr.inpCalcMaxHeight) && hasVal(sr.workMaxHeight) &&
    hasVal(sr.inpSpeedV0) && hasVal(sr.inpAngleTheta) && hasVal(sr.workVector);
  if (el('chkStatus3')) {
    el('chkStatus3').innerHTML = c3Ok
      ? '<span class="pct-diff-badge good">All 5a–5f Submitted</span>'
      : '<span class="pct-diff-badge warn">Some 5a–5f fields blank</span>';
  }

  // Criterion 4 (3 pts): Signed area, initial height, direction intervals & apex reasoning
  const c4Ok = hasVal(sr.inpZeroCrossT) && hasVal(sr.inpAreaUp) && hasVal(sr.inpAreaDown) &&
    hasVal(sr.inpNetDyArea) && hasVal(sr.inpYFinalFromArea) && hasVal(sr.workSignedArea) &&
    hasVal(sr.inpPosDirStart) && hasVal(sr.inpPosDirEnd) &&
    hasVal(sr.inpNegDirStart) && hasVal(sr.inpNegDirEnd) &&
    hasVal(sr.txtStopExplanation) && hasVal(sr.txtAccSignExplanation);
  if (el('chkStatus4')) {
    el('chkStatus4').innerHTML = c4Ok
      ? '<span class="pct-diff-badge good">Included in Report</span>'
      : '<span class="pct-diff-badge warn">Complete area &amp; interval fields</span>';
  }

  // Criterion 5 (1 pt): Specific measurement limitation
  const c5Ok = hasVal(sr.reflectionText) && sr.reflectionText.trim().length >= 15;
  if (el('chkStatus5')) {
    el('chkStatus5').innerHTML = c5Ok
      ? '<span class="pct-diff-badge good">Included in Report</span>'
      : '<span class="pct-diff-badge warn">Not submitted</span>';
  }

  const readyCount = [c1Ok, c2Ok, c3Ok, c4Ok, c5Ok].filter(Boolean).length;
  const badge = el('rubricReadinessBadge');
  if (badge) {
    badge.textContent = `${readyCount} / 5 Rubric Sections Populated`;
    badge.className = `pct-diff-badge ${readyCount === 5 ? 'good' : 'warn'}`;
  }
}

// High-resolution snapshot of video + calibration stick + origin + tracked trajectory
function getVideoSnapshotData() {
  const w = 880;
  const h = 495;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = w;
  offCanvas.height = h;
  const offCtx = offCanvas.getContext('2d');

  offCtx.fillStyle = '#f8fafc';
  offCtx.fillRect(0, 0, w, h);

  if (!state.isSynthetic && video && video.videoWidth > 0) {
    try {
      offCtx.drawImage(video, 0, 0, w, h);
    } catch (e) {}
  } else if (state.isSynthetic && state.syntheticCanvas) {
    renderSyntheticFrame(state.currentTime);
    try {
      offCtx.drawImage(state.syntheticCanvas, 0, 0, w, h);
    } catch (e) {}
  }

  const srcW = (overlayCanvas && overlayCanvas.width > 0) ? overlayCanvas.width : w;
  const srcH = (overlayCanvas && overlayCanvas.height > 0) ? overlayCanvas.height : h;
  const scaleX = w / srcW;
  const scaleY = h / srcH;

  // Draw Origin Axes
  if (state.origin) {
    const ox = state.origin.x * scaleX;
    const oy = state.origin.y * scaleY;
    offCtx.save();
    offCtx.translate(ox, oy);
    offCtx.rotate(-(state.originAngle || 0));

    offCtx.strokeStyle = '#0f7e9b';
    offCtx.lineWidth = 2.8;
    offCtx.beginPath();
    offCtx.moveTo(-35, 0);
    offCtx.lineTo(135, 0);
    offCtx.stroke();

    offCtx.strokeStyle = '#d67b19';
    offCtx.lineWidth = 2.8;
    offCtx.beginPath();
    offCtx.moveTo(0, 35);
    offCtx.lineTo(0, -135);
    offCtx.stroke();

    offCtx.fillStyle = '#0f7e9b';
    offCtx.beginPath();
    offCtx.arc(0, 0, 7, 0, Math.PI * 2);
    offCtx.fill();
    offCtx.strokeStyle = '#ffffff';
    offCtx.lineWidth = 2;
    offCtx.stroke();

    offCtx.font = 'bold 12px sans-serif';
    offCtx.fillStyle = '#0f7e9b';
    offCtx.fillText('+x', 140, 4);
    offCtx.fillStyle = '#d67b19';
    offCtx.fillText('+y', -12, -142);
    offCtx.restore();
  }

  // Draw Scale Stick
  if (state.scaleStick && state.scaleStick.start && state.scaleStick.end) {
    const sx = state.scaleStick.start.x * scaleX;
    const sy = state.scaleStick.start.y * scaleY;
    const ex = state.scaleStick.end.x * scaleX;
    const ey = state.scaleStick.end.y * scaleY;

    offCtx.save();
    offCtx.strokeStyle = '#d67b19';
    offCtx.lineWidth = 3;
    offCtx.beginPath();
    offCtx.moveTo(sx, sy);
    offCtx.lineTo(ex, ey);
    offCtx.stroke();

    const midX = (sx + ex) / 2;
    const midY = (sy + ey) / 2;
    const label = `Scale: ${state.scaleStick.lengthMeters.toFixed(2)} m`;
    offCtx.font = 'bold 11px sans-serif';
    const tw = offCtx.measureText(label).width;
    offCtx.fillStyle = '#ffffff';
    offCtx.fillRect(midX - tw / 2 - 6, midY - 22, tw + 12, 18);
    offCtx.strokeStyle = '#d67b19';
    offCtx.strokeRect(midX - tw / 2 - 6, midY - 22, tw + 12, 18);
    offCtx.fillStyle = '#b06210';
    offCtx.fillText(label, midX - tw / 2, midY - 9);
    offCtx.restore();
  }

  // Draw Tracked Points
  const pts = state.series[state.activeSeries] || [];
  if (pts.length > 0) {
    offCtx.strokeStyle = 'rgba(15, 126, 155, 0.8)';
    offCtx.lineWidth = 2.2;
    offCtx.beginPath();
    pts.forEach((p, idx) => {
      const px = p.videoX * scaleX;
      const py = p.videoY * scaleY;
      if (idx === 0) offCtx.moveTo(px, py);
      else offCtx.lineTo(px, py);
    });
    offCtx.stroke();

    pts.forEach((p, idx) => {
      const px = p.videoX * scaleX;
      const py = p.videoY * scaleY;
      offCtx.beginPath();
      offCtx.arc(px, py, 6, 0, Math.PI * 2);
      offCtx.fillStyle = idx === 0 ? '#1a7f37' : '#d67b19';
      offCtx.fill();
      offCtx.strokeStyle = '#ffffff';
      offCtx.lineWidth = 1.8;
      offCtx.stroke();

      offCtx.fillStyle = '#123140';
      offCtx.font = 'bold 10px monospace';
      offCtx.fillText(`${idx + 1}`, px + 7, py - 5);
    });
  }

  return offCanvas.toDataURL('image/png');
}

function generateChartImageData(type) {
  const pts = state.series[state.activeSeries] || [];
  if (pts.length < 3) return null;

  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 400;
  const cCtx = canvas.getContext('2d');
  cCtx.fillStyle = '#ffffff';
  cCtx.fillRect(0, 0, canvas.width, canvas.height);

  const cfg = buildChartConfigForGraph(type, true);
  const tempChart = new Chart(cCtx, cfg);
  tempChart.update();
  const dataUrl = canvas.toDataURL('image/png');
  tempChart.destroy();
  return dataUrl;
}

// Strict helper: NEVER fall back to model answers when formatting student work!
function fmtStudentVal(rawVal, unit = '') {
  if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
    return '<span class="not-submitted-tag">Not submitted</span>';
  }
  return `<strong>${escapeHtml(String(rawVal).trim())}${unit ? ' ' + escapeHtml(unit) : ''}</strong>`;
}

function fmtStudentText(rawText) {
  if (rawText === undefined || rawText === null || String(rawText).trim() === '') {
    return '<span class="not-submitted-tag">Not submitted</span>';
  }
  return `<div class="report-work-text">${escapeHtml(String(rawText).trim())}</div>`;
}

function preparePrintableReport() {
  syncStudentInputsFromDOM();
  autoFitAndDeriveAllGraphs();

  const exp = getExpectedPhysicsValues();
  const cov = state.coverageStatus;
  const eqs = getSixGraphEquationsText();
  const sr = state.studentResponses;
  const pred = state.firstAttemptPrediction;

  const sName = (state.studentName || '').trim() || 'Not submitted';
  const tName = (state.teacherName || '').trim() || 'Physics Teacher';
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const clipSourceLabel = state.isSynthetic
    ? (SYNTHETIC_MODELS[state.syntheticType] ? SYNTHETIC_MODELS[state.syntheticType].label : 'SYNTHETIC MODEL CLIP (Practice)')
    : `MEASURED VIDEO FILE (${state.videoFileName || 'Local Video'})`;

  const videoSnap = getVideoSnapshotData();
  const imgXPos = generateChartImageData('x-pos');
  const imgYPos = generateChartImageData('y-pos');
  const imgXVel = generateChartImageData('x-vel');
  const imgYVel = generateChartImageData('y-vel');
  const imgXAcc = generateChartImageData('x-acc');
  const imgYAcc = generateChartImageData('y-acc');

  const pts = state.series[state.activeSeries] || [];

  const firstPredHtml = pred.isSaved
    ? (pred.isLegacyMissing
      ? '<em>Not recorded in legacy v1.0 session file.</em>'
      : `
        <div><strong>• Predicted vₓ(t):</strong> ${escapeHtml(pred.vxShape)}</div>
        <div><strong>• Predicted vᵧ(t):</strong> ${escapeHtml(pred.vyShape)}</div>
        <div><strong>• Predicted aₓ(t):</strong> ${escapeHtml(pred.axShape)}</div>
        <div><strong>• Predicted aᵧ(t):</strong> ${escapeHtml(pred.ayShape)}</div>
        <div style="margin-top:0.25rem;"><strong>• Initial Prediction Notes:</strong> ${escapeHtml(pred.initialNotes)}</div>
      `)
    : '<span class="not-submitted-tag">Not submitted (Prediction not saved before reveal)</span>';

  const reportHtml = `
    <div class="lab-report-document">
      <!-- Report Header -->
      <header class="report-doc-header">
        <div>
          <div class="report-doc-kicker">THE THINKING EXPERIMENT &bull; PROJECTILE VIDEO PROJECT REPORT</div>
          <h1 class="report-doc-title">2D Projectile Motion &amp; Kinematic Graph Analysis</h1>
          <div class="report-doc-meta">
            <span><strong>Student:</strong> ${escapeHtml(sName)}</span>
            <span><strong>Teacher:</strong> ${escapeHtml(tName)}</span>
            <span><strong>Date:</strong> ${escapeHtml(dateStr)}</span>
          </div>
        </div>
        <div class="report-source-badge">
          ${escapeHtml(clipSourceLabel)}
        </div>
      </header>

      <!-- SECTION 1: Calibration, Setup Quantities & Tracked Flight Evidence (Directions 1–2) -->
      <section class="report-section">
        <h2 class="report-section-title">1. Calibration, Coordinate Setup &amp; Tracked Flight Evidence (Directions 1–2)</h2>
        ${!cov.hasValidTurnaround ? `
          <div style="margin-bottom:0.65rem; padding:0.5rem 0.75rem; background:#fef2f2; border:1.5px solid #dc2626; border-radius:6px; color:#991b1b; font-size:0.82rem;">
            <strong>⚠️ Coverage Notice:</strong> ${escapeHtml(cov.message)}
          </div>
        ` : ''}
        <div class="report-setup-grid">
          <div>
            <img src="${videoSnap}" alt="Calibrated Video Tracking Screenshot" class="report-snapshot-img">
          </div>
          <div>
            <table class="report-table">
              <thead>
                <tr>
                  <th colspan="2">Recorded Setup, Timing &amp; Fit Reference Summary</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Video Source Type</strong></td>
                  <td>${escapeHtml(clipSourceLabel)}</td>
                </tr>
                <tr>
                  <td><strong>Calibration Reference &amp; Scale</strong></td>
                  <td>${state.scaleStick.lengthMeters.toFixed(2)} m (${state.pixelsPerMeter.toFixed(1)} px/m)</td>
                </tr>
                <tr>
                  <td><strong>Source Frame Rate (FPS)</strong></td>
                  <td>${state.fps} FPS (&Delta;t<sub>frame</sub> = ${(1 / state.fps).toFixed(4)} s)</td>
                </tr>
                <tr>
                  <td><strong>Origin &amp; Sign Convention</strong></td>
                  <td>+x right, +y up; y = 0 at ground reference, x = 0 below release</td>
                </tr>
                <tr>
                  <td><strong>First Tracked Airborne Frame (t = 0)</strong></td>
                  <td>Measured initial height y<sub>0</sub> = <strong>${exp ? exp.y0.toFixed(3) + ' m' : '—'}</strong> (x<sub>0</sub> = ${exp ? exp.x0Track.toFixed(3) + ' m' : '—'})</td>
                </tr>
                <tr>
                  <td><strong>Total Tracked Duration T</strong></td>
                  <td><strong>${exp ? exp.T.toFixed(3) + ' s' : '—'}</strong> (${pts.length} tracked instants over [0.000 s, ${exp ? exp.tMax.toFixed(3) : '0.000'} s])</td>
                </tr>
                <tr>
                  <td><strong>Observed Video Rise Time t<sub>up</sub></strong></td>
                  <td>${fmtStudentVal(state.observedTUp, 's')} <span style="color:#4b6570; font-size:0.75rem;">(Highest tracked point: ${exp && exp.yMaxTrack !== null ? `${exp.yMaxTrack.toFixed(3)} m at t = ${exp.tPeakTrack.toFixed(3)} s` : '—'})</span></td>
                </tr>
                <tr>
                  <td><strong>Tracked Endpoint Changes at T</strong></td>
                  <td>&Delta;x<sub>track</sub> = ${exp ? exp.dxTrack.toFixed(3) + ' m' : '—'}, &Delta;y<sub>track</sub> = ${exp ? exp.dyTrack.toFixed(3) + ' m' : '—'}, y(T) = ${exp ? exp.yFinalTrack.toFixed(3) + ' m' : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- SECTION 2: Saved Predictions, Reasoned Revisions & Two-Column Six-Graph Panel (Directions 3–4) -->
      <section class="report-section">
        <h2 class="report-section-title">2. Saved Predictions, Reasoned Revisions &amp; Six-Graph Panel (Directions 3–4)</h2>
        <div class="report-two-col" style="margin-bottom: 0.75rem;">
          <div class="report-box">
            <div class="report-box-title">Saved First-Attempt Prediction (Before Reveal)</div>
            <div style="font-size: 0.8rem; line-height: 1.45;">${firstPredHtml}</div>
            <div class="report-box-title" style="margin-top: 0.55rem; color: #b06210;">Reasoned Revision After Reveal</div>
            ${fmtStudentText(state.predictionRevision)}
          </div>
          <div class="report-box">
            <div class="report-box-title">Explanation of Graph Connections &amp; Model Dependence (Direction 4)</div>
            ${fmtStudentText(state.graphConnections)}
            <div style="margin-top: 0.5rem; padding-top: 0.45rem; border-top: 1px dashed #c8dbe3; font-size: 0.76rem; color: #123140;">
              <div><strong>Fitted x(t):</strong> <code>${escapeHtml(eqs.xPos)}</code></div>
              <div><strong>Derived v<sub>x</sub>(t) &amp; a<sub>x</sub>(t):</strong> <code>vₓ = ${exp ? exp.m.toFixed(3) : '—'} m/s</code>, <code>aₓ = 0.000 m/s²</code> (follows from linear x model)</div>
              <div><strong>Fitted y(t):</strong> <code>${escapeHtml(eqs.yPos)}</code> (Measured y<sub>0</sub> = ${exp ? exp.y0.toFixed(3) : '—'} m vs. Fitted C = ${exp ? exp.C.toFixed(3) : '—'} m)</div>
              <div><strong>Derived v<sub>y</sub>(t) &amp; a<sub>y</sub>(t):</strong> <code>${escapeHtml(eqs.yVel)}</code>, <code>aᵧ = ${exp ? exp.ayFit.toFixed(3) : '—'} m/s²</code></div>
            </div>
          </div>
        </div>

        <!-- Two-Column Six-Graph Panel (Horizontal Left | Vertical Right) -->
        <div class="report-six-graph-grid">
          <div class="report-graph-cell">
            <div class="report-graph-hdr">Horizontal Position: x vs. t (m, s) &bull; Tracked + Linear Fit</div>
            ${imgXPos ? `<img src="${imgXPos}" alt="x(t) graph">` : '<div class="not-submitted-tag">Insufficient points</div>'}
            <div class="report-graph-eq">${escapeHtml(eqs.xPos)}</div>
          </div>
          <div class="report-graph-cell">
            <div class="report-graph-hdr amber">Vertical Position: y vs. t (m, s) &bull; Tracked + Quadratic Fit</div>
            ${imgYPos ? `<img src="${imgYPos}" alt="y(t) graph">` : '<div class="not-submitted-tag">Insufficient points</div>'}
            <div class="report-graph-eq">${escapeHtml(eqs.yPos)}</div>
          </div>
          <div class="report-graph-cell">
            <div class="report-graph-hdr">Horizontal Velocity: v<sub>x</sub> vs. t (m/s, s) &bull; Derived (v<sub>x</sub> = m)</div>
            ${imgXVel ? `<img src="${imgXVel}" alt="vx(t) graph">` : '<div class="not-submitted-tag">Insufficient points</div>'}
            <div class="report-graph-eq">${escapeHtml(eqs.xVel)}</div>
          </div>
          <div class="report-graph-cell">
            <div class="report-graph-hdr amber">Vertical Velocity: v<sub>y</sub> vs. t (m/s, s) &bull; Derived (v<sub>y</sub> = 2At + B)</div>
            ${imgYVel ? `<img src="${imgYVel}" alt="vy(t) graph">` : '<div class="not-submitted-tag">Insufficient points</div>'}
            <div class="report-graph-eq">${escapeHtml(eqs.yVel)}</div>
          </div>
          <div class="report-graph-cell">
            <div class="report-graph-hdr">Horizontal Acceleration: a<sub>x</sub> vs. t (m/s², s) &bull; Derived (Linear Model)</div>
            ${imgXAcc ? `<img src="${imgXAcc}" alt="ax(t) graph">` : '<div class="not-submitted-tag">Insufficient points</div>'}
            <div class="report-graph-eq">${escapeHtml(eqs.xAcc)}</div>
          </div>
          <div class="report-graph-cell">
            <div class="report-graph-hdr amber">Vertical Acceleration: a<sub>y</sub> vs. t (m/s², s) &bull; Derived (a<sub>y</sub> = 2A)</div>
            ${imgYAcc ? `<img src="${imgYAcc}" alt="ay(t) graph">` : '<div class="not-submitted-tag">Insufficient points</div>'}
            <div class="report-graph-eq">${escapeHtml(eqs.yAcc)}</div>
          </div>
        </div>
      </section>

      <!-- SECTION 3: Slopes & Projectile Model Calculations (Student Steps 5a–5f) -->
      <section class="report-section">
        <h2 class="report-section-title">3. Shown Slope Calculations &amp; Projectile Predictions (Steps 5a–5f; Fixed a<sub>y,ref</sub> = &minus;9.8 m/s²)</h2>
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 22%;">Calculation Step</th>
              <th style="width: 24%;">Student Submitted Value(s)</th>
              <th style="width: 22%;">Model / Fit Reference Check</th>
              <th style="width: 32%;">Student Equations, Substitutions, Units &amp; Comparison Work</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>5a. Horizontal Velocity</strong><br><small>Slope v<sub>0x</sub> = &Delta;x / &Delta;t on fitted x–t line</small></td>
              <td>
                <div>Pt 1: ${fmtStudentVal(sr.inp5aPt1)}</div>
                <div>Pt 2: ${fmtStudentVal(sr.inp5aPt2)}</div>
                <div>v<sub>0x</sub>: ${fmtStudentVal(sr.inpVx0, 'm/s')}</div>
              </td>
              <td>Fitted slope m = <strong>${exp ? exp.m.toFixed(3) + ' m/s' : '—'}</strong></td>
              <td>${fmtStudentText(sr.work5aVx)}</td>
            </tr>
            <tr>
              <td><strong>5b. Vertical Acceleration</strong><br><small>Slope a<sub>y,fit</sub> = &Delta;v<sub>y</sub> / &Delta;t on derived v<sub>y</sub>–t line</small></td>
              <td>
                <div>Pt 1: ${fmtStudentVal(sr.inp5bPt1)}</div>
                <div>Pt 2: ${fmtStudentVal(sr.inp5bPt2)}</div>
                <div>a<sub>y,fit</sub>: ${fmtStudentVal(sr.inpAy, 'm/s²')}</div>
              </td>
              <td>Derived 2A = <strong>${exp ? exp.ayFit.toFixed(3) + ' m/s²' : '—'}</strong><br>Ref a<sub>y,ref</sub> = <strong>&minus;9.8 m/s²</strong></td>
              <td>${fmtStudentText(sr.work5bAy)}</td>
            </tr>
            <tr>
              <td><strong>5c. Initial Vertical Velocity</strong><br><small>v<sub>0y,pred</sub> = &minus;a<sub>y,ref</sub> t<sub>up</sub> vs. fitted B</small></td>
              <td>
                <div>Observed t<sub>up</sub>: ${fmtStudentVal(state.observedTUp, 's')}</div>
                <div>v<sub>0y,pred</sub>: ${fmtStudentVal(sr.inpVy0Pred, 'm/s')}</div>
              </td>
              <td>
                Ref &minus;(&minus;9.8)t<sub>up</sub>: <strong>${exp && exp.vy0Pred !== null ? exp.vy0Pred.toFixed(3) + ' m/s' : 'Requires t_up'}</strong><br>
                Fitted B: <strong>${exp ? exp.B.toFixed(3) + ' m/s' : '—'}</strong>
              </td>
              <td>${fmtStudentText(sr.work5cVy0)}</td>
            </tr>
            <tr>
              <td><strong>5d. Displacements &amp; Final Height at T</strong><br><small>&Delta;x, &Delta;y over T, and y<sub>final</sub> = y<sub>0</sub> + &Delta;y</small></td>
              <td>
                <div>Pred &Delta;x: ${fmtStudentVal(sr.inpCalcRange, 'm')}</div>
                <div>Pred &Delta;y: ${fmtStudentVal(sr.inpPredDy, 'm')}</div>
                <div>Pred y<sub>final</sub>: ${fmtStudentVal(sr.inpPredYFinal, 'm')}</div>
              </td>
              <td>
                Pred &Delta;x = ${exp ? exp.dxPred.toFixed(3) + ' m' : '—'} (Track: ${exp ? exp.dxTrack.toFixed(3) + ' m' : '—'})<br>
                Pred &Delta;y = ${exp && exp.dyPred !== null ? exp.dyPred.toFixed(3) + ' m' : '—'} (Track: ${exp ? exp.dyTrack.toFixed(3) + ' m' : '—'})<br>
                Pred y<sub>final</sub> = ${exp && exp.yFinalPred !== null ? exp.yFinalPred.toFixed(3) + ' m' : '—'} (Track: ${exp ? exp.yFinalTrack.toFixed(3) + ' m' : '—'})
              </td>
              <td>${fmtStudentText(sr.work5dDisp)}</td>
            </tr>
            <tr>
              <td><strong>5e. Maximum Height at t<sub>up</sub></strong><br><small>Using t<sub>up</sub> (not T) and measured y<sub>0</sub></small></td>
              <td>
                <div>Pred &Delta;y<sub>up</sub>: ${fmtStudentVal(sr.inpPredDyUp, 'm')}</div>
                <div>Pred y<sub>max</sub>: ${fmtStudentVal(sr.inpCalcMaxHeight, 'm')}</div>
              </td>
              <td>
                Pred &Delta;y<sub>up</sub> = ${exp && exp.dyUpPred !== null ? exp.dyUpPred.toFixed(3) + ' m' : '—'}<br>
                Pred y<sub>max</sub> = ${exp && exp.yMaxPred !== null ? exp.yMaxPred.toFixed(3) + ' m' : '—'}<br>
                Highest tracked y = <strong>${exp && exp.yMaxTrack !== null ? exp.yMaxTrack.toFixed(3) + ' m' : '—'}</strong>
              </td>
              <td>${fmtStudentText(sr.workMaxHeight)}</td>
            </tr>
            <tr>
              <td><strong>5f. Initial Speed &amp; Launch Angle</strong><br><small>At first tracked airborne instant (t = 0)</small></td>
              <td>
                <div>Speed v<sub>0</sub>: ${fmtStudentVal(sr.inpSpeedV0, 'm/s')}</div>
                <div>Angle &theta;: ${fmtStudentVal(sr.inpAngleTheta, '°')}</div>
              </td>
              <td>
                Ref v<sub>0</sub> = ${exp && exp.v0Pred !== null ? exp.v0Pred.toFixed(3) + ' m/s' : '—'}<br>
                Ref &theta; = ${exp && exp.thetaPred !== null ? exp.thetaPred.toFixed(2) + '°' : '—'}
              </td>
              <td>${fmtStudentText(sr.workVector)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- SECTION 4: Signed-Area Consistency Check, Direction Intervals & Limitation -->
      <section class="report-section">
        <h2 class="report-section-title">4. Signed-Area Check, Motion Intervals, Apex Reasoning &amp; Measurement Limitation</h2>
        <div class="report-box" style="margin-bottom: 0.75rem;">
          <div class="report-box-title">Signed-Area Check on Derived v<sub>y</sub>–t Graph (Using Fitted v<sub>y</sub> = 2At + B and Fitted Initial Height C)</div>
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; font-size: 0.78rem; margin-bottom: 0.45rem;">
            <div>Zero Crossing t<sub>zero</sub>:<br>${fmtStudentVal(sr.inpZeroCrossT, 's')}<br><small style="color:#4b6570;">(Fit: ${exp && exp.tZero !== null ? exp.tZero.toFixed(3) + ' s' : 'N/A'})</small></div>
            <div>Ascent +Area<sub>up</sub>:<br>${fmtStudentVal(sr.inpAreaUp, 'm')}<br><small style="color:#4b6570;">(Fit: ${exp && exp.areaUp !== null ? '+' + exp.areaUp.toFixed(3) + ' m' : 'N/A'})</small></div>
            <div>Descent Area<sub>down</sub>:<br>${fmtStudentVal(sr.inpAreaDown, 'm')}<br><small style="color:#4b6570;">(Fit: ${exp && exp.areaDown !== null ? exp.areaDown.toFixed(3) + ' m' : 'N/A'})</small></div>
            <div>Sum &Delta;y<sub>area</sub>:<br>${fmtStudentVal(sr.inpNetDyArea, 'm')}<br><small style="color:#4b6570;">(Fit: ${exp && exp.netDyArea !== null ? exp.netDyArea.toFixed(3) + ' m' : 'N/A'})</small></div>
            <div>Fitted C + &Delta;y<sub>area</sub>:<br>${fmtStudentVal(sr.inpYFinalFromArea, 'm')}<br><small style="color:#4b6570;">(y<sub>fit</sub>(T) = ${exp ? exp.yFitAtT.toFixed(3) + ' m' : '—'})</small></div>
          </div>
          <div style="font-size: 0.78rem; font-weight: 700; color: #0f7e9b; margin-bottom: 0.2rem;">Student Area Calculations &amp; Comparison with y<sub>fit</sub>(T):</div>
          ${fmtStudentText(sr.workSignedArea)}
        </div>

        <div class="report-two-col" style="margin-bottom: 0.75rem;">
          <div class="report-box">
            <div class="report-box-title">Upward &amp; Downward Intervals (Excluding Turnaround) &amp; Meaning of v<sub>y</sub> = 0 in 2D</div>
            <div style="font-size: 0.78rem; margin-bottom: 0.35rem;">
              <div><strong>Upward Interval (v<sub>y</sub> &gt; 0):</strong> ${fmtStudentVal(sr.inpPosDirStart, 's')} &lt; t &lt; ${fmtStudentVal(sr.inpPosDirEnd, 's')}</div>
              <div><strong>Downward Interval (v<sub>y</sub> &lt; 0):</strong> ${fmtStudentVal(sr.inpNegDirStart, 's')} &lt; t &lt; ${fmtStudentVal(sr.inpNegDirEnd, 's')}</div>
            </div>
            ${fmtStudentText(sr.txtStopExplanation)}
          </div>
          <div class="report-box">
            <div class="report-box-title">When Is Vertical Acceleration Negative? Reasoning on Both Sides of Apex</div>
            <div style="font-size: 0.78rem; margin-bottom: 0.35rem;">
              <strong>Submitted Interval where a<sub>y</sub> &lt; 0:</strong> ${fmtStudentVal(sr.inpNegAccStart, 's')} to ${fmtStudentVal(sr.inpNegAccEnd, 's')}
            </div>
            ${fmtStudentText(sr.txtAccSignExplanation)}
          </div>
        </div>

        <div class="report-box">
          <div class="report-box-title">Specific Measurement Limitation Tied to a Reported Result</div>
          ${fmtStudentText(sr.reflectionText)}
        </div>
      </section>
    </div>
  `;

  if (el('liveReportPreviewContainer')) {
    el('liveReportPreviewContainer').innerHTML = reportHtml;
  }
  if (el('printableLabReport')) {
    el('printableLabReport').innerHTML = reportHtml;
  }
}

// ============================================================================
// Session Save & Load (Schema v2.0 + Legacy v1.0 Loader)
// ============================================================================
function saveSessionJSON() {
  syncStudentInputsFromDOM();
  autoFitAndDeriveAllGraphs();

  const sessionPayload = {
    schemaVersion: '2.0',
    savedAt: new Date().toISOString(),
    studentName: state.studentName,
    teacherName: state.teacherName,
    state: {
      isSynthetic: state.isSynthetic,
      syntheticType: state.syntheticType,
      videoFileName: state.videoFileName,
      fps: state.fps,
      stepFrames: state.stepFrames,
      duration: state.duration,
      timeOffset: state.timeOffset,
      pixelsPerMeter: state.pixelsPerMeter,
      origin: state.origin,
      originAngle: state.originAngle,
      scaleStick: state.scaleStick,
      series: state.series,
      observedTUp: state.observedTUp,
      coverageStatus: state.coverageStatus,
      fitResults: state.fitResults,
      firstAttemptPrediction: state.firstAttemptPrediction,
      predictionRevision: state.predictionRevision,
      graphConnections: state.graphConnections,
      showSignedArea: state.showSignedArea,
      studentResponses: state.studentResponses,
      feedbackState: state.feedbackState
    }
  };

  const blob = new Blob([JSON.stringify(sessionPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanName = (state.studentName || 'student').trim().replace(/\s+/g, '_');
  a.download = `projectile_video_lab_${cleanName}.json`;
  a.click();
}

function loadSessionJSON(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const s = data.state || {};
      const isV2 = data.schemaVersion === '2.0' || s.firstAttemptPrediction !== undefined;

      state.studentName = data.studentName || '';
      state.teacherName = data.teacherName || 'Mr. Lopez';

      // Restore video / synthetic setup
      if (s.isSynthetic === false) {
        state.isSynthetic = false;
        state.videoFileName = s.videoFileName || 'recorded video file';
        const badge = el('clipSourceTypeBadge');
        if (badge) {
          badge.textContent = `MEASURED VIDEO FILE (${state.videoFileName})`;
          badge.style.background = '#e6f4f8';
          badge.style.color = '#095f76';
          badge.style.borderColor = '#b3d9e6';
        }
        if (el('reopenVideoFileName')) el('reopenVideoFileName').textContent = state.videoFileName;
        if (el('reopenVideoNotice')) el('reopenVideoNotice').style.display = 'block';
      } else {
        const synType = s.syntheticType && SYNTHETIC_MODELS[s.syntheticType] ? s.syntheticType : 'basketball';
        initSyntheticExperiment(synType);
      }

      if (s.fps) {
        state.fps = s.fps;
        if (el('fpsInput')) el('fpsInput').value = state.fps;
      }
      if (s.timeOffset !== undefined) state.timeOffset = s.timeOffset;
      if (s.origin) state.origin = s.origin;
      if (s.originAngle !== undefined) {
        state.originAngle = s.originAngle;
        if (el('originAngleInput')) el('originAngleInput').value = state.originAngle;
      }
      if (s.pixelsPerMeter) state.pixelsPerMeter = s.pixelsPerMeter;
      if (s.scaleStick) {
        state.scaleStick = s.scaleStick;
        if (el('scaleLengthInput') && s.scaleStick.lengthMeters) {
          el('scaleLengthInput').value = Number(s.scaleStick.lengthMeters).toFixed(2);
        }
      }
      if (s.series) {
        state.series = {
          A: Array.isArray(s.series.A) ? s.series.A : (Array.isArray(s.series.default) ? s.series.default : []),
          B: Array.isArray(s.series.B) ? s.series.B : []
        };
      }

      if (isV2) {
        // Version 2.0 session
        state.observedTUp = s.observedTUp !== undefined ? String(s.observedTUp) : '';
        state.firstAttemptPrediction = s.firstAttemptPrediction || {
          isSaved: false,
          isLegacyMissing: false,
          savedAt: null,
          vxShape: '',
          vyShape: '',
          axShape: '',
          ayShape: '',
          initialNotes: ''
        };
        state.predictionRevision = s.predictionRevision || '';
        state.graphConnections = s.graphConnections || '';
        if (s.showSignedArea !== undefined) {
          state.showSignedArea = Boolean(s.showSignedArea);
          if (el('chkShowSignedArea')) el('chkShowSignedArea').checked = state.showSignedArea;
        }
        if (s.studentResponses) {
          Object.keys(state.studentResponses).forEach(k => {
            state.studentResponses[k] = s.studentResponses[k] !== undefined ? String(s.studentResponses[k]) : '';
          });
        }
        if (s.feedbackState) {
          state.feedbackState = { ...state.feedbackState, ...s.feedbackState };
        }
      } else {
        // Legacy Version 1.0 session migration (Do NOT invent a missing firstAttemptPrediction!)
        state.firstAttemptPrediction = {
          isSaved: true,
          isLegacyMissing: true,
          savedAt: null,
          vxShape: '',
          vyShape: '',
          axShape: '',
          ayShape: '',
          initialNotes: ''
        };
        const gi = s.graphInterpretation || {};
        const sa = s.signedAreaValues || {};
        const cv = s.calcValues || {};
        const sw = s.studentWork || {};

        state.observedTUp = gi.stopTimeApex !== undefined ? String(gi.stopTimeApex) : '';
        state.predictionRevision = '';
        state.graphConnections = [gi.transYtoVy, gi.transVytoAy, gi.transX].filter(Boolean).join(' | ');

        const strOrBlank = (v) => (v !== undefined && v !== null && v !== 0 ? String(v) : '');
        state.studentResponses = {
          ...state.studentResponses,
          inpVx0: strOrBlank(cv.vx0),
          work5aVx: sw.workRange || '',
          inpAy: strOrBlank(sa.slopeAyFromVt || cv.ay),
          work5bAy: '',
          inpVy0Pred: strOrBlank(cv.vy0),
          work5cVy0: sw.workHang || '',
          inpCalcRange: strOrBlank(cv.rangeCalc),
          inpPredDy: '',
          inpPredYFinal: '',
          work5dDisp: sw.workRange || '',
          inpPredDyUp: '',
          inpCalcMaxHeight: strOrBlank(cv.maxHCalc),
          workMaxHeight: sw.workMaxH || '',
          inpSpeedV0: strOrBlank(cv.v0),
          inpAngleTheta: strOrBlank(cv.theta),
          workVector: sw.workVector || '',
          inpZeroCrossT: strOrBlank(gi.stopTimeApex),
          inpAreaUp: strOrBlank(sa.areaUp),
          inpAreaDown: strOrBlank(sa.areaDown),
          inpNetDyArea: strOrBlank(sa.netDyArea),
          inpYFinalFromArea: strOrBlank(sa.yFinalFromArea),
          workSignedArea: sa.workSignedArea || '',
          inpPosDirStart: gi.posDirStart !== undefined ? String(gi.posDirStart) : '',
          inpPosDirEnd: gi.posDirEnd !== undefined ? String(gi.posDirEnd) : '',
          inpNegDirStart: gi.negDirStart !== undefined ? String(gi.negDirStart) : '',
          inpNegDirEnd: gi.negDirEnd !== undefined ? String(gi.negDirEnd) : '',
          txtStopExplanation: gi.stopExplanation || '',
          inpNegAccStart: gi.negAccStart !== undefined ? String(gi.negAccStart) : '',
          inpNegAccEnd: gi.negAccEnd !== undefined ? String(gi.negAccEnd) : '',
          txtAccSignExplanation: gi.accSignExplanation || '',
          reflectionText: s.reflectionText || ''
        };
      }

      updateScaleReadout();
      recalculateKinematics();
      autoFitAndDeriveAllGraphs();
      updateTable();
      updateSetupAndCoverageReadouts();
      populateDOMFromStudentState();
      updatePredictionGateUI();
      updatePosChart();
      if (state.firstAttemptPrediction.isSaved) {
        renderSixGraphPanel();
      }
      updateReferenceQuantitiesBar();
      updateRubricChecklistUI();
      preparePrintableReport();
      drawOverlay();
    } catch (err) {
      alert('Could not parse session JSON file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function exportCSV() {
  const pts = state.series[state.activeSeries] || [];
  if (pts.length === 0) {
    alert('No tracked points to export yet.');
    return;
  }
  let csv = 'Point,Frame,Time (s),x (m),y (m),vx_diag (m/s),vy_diag (m/s)\n';
  pts.forEach((p, idx) => {
    csv += `${idx + 1},${p.frame},${p.time.toFixed(4)},${p.x.toFixed(4)},${p.y.toFixed(4)},${p.vx.toFixed(4)},${p.vy.toFixed(4)}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `projectile_tracked_points_${state.activeSeries}.csv`;
  a.click();
}

// ============================================================================
// Event Listeners Binding
// ============================================================================
function initEventListeners() {
  // 3-Step Navigation Buttons
  stepBtns.forEach((btn, idx) => {
    if (btn) btn.addEventListener('click', () => updateStepView(idx + 1));
  });
  if (el('btnProceedToStep2')) {
    el('btnProceedToStep2').addEventListener('click', () => updateStepView(2));
  }
  if (el('btnProceedToStep3')) {
    el('btnProceedToStep3').addEventListener('click', () => updateStepView(3));
  }

  // Primary Tracking Tools
  if (el('toolTrack')) el('toolTrack').addEventListener('click', () => setActiveTool('track'));
  if (el('toolScale')) el('toolScale').addEventListener('click', () => setActiveTool('scale'));
  if (el('toolOrigin')) el('toolOrigin').addEventListener('click', () => setActiveTool('origin'));

  if (el('btnSetTZero')) el('btnSetTZero').addEventListener('click', setInitialTimeAtFirstPoint);
  if (el('btnDeleteLastPt')) {
    el('btnDeleteLastPt').addEventListener('click', () => {
      const pts = state.series[state.activeSeries];
      if (pts && pts.length > 0) {
        window.deleteTrackedPoint(pts.length - 1);
      }
    });
  }
  if (el('btnClearSeries')) {
    el('btnClearSeries').addEventListener('click', () => {
      if (confirm(`Clear all tracked points in Series ${state.activeSeries}?`)) {
        state.series[state.activeSeries] = [];
        recalculateKinematics();
        autoFitAndDeriveAllGraphs();
        updateTable();
        updateSetupAndCoverageReadouts();
        updatePosChart();
        drawOverlay();
      }
    });
  }

  // Visibility & Optional Tools
  if (el('chkShowPoints')) {
    el('chkShowPoints').addEventListener('change', (e) => {
      state.showPoints = e.target.checked;
      drawOverlay();
    });
  }
  if (el('chkShowScale')) {
    el('chkShowScale').addEventListener('change', (e) => {
      state.showScale = e.target.checked;
      drawOverlay();
    });
  }
  if (el('chkShowOrigin')) {
    el('chkShowOrigin').addEventListener('change', (e) => {
      state.showOrigin = e.target.checked;
      drawOverlay();
    });
  }
  if (el('chkShowVectors')) {
    el('chkShowVectors').addEventListener('change', (e) => {
      state.showVectors = e.target.checked;
      drawOverlay();
    });
  }
  if (el('markerTypeSelect')) {
    el('markerTypeSelect').addEventListener('change', (e) => {
      state.markerType = e.target.value;
      drawOverlay();
    });
  }
  if (el('markerSizeSelect')) {
    el('markerSizeSelect').addEventListener('change', (e) => {
      state.markerRadius = parseInt(e.target.value, 10) || 14;
      drawOverlay();
    });
  }
  if (el('seriesSelect')) {
    el('seriesSelect').addEventListener('change', (e) => {
      state.activeSeries = e.target.value;
      autoFitAndDeriveAllGraphs();
      updateTable();
      updateSetupAndCoverageReadouts();
      updatePosChart();
      drawOverlay();
    });
  }
  if (el('originAngleInput')) {
    el('originAngleInput').addEventListener('change', (e) => {
      const deg = parseFloat(e.target.value) || 0;
      state.originAngle = deg * (Math.PI / 180);
      recalculateKinematics();
      autoFitAndDeriveAllGraphs();
      updateTable();
      updateSetupAndCoverageReadouts();
      updatePosChart();
      drawOverlay();
    });
  }
  if (el('btnResetOrigin')) {
    el('btnResetOrigin').addEventListener('click', () => {
      const h = (overlayCanvas && overlayCanvas.height) ? overlayCanvas.height : 520;
      state.origin = { x: 110, y: Math.round(h * 0.82) };
      state.originAngle = 0;
      if (el('originAngleInput')) el('originAngleInput').value = '0.0';
      recalculateKinematics();
      autoFitAndDeriveAllGraphs();
      updateTable();
      updateSetupAndCoverageReadouts();
      updatePosChart();
      drawOverlay();
    });
  }
  if (el('btnExportCSV')) el('btnExportCSV').addEventListener('click', exportCSV);

  // Synthetic Model Selector & Sample Points Loader
  if (el('presetModelSelect')) {
    el('presetModelSelect').addEventListener('change', (e) => {
      initSyntheticExperiment(e.target.value);
      loadSamplePointsForActivePreset();
    });
  }
  if (el('btnAutoDemoTrack')) {
    el('btnAutoDemoTrack').addEventListener('click', () => {
      if (!state.isSynthetic) {
        initSyntheticExperiment(el('presetModelSelect') ? el('presetModelSelect').value : 'basketball');
      }
      loadSamplePointsForActivePreset();
    });
  }
  document.querySelectorAll('.preset-pills button').forEach(btn => {
    btn.addEventListener('click', () => {
      initSyntheticExperiment(btn.dataset.preset);
      loadSamplePointsForActivePreset();
      if (dropzoneOverlay) dropzoneOverlay.style.display = 'none';
    });
  });

  // Scale & Observed Rise Time t_up Controls
  if (el('btnApplyScale')) {
    el('btnApplyScale').addEventListener('click', () => {
      const len = parseFloat(el('scaleLengthInput') ? el('scaleLengthInput').value : 1.0);
      if (len > 0) {
        state.scaleStick.lengthMeters = len;
        updateScaleReadout();
        recalculateKinematics();
        autoFitAndDeriveAllGraphs();
        updateTable();
        updateSetupAndCoverageReadouts();
        updatePosChart();
        drawOverlay();
      }
    });
  }

  const syncObservedTUp = (valStr) => {
    state.observedTUp = valStr;
    if (el('inpObservedTUp') && document.activeElement !== el('inpObservedTUp')) {
      el('inpObservedTUp').value = valStr;
    }
    if (el('inpCalcTUp') && document.activeElement !== el('inpCalcTUp')) {
      el('inpCalcTUp').value = valStr;
    }
    updateReferenceQuantitiesBar();
  };

  if (el('inpObservedTUp')) {
    el('inpObservedTUp').addEventListener('input', (e) => syncObservedTUp(e.target.value));
  }
  if (el('inpCalcTUp')) {
    el('inpCalcTUp').addEventListener('input', (e) => syncObservedTUp(e.target.value));
  }
  if (el('btnUsePeakFrameTUp')) {
    el('btnUsePeakFrameTUp').addEventListener('click', () => {
      const cov = state.coverageStatus;
      if (cov && cov.peakPoint) {
        syncObservedTUp(cov.peakPoint.time.toFixed(3));
      } else {
        alert('Track points across the apex first.');
      }
    });
  }

  // Video Transport Controls
  if (el('btnPlayPause')) el('btnPlayPause').addEventListener('click', togglePlay);
  if (el('btnPrevFrame')) el('btnPrevFrame').addEventListener('click', () => stepFrame(-1));
  if (el('btnNextFrame')) el('btnNextFrame').addEventListener('click', () => stepFrame(1));
  if (el('timeScrubber')) {
    el('timeScrubber').addEventListener('input', (e) => {
      const t = parseFloat(e.target.value) || 0;
      updateTimeAndFrame(t);
      if (!state.isSynthetic && video) video.currentTime = t;
    });
  }
  if (el('playbackRateSelect')) {
    el('playbackRateSelect').addEventListener('change', (e) => {
      const rate = parseFloat(e.target.value) || 0.5;
      if (video) video.playbackRate = rate;
    });
  }
  if (el('fpsInput')) {
    el('fpsInput').addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val > 0) {
        state.fps = val;
        if (el('timeScrubber')) el('timeScrubber').step = 1 / state.fps;
        recalculateKinematics();
        autoFitAndDeriveAllGraphs();
        updateTable();
        updateSetupAndCoverageReadouts();
        updateTimeAndFrame(state.currentTime);
      }
    });
  }

  // Keyboard Frame Stepping (ArrowLeft, ArrowRight, Spacebar)
  window.addEventListener('keydown', (e) => {
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || state.currentStep !== 1) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepFrame(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepFrame(-1);
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    }
  });

  // Canvas Mouse & Touch Interactions
  if (overlayCanvas) {
    let isDragging = false;
    let dragTarget = null;

    overlayCanvas.addEventListener('mousedown', (e) => {
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
          isDragging = true;
          dragTarget = 'scaleEnd';
          state.scaleStick.start = { x, y };
          state.scaleStick.end = { x, y };
          drawOverlay();
        }
      } else if (state.activeTool === 'origin') {
        isDragging = true;
        dragTarget = 'origin';
        state.origin = { x, y };
        recalculateKinematics();
        autoFitAndDeriveAllGraphs();
        updateTable();
        updateSetupAndCoverageReadouts();
        updatePosChart();
        drawOverlay();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (state.activeTool === 'track' && reticlePreview && !isDragging) {
        const rect = overlayCanvas.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          reticlePreview.style.display = 'block';
          reticlePreview.style.width = (state.markerRadius * 2) + 'px';
          reticlePreview.style.height = (state.markerRadius * 2) + 'px';
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
      } else if (dragTarget === 'scaleEnd') {
        state.scaleStick.end = { x, y };
        updateScaleReadout();
      } else if (dragTarget === 'origin') {
        state.origin = { x, y };
      }
      recalculateKinematics();
      autoFitAndDeriveAllGraphs();
      updateTable();
      updateSetupAndCoverageReadouts();
      updatePosChart();
      drawOverlay();
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      dragTarget = null;
    });
  }

  // Local Video File Loading
  const loadUserVideoFile = (file) => {
    if (!file) return;
    state.isSynthetic = false;
    state.videoFileName = file.name;
    state.series.A = [];
    state.series.B = [];
    state.observedTUp = '';
    if (el('inpObservedTUp')) el('inpObservedTUp').value = '';
    if (el('inpCalcTUp')) el('inpCalcTUp').value = '';
    if (el('reopenVideoNotice')) el('reopenVideoNotice').style.display = 'none';

    const badge = el('clipSourceTypeBadge');
    if (badge) {
      badge.textContent = `MEASURED VIDEO FILE (${file.name})`;
      badge.style.background = '#e6f4f8';
      badge.style.color = '#095f76';
      badge.style.borderColor = '#b3d9e6';
    }

    const url = URL.createObjectURL(file);
    video.src = url;
    video.style.display = 'block';
    video.load();
    video.onloadedmetadata = () => {
      const dur = (Number.isFinite(video.duration) && video.duration > 0) ? video.duration : 10;
      state.duration = dur;
      state.currentTime = 0;
      state.timeOffset = 0;
      const scrubber = el('timeScrubber');
      if (scrubber) {
        scrubber.min = 0;
        scrubber.max = dur;
        scrubber.step = 1 / state.fps;
        scrubber.value = 0;
      }
      resizeCanvas();
      updateTimeAndFrame(0);
      updateTable();
      updateSetupAndCoverageReadouts();
      updateStepView(1);
    };
  };

  if (el('videoFileInput')) {
    el('videoFileInput').addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        loadUserVideoFile(e.target.files[0]);
      }
    });
  }

  if (video) {
    video.addEventListener('timeupdate', () => {
      if (!state.isSynthetic && state.isPlaying) updateTimeAndFrame(video.currentTime);
    });
    video.addEventListener('seeked', () => {
      if (!state.isSynthetic) updateTimeAndFrame(video.currentTime);
    });
    video.addEventListener('ended', () => {
      if (!state.isSynthetic && state.isPlaying) togglePlay();
    });
  }

  // Step 2 Controls: Position Filter, Save Prediction & Reveal, Signed Area Toggle, Optional Tangent Explorer
  if (el('motionComponentSelect')) {
    el('motionComponentSelect').addEventListener('change', (e) => {
      state.motionFilter = e.target.value;
      updatePosChart();
    });
  }
  if (el('btnSavePredictionAndReveal')) {
    el('btnSavePredictionAndReveal').addEventListener('click', saveInitialPredictionAndReveal);
  }
  if (el('chkShowSignedArea')) {
    el('chkShowSignedArea').addEventListener('change', (e) => {
      state.showSignedArea = e.target.checked;
      renderSixGraphPanel();
    });
  }
  if (el('btnAutoFitAll')) {
    el('btnAutoFitAll').addEventListener('click', () => {
      renderSixGraphPanel();
      updateReferenceQuantitiesBar();
    });
  }
  if (el('tangentSlider')) {
    el('tangentSlider').addEventListener('input', (e) => {
      const pct = parseFloat(e.target.value) || 0;
      const cov = state.coverageStatus;
      const t = cov.tMin + (cov.tMax - cov.tMin) * (pct / 100);
      state.activeTangentTime = t;
      const yFit = state.fitResults.yPos;
      if (el('tangentReadoutCoordsHint') && yFit) {
        const slope = 2 * yFit.A * t + yFit.B;
        el('tangentReadoutCoordsHint').textContent = `t = ${t.toFixed(3)} s • Instantaneous Slope Δy/Δt = ${slope.toFixed(3)} m/s`;
      }
      renderSixGraphPanel();
    });
  }

  // Student Inputs & Check Numbers Button
  if (el('btnCheckWorksheet')) {
    el('btnCheckWorksheet').addEventListener('click', checkNumbersForPracticeFeedback);
  }
  Object.keys(state.studentResponses).forEach(k => {
    const node = el(k);
    if (node) {
      node.addEventListener('input', () => {
        state.studentResponses[k] = node.value;
        updateWrittenStatusBadges();
      });
    }
  });
  if (el('txtPredictionRevision')) {
    el('txtPredictionRevision').addEventListener('input', (e) => {
      state.predictionRevision = e.target.value;
      updateWrittenStatusBadges();
    });
  }
  if (el('txtGraphConnections')) {
    el('txtGraphConnections').addEventListener('input', (e) => {
      state.graphConnections = e.target.value;
      updateWrittenStatusBadges();
    });
  }

  // Step 3: Identification, Report Preview, Print & Save/Load Session
  if (el('studentNameInput')) {
    el('studentNameInput').addEventListener('input', (e) => {
      state.studentName = e.target.value;
    });
  }
  if (el('teacherSelect')) {
    el('teacherSelect').addEventListener('change', (e) => {
      state.teacherName = e.target.value;
    });
  }
  if (el('btnRefreshReportPreview')) {
    el('btnRefreshReportPreview').addEventListener('click', () => {
      updateRubricChecklistUI();
      preparePrintableReport();
    });
  }
  if (el('btnPrintReport')) {
    el('btnPrintReport').addEventListener('click', () => {
      updateRubricChecklistUI();
      preparePrintableReport();
      window.print();
    });
  }
  window.addEventListener('beforeprint', () => {
    updateRubricChecklistUI();
    preparePrintableReport();
  });

  // Save / Load JSON Progress Buttons (Top bar & Step 3)
  [el('btnSaveSessionTop'), el('btnSaveSession')].forEach(btn => {
    if (btn) btn.addEventListener('click', saveSessionJSON);
  });
  [el('btnLoadSessionTop'), el('btnLoadSession')].forEach(btn => {
    if (btn && el('loadSessionInput')) {
      btn.addEventListener('click', () => el('loadSessionInput').click());
    }
  });
  if (el('loadSessionInput')) {
    el('loadSessionInput').addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        loadSessionJSON(e.target.files[0]);
      }
    });
  }

  // Directions & Rubric Modal
  const helpModal = el('helpModal');
  const openHelpModal = (tabId) => {
    if (!helpModal) return;
    helpModal.style.display = 'flex';
    helpModal.setAttribute('aria-hidden', 'false');
    if (tabId) {
      document.querySelectorAll('.help-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.helpTab === tabId));
      document.querySelectorAll('.help-tab-panel').forEach(p => p.classList.toggle('active', p.id === tabId));
    }
    triggerKaTeXRender(helpModal);
  };
  const closeHelpModal = () => {
    if (!helpModal) return;
    helpModal.style.display = 'none';
    helpModal.setAttribute('aria-hidden', 'true');
  };
  if (el('btnLabHelp')) el('btnLabHelp').addEventListener('click', () => openHelpModal('help-overview'));
  document.querySelectorAll('.btn-help-trigger').forEach(btn => {
    btn.addEventListener('click', () => openHelpModal('help-overview'));
  });
  if (el('btnCloseHelpModal')) el('btnCloseHelpModal').addEventListener('click', closeHelpModal);
  if (el('btnModalCloseDone')) el('btnModalCloseDone').addEventListener('click', closeHelpModal);
  if (helpModal) {
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) closeHelpModal();
    });
  }
  document.querySelectorAll('.help-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => openHelpModal(btn.dataset.helpTab));
  });
}

window.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', () => {
  resizeCanvas();
  if (state.isSynthetic) renderSyntheticFrame(state.currentTime);
  drawOverlay();
});
