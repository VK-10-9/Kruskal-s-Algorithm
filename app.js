// =============================================
// Kruskal's MST Algorithm — Visualizer + Stats
// =============================================
// 
// Description:
// This implementation provides an interactive visualization of Kruskal's algorithm
// for finding the Minimum Spanning Tree (MST) in a weighted undirected graph.
// It uses Union-Find (Disjoint Set Union) data structure with path compression.
//
// Time Complexity: O(E log E) - dominated by sorting
// Space Complexity: O(V + E) - for storing vertices and edges
//
// Features:
// - Step-by-step algorithm visualization
// - Real-time statistics and component tracking
// - Input validation and error handling
// - Canvas-based graph rendering
// - Accessible error messages
//

// -------- DATA --------
let numVertices = 5;
let numEdges = 7;
let edgesData = [];
let mstEdges = [];
let rejectedEdges = [];
let parentArr = [];
let scrollObserver = null;  // Track observer for cleanup
let chartObserver = null;   // Track observer for cleanup
let runState = {
    initialized: false,
    running: false,
    paused: false,
    stepIndex: 0,
    currentEdgeIndex: null,
    minCost: 0,
    accepted: 0,
    rejected: 0,
    speedMs: 700,
    timerId: null,
    decisionId: null,
};

const PRESETS = {
    triangle: {
        vertices: 3,
        edges: 3,
        list: [[0, 1, 1], [1, 2, 2], [0, 2, 4]],
    },
    standard4: {
        vertices: 4,
        edges: 5,
        list: [[0, 1, 1], [0, 2, 3], [1, 2, 2], [1, 3, 4], [2, 3, 2]],
    },
    equalWeights: {
        vertices: 4,
        edges: 5,
        list: [[0, 1, 5], [1, 2, 5], [2, 3, 5], [0, 3, 5], [0, 2, 5]],
    },
    disconnected: {
        vertices: 4,
        edges: 2,
        list: [[0, 1, 2], [2, 3, 3]],
    },
    dense5: {
        vertices: 5,
        edges: 7,
        list: [[0, 1, 2], [0, 2, 3], [1, 2, 1], [1, 3, 4], [2, 4, 5], [3, 4, 1], [2, 3, 2]],
    },
    path5: {
        vertices: 5,
        edges: 4,
        list: [[0, 1, 5], [1, 2, 3], [2, 3, 8], [3, 4, 2]],
    },
};

const CANVAS_FONT_SMALL = "500 11px 'Consolas','Lucida Console','Courier New',monospace";
const CANVAS_FONT_MED = "600 12px 'Consolas','Lucida Console','Courier New',monospace";
const CANVAS_FONT_LABEL = "700 13px 'Trebuchet MS','Candara','Segoe UI',sans-serif";

// -------- INIT --------
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize UI elements if they exist (not in test-runner page)
    const edgeInputContainer = document.getElementById('edge-inputs-container');
    if (edgeInputContainer) {
        generateEdgeInputs();
        initControls();
    }
    animateBarChart();
    setupScrollAnimations();
});

// -------- SCROLL ANIMATIONS --------
function setupScrollAnimations() {
    // Cleanup previous observer if it exists
    if (scrollObserver) {
        scrollObserver.disconnect();
    }

    const elements = document.querySelectorAll(
        '.explanation-card, .timeline-step, .stat-card, .testcase-card, .rules-card, .app-item, .apps-summary, .comparison-table-wrapper, .complexity-chart-container'
    );

    elements.forEach(el => el.classList.add('animate-in'));

    scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(el => scrollObserver.observe(el));
}

// -------- BAR CHART ANIMATION --------
function animateBarChart() {
    // Cleanup previous observer if it exists
    if (chartObserver) {
        chartObserver.disconnect();
    }

    chartObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bars = entry.target.querySelectorAll('.bar-fill');
                bars.forEach((bar, i) => {
                    setTimeout(() => {
                        bar.style.width = bar.getAttribute('data-width') + '%';
                    }, i * 200);
                });
                chartObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    const chart = document.getElementById('bar-chart');
    if (chart) chartObserver.observe(chart);
}

