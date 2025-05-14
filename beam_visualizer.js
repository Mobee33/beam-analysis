// beam_visualizer.js

const SVG_NS_VIS = "http://www.w3.org/2000/svg";

// --- General SVG Helper Functions (from your provided code, slightly adjusted for consistency) ---
function _createSvgElement(type, attributes) {
    const el = document.createElementNS(SVG_NS_VIS, type);
    for (const key in attributes) {
        el.setAttribute(key, attributes[key]);
    }
    return el;
}

function _drawBeamLine(svg, x1, y, x2, className = "beam-line") {
    svg.appendChild(_createSvgElement("line", { x1, y1: y, x2, y2: y, class: className }));
}

function _drawPinSupport(svg, x_svg, beam_y_svg, size = 18, className = "support-pin") {
    const group = _createSvgElement("g", { class: className });
    const path = _createSvgElement("path", { d: `M${x_svg - size/2},${beam_y_svg} L${x_svg + size/2},${beam_y_svg} L${x_svg},${beam_y_svg + size*0.866} Z` });
    group.appendChild(path);
    group.appendChild(_createSvgElement("line", {x1: x_svg - size*0.8, y1:beam_y_svg + size*0.866 + 3, x2:x_svg + size*0.8, y2:beam_y_svg + size*0.866 + 3}));
    svg.appendChild(group);
}

function _drawRollerSupport(svg, x_svg, beam_y_svg, radius = 7, baseSize = 20, className = "support-roller") {
    const group = _createSvgElement("g", { class: className });
    group.appendChild(_createSvgElement("circle", { cx: x_svg, cy: beam_y_svg + radius, r: radius }));
    group.appendChild(_createSvgElement("circle", { cx: x_svg - radius*0.6, cy: beam_y_svg + radius + radius*0.2, r: radius*0.4, fill: '#b8c0c8' })); // Smaller inner circles
    group.appendChild(_createSvgElement("circle", { cx: x_svg + radius*0.6, cy: beam_y_svg + radius + radius*0.2, r: radius*0.4, fill: '#b8c0c8' }));
    group.appendChild(_createSvgElement("line", { class:"roller-base", x1: x_svg - baseSize/2, y1: beam_y_svg + 2*radius + 3, x2: x_svg + baseSize/2, y2: beam_y_svg + 2*radius + 3 }));
    svg.appendChild(group);
}

function _drawFixedSupport(svg, fixed_at_x_svg, beam_y_svg, is_left_end, wall_width = 20, wall_height_ratio = 0.7, className = "support-fixed") {
    const group = _createSvgElement("g", { class: className });
    const svgViewBoxHeight = svg.viewBox.baseVal ? svg.viewBox.baseVal.height : 150; // Default if viewBox not set
    const wall_height = svgViewBoxHeight * wall_height_ratio;
    const wall_x = is_left_end ? fixed_at_x_svg - wall_width : fixed_at_x_svg;
    
    group.appendChild(_createSvgElement("rect", { x: wall_x, y: beam_y_svg - wall_height/2, width: wall_width, height: wall_height }));
    
    const hatchGroup = _createSvgElement("g", { class: "fixed-hatch" });
    const num_hatches = 6;
    for (let i = 0; i <= num_hatches; i++) {
        let y_pos = (beam_y_svg - wall_height/2) + (i/num_hatches) * wall_height;
        hatchGroup.appendChild(_createSvgElement("line", {
            x1: wall_x, y1: y_pos,
            x2: wall_x + wall_width, y2: y_pos - (is_left_end ? -wall_width*0.7 : wall_width*0.7), // Diagonal
        }));
    }
    group.appendChild(hatchGroup);
    svg.appendChild(group);
}

function _drawConcentratedLoad(svg, x_load_svg, beam_y_svg, magnitude_label = "P", arrow_len = 35, is_upward = false) {
    const group = _createSvgElement("g");
    const y_start = is_upward ? beam_y_svg + arrow_len - 3 : beam_y_svg - arrow_len + 3; // Adjusted for marker
    const y_end = beam_y_svg + (is_upward ? 3 : -3); // End slightly on/into the beam
    const marker = is_upward ? "url(#loadArrowheadGeneralUp)" : "url(#loadArrowheadGeneralDown)";
    
    const line = _createSvgElement("line", {
        x1: x_load_svg, y1: y_start,
        x2: x_load_svg, y2: y_end,
        class: "load-arrow", "marker-end": marker
    });
    group.appendChild(line);
    _drawText(svg, x_load_svg, y_start + (is_upward ? 10 : -10), magnitude_label, "load-label");
    svg.appendChild(group);
}

function _drawUDL(svg, x_start_svg, x_end_svg, beam_y_svg, w_label = "w", num_arrows = 5, arrow_len = 25, rect_h = 12) {
    const group = _createSvgElement("g", { class: "udl" });
    if (x_end_svg - x_start_svg > 0) { // Only draw if width is positive
        group.appendChild(_createSvgElement("rect", {
            x: x_start_svg, y: beam_y_svg - rect_h - (arrow_len*0.5),
            width: x_end_svg - x_start_svg, height: rect_h, class: "udl-rect"
        }));

        const actual_num_arrows = Math.max(2, num_arrows);
        const step = (x_end_svg - x_start_svg) / Math.max(1, (actual_num_arrows -1));
        for (let i = 0; i < actual_num_arrows; i++) {
            const x = x_start_svg + i * step;
            const line = _createSvgElement("line", {
                x1: x, y1: beam_y_svg - arrow_len + 2, x2: x, y2: beam_y_svg + 2,
                class: "udl-arrow", "marker-end": "url(#loadArrowheadUDL)"
            });
            group.appendChild(line);
        }
        _drawText(svg, x_start_svg + (x_end_svg - x_start_svg)/2, beam_y_svg - arrow_len - rect_h/2 - 5, w_label, "load-label");
    }
    svg.appendChild(group);
}

