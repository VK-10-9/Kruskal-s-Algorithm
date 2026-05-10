// =============================================
// Kruskal's MST Algorithm — Visualizer + Stats
// =============================================

// -------- DATA --------
let numVertices = 5;
let numEdges = 7;
let edgesData = [];
let mstEdges = [];
let rejectedEdges = [];
let parentArr = [];

// -------- INIT --------
document.addEventListener('DOMContentLoaded', () => {
    generateEdgeInputs();
    animateBarChart();
    setupScrollAnimations();
});

// -------- SCROLL ANIMATIONS --------
function setupScrollAnimations() {
    const elements = document.querySelectorAll(
        '.explanation-card, .timeline-step, .stat-card, .app-card, .comparison-table-wrapper, .complexity-chart-container'
    );

    elements.forEach(el => el.classList.add('animate-in'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(el => observer.observe(el));
}

// -------- BAR CHART ANIMATION --------
function animateBarChart() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bars = entry.target.querySelectorAll('.bar-fill');
                bars.forEach((bar, i) => {
                    setTimeout(() => {
                        bar.style.width = bar.getAttribute('data-width') + '%';
                    }, i * 200);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    const chart = document.getElementById('bar-chart');
    if (chart) observer.observe(chart);
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
function find(i) {
    if (parentArr[i] !== i) parentArr[i] = find(parentArr[i]);
    return parentArr[i];
}

function unionSet(u, v) {
    const rootU = find(u);
    const rootV = find(v);
    if (rootU !== rootV) parentArr[rootV] = rootU;
}

// Count connected components
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

        // Init parent
        parentArr = [];
        for (let i = 0; i < numVertices; i++) parentArr[i] = i;

        mstEdges = [];
        rejectedEdges = [];

        // Show panels
        document.getElementById('steps-panel').classList.remove('hidden');
        document.getElementById('graph-panel').classList.remove('hidden');

        renderSortedChips();
        document.getElementById('steps-log').innerHTML = '';
        document.getElementById('result-box').classList.add('hidden');

        // Show & reset live stats
        const liveStats = document.getElementById('live-stats');
        liveStats.classList.remove('hidden');
        document.getElementById('stat-processed').textContent = '0';
        document.getElementById('stat-accepted').textContent = '0';
        document.getElementById('stat-rejected').textContent = '0';
        document.getElementById('stat-components').textContent = numVertices;

        drawGraph();
        animateSteps();

        // Smooth scroll to steps
        document.getElementById('steps-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        console.error('Error in runKruskal:', error);
        showError('An unexpected error occurred. Please check your input.');
    }
}

// -------- RENDER SORTED CHIPS --------
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

// -------- ANIMATE STEPS --------
function animateSteps() {
    let stepIndex = 0;
    let minCost = 0;
    let accepted = 0;
    let rejected = 0;

    function processStep() {
        if (stepIndex >= edgesData.length) {
            const resultBox = document.getElementById('result-box');
            resultBox.classList.remove('hidden');
            document.getElementById('result-cost').textContent = minCost;
            drawGraph();
            return;
        }

        const edge = edgesData[stepIndex];
        const chip = document.getElementById(`chip-${stepIndex}`);
        const log = document.getElementById('steps-log');

        chip.classList.add('processing');

        setTimeout(() => {
            // Update processed stat
            document.getElementById('stat-processed').textContent = stepIndex + 1;

            if (find(edge.u) !== find(edge.v)) {
                unionSet(edge.u, edge.v);
                mstEdges.push(edge);
                minCost += edge.weight;
                accepted++;

                chip.classList.remove('processing');
                chip.classList.add('accepted');

                document.getElementById('stat-accepted').textContent = accepted;

                const entry = document.createElement('div');
                entry.classList.add('step-entry', 'accepted');
                entry.innerHTML = `<span class="step-icon">✅</span><span class="step-text">Edge (${edge.u}, ${edge.v}) w=${edge.weight} — Added to MST</span>`;
                log.appendChild(entry);
            } else {
                rejectedEdges.push(edge);
                rejected++;

                chip.classList.remove('processing');
                chip.classList.add('rejected');

                document.getElementById('stat-rejected').textContent = rejected;

                const entry = document.createElement('div');
                entry.classList.add('step-entry', 'rejected');
                entry.innerHTML = `<span class="step-icon">❌</span><span class="step-text">Edge (${edge.u}, ${edge.v}) w=${edge.weight} — Rejected (cycle)</span>`;
                log.appendChild(entry);
            }

            // Update components
            document.getElementById('stat-components').textContent = countComponents();

            drawGraph();
            stepIndex++;
            setTimeout(processStep, 600);
        }, 500);
    }

    processStep();
}

// -------- DRAW GRAPH --------
function drawGraph() {
    const canvas = document.getElementById('graph-canvas');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2;
    const rad = Math.min(cx, cy) - 50;

    const positions = [];
    for (let i = 0; i < numVertices; i++) {
        const angle = (2 * Math.PI * i) / numVertices - Math.PI / 2;
        positions.push({
            x: cx + rad * Math.cos(angle),
            y: cy + rad * Math.sin(angle),
        });
    }

    ctx.clearRect(0, 0, w, h);

    // All edges — faded
    edgesData.forEach((edge) => {
        const from = positions[edge.u];
        const to = positions[edge.v];
        if (!from || !to) return;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.font = '500 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(edge.weight, mx, my - 8);
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
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
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
        ctx.lineWidth = 10;
        ctx.stroke();

        // Line
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3;
        ctx.stroke();

        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        ctx.fillStyle = '#34d399';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(edge.weight, mx, my - 10);
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

        // Node
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 17, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0e1a';
        ctx.fill();
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '700 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i, pos.x, pos.y);
    });
}

// -------- WINDOW RESIZE --------
window.addEventListener('resize', () => {
    if (edgesData.length > 0) drawGraph();
});