// -------- CONTROLS INIT --------
function initControls() {
    const speedRange = document.getElementById('speed-range');
    const speedValue = document.getElementById('speed-value');

    if (speedRange && speedValue) {
        runState.speedMs = parseInt(speedRange.value, 10);
        speedValue.textContent = `${runState.speedMs} ms`;
        speedRange.addEventListener('input', () => {
            runState.speedMs = parseInt(speedRange.value, 10);
            speedValue.textContent = `${runState.speedMs} ms`;
        });
    }

    updateControlButtons();

    document.addEventListener('keydown', (event) => {
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;
        if (!runState.initialized && event.code !== 'Space') return;

        if (event.code === 'Space') {
            event.preventDefault();
            togglePlayPause();
        } else if (event.code === 'ArrowRight') {
            event.preventDefault();
            stepOnce();
        } else if (event.key && event.key.toLowerCase() === 'r') {
            event.preventDefault();
            resetRun();
        }
    });
}

function updateControlButtons() {
    const playBtn = document.getElementById('btn-play-pause');
    const stepBtn = document.getElementById('btn-step');
    const resetBtn = document.getElementById('btn-reset');

    if (!playBtn || !stepBtn || !resetBtn) return;

    if (!runState.initialized) {
        playBtn.textContent = 'Play';
        playBtn.disabled = true;
        stepBtn.disabled = true;
        resetBtn.disabled = true;
        return;
    }

    playBtn.disabled = false;
    resetBtn.disabled = false;
    stepBtn.disabled = runState.running && !runState.paused;

    if (runState.running && !runState.paused) {
        playBtn.textContent = 'Pause';
    } else {
        playBtn.textContent = 'Play';
    }
}

function clearRunTimers() {
    if (runState.timerId) clearTimeout(runState.timerId);
    if (runState.decisionId) clearTimeout(runState.decisionId);
    runState.timerId = null;
    runState.decisionId = null;
}

// -------- PRESET LOADER --------
function applyPreset() {
    const select = document.getElementById('preset-select');
    if (!select || !select.value) return;

    const preset = PRESETS[select.value];
    if (!preset) return;

    document.getElementById('vertices').value = preset.vertices;
    document.getElementById('num-edges').value = preset.edges;
    generateEdgeInputs();

    preset.list.forEach((edge, i) => {
        const uField = document.getElementById(`eu-${i}`);
        const vField = document.getElementById(`ev-${i}`);
        const wField = document.getElementById(`ew-${i}`);
        if (!uField || !vField || !wField) return;
        uField.value = edge[0];
        vField.value = edge[1];
        wField.value = edge[2];
    });

    clearRunTimers();
    runState.initialized = false;
    runState.running = false;
    runState.paused = false;
    updateControlButtons();

    const stepsPanel = document.getElementById('steps-panel');
    const graphPanel = document.getElementById('graph-panel');
    if (stepsPanel) stepsPanel.classList.add('hidden');
    if (graphPanel) graphPanel.classList.add('hidden');
}

// -------- VALIDATE INPUT --------
function validateInput(vertices, edges) {
    const errors = [];
    
    // Check vertices
    if (isNaN(vertices) || vertices < 2) {
        errors.push('Vertices must be at least 2');
    }
    if (vertices > 12) {
        errors.push('Vertices cannot exceed 12');
    }
    
    // Check edges
    if (isNaN(edges) || edges < 1) {
        errors.push('Edges must be at least 1');
    }
    const maxEdges = (vertices * (vertices - 1)) / 2;
    if (edges > maxEdges) {
        errors.push(`Edges cannot exceed ${maxEdges} for ${vertices} vertices`);
    }
    if (edges > 30) {
        errors.push('Edges cannot exceed 30 for visualization purposes');
    }
    
    return errors;
}

// -------- DISPLAY ERROR MESSAGE --------
function showError(message) {
    const container = document.getElementById('edge-inputs-container');
    container.innerHTML = `<div class="error-message" role="alert"><strong>Error:</strong> ${message}</div>`;
}