function _drawTriangularLoad(svg, x_start_svg, x_end_svg, beam_y_svg, peak_label = "w₀", num_arrows = 5, max_arrow_len = 30, increasing_to_right = true) {
    const group = _createSvgElement("g", { class: "triangular-load" });
    const load_width = x_end_svg - x_start_svg;
    if (load_width <=0) return;

    const y_top_start = increasing_to_right ? beam_y_svg - 3 : beam_y_svg - max_arrow_len + 3;
    const y_top_end = increasing_to_right ? beam_y_svg - max_arrow_len + 3 : beam_y_svg - 3;

    group.appendChild(_createSvgElement("path", { 
        d: `M${x_start_svg},${y_top_start} L${x_end_svg},${y_top_end} L${x_end_svg},${beam_y_svg} L${x_start_svg},${beam_y_svg} Z`, 
        class: "udl-rect" 
    }));
    
    const actual_num_arrows = Math.max(2, num_arrows);
    for (let i = 0; i < actual_num_arrows; i++) {
        const ratio = actual_num_arrows === 1 ? 0.5 : i / (actual_num_arrows - 1);
        const x = x_start_svg + ratio * load_width;
        let current_arrow_len = increasing_to_right ? max_arrow_len * ratio : max_arrow_len * (1 - ratio);
        current_arrow_len = Math.max(5, current_arrow_len);

        const line = _createSvgElement("line", {
            x1: x, y1: beam_y_svg - current_arrow_len, x2: x, y2: beam_y_svg,
            class: "udl-arrow", "marker-end": "url(#loadArrowheadUDL)"
        });
        group.appendChild(line);
    }
    const label_x = x_start_svg + load_width/2;
    _drawText(svg, label_x, beam_y_svg - max_arrow_len - 10, peak_label, "load-label");
    svg.appendChild(group);
}

function _drawAppliedMoment(svg, x_svg, beam_y_svg, m_label = "M", size = 18, is_clockwise = true) {
    const group = _createSvgElement("g", { class: "applied-moment" });
    const arc_radius = size;
    // Angles for a more complete circle, ending with an arrow
    const start_angle_rad = is_clockwise ? -Math.PI * 0.8 : Math.PI * 0.2;
    const end_angle_rad = is_clockwise ? Math.PI * 1.1 : -Math.PI * 1.1;


    const start_x = x_svg + arc_radius * Math.cos(start_angle_rad);
    const start_y = beam_y_svg + arc_radius * Math.sin(start_angle_rad);
    const end_x = x_svg + arc_radius * Math.cos(end_angle_rad);
    const end_y = beam_y_svg + arc_radius * Math.sin(end_angle_rad);
    
    const large_arc_flag = "1"; // For > 180 degree arc
    const sweep_flag = is_clockwise ? "1" : "0";

    const path_d = `M ${start_x} ${start_y} A ${arc_radius} ${arc_radius} 0 ${large_arc_flag} ${sweep_flag} ${end_x} ${end_y}`;
    
    const path = _createSvgElement("path", {
        d: path_d, fill: "none", class: "load-arrow", style: "stroke-width: 2px;",
        "marker-end": is_clockwise ? "url(#loadArrowheadGeneralDown)" : "url(#loadArrowheadGeneralUp)"
    });
    group.appendChild(path);
    _drawText(svg, x_svg + (is_clockwise ? size*1.3 : -size*1.3), beam_y_svg - size*0.3, m_label, "load-label");
    svg.appendChild(group);
}

function _drawText(svg, x, y, text_content, className = "dim-text", background = false) {
    const txtEl = _createSvgElement("text", { x, y, class: className });
    txtEl.textContent = text_content;
    if (background) {
        const g = _createSvgElement("g");
        g.appendChild(txtEl); 
        svg.appendChild(g); 
        try { 
            const bbox = txtEl.getBBox();
            const rect = _createSvgElement("rect", {
                x: bbox.x - 2, y: bbox.y -1, width: bbox.width + 4, height: bbox.height + 2,
                class: "dim-text-bg"
            });
            g.insertBefore(rect, txtEl);
        } catch(e) { 
            svg.appendChild(txtEl); 
            if(g.parentNode && g.parentNode === svg) g.remove(); // Only remove if it was added
        }
    } else {
        svg.appendChild(txtEl);
    }
}

function _drawDimensionLine(svg, x1_svg, y_svg_beam, x2_svg, label_text, offset_y_abs = 35) {
    const group = _createSvgElement("g", { class: "dimension" });
    const line_y = y_svg_beam + offset_y_abs;
    group.appendChild(_createSvgElement("line", { x1:x1_svg, y1:line_y, x2:x2_svg, y2:line_y, class: "dim-line"}));
    group.appendChild(_createSvgElement("line", {x1:x1_svg, y1:line_y-4, x2:x1_svg, y2:line_y+4, class: "dim-tick", stroke: "#7f8c8d", "stroke-width": 1}));
    group.appendChild(_createSvgElement("line", {x1:x2_svg, y1:line_y-4, x2:x2_svg, y2:line_y+4, class: "dim-tick", stroke: "#7f8c8d", "stroke-width": 1}));
    _drawText(group, (x1_svg + x2_svg) / 2, line_y - 6, label_text, "dim-text", true);
    svg.appendChild(group);
}

// --- beamVisualizers Object ---
const beamVisualizers = {};