// -------- GENERATE EDGE INPUT FIELDS --------
function generateEdgeInputs() {
    const verticesInput = document.getElementById('vertices').value;
    const edgesInput = document.getElementById('num-edges').value;
    
    numVertices = parseInt(verticesInput) || 5;
    numEdges = parseInt(edgesInput) || 7;

    // Validate inputs
    const errors = validateInput(numVertices, numEdges);
    if (errors.length > 0) {
        showError(errors.join('<br>'));
        return;
    }

    const container = document.getElementById('edge-inputs-container');
    container.innerHTML = '';

    for (let i = 0; i < numEdges; i++) {
        const row = document.createElement('div');
        row.classList.add('edge-input-row');
        row.innerHTML = `
            <span class="edge-label">E${i + 1}</span>
            <input type="number" id="eu-${i}" min="0" max="${numVertices - 1}" placeholder="u" required>
            <span class="separator">→</span>
            <input type="number" id="ev-${i}" min="0" max="${numVertices - 1}" placeholder="v" required>
            <span class="separator">w:</span>
            <input type="number" id="ew-${i}" min="1" placeholder="wt" required>
        `;
        container.appendChild(row);
    }
}

// -------- LOAD SAMPLE GRAPH --------
/**
 * Load a pre-configured sample graph for demonstration
 * Sample: 6 vertices with 9 edges for learning purposes
 */
function loadSampleGraph() {
    document.getElementById('vertices').value = 6;
    document.getElementById('num-edges').value = 9;
    generateEdgeInputs();

    const sample = [
        [0, 1, 4], [0, 2, 4], [1, 2, 2],
        [1, 3, 6], [2, 3, 8], [2, 4, 3],
        [3, 4, 9], [3, 5, 5], [4, 5, 1],
    ];

    sample.forEach((edge, i) => {
        document.getElementById(`eu-${i}`).value = edge[0];
        document.getElementById(`ev-${i}`).value = edge[1];
        document.getElementById(`ew-${i}`).value = edge[2];
    });
}

// -------- UNION-FIND --------
/**
 * Find the root parent of an element using path compression
 * @param {number} i - The element to find root for
 * @returns {number} The root parent of element i
 * @complexity O(α(V)) - nearly constant with path compression
 */
function find(i) {
    if (parentArr[i] !== i) parentArr[i] = find(parentArr[i]);
    return parentArr[i];
}

/**
 * Union two sets containing elements u and v
 * @param {number} u - First element
 * @param {number} v - Second element
 * @complexity O(α(V)) - nearly constant
 */
function unionSet(u, v) {
    const rootU = find(u);
    const rootV = find(v);
    if (rootU !== rootV) parentArr[rootV] = rootU;
}

/**
 * Count the number of connected components in the graph
 * @returns {number} Number of disconnected components
 * @complexity O(V·α(V))
 */
function countComponents() {
    const roots = new Set();
    for (let i = 0; i < numVertices; i++) roots.add(find(i));
    return roots.size;
}

// -------- RUN KRUSKAL'S --------
function runKruskal() {
    try {
        numVertices = parseInt(document.getElementById('vertices').value) || 5;
        numEdges = parseInt(document.getElementById('num-edges').value) || 7;

        // Validate inputs
        const errors = validateInput(numVertices, numEdges);
        if (errors.length > 0) {
            showError(errors.join('<br>'));
            return;
        }

        edgesData = [];
        const edgeErrors = [];
        
        for (let i = 0; i < numEdges; i++) {
            const uInput = document.getElementById(`eu-${i}`).value;
            const vInput = document.getElementById(`ev-${i}`).value;
            const wInput = document.getElementById(`ew-${i}`).value;
            
            const u = parseInt(uInput);
            const v = parseInt(vInput);
            const w = parseInt(wInput);
            
            // Skip empty edges
            if (uInput === '' && vInput === '' && wInput === '') {
                continue;
            }
            
            // Validate edge
            if (isNaN(u) || isNaN(v) || isNaN(w)) {
                edgeErrors.push(`Edge ${i + 1}: All fields must be valid numbers`);
                continue;
            }
            
            if (u < 0 || u >= numVertices) {
                edgeErrors.push(`Edge ${i + 1}: Vertex u must be between 0 and ${numVertices - 1}`);
                continue;
            }
            
            if (v < 0 || v >= numVertices) {
                edgeErrors.push(`Edge ${i + 1}: Vertex v must be between 0 and ${numVertices - 1}`);
                continue;
            }
            
            if (w <= 0) {
                edgeErrors.push(`Edge ${i + 1}: Weight must be greater than 0`);
                continue;
            }
            
            if (u === v) {
                edgeErrors.push(`Edge ${i + 1}: Self-loops are not allowed (u = v = ${u})`);
                continue;
            }
            
            edgesData.push({ u, v, weight: w });
        }
        
        // Show edge validation errors
        if (edgeErrors.length > 0) {
            showError(edgeErrors.join('<br>'));
            return;
        }

        if (edgesData.length === 0) {
            showError('Please provide at least one valid edge');
            return;
        }

        // Sort by weight
        edgesData.sort((a, b) => a.weight - b.weight);

        initializeRun();
        startRun();

        // Smooth scroll to steps
        document.getElementById('steps-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        console.error('Error in runKruskal:', error);
        showError('An unexpected error occurred. Please check your input.');
    }
}

// -------- RENDER SORTED CHIPS --------
/**
 * Render visual chips for each edge, sorted by weight
 * These chips show the order in which edges are processed
 */
function renderSortedChips() {
    const container = document.getElementById('sorted-edges-list');
    container.innerHTML = '';
    edgesData.forEach((edge, i) => {
        const chip = document.createElement('span');
        chip.classList.add('edge-chip');
        chip.id = `chip-${i}`;
        chip.textContent = `(${edge.u},${edge.v}) = ${edge.weight}`;
        container.appendChild(chip);
    });
}

// -------- PLAYBACK CONTROLS --------
function initializeRun() {
    clearRunTimers();

    // Init parent
    parentArr = [];
    for (let i = 0; i < numVertices; i++) parentArr[i] = i;

    mstEdges = [];
    rejectedEdges = [];

    runState.initialized = true;
    runState.running = false;
    runState.paused = false;
    runState.stepIndex = 0;
    runState.currentEdgeIndex = null;
    runState.minCost = 0;
    runState.accepted = 0;
    runState.rejected = 0;

    // Show panels
    document.getElementById('steps-panel').classList.remove('hidden');
    document.getElementById('graph-panel').classList.remove('hidden');

    renderSortedChips();
    document.getElementById('steps-log').innerHTML = '';
    document.getElementById('result-box').classList.add('hidden');
    document.getElementById('result-note').textContent = '';
    document.getElementById('result-label').textContent = 'Minimum Cost of MST';

    // Show & reset live stats
    const liveStats = document.getElementById('live-stats');
    liveStats.classList.remove('hidden');
    document.getElementById('stat-processed').textContent = '0';
    document.getElementById('stat-accepted').textContent = '0';
    document.getElementById('stat-rejected').textContent = '0';
    document.getElementById('stat-components').textContent = numVertices;

    drawGraph();
    updateControlButtons();
}

function startRun() {
    if (!runState.initialized) return;
    if (runState.running && !runState.paused) return;

    runState.running = true;
    runState.paused = false;
    updateControlButtons();
    scheduleNextStep();
}

function pauseRun() {
    runState.paused = true;
    clearRunTimers();
    updateControlButtons();
}

function togglePlayPause() {
    if (!runState.initialized) return;
    if (runState.running && !runState.paused) {
        pauseRun();
    } else {
        startRun();
    }
}

function stepOnce() {
    if (!runState.initialized) return;
    runState.running = true;
    runState.paused = true;
    clearRunTimers();
    processStep();
    updateControlButtons();
}

function resetRun() {
    if (!runState.initialized) return;
    clearRunTimers();
    runState.running = false;
    runState.paused = false;
    runState.stepIndex = 0;
    runState.currentEdgeIndex = null;
    runState.minCost = 0;
    runState.accepted = 0;
    runState.rejected = 0;

    // Reset parent for fresh run
    parentArr = [];
    for (let i = 0; i < numVertices; i++) parentArr[i] = i;
    mstEdges = [];
    rejectedEdges = [];

    renderSortedChips();
    document.getElementById('steps-log').innerHTML = '';
    document.getElementById('result-box').classList.add('hidden');
    document.getElementById('result-note').textContent = '';
    document.getElementById('result-label').textContent = 'Minimum Cost of MST';

    document.getElementById('stat-processed').textContent = '0';
    document.getElementById('stat-accepted').textContent = '0';
    document.getElementById('stat-rejected').textContent = '0';
    document.getElementById('stat-components').textContent = numVertices;

    drawGraph();
    updateControlButtons();
}

function scheduleNextStep() {
    if (!runState.running || runState.paused) return;
    runState.timerId = setTimeout(processStep, runState.speedMs);
}

function finalizeRun() {
    const resultBox = document.getElementById('result-box');
    const components = countComponents();

    resultBox.classList.remove('hidden');
    document.getElementById('result-cost').textContent = runState.minCost;
    document.getElementById('result-label').textContent = components === 1
        ? 'Minimum Cost of MST'
        : 'Minimum Cost of Spanning Forest';
    document.getElementById('result-note').textContent = components === 1
        ? ''
        : `Graph is disconnected (${components} components).`;

    runState.running = false;
    runState.paused = false;
    runState.currentEdgeIndex = null;
    updateControlButtons();
    drawGraph();
}

function processStep() {
    if (runState.stepIndex >= edgesData.length) {
        finalizeRun();
        return;
    }

    const edge = edgesData[runState.stepIndex];
    runState.currentEdgeIndex = runState.stepIndex;
    const chip = document.getElementById(`chip-${runState.stepIndex}`);
    const log = document.getElementById('steps-log');
    const decisionDelay = Math.min(180, Math.max(80, runState.speedMs * 0.25));

    if (chip) chip.classList.add('processing');

    runState.decisionId = setTimeout(() => {
        document.getElementById('stat-processed').textContent = runState.stepIndex + 1;

        if (find(edge.u) !== find(edge.v)) {
            unionSet(edge.u, edge.v);
            mstEdges.push(edge);
            runState.minCost += edge.weight;
            runState.accepted++;

            if (chip) {
                chip.classList.remove('processing');
                chip.classList.add('accepted');
            }

            document.getElementById('stat-accepted').textContent = runState.accepted;

            const entry = document.createElement('div');
            entry.classList.add('step-entry', 'accepted');
            entry.innerHTML = `<span class="step-icon">OK</span><span class="step-text">Edge (${edge.u}, ${edge.v}) w=${edge.weight} — Added to MST</span>`;
            log.appendChild(entry);
        } else {
            rejectedEdges.push(edge);
            runState.rejected++;

            if (chip) {
                chip.classList.remove('processing');
                chip.classList.add('rejected');
            }

            document.getElementById('stat-rejected').textContent = runState.rejected;

            const entry = document.createElement('div');
            entry.classList.add('step-entry', 'rejected');
            entry.innerHTML = `<span class="step-icon">X</span><span class="step-text">Edge (${edge.u}, ${edge.v}) w=${edge.weight} — Rejected (cycle)</span>`;
            log.appendChild(entry);
        }

        document.getElementById('stat-components').textContent = countComponents();
        drawGraph();

        runState.stepIndex++;
        runState.currentEdgeIndex = runState.stepIndex < edgesData.length
            ? runState.stepIndex
            : null;
        if (runState.running && !runState.paused) {
            scheduleNextStep();
        }
    }, decisionDelay);
}

// -------- DRAW GRAPH --------
/**
 * Render the graph on canvas with proper DPI scaling
 * - Vertices positioned in a circle
 * - All edges shown in faded gray
 * - MST edges highlighted in green with glow effect
 * - Rejected edges shown as dashed red lines
 * - Labels and weights displayed
 */
function drawGraph() {
    const canvas = document.getElementById('graph-canvas');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const now = Date.now();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2;
    const rad = Math.min(cx, cy) - 60;

    const positions = [];
    for (let i = 0; i < numVertices; i++) {
        const angle = (2 * Math.PI * i) / numVertices - Math.PI / 2;
        positions.push({
            x: cx + rad * Math.cos(angle),
            y: cy + rad * Math.sin(angle),
        });
    }

    ctx.clearRect(0, 0, w, h);

    // Blueprint grid overlay
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 20; x < w; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (let y = 20; y < h; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
    ctx.restore();

    const weights = edgesData.map(edge => edge.weight);
    const weightMin = weights.length ? Math.min(...weights) : 0;
    const weightMax = weights.length ? Math.max(...weights) : 1;
    const weightRange = Math.max(1, weightMax - weightMin);

    function edgeWidth(weight) {
        return 1.2 + ((weight - weightMin) / weightRange) * 2.8;
    }

    function drawWeightLabel(x, y, text, color, bg) {
        const paddingX = 8;
        const paddingY = 4;
        ctx.font = CANVAS_FONT_SMALL;
        const metrics = ctx.measureText(text);
        const boxWidth = metrics.width + paddingX * 2;
        const boxHeight = 18;
        const radius = 8;

        ctx.fillStyle = bg;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - boxWidth / 2 + radius, y - boxHeight / 2);
        ctx.lineTo(x + boxWidth / 2 - radius, y - boxHeight / 2);
        ctx.quadraticCurveTo(x + boxWidth / 2, y - boxHeight / 2, x + boxWidth / 2, y - boxHeight / 2 + radius);
        ctx.lineTo(x + boxWidth / 2, y + boxHeight / 2 - radius);
        ctx.quadraticCurveTo(x + boxWidth / 2, y + boxHeight / 2, x + boxWidth / 2 - radius, y + boxHeight / 2);
        ctx.lineTo(x - boxWidth / 2 + radius, y + boxHeight / 2);
        ctx.quadraticCurveTo(x - boxWidth / 2, y + boxHeight / 2, x - boxWidth / 2, y + boxHeight / 2 - radius);
        ctx.lineTo(x - boxWidth / 2, y - boxHeight / 2 + radius);
        ctx.quadraticCurveTo(x - boxWidth / 2, y - boxHeight / 2, x - boxWidth / 2 + radius, y - boxHeight / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y + 0.5);
    }

    // All edges — base layer
    edgesData.forEach((edge, index) => {
        const from = positions[edge.u];
        const to = positions[edge.v];
        if (!from || !to) return;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
        ctx.lineWidth = edgeWidth(edge.weight);
        ctx.stroke();

        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        drawWeightLabel(mx, my - 10, String(edge.weight), '#94a3b8', 'rgba(8, 12, 24, 0.7)');

        if (runState.currentEdgeIndex === index) {
            ctx.save();
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
            ctx.lineWidth = edgeWidth(edge.weight) + 2;
            ctx.setLineDash([10, 6]);
            ctx.lineDashOffset = -((now / 40) % 16);
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
            ctx.restore();
        }
    });

    // Rejected edges — dashed red
    rejectedEdges.forEach((edge) => {
        const from = positions[edge.u];
        const to = positions[edge.v];
        if (!from || !to) return;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = 'rgba(248, 113, 113, 0.3)';
        ctx.lineWidth = edgeWidth(edge.weight) + 0.8;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        drawWeightLabel(mx, my - 8, String(edge.weight), '#f87171', 'rgba(16, 5, 7, 0.7)');
    });

    // MST edges — glowing green
    mstEdges.forEach((edge) => {
        const from = positions[edge.u];
        const to = positions[edge.v];
        if (!from || !to) return;

        // Glow
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.18)';
        ctx.lineWidth = edgeWidth(edge.weight) + 8;
        ctx.stroke();

        // Line
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = edgeWidth(edge.weight) + 2;
        ctx.stroke();

        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        drawWeightLabel(mx, my - 12, String(edge.weight), '#34d399', 'rgba(5, 12, 10, 0.8)');
    });

    // Vertices
    const colors = [
        '#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#22d3ee',
        '#fb923c', '#e879f9', '#4ade80', '#f472b6', '#818cf8', '#a3e635'
    ];

    positions.forEach((pos, i) => {
        // Outer glow
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 24, 0, Math.PI * 2);
        const glowColor = colors[i % colors.length] + '12';
        ctx.fillStyle = glowColor;
        ctx.fill();

        ctx.save();
        ctx.shadowColor = 'rgba(56, 189, 248, 0.25)';
        ctx.shadowBlur = 12;

        // Node
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 17, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0e1a';
        ctx.fill();
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.restore();

        // Label
        ctx.fillStyle = '#f1f5f9';
        ctx.font = CANVAS_FONT_LABEL;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i, pos.x, pos.y);
    });
}

// -------- WINDOW RESIZE --------
window.addEventListener('resize', () => {
    if (edgesData.length > 0) drawGraph();
});