// --- _calculateLayout Helper (Refined) ---
function _calculateLayout(modelParams, svgLayout, beamConfig = {}) {
    const { width: svgWidth, height: svgHeight, margin } = svgLayout;
    const beamY = svgHeight * 0.55; 
    const fixedSupportWidth = 20;

    let totalEffectiveLength = modelParams.l || modelParams.l_span || (modelParams.l1 + (modelParams.l2 || 0)) || 10;
    
    // Specific overrides for total length based on beam type
    if (beamConfig.type === 'overhang_right') totalEffectiveLength = modelParams.l_span + modelParams.a_overhang;
    else if (beamConfig.type === 'overhang_left') totalEffectiveLength = modelParams.a_overhang + modelParams.l_span;
    else if (beamConfig.type === 'double_overhang') totalEffectiveLength = modelParams.a_left_overhang + modelParams.l_span + modelParams.c_right_overhang;
    else if (beamConfig.type === 'continuous_two_equal_span') totalEffectiveLength = 2 * modelParams.l_span;
    else if (beamConfig.type === 'continuous_two_unequal_span') totalEffectiveLength = modelParams.l1 + modelParams.l2;

    let drawableWidth = svgWidth - 2 * margin;
    let visualStartX_svg = margin;

    if (beamConfig.fixed === 'left' || beamConfig.fixed === 'both') {
        drawableWidth -= fixedSupportWidth;
        visualStartX_svg += fixedSupportWidth;
    }
    if (beamConfig.fixed === 'right' || beamConfig.fixed === 'both') {
        drawableWidth -= fixedSupportWidth;
    }
    
    const scale = totalEffectiveLength > 0 ? drawableWidth / totalEffectiveLength : (svgWidth - 2 * margin) / 10;

    return { beamY, scale, visualStartX_svg, fixedSupportWidth, totalModelLength: totalEffectiveLength };
}


// --- Individual Visualizer Functions (All 32 Cases) ---

// Fig 1-14: Same as previously provided and verified.
beamVisualizers['fig1'] = (svg, params, svgLayout) => { /* ... from previous complete version ... */ const layout = _calculateLayout(params, svgLayout, {type: 'simple'}); _drawBeamLine(svg, layout.visualStartX_svg, layout.beamY, layout.visualStartX_svg + params.l * layout.scale); _drawPinSupport(svg, layout.visualStartX_svg, layout.beamY); _drawRollerSupport(svg, layout.visualStartX_svg + params.l * layout.scale, layout.beamY); _drawUDL(svg, layout.visualStartX_svg, layout.visualStartX_svg + params.l * layout.scale, layout.beamY, `w=${params.w}`, Math.max(5, Math.floor(params.l)), 25, 12); _drawDimensionLine(svg, layout.visualStartX_svg, layout.beamY, layout.visualStartX_svg + params.l * layout.scale, `ℓ=${params.l}`, 40); };
beamVisualizers['fig2'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'simple'}); const { visualStartX_svg, beamY, scale } = layout; const beamEndX_svg = visualStartX_svg + params.l * scale; _drawBeamLine(svg, visualStartX_svg, beamY, beamEndX_svg); _drawPinSupport(svg, visualStartX_svg, beamY); _drawRollerSupport(svg, beamEndX_svg, beamY); const udlStartX_svg = visualStartX_svg + params.a * scale; const udlEndX_svg = visualStartX_svg + (params.a + params.b) * scale; _drawUDL(svg, udlStartX_svg, udlEndX_svg, beamY, `w=${params.w}`, Math.max(3, Math.floor(params.b)), 25, 12); _drawDimensionLine(svg, visualStartX_svg, beamY, beamEndX_svg, `ℓ=${params.l}`, 40); if (params.a > 0) _drawDimensionLine(svg, visualStartX_svg, beamY, udlStartX_svg, `a=${params.a}`, 55); _drawDimensionLine(svg, udlStartX_svg, beamY, udlEndX_svg, `b=${params.b}`, 55); const c = params.l - params.a - params.b; if (c > 0.01) _drawDimensionLine(svg, udlEndX_svg, beamY, beamEndX_svg, `c=${c.toFixed(1)}`, 55); };
beamVisualizers['fig3'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'simple'}); const { visualStartX_svg, beamY, scale } = layout; const beamEndX_svg = visualStartX_svg + params.l * scale; _drawBeamLine(svg, visualStartX_svg, beamY, beamEndX_svg); _drawPinSupport(svg, visualStartX_svg, beamY); _drawRollerSupport(svg, beamEndX_svg, beamY); const udlEndX_svg = visualStartX_svg + params.a * scale; _drawUDL(svg, visualStartX_svg, udlEndX_svg, beamY, `w=${params.w}`, Math.max(3, Math.floor(params.a)), 25, 12); _drawDimensionLine(svg, visualStartX_svg, beamY, beamEndX_svg, `ℓ=${params.l}`, 40); _drawDimensionLine(svg, visualStartX_svg, beamY, udlEndX_svg, `a=${params.a}`, 55); };
beamVisualizers['fig4'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'simple'}); const { visualStartX_svg, beamY, scale } = layout; const beamEndX_svg = visualStartX_svg + params.l * scale; _drawBeamLine(svg, visualStartX_svg, beamY, beamEndX_svg); _drawPinSupport(svg, visualStartX_svg, beamY); _drawRollerSupport(svg, beamEndX_svg, beamY); const udl1EndX_svg = visualStartX_svg + params.a * scale; _drawUDL(svg, visualStartX_svg, udl1EndX_svg, beamY, `w₁=${params.w1}`, Math.max(3, Math.floor(params.a)), 20, 10); const udl2StartX_svg = visualStartX_svg + (params.l - params.c) * scale; _drawUDL(svg, udl2StartX_svg, beamEndX_svg, beamY, `w₂=${params.w2}`, Math.max(3, Math.floor(params.c)), 20, 10); _drawDimensionLine(svg, visualStartX_svg, beamY, beamEndX_svg, `ℓ=${params.l}`, 40); _drawDimensionLine(svg, visualStartX_svg, beamY, udl1EndX_svg, `a=${params.a}`, 55); const b_len = params.l - params.a - params.c; if (b_len > 0.01) _drawDimensionLine(svg, udl1EndX_svg, beamY, udl2StartX_svg, `b=${b_len.toFixed(1)}`, 55); _drawDimensionLine(svg, udl2StartX_svg, beamY, beamEndX_svg, `c=${params.c}`, 55); };
beamVisualizers['fig5'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'simple'}); const { visualStartX_svg, beamY, scale } = layout; const beamEndX_svg = visualStartX_svg + params.l * scale; _drawBeamLine(svg, visualStartX_svg, beamY, beamEndX_svg); _drawPinSupport(svg, visualStartX_svg, beamY); _drawRollerSupport(svg, beamEndX_svg, beamY); _drawTriangularLoad(svg, visualStartX_svg, beamEndX_svg, beamY, `w₀=${params.W_peak}`, Math.max(5, Math.floor(params.l)), 30, true); _drawDimensionLine(svg, visualStartX_svg, beamY, beamEndX_svg, `ℓ=${params.l}`, 45); };
beamVisualizers['fig6'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'simple'}); const { visualStartX_svg, beamY, scale } = layout; const beamEndX_svg = visualStartX_svg + params.l * scale; const midPointX_svg = visualStartX_svg + (params.l / 2) * scale; _drawBeamLine(svg, visualStartX_svg, beamY, beamEndX_svg); _drawPinSupport(svg, visualStartX_svg, beamY); _drawRollerSupport(svg, beamEndX_svg, beamY); _drawTriangularLoad(svg, visualStartX_svg, midPointX_svg, beamY, `w₀=${params.W_peak}`, Math.max(3, Math.floor(params.l/2)), 30, true); _drawTriangularLoad(svg, midPointX_svg, beamEndX_svg, beamY, ``, Math.max(3, Math.floor(params.l/2)), 30, false); _drawDimensionLine(svg, visualStartX_svg, beamY, beamEndX_svg, `ℓ=${params.l}`, 45); _drawDimensionLine(svg, visualStartX_svg, beamY, midPointX_svg, `ℓ/2`, 60); };
beamVisualizers['fig7'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'simple'}); const { visualStartX_svg, beamY, scale } = layout; const beamEndX_svg = visualStartX_svg + params.l * scale; const loadX_svg = visualStartX_svg + (params.l / 2) * scale; _drawBeamLine(svg, visualStartX_svg, beamY, beamEndX_svg); _drawPinSupport(svg, visualStartX_svg, beamY); _drawRollerSupport(svg, beamEndX_svg, beamY); _drawConcentratedLoad(svg, loadX_svg, beamY, `P=${params.P}`, 35); _drawDimensionLine(svg, visualStartX_svg, beamY, beamEndX_svg, `ℓ=${params.l}`, 40); _drawDimensionLine(svg, visualStartX_svg, beamY, loadX_svg, `ℓ/2`, 55); };
beamVisualizers['fig8'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'simple'}); const { visualStartX_svg, beamY, scale } = layout; const beamEndX_svg = visualStartX_svg + params.l * scale; const loadX_svg = visualStartX_svg + params.a * scale; _drawBeamLine(svg, visualStartX_svg, beamY, beamEndX_svg); _drawPinSupport(svg, visualStartX_svg, beamY); _drawRollerSupport(svg, beamEndX_svg, beamY); _drawConcentratedLoad(svg, loadX_svg, beamY, `P=${params.P}`, 35); _drawDimensionLine(svg, visualStartX_svg, beamY, beamEndX_svg, `ℓ=${params.l}`, 40); _drawDimensionLine(svg, visualStartX_svg, beamY, loadX_svg, `a=${params.a}`, 55); const b_val = params.l - params.a; if (b_val > 0.01) _drawDimensionLine(svg, loadX_svg, beamY, beamEndX_svg, `b=${b_val.toFixed(1)}`, 55); };
beamVisualizers['fig9'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'simple'}); const { visualStartX_svg, beamY, scale } = layout; const beamEndX_svg = visualStartX_svg + params.l * scale; const load1X_svg = visualStartX_svg + params.a * scale; const load2X_svg = visualStartX_svg + (params.l - params.a) * scale; _drawBeamLine(svg, visualStartX_svg, beamY, beamEndX_svg); _drawPinSupport(svg, visualStartX_svg, beamY); _drawRollerSupport(svg, beamEndX_svg, beamY); _drawConcentratedLoad(svg, load1X_svg, beamY, `P=${params.P}`, 35); _drawConcentratedLoad(svg, load2X_svg, beamY, `P=${params.P}`, 35); _drawDimensionLine(svg, visualStartX_svg, beamY, beamEndX_svg, `ℓ=${params.l}`, 40); _drawDimensionLine(svg, visualStartX_svg, beamY, load1X_svg, `a=${params.a}`, 55); _drawDimensionLine(svg, load2X_svg, beamY, beamEndX_svg, `a=${params.a}`, 55); };
beamVisualizers['fig10'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'simple'}); const { visualStartX_svg, beamY, scale } = layout; const beamEndX_svg = visualStartX_svg + params.l * scale; const load1X_svg = visualStartX_svg + params.a_dist * scale; const load2X_svg = visualStartX_svg + (params.l - params.b_dist) * scale; _drawBeamLine(svg, visualStartX_svg, beamY, beamEndX_svg); _drawPinSupport(svg, visualStartX_svg, beamY); _drawRollerSupport(svg, beamEndX_svg, beamY); _drawConcentratedLoad(svg, load1X_svg, beamY, `P=${params.P}`, 35); _drawConcentratedLoad(svg, load2X_svg, beamY, `P=${params.P}`, 35); _drawDimensionLine(svg, visualStartX_svg, beamY, beamEndX_svg, `ℓ=${params.l}`, 40); _drawDimensionLine(svg, visualStartX_svg, beamY, load1X_svg, `a=${params.a_dist}`, 55); _drawDimensionLine(svg, load2X_svg, beamY, beamEndX_svg, `b=${params.b_dist}`, 55); };
beamVisualizers['fig11'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'simple'}); const { visualStartX_svg, beamY, scale } = layout; const beamEndX_svg = visualStartX_svg + params.l * scale; const load1X_svg = visualStartX_svg + params.a * scale; const load2X_svg = visualStartX_svg + (params.a + params.b_spacing) * scale; _drawBeamLine(svg, visualStartX_svg, beamY, beamEndX_svg); _drawPinSupport(svg, visualStartX_svg, beamY); _drawRollerSupport(svg, beamEndX_svg, beamY); _drawConcentratedLoad(svg, load1X_svg, beamY, `P₁=${params.P1}`, 35); _drawConcentratedLoad(svg, load2X_svg, beamY, `P₂=${params.P2}`, 35); _drawDimensionLine(svg, visualStartX_svg, beamY, beamEndX_svg, `ℓ=${params.l}`, 40); _drawDimensionLine(svg, visualStartX_svg, beamY, load1X_svg, `a=${params.a}`, 55); _drawDimensionLine(svg, load1X_svg, beamY, load2X_svg, `b=${params.b_spacing}`, 55); };
beamVisualizers['fig12'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'cantilever', fixed: 'left'}); const { visualStartX_svg, beamY, scale, fixedSupportWidth } = layout; const beamModelEndX_svg = visualStartX_svg + params.l * scale; _drawFixedSupport(svg, visualStartX_svg - fixedSupportWidth, beamY, true, fixedSupportWidth); _drawBeamLine(svg, visualStartX_svg, beamY, beamModelEndX_svg); _drawUDL(svg, visualStartX_svg, beamModelEndX_svg, beamY, `w=${params.w}`, Math.max(5, Math.floor(params.l)), 25, 12); _drawDimensionLine(svg, visualStartX_svg, beamY, beamModelEndX_svg, `ℓ=${params.l}`, 40); };
beamVisualizers['fig13'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'cantilever', fixed: 'left'}); const { visualStartX_svg, beamY, scale, fixedSupportWidth } = layout; const beamModelEndX_svg = visualStartX_svg + params.l * scale; _drawFixedSupport(svg, visualStartX_svg - fixedSupportWidth, beamY, true, fixedSupportWidth); _drawBeamLine(svg, visualStartX_svg, beamY, beamModelEndX_svg); _drawConcentratedLoad(svg, beamModelEndX_svg, beamY, `P=${params.P}`, 35); _drawDimensionLine(svg, visualStartX_svg, beamY, beamModelEndX_svg, `ℓ=${params.l}`, 40); };
beamVisualizers['fig14'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'cantilever', fixed: 'left'}); const { visualStartX_svg, beamY, scale, fixedSupportWidth } = layout; const beamModelEndX_svg = visualStartX_svg + params.l * scale; const loadX_svg = visualStartX_svg + params.a_load * scale; _drawFixedSupport(svg, visualStartX_svg - fixedSupportWidth, beamY, true, fixedSupportWidth); _drawBeamLine(svg, visualStartX_svg, beamY, beamModelEndX_svg); _drawConcentratedLoad(svg, loadX_svg, beamY, `P=${params.P}`, 35); _drawDimensionLine(svg, visualStartX_svg, beamY, beamModelEndX_svg, `ℓ=${params.l}`, 40); _drawDimensionLine(svg, visualStartX_svg, beamY, loadX_svg, `a=${params.a_load}`, 55); };
beamVisualizers['fig15'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'propped_cantilever', fixed: 'left'}); const { visualStartX_svg, beamY, scale, fixedSupportWidth } = layout; const beamModelEndX_svg = visualStartX_svg + params.l * scale; _drawFixedSupport(svg, visualStartX_svg - fixedSupportWidth, beamY, true, fixedSupportWidth); _drawBeamLine(svg, visualStartX_svg, beamY, beamModelEndX_svg); _drawRollerSupport(svg, beamModelEndX_svg, beamY); _drawUDL(svg, visualStartX_svg, beamModelEndX_svg, beamY, `w=${params.w}`, Math.max(5, Math.floor(params.l)), 25, 12); _drawDimensionLine(svg, visualStartX_svg, beamY, beamModelEndX_svg, `ℓ=${params.l}`, 40); };
beamVisualizers['fig16'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'propped_cantilever', fixed: 'left'}); const { visualStartX_svg, beamY, scale, fixedSupportWidth } = layout; const beamModelEndX_svg = visualStartX_svg + params.l * scale; const loadX_svg = visualStartX_svg + (params.l / 2) * scale; _drawFixedSupport(svg, visualStartX_svg - fixedSupportWidth, beamY, true, fixedSupportWidth); _drawBeamLine(svg, visualStartX_svg, beamY, beamModelEndX_svg); _drawRollerSupport(svg, beamModelEndX_svg, beamY); _drawConcentratedLoad(svg, loadX_svg, beamY, `P=${params.P}`, 35); _drawDimensionLine(svg, visualStartX_svg, beamY, beamModelEndX_svg, `ℓ=${params.l}`, 40); _drawDimensionLine(svg, visualStartX_svg, beamY, loadX_svg, `ℓ/2`, 55); };
beamVisualizers['fig17'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'propped_cantilever', fixed: 'left'}); const { visualStartX_svg, beamY, scale, fixedSupportWidth } = layout; const beamModelEndX_svg = visualStartX_svg + params.l * scale; const loadX_svg = visualStartX_svg + params.a_load * scale; _drawFixedSupport(svg, visualStartX_svg - fixedSupportWidth, beamY, true, fixedSupportWidth); _drawBeamLine(svg, visualStartX_svg, beamY, beamModelEndX_svg); _drawRollerSupport(svg, beamModelEndX_svg, beamY); _drawConcentratedLoad(svg, loadX_svg, beamY, `P=${params.P}`, 35); _drawDimensionLine(svg, visualStartX_svg, beamY, beamModelEndX_svg, `ℓ=${params.l}`, 40); _drawDimensionLine(svg, visualStartX_svg, beamY, loadX_svg, `a=${params.a_load}`, 55); };
beamVisualizers['fig18'] = (svg, params, svgLayout) => { const totalLength = params.l_span + params.a_overhang; const layout = _calculateLayout({l: totalLength}, svgLayout, {type: 'overhang_right'}); const { visualStartX_svg, beamY, scale } = layout; const support1X_svg = visualStartX_svg; const support2X_svg = visualStartX_svg + params.l_span * scale; const beamEndX_svg = visualStartX_svg + totalLength * scale; _drawBeamLine(svg, visualStartX_svg, beamY, beamEndX_svg); _drawPinSupport(svg, support1X_svg, beamY); _drawRollerSupport(svg, support2X_svg, beamY); _drawUDL(svg, visualStartX_svg, beamEndX_svg, beamY, `w=${params.w}`, Math.max(5, Math.floor(totalLength)), 25, 12); _drawDimensionLine(svg, support1X_svg, beamY, support2X_svg, `ℓ=${params.l_span}`, 40); if (params.a_overhang > 0) _drawDimensionLine(svg, support2X_svg, beamY, beamEndX_svg, `a=${params.a_overhang}`, 40); };
beamVisualizers['fig19'] = (svg, params, svgLayout) => { const totalLength = params.l_span + params.a_overhang; const layout = _calculateLayout({l: totalLength}, svgLayout, {type: 'overhang_right'}); const { visualStartX_svg, beamY, scale } = layout; const support1X_svg = visualStartX_svg; const support2X_svg = visualStartX_svg + params.l_span * scale; const beamEndX_svg = visualStartX_svg + totalLength * scale; const udlStartX_svg = support2X_svg; _drawBeamLine(svg, visualStartX_svg, beamY, beamEndX_svg); _drawPinSupport(svg, support1X_svg, beamY); _drawRollerSupport(svg, support2X_svg, beamY); _drawUDL(svg, udlStartX_svg, beamEndX_svg, beamY, `w=${params.w}`, Math.max(3, Math.floor(params.a_overhang)), 25, 12); _drawDimensionLine(svg, support1X_svg, beamY, support2X_svg, `ℓ=${params.l_span}`, 40); if (params.a_overhang > 0) _drawDimensionLine(svg, support2X_svg, beamY, beamEndX_svg, `a=${params.a_overhang}`, 55); };
beamVisualizers['fig20'] = (svg, params, svgLayout) => { const totalLength = params.l_span + params.a_overhang; const layout = _calculateLayout({l: totalLength}, svgLayout, {type: 'overhang_right'}); const { visualStartX_svg, beamY, scale } = layout; const support1X_svg = visualStartX_svg; const support2X_svg = visualStartX_svg + params.l_span * scale; const beamEndX_svg = visualStartX_svg + totalLength * scale; _drawBeamLine(svg, visualStartX_svg, beamY, beamEndX_svg); _drawPinSupport(svg, support1X_svg, beamY); _drawRollerSupport(svg, support2X_svg, beamY); _drawConcentratedLoad(svg, beamEndX_svg, beamY, `P=${params.P}`, 35); _drawDimensionLine(svg, support1X_svg, beamY, support2X_svg, `ℓ=${params.l_span}`, 40); if (params.a_overhang > 0) _drawDimensionLine(svg, support2X_svg, beamY, beamEndX_svg, `a=${params.a_overhang}`, 55); };
beamVisualizers['fig21'] = (svg, params, svgLayout) => { const totalLength = params.l_span + params.x1_overhang; const layout = _calculateLayout({l: totalLength}, svgLayout, {type: 'overhang_right'}); const { visualStartX_svg, beamY, scale } = layout; const support1X_svg = visualStartX_svg; const support2X_svg = visualStartX_svg + params.l_span * scale; const loadX_svg = visualStartX_svg + params.a_load * scale; const beamEndX_svg = visualStartX_svg + totalLength * scale; _drawBeamLine(svg, visualStartX_svg, beamY, beamEndX_svg); _drawPinSupport(svg, support1X_svg, beamY); _drawRollerSupport(svg, support2X_svg, beamY); _drawConcentratedLoad(svg, loadX_svg, beamY, `P=${params.P}`, 35); _drawDimensionLine(svg, support1X_svg, beamY, support2X_svg, `ℓ=${params.l_span}`, 40); _drawDimensionLine(svg, support1X_svg, beamY, loadX_svg, `a=${params.a_load}`, 55); if (params.x1_overhang > 0) _drawDimensionLine(svg, support2X_svg, beamY, beamEndX_svg, `x₁=${params.x1_overhang}`, 55); };
beamVisualizers['fig22'] = (svg, params, svgLayout) => { const totalLength = params.a_left_overhang + params.l_span + params.c_right_overhang; const layout = _calculateLayout({l: totalLength}, svgLayout, {type: 'double_overhang'}); const { visualStartX_svg, beamY, scale } = layout; const support1X_svg = visualStartX_svg + params.a_left_overhang * scale; const support2X_svg = support1X_svg + params.l_span * scale; const beamEndX_svg = visualStartX_svg + totalLength * scale; _drawBeamLine(svg, visualStartX_svg, beamY, beamEndX_svg); _drawPinSupport(svg, support1X_svg, beamY); _drawRollerSupport(svg, support2X_svg, beamY); _drawUDL(svg, visualStartX_svg, beamEndX_svg, beamY, `w=${params.w}`, Math.max(7, Math.floor(totalLength)), 25, 12); if (params.a_left_overhang > 0) _drawDimensionLine(svg, visualStartX_svg, beamY, support1X_svg, `a=${params.a_left_overhang}`, 40); _drawDimensionLine(svg, support1X_svg, beamY, support2X_svg, `ℓ=${params.l_span}`, 40); if (params.c_right_overhang > 0) _drawDimensionLine(svg, support2X_svg, beamY, beamEndX_svg, `c=${params.c_right_overhang}`, 40); };
beamVisualizers['fig23'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'fixed_both_ends', fixed: 'both'}); const { visualStartX_svg, beamY, scale, fixedSupportWidth } = layout; const beamModelEndX_svg = visualStartX_svg + params.l * scale; _drawFixedSupport(svg, visualStartX_svg - fixedSupportWidth, beamY, true, fixedSupportWidth); _drawBeamLine(svg, visualStartX_svg, beamY, beamModelEndX_svg); _drawFixedSupport(svg, beamModelEndX_svg, beamY, false, fixedSupportWidth); _drawUDL(svg, visualStartX_svg, beamModelEndX_svg, beamY, `w=${params.w}`, Math.max(5, Math.floor(params.l)), 25, 12); _drawDimensionLine(svg, visualStartX_svg, beamY, beamModelEndX_svg, `ℓ=${params.l}`, 40); };
beamVisualizers['fig24'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'fixed_both_ends', fixed: 'both'}); const { visualStartX_svg, beamY, scale, fixedSupportWidth } = layout; const beamModelEndX_svg = visualStartX_svg + params.l * scale; const loadX_svg = visualStartX_svg + (params.l / 2) * scale; _drawFixedSupport(svg, visualStartX_svg - fixedSupportWidth, beamY, true, fixedSupportWidth); _drawBeamLine(svg, visualStartX_svg, beamY, beamModelEndX_svg); _drawFixedSupport(svg, beamModelEndX_svg, beamY, false, fixedSupportWidth); _drawConcentratedLoad(svg, loadX_svg, beamY, `P=${params.P}`, 35); _drawDimensionLine(svg, visualStartX_svg, beamY, beamModelEndX_svg, `ℓ=${params.l}`, 40); _drawDimensionLine(svg, visualStartX_svg, beamY, loadX_svg, `ℓ/2`, 55); };
beamVisualizers['fig25'] = (svg, params, svgLayout) => { const layout = _calculateLayout(params, svgLayout, {type: 'fixed_both_ends', fixed: 'both'}); const { visualStartX_svg, beamY, scale, fixedSupportWidth } = layout; const beamModelEndX_svg = visualStartX_svg + params.l * scale; const loadX_svg = visualStartX_svg + params.a_load * scale; _drawFixedSupport(svg, visualStartX_svg - fixedSupportWidth, beamY, true, fixedSupportWidth); _drawBeamLine(svg, visualStartX_svg, beamY, beamModelEndX_svg); _drawFixedSupport(svg, beamModelEndX_svg, beamY, false, fixedSupportWidth); _drawConcentratedLoad(svg, loadX_svg, beamY, `P=${params.P}`, 35); _drawDimensionLine(svg, visualStartX_svg, beamY, beamModelEndX_svg, `ℓ=${params.l}`, 40); _drawDimensionLine(svg, visualStartX_svg, beamY, loadX_svg, `a=${params.a_load}`, 55); };
beamVisualizers['fig26'] = (svg, params, svgLayout) => { const totalLength = 2 * params.l_span; const layout = _calculateLayout({l: totalLength}, svgLayout, {type: 'continuous_two_equal_span'}); const { visualStartX_svg, beamY, scale } = layout; const support1X_svg = visualStartX_svg; const support2X_svg = visualStartX_svg + params.l_span * scale; const support3X_svg = visualStartX_svg + 2 * params.l_span * scale; _drawBeamLine(svg, support1X_svg, beamY, support3X_svg); _drawPinSupport(svg, support1X_svg, beamY); _drawRollerSupport(svg, support2X_svg, beamY); _drawRollerSupport(svg, support3X_svg, beamY); _drawUDL(svg, support1X_svg, support2X_svg, beamY, `w=${params.w}`, Math.max(5, Math.floor(params.l_span)), 25, 12); _drawDimensionLine(svg, support1X_svg, beamY, support2X_svg, `ℓ=${params.l_span}`, 40); _drawDimensionLine(svg, support2X_svg, beamY, support3X_svg, `ℓ=${params.l_span}`, 40); };
beamVisualizers['fig27'] = (svg, params, svgLayout) => { const totalLength = 2 * params.l_span; const layout = _calculateLayout({l: totalLength}, svgLayout, {type: 'continuous_two_equal_span'}); const { visualStartX_svg, beamY, scale } = layout; const support1X_svg = visualStartX_svg; const support2X_svg = visualStartX_svg + params.l_span * scale; const support3X_svg = visualStartX_svg + 2 * params.l_span * scale; const loadX_svg = support1X_svg + (params.l_span / 2) * scale; _drawBeamLine(svg, support1X_svg, beamY, support3X_svg); _drawPinSupport(svg, support1X_svg, beamY); _drawRollerSupport(svg, support2X_svg, beamY); _drawRollerSupport(svg, support3X_svg, beamY); _drawConcentratedLoad(svg, loadX_svg, beamY, `P=${params.P}`, 35); _drawDimensionLine(svg, support1X_svg, beamY, support2X_svg, `ℓ=${params.l_span}`, 40); _drawDimensionLine(svg, support2X_svg, beamY, support3X_svg, `ℓ=${params.l_span}`, 40); _drawDimensionLine(svg, support1X_svg, beamY, loadX_svg, `ℓ/2`, 55); };
beamVisualizers['fig28'] = (svg, params, svgLayout) => { const totalLength = 2 * params.l_span; const layout = _calculateLayout({l: totalLength}, svgLayout, {type: 'continuous_two_equal_span'}); const { visualStartX_svg, beamY, scale } = layout; const support1X_svg = visualStartX_svg; const support2X_svg = visualStartX_svg + params.l_span * scale; const support3X_svg = visualStartX_svg + 2 * params.l_span * scale; const loadX_svg = support1X_svg + params.a_load * scale; _drawBeamLine(svg, support1X_svg, beamY, support3X_svg); _drawPinSupport(svg, support1X_svg, beamY); _drawRollerSupport(svg, support2X_svg, beamY); _drawRollerSupport(svg, support3X_svg, beamY); _drawConcentratedLoad(svg, loadX_svg, beamY, `P=${params.P}`, 35); _drawDimensionLine(svg, support1X_svg, beamY, support2X_svg, `ℓ=${params.l_span}`, 40); _drawDimensionLine(svg, support2X_svg, beamY, support3X_svg, `ℓ=${params.l_span}`, 40); _drawDimensionLine(svg, support1X_svg, beamY, loadX_svg, `a=${params.a_load}`, 55); };
beamVisualizers['fig29'] = (svg, params, svgLayout) => { const totalLength = 2 * params.l_span; const layout = _calculateLayout({l: totalLength}, svgLayout, {type: 'continuous_two_equal_span'}); const { visualStartX_svg, beamY, scale } = layout; const support1X_svg = visualStartX_svg; const support2X_svg = visualStartX_svg + params.l_span * scale; const support3X_svg = visualStartX_svg + 2 * params.l_span * scale; _drawBeamLine(svg, support1X_svg, beamY, support3X_svg); _drawPinSupport(svg, support1X_svg, beamY); _drawRollerSupport(svg, support2X_svg, beamY); _drawRollerSupport(svg, support3X_svg, beamY); _drawUDL(svg, support1X_svg, support3X_svg, beamY, `w=${params.w}`, Math.max(7, Math.floor(totalLength)), 25, 12); _drawDimensionLine(svg, support1X_svg, beamY, support2X_svg, `ℓ=${params.l_span}`, 40); _drawDimensionLine(svg, support2X_svg, beamY, support3X_svg, `ℓ=${params.l_span}`, 40); };
beamVisualizers['fig30'] = (svg, params, svgLayout) => { const totalLength = 2 * params.l_span; const layout = _calculateLayout({l: totalLength}, svgLayout, {type: 'continuous_two_equal_span'}); const { visualStartX_svg, beamY, scale } = layout; const s1 = visualStartX_svg; const s2 = visualStartX_svg + params.l_span * scale; const s3 = visualStartX_svg + 2 * params.l_span * scale; const load1_s1_svg = s1 + params.a_dist * scale; const load2_s1_svg = s2 - params.a_dist * scale; const load1_s2_svg = s2 + params.a_dist * scale; const load2_s2_svg = s3 - params.a_dist * scale; _drawBeamLine(svg, s1, beamY, s3); _drawPinSupport(svg, s1, beamY); _drawRollerSupport(svg, s2, beamY); _drawRollerSupport(svg, s3, beamY); _drawConcentratedLoad(svg, load1_s1_svg, beamY, `P=${params.P}`, 35); _drawConcentratedLoad(svg, load2_s1_svg, beamY, `P=${params.P}`, 35); _drawConcentratedLoad(svg, load1_s2_svg, beamY, `P=${params.P}`, 35); _drawConcentratedLoad(svg, load2_s2_svg, beamY, `P=${params.P}`, 35); _drawDimensionLine(svg, s1, beamY, s2, `ℓ=${params.l_span}`, 40); _drawDimensionLine(svg, s2, beamY, s3, `ℓ=${params.l_span}`, 40); _drawDimensionLine(svg, s1, beamY, load1_s1_svg, `a=${params.a_dist}`, 55); _drawDimensionLine(svg, s2, beamY, load1_s2_svg, `a=${params.a_dist}`, 55); };
beamVisualizers['fig31'] = (svg, params, svgLayout) => { const totalLength = params.l1 + params.l2; const layout = _calculateLayout({l: totalLength}, svgLayout, {type: 'continuous_two_unequal_span'}); const { visualStartX_svg, beamY, scale } = layout; const s1 = visualStartX_svg; const s2 = visualStartX_svg + params.l1 * scale; const s3 = visualStartX_svg + (params.l1 + params.l2) * scale; _drawBeamLine(svg, s1, beamY, s3); _drawPinSupport(svg, s1, beamY); _drawRollerSupport(svg, s2, beamY); _drawRollerSupport(svg, s3, beamY); _drawUDL(svg, s1, s3, beamY, `w=${params.w}`, Math.max(7, Math.floor(totalLength)), 25, 12); _drawDimensionLine(svg, s1, beamY, s2, `ℓ₁=${params.l1}`, 40); _drawDimensionLine(svg, s2, beamY, s3, `ℓ₂=${params.l2}`, 40); };
beamVisualizers['fig32'] = (svg, params, svgLayout) => { const totalLength = params.l1 + params.l2; const layout = _calculateLayout({l: totalLength}, svgLayout, {type: 'continuous_two_unequal_span'}); const { visualStartX_svg, beamY, scale } = layout; const s1 = visualStartX_svg; const s2 = visualStartX_svg + params.l1 * scale; const s3 = visualStartX_svg + (params.l1 + params.l2) * scale; const load1_svg = s1 + (params.l1 / 2) * scale; const load2_svg = s2 + (params.l2 / 2) * scale; _drawBeamLine(svg, s1, beamY, s3); _drawPinSupport(svg, s1, beamY); _drawRollerSupport(svg, s2, beamY); _drawRollerSupport(svg, s3, beamY); _drawConcentratedLoad(svg, load1_svg, beamY, `P₁=${params.P1}`, 35); _drawConcentratedLoad(svg, load2_svg, beamY, `P₂=${params.P2}`, 35); _drawDimensionLine(svg, s1, beamY, s2, `ℓ₁=${params.l1}`, 40); _drawDimensionLine(svg, s2, beamY, s3, `ℓ₂=${params.l2}`, 40); _drawDimensionLine(svg, s1, beamY, load1_svg, `ℓ₁/2`, 55); _drawDimensionLine(svg, s2, beamY, load2_svg, `ℓ₂/2`, 55); };