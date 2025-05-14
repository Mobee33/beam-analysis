// beam_data.js

// Helper function to generate points for curves
function generateCurvePoints(x_start, x_end, numPoints, func_y_original_calculator, invertY = true, paramsForFunc = {}) {
    const points = [];
    if (numPoints <= 1 && x_start === x_end) {
         points.push({ x: x_start, y: invertY ? -func_y_original_calculator(x_start, paramsForFunc) : func_y_original_calculator(x_start, paramsForFunc) });
         return points;
    }
    if (numPoints <=0) numPoints = 2;

    const step = (x_end - x_start) / (numPoints <= 1 ? 1 : (numPoints - 1));
    for (let i = 0; i < numPoints; i++) {
        const x = x_start + i * step;
        const original_y = func_y_original_calculator(x, paramsForFunc);
        points.push({ x: x, y: invertY ? -original_y : original_y });
    }
    return points;
}

const beamData = [
    { // Figure 1
        id: 'fig1', title: 'Figure 1: Simple Beam - Uniformly Distributed Load',
        beamType: 'simple',
        parameters: [ { name: 'w', label: 'Load (w)', default: 1, unit: 'N/m' }, { name: 'l', label: 'Length (ℓ)', default: 10, unit: 'm' } ],
        equations: { R: "R = V = wℓ/2", Vx: "V<span class='eq-sub'>x</span> = w(ℓ/2 - x)", Mmax_center: "M<span class='eq-sub'>max</span> (center) = wℓ<span class='eq-sup'>2</span>/8", Mx: "M<span class='eq-sub'>x</span> = wx/2 * (ℓ - x)", Delta_max: "Δ<span class='eq-sub'>max</span> = 5wℓ<span class='eq-sup'>4</span>/(384EI)" },
        plotConfig: {
            shear: (params) => { const { w, l } = params; const R = w * l / 2; return { data: [ { x: 0, y: R }, { x: l / 2, y: 0 }, { x: l, y: -R } ], yAxisLabel: 'V' }; },
            moment: (params) => { const { w, l } = params; return { data: generateCurvePoints(0, l, 31, (x) => (w * x / 2) * (l - x)), yAxisLabel: 'M (Inverted)' }; }
        },
        visualizer: null
    },
    { // Figure 2
        id: 'fig2', title: 'Figure 2: Simple Beam - Uniform Load Partially Distributed',
        beamType: 'simple',
        parameters: [ { name: 'w', label: 'Load (w)', default: 1, unit: 'N/m' }, { name: 'l', label: 'Total Length (ℓ)', default: 12, unit: 'm' }, { name: 'a', label: 'Dist to Load Start (a)', default: 2, unit: 'm' }, { name: 'b', label: 'Load Length (b)', default: 6, unit: 'm' } ],
        equations: { R1: "R₁ = wb/(2ℓ) · (2(ℓ-a-b) + b)", R2: "R₂ = wb/(2ℓ) · (2a + b)", Vx_partial: "Vₓ (a<x<a+b) = R₁ - w(x-a)", Mmax_at_Vx_0: "Mₘₐₓ (at x=a+R₁/w) = R₁(a + R₁/(2w))", M_before_load: "Mₓ (x<a) = R₁x", M_under_load: "Mₓ (a<x<a+b) = R₁x - w/2 · (x-a)²", M_after_load: "Mₓ (x>a+b) = R₂(ℓ-x)" },
        plotConfig: {
            shear: (params) => { const { w, l, a, b } = params; const c_dist = l - a - b; if (c_dist<0 || a<0 || b<0 || a+b>l) return {data:[], yAxisLabel:'V (Error: invalid lengths)'}; const R1 = (w * b / (2 * l)) * (2 * c_dist + b); const V_at_a_plus_b = R1 - w * b; return { data: [ { x: 0, y: R1 }, { x: a, y: R1 }, {x: a+0.0001, y: R1}, { x: a + b, y: V_at_a_plus_b }, { x: l, y: V_at_a_plus_b } ], yAxisLabel: 'V' }; },
            moment: (params) => { const { w, l, a, b } = params; const c_dist = l - a - b; if (c_dist<0 || a<0 || b<0 || a+b>l) return {data:[], yAxisLabel:'M (Error: invalid lengths)'}; const R1 = (w * b / (2 * l)) * (2 * c_dist + b); const R2 = (w * b / (2 * l)) * (2 * a + b); let p = []; p.push(...generateCurvePoints(0, a, Math.max(2, Math.ceil(a*2+1)), (x) => R1 * x)); if(a>0 && p.length > 0 && Math.abs(p[p.length-1].x - a) < 1e-5) p.pop(); p.push(...generateCurvePoints(a, a + b, Math.max(2,Math.ceil(b*3+1)), (x) => R1 * x - (w / 2) * Math.pow(x - a, 2))); if(b>0 && p.length > 0 && Math.abs(p[p.length-1].x - (a+b)) < 1e-5) p.pop(); p.push(...generateCurvePoints(a + b, l, Math.max(2,Math.ceil(c_dist*2+1)), (x) => R2 * (l - x))); return { data: p, yAxisLabel: 'M (Inverted)' }; }
        },
        visualizer: null
    },
    { // Figure 3
        id: 'fig3', title: 'Figure 3: Simple Beam - Uniform Load Partially Distributed at One End',
        beamType: 'simple',
        parameters: [ { name: 'w', label: 'Load (w)', default: 1, unit: 'N/m' }, { name: 'l', label: 'Total Length (ℓ)', default: 10, unit: 'm' }, { name: 'a', label: 'Load Length (a)', default: 6, unit: 'm' } ],
        equations: { R1: "R₁=wa/(2ℓ)(2ℓ-a)", R2: "R₂=wa²/(2ℓ)", Vx_loaded: "Vₓ(x<a)=R₁-wx", Mmax: "Mₘₐₓ(x=R₁/w)=R₁²/(2w)", Mx_loaded: "Mₓ(x<a)=R₁x-wx²/2", Mx_unloaded: "Mₓ(x>a)=R₂(ℓ-x)" },
        plotConfig: {
            shear: (params) => { const { w, l, a } = params; if (a>l || a<0) return {data:[], yAxisLabel:'V (Error: invalid a)'}; const R1 = (w * a / (2 * l)) * (2 * l - a); const R2 = (w * a * a) / (2 * l); return { data: [ { x: 0, y: R1 }, { x: a, y: R1 - w * a }, { x: l, y: -R2 } ], yAxisLabel: 'V' }; },
            moment: (params) => { const { w, l, a } = params; if (a>l || a<0) return {data:[], yAxisLabel:'M (Error: invalid a)'}; const R1 = (w * a / (2 * l)) * (2 * l - a); const R2 = (w * a * a) / (2 * l); let p = []; p.push(...generateCurvePoints(0, a, Math.max(2,Math.ceil(a*3+1)), (x) => R1 * x - (w * x * x / 2))); if(a>0 && p.length > 0 && Math.abs(p[p.length-1].x - a) < 1e-5) p.pop(); p.push(...generateCurvePoints(a, l, Math.max(2,Math.ceil((l-a)*2+1)), (x) => R2 * (l - x))); return { data: p, yAxisLabel: 'M (Inverted)' }; }
        },
        visualizer: null
    },
    { // Figure 4
        id: 'fig4', title: 'Figure 4: Simple Beam - Uniform Load Partially Distributed at Each End',
        beamType: 'simple',
        parameters: [ { name: 'w1', label: 'Load Left (w₁)', default: 1, unit: 'N/m' }, { name: 'w2', label: 'Load Right (w₂)', default: 0.8, unit: 'N/m' }, { name: 'l', label: 'Total Length (ℓ)', default: 15, unit: 'm' }, { name: 'a', label: 'Load Length Left (a)', default: 4, unit: 'm' }, { name: 'c', label: 'Load Length Right (c)', default: 5, unit: 'm' } ],
        equations: { R1: "R₁=V₁=(w₁a(2ℓ-a)+w₂c²)/(2ℓ)", R2: "R₂=V₂=(w₂c(2ℓ-c)+w₁a²)/(2ℓ)", Vx_a: "Vₓ(x<a)=R₁-w₁x", Vx_b: "Vₓ(a<x<ℓ-c)=R₁-w₁a", Vx_c: "Vₓ(x>ℓ-c)=R₂-w₂(ℓ-x)", M_a:"Mₓ(x<a)=R₁x-w₁x²/2", M_b:"Mₓ(a<x<ℓ-c)=R₁x-w₁a(x-a/2)", M_c:"Mₓ(x>ℓ-c)=R₂(ℓ-x)-w₂(ℓ-x)²/2" },
        plotConfig: {
            shear: (params) => {
                const { w1, w2, l, a, c } = params;
                const b_gap = l - a - c;
                if (b_gap < 0 || a < 0 || c < 0) return {data:[], yAxisLabel:'V (Error: invalid lengths)'};
                const R1 = (w1 * a * (2 * l - a) + w2 * c * c) / (2 * l);
                const R2 = (w2 * c * (2 * l - c) + w1 * a * a) / (2 * l);
                let data = [];
                data.push({ x: 0, y: R1 }); data.push({ x: a, y: R1 - w1 * a });
                if (b_gap > 0.001) { data.push({ x: a + 0.0001, y: R1 - w1 * a }); data.push({ x: l - c - 0.0001, y: R1 - w1 * a }); }
                data.push({ x: l - c, y: -R2 + w2 * c }); data.push({ x: l, y: -R2 });
                return { data, yAxisLabel: 'V' };
            },
            moment: (params) => {
                const { w1, w2, l, a, c } = params;
                const b_gap = l - a - c;
                if (b_gap < 0 || a < 0 || c < 0) return {data:[], yAxisLabel:'M (Error: invalid lengths)'};
                const R1 = (w1 * a * (2 * l - a) + w2 * c * c) / (2 * l);
                const R2 = (w2 * c * (2 * l - c) + w1 * a * a) / (2 * l);
                let p = [];
                p.push(...generateCurvePoints(0, a, Math.max(2, Math.ceil(a*3+1)), (x) => R1 * x - w1 * x * x / 2));
                if(a>0 && p.length > 0 && Math.abs(p[p.length-1].x - a) < 1e-5 ) p.pop();
                if (b_gap > 0.001) { p.push(...generateCurvePoints(a, l - c, Math.max(2, Math.ceil(b_gap*2+1)), (x) => R1 * x - w1 * a * (x - a / 2) )); if(p.length > 0 && Math.abs(p[p.length-1].x - (l-c)) < 1e-5 ) p.pop(); }
                p.push(...generateCurvePoints(l - c, l, Math.max(2, Math.ceil(c*3+1)), (x) => R2 * (l - x) - w2 * Math.pow(l - x, 2) / 2));
                return { data: p, yAxisLabel: 'M (Inverted)' };
            }
        },
        visualizer: null
    },
    { // Figure 5
        id: 'fig5', title: 'Figure 5: Simple Beam - Load Increasing Uniformly to One End',
        beamType: 'simple',
        parameters: [ { name: 'W_peak', label: 'Peak Load (w₀ at ℓ)', default: 10, unit: 'N/m' }, { name: 'l', label: 'Length (ℓ)', default: 10, unit: 'm' } ],
        equations: { R1: "R₁=V₁=w₀ℓ/6", R2: "R₂=V₂=w₀ℓ/3", Vx: "Vₓ=w₀ℓ/6-w₀x²/(2ℓ)", Mmax: "Mₘₐₓ(x=ℓ/√3)=w₀ℓ²/(9√3)", Mx: "Mₓ=w₀x/(6ℓ)*(ℓ²-x²)" },
        plotConfig: {
            shear: (params) => { const { W_peak, l } = params; return { data: generateCurvePoints(0, l, 31, (x) => W_peak*l/6 - (W_peak * x*x)/(2*l), false), yAxisLabel: 'V' }; },
            moment: (params) => { const { W_peak, l } = params; return { data: generateCurvePoints(0, l, 41, (x) => (W_peak*x)/(6*l) * (l*l - x*x) ), yAxisLabel: 'M (Inverted)' }; }
        },
        visualizer: null
    },
    { // Figure 6
        id: 'fig6', title: 'Figure 6: Simple Beam - Load Increasing Uniformly to Center',
        beamType: 'simple',
        parameters: [ { name: 'W_peak', label: 'Peak Load (w₀ at center)', default: 5, unit: 'N/m' }, { name: 'l', label: 'Length (ℓ)', default: 10, unit: 'm' } ],
        equations: { R: "R=V=w₀ℓ/4", Vx_half: "Vₓ(x<ℓ/2)=w₀ℓ/4-2w₀x²/ℓ²", Mmax_center: "Mₘₐₓ(center)=w₀ℓ²/12", Mx_half: "Mₓ(x<ℓ/2)=w₀x/2 · (ℓ/2 - 2x²/ (3ℓ))" }, // Corrected Vx and Mx based on w(x) = 2w₀x/ℓ for x<ℓ/2
        plotConfig: {
            shear: (params) => {
                const { W_peak, l } = params; let data = []; const R = W_peak*l/4;
                data.push(...generateCurvePoints(0, l/2, 21, (x) => R - (W_peak * 2 * x * x) / (l*l), false)); // w(x) = W_peak * (2x/l) for x < l/2
                let p2_shear = generateCurvePoints(0, l/2, 21, (x) => R - (W_peak * 2 * x * x) / (l*l), false);
                p2_shear.forEach(pt => data.push({x: l - pt.x, y: -pt.y})); // Symmetry for shear
                data = data.sort((a,b)=>a.x-b.x).filter((item, pos, ary) => !pos || Math.abs(item.x - ary[pos-1].x) > 1e-5 || Math.abs(item.y - ary[pos-1].y) > 1e-5 );
                return { data, yAxisLabel: 'V' };
            },
            moment: (params) => {
                const { W_peak, l } = params; let data = []; const R = W_peak*l/4;
                data.push(...generateCurvePoints(0, l/2, 31, (x) => R*x - (W_peak * 2 * x * x * x) / (3*l*l) ));
                let p2_moment = generateCurvePoints(0, l/2, 31, (x) => R*x - (W_peak * 2 * x * x * x) / (3*l*l) );
                p2_moment.forEach(pt => data.push({x: l - pt.x, y: pt.y})); // Symmetry for moment
                data = data.sort((a,b)=>a.x-b.x).filter((item, pos, ary) => !pos || Math.abs(item.x - ary[pos-1].x) > 1e-5 || Math.abs(item.y - ary[pos-1].y) > 1e-5 );
                return { data, yAxisLabel: 'M (Inverted)' };
            }
        },
        visualizer: null
    },
    { // Figure 7
        id: 'fig7', title: 'Figure 7: Simple Beam - Concentrated Load at Center',
        beamType: 'simple',
        parameters: [ { name: 'P', label: 'Load (P)', default: 10, unit: 'N' }, { name: 'l', label: 'Length (ℓ)', default: 10, unit: 'm' } ],
        equations: { R: "R = V = P/2", Mmax_load: "Mₘₐₓ (at load) = Pℓ/4", Mx_half: "Mₓ (x < ℓ/2) = Px/2", Delta_max: "Δₘₐₓ = Pℓ³/(48EI)" },
        plotConfig: {
            shear: (params) => { const { P, l } = params; const V = P / 2; return { data: [ { x: 0, y: V }, { x: l / 2 - 0.0001, y: V }, { x: l / 2 + 0.0001, y: -V }, { x: l, y: -V } ], yAxisLabel: 'V' }; },
            moment: (params) => { const { P, l } = params; const M_max_original = P * l / 4; return { data: [ { x: 0, y: 0 }, { x: l / 2, y: -M_max_original }, { x: l, y: 0 } ], yAxisLabel: 'M (Inverted)' }; }
        },
        visualizer: null
    },
    { // Figure 8
        id: 'fig8', title: 'Figure 8: Simple Beam - Concentrated Load at Any Point',
        beamType: 'simple',
        parameters: [ { name: 'P', label: 'Load (P)', default: 10, unit: 'N' }, { name: 'l', label: 'Total Length (ℓ)', default: 10, unit: 'm' }, { name: 'a', label: 'Dist to Load (a)', default: 3, unit: 'm' } ],
        equations: { R1: "R₁=Pb/ℓ (b=ℓ-a)", R2: "R₂=Pa/ℓ", Mmax_load: "Mₘₐₓ(at load)=Pab/ℓ", Mx_left: "Mₓ(x<a)=Pbx/ℓ", Mx_right: "Mₓ(x>a)=Pa(ℓ-x)/ℓ" },
        plotConfig: {
            shear: (params) => { const { P, l, a } = params; if(a>l || a<0) return {data:[], yAxisLabel:'V (Error: invalid a)'}; const b = l - a; const R1 = P * b / l; const R2 = P * a / l; return { data: [ { x: 0, y: R1 }, { x: a - 0.0001, y: R1 }, { x: a + 0.0001, y: -R2 }, { x: l, y: -R2 } ], yAxisLabel: 'V' }; },
            moment: (params) => { const { P, l, a } = params; if(a>l || a<0) return {data:[], yAxisLabel:'M (Error: invalid a)'}; const b = l - a; const M_max_original = P * a * b / l; return { data: [ { x: 0, y: 0 }, { x: a, y: -M_max_original }, { x: l, y: 0 } ], yAxisLabel: 'M (Inverted)' }; }
        },
        visualizer: null
    },
    { // Figure 9
        id: 'fig9', title: 'Figure 9: Simple Beam - Two Equal Concentrated Loads Symmetrically Placed',
        beamType: 'simple',
        parameters: [ { name: 'P', label: 'Load (P)', default: 5, unit: 'N' }, { name: 'l', label: 'Total Length (ℓ)', default: 12, unit: 'm' }, { name: 'a', label: 'Dist from Support (a)', default: 3, unit: 'm' } ],
        equations: { R: "R = V = P", Mmax_between: "Mₘₐₓ(between loads)=Pa", Mx_outside: "Mₓ(x<a)=Px", Delta_max: "Δₘₐₓ(center)=Pa/(24EI)(3ℓ²-4a²)" },
        plotConfig: {
            shear: (params) => { const { P, l, a } = params; if(2*a>l || a<0) return {data:[], yAxisLabel:'V (Error: invalid a)'}; return { data: [ { x: 0, y: P }, { x: a - 0.0001, y: P }, { x: a + 0.0001, y: 0 }, { x: l - a - 0.0001, y: 0 }, { x: l - a + 0.0001, y: -P }, { x: l, y: -P } ], yAxisLabel: 'V' }; },
            moment: (params) => { const { P, l, a } = params; if(2*a>l || a<0) return {data:[], yAxisLabel:'M (Error: invalid a)'}; const M_max_original = P * a; return { data: [ { x: 0, y: 0 }, { x: a, y: -M_max_original }, { x: l - a, y: -M_max_original }, { x: l, y: 0 } ], yAxisLabel: 'M (Inverted)' }; }
        },
        visualizer: null
    },
    { // Figure 10
        id: 'fig10', title: 'Figure 10: Simple Beam - Two Equal Concentrated Loads Unsymmetrically Placed',
        beamType: 'simple',
        parameters: [ { name: 'P', label: 'Load (P)', default: 7, unit: 'N' }, { name: 'l', label: 'Total Length (ℓ)', default: 15, unit: 'm' }, { name: 'a_dist', label: 'Dist to 1st Load (a)', default: 4, unit: 'm' }, { name: 'b_dist', label: 'Dist from Right to 2nd Load (b)', default: 5, unit: 'm' } ],
        equations: { R1: "R₁=P/ℓ( (ℓ-a) + b )", R2: "R₂=P/ℓ( a + (ℓ-b) )", V1: "V₁(x<a)=R₁", V2: "V₂(a<x<ℓ-b)=R₁-P", V3: "V₃(x>ℓ-b)=-R₂", M1: "M₁(at 1st load)=R₁a", M2: "M₂(at 2nd load)=R₂b" },
        plotConfig: {
            shear: (params) => {
                const { P, l, a_dist, b_dist } = params;
                const load1_pos = a_dist; const load2_pos = l - b_dist;
                if (load1_pos >= load2_pos || a_dist < 0 || b_dist < 0 || a_dist >=l || b_dist >=l ) return {data:[], yAxisLabel:'V (Error: invalid lengths)'};
                const R1 = P/l * ( (l-load1_pos) + (l-load2_pos) ); // Corrected based on superposition: R1 = P(l-a)/l + P(l-(l-b))/l = P/l * (l-a+b)
                const R2 = P - R1 + P; // Total upward = total downward. R1+R2 = 2P. R2 = 2P-R1.
                                      // Or R2 = P*a/l + P*(l-b)/l = P/l * (a+l-b)
                let data = [];
                data.push({ x: 0, y: R1 }); data.push({ x: load1_pos - 0.0001, y: R1 });
                data.push({ x: load1_pos + 0.0001, y: R1 - P }); data.push({ x: load2_pos - 0.0001, y: R1 - P });
                data.push({ x: load2_pos + 0.0001, y: R1 - P - P }); data.push({ x: l, y: R1 - 2*P }); // which is -R2
                return { data, yAxisLabel: 'V' };
            },
            moment: (params) => {
                const { P, l, a_dist, b_dist } = params;
                const load1_pos = a_dist; const load2_pos = l - b_dist;
                if (load1_pos >= load2_pos || a_dist < 0 || b_dist < 0 || a_dist >=l || b_dist >=l ) return {data:[], yAxisLabel:'M (Error: invalid lengths)'};
                const R1 = P/l * ( (l-load1_pos) + (l-load2_pos) );
                let p = [];
                p.push({x:0, y:0}); p.push({x:load1_pos, y: -R1*load1_pos});
                p.push({x:load2_pos, y: -(R1*load2_pos - P*(load2_pos-load1_pos))}); p.push({x:l, y:0});
                return { data: p, yAxisLabel: 'M (Inverted)' };
            }
        },
        visualizer: null
    },
    { // Figure 11 - With c substituted in equations for clarity
        id: 'fig11', title: 'Figure 11: Simple Beam - Two Unequal Concentrated Loads Unsymmetrically Placed',
        beamType: 'simple',
        parameters: [ { name: 'P1', label: 'Load P₁', default: 8, unit: 'N' }, { name: 'P2', label: 'Load P₂', default: 6, unit: 'N' }, { name: 'l', label: 'Total Length (ℓ)', default: 15, unit: 'm' }, { name: 'a', label: 'Dist to P₁ (a)', default: 4, unit: 'm' }, { name: 'b_spacing', label: 'Dist P₁ to P₂ (b)', default: 5, unit: 'm' } ],
        equations: { R1: "R₁ = (P₁(ℓ-a) + P₂(ℓ-a-b)) / ℓ", R2: "R₂ = (P₁a + P₂(a+b)) / ℓ", V_between: "V (a<x<a+b) = R₁ - P₁", M_at_P1: "M (at P₁) = R₁a", M_at_P2: "M (at P₂) = R₂(ℓ-(a+b))" },
        plotConfig: {
            shear: (params) => {
                const { P1, P2, l, a, b_spacing } = params;
                const load1_pos = a; const load2_pos = a + b_spacing;
                const c_dist_from_right = l - load2_pos;
                if (load2_pos > l || a < 0 || b_spacing < 0 || c_dist_from_right < 0) return {data:[], yAxisLabel:'V (Error: invalid lengths)'};
                const R1 = (P1 * (l - a) + P2 * c_dist_from_right) / l;
                const R2 = (P1 * a + P2 * (l-c_dist_from_right)) / l;
                let data = [];
                data.push({ x: 0, y: R1 }); data.push({ x: load1_pos - 0.0001, y: R1 });
                data.push({ x: load1_pos + 0.0001, y: R1 - P1 }); data.push({ x: load2_pos - 0.0001, y: R1 - P1 });
                data.push({ x: load2_pos + 0.0001, y: R1 - P1 - P2 }); data.push({ x: l, y: -R2 });
                return { data, yAxisLabel: 'V' };
            },
            moment: (params) => {
                const { P1, P2, l, a, b_spacing } = params;
                const load1_pos = a; const load2_pos = a + b_spacing;
                const c_dist_from_right = l - load2_pos;
                if (load2_pos > l || a < 0 || b_spacing < 0 || c_dist_from_right < 0) return {data:[], yAxisLabel:'M (Error: invalid lengths)'};
                const R1 = (P1 * (l - a) + P2 * c_dist_from_right) / l;
                let p = [];
                p.push({x:0, y:0}); p.push({x:load1_pos, y: -R1*load1_pos});
                p.push({x:load2_pos, y: -(R1*load2_pos - P1*(load2_pos-load1_pos))}); p.push({x:l, y:0});
                return { data: p, yAxisLabel: 'M (Inverted)' };
            }
        },
        visualizer: null
    },
    { // Figure 12
        id: 'fig12', title: 'Figure 12: Cantilever Beam - Uniformly Distributed Load',
        beamType: 'cantilever_left_fixed',
        parameters: [ { name: 'w', label: 'Load (w)', default: 1, unit: 'N/m' }, { name: 'l', label: 'Length (ℓ)', default: 10, unit: 'm' } ],
        equations: { R_Vmax: "R=V=wℓ", Vx: "Vₓ=wx (x from free)", Mmax_fixed: "Mₘₐₓ(fixed end)=wℓ²/2", Mx: "Mₓ=wx²/2 (x from free)", Delta_max: "Δₘₐₓ(free)=wℓ⁴/(8EI)" },
        plotConfig: {
            shear: (params) => { const { w, l } = params; return { data: generateCurvePoints(0, l, 2, (x_fixed) => w * (l-x_fixed), false), yAxisLabel: 'V' }; },
            moment: (params) => { const { w, l } = params; return { data: generateCurvePoints(0, l, 31, (x_fixed) => w * Math.pow(l - x_fixed, 2) / 2), yAxisLabel: 'M (Inverted)' };}
        },
        visualizer: null
    },
    { // Figure 13
        id: 'fig13', title: 'Figure 13: Cantilever Beam - Concentrated Load at Free End',
        beamType: 'cantilever_left_fixed',
        parameters: [ { name: 'P', label: 'Load (P)', default: 5, unit: 'N' }, { name: 'l', label: 'Length (ℓ)', default: 10, unit: 'm' } ],
        equations: { R_V: "R=V=P", Mmax_fixed: "Mₘₐₓ(fixed end)=Pℓ", Mx: "Mₓ=Px (x from free)", Delta_max: "Δₘₐₓ(free)=Pℓ³/(3EI)" },
        plotConfig: {
            shear: (params) => { const { P, l } = params; return { data: [ { x: 0, y: P }, { x: l, y: P } ], yAxisLabel: 'V' }; },
            moment: (params) => { const { P, l } = params; return { data: generateCurvePoints(0, l, 2, (x_fixed) => P * (l - x_fixed)), yAxisLabel: 'M (Inverted)' }; }
        },
        visualizer: null
    },
    { // Figure 14
        id: 'fig14', title: 'Figure 14: Cantilever Beam - Concentrated Load at Any Point',
        beamType: 'cantilever_left_fixed',
        parameters: [ { name: 'P', label: 'Load (P)', default: 5, unit: 'N' }, { name: 'l', label: 'Total Length (ℓ)', default: 10, unit: 'm' }, { name: 'a_load', label: 'Dist from Fixed to Load (a)', default: 4, unit: 'm' } ],
        equations: { R_V: "R=V=P", Mmax_fixed: "Mₘₐₓ(fixed end)=Pa (a=dist from fixed)", Mx_loaded: "Mₓ(x<a, x from fixed)=P(a-x)", Delta_max: "Δₘₐₓ(free)=Pb²/(6EI)(3ℓ-b) (b=dist load to free)" },
        plotConfig: {
            shear: (params) => { const {P, l, a_load} = params; if(a_load > l || a_load < 0) return {data:[], yAxisLabel:'V (Error: invalid a_load)'}; return { data: [ { x: 0, y: P }, { x: a_load - 0.0001, y: P }, { x: a_load + 0.0001, y: 0 }, { x: l, y: 0 } ], yAxisLabel: 'V' }; },
            moment: (params) => { const {P, l, a_load} = params; if(a_load > l || a_load < 0) return {data:[], yAxisLabel:'M (Error: invalid a_load)'}; let p = []; p.push(...generateCurvePoints(0, a_load, 2, (x_fixed) => P * (a_load - x_fixed))); if(a_load>0 && p.length > 0 && Math.abs(p[p.length-1].x - a_load) < 1e-5 ) p.pop(); p.push(...generateCurvePoints(a_load, l, 2, (x_fixed) => 0 )); return { data: p, yAxisLabel: 'M (Inverted)' }; }
        },
        visualizer: null
    },
    { // Figure 15
        id: 'fig15', title: 'Figure 15: Beam Fixed at One End, Supported at Other - Uniformly Distributed Load',
        beamType: 'propped_cantilever_left_fixed',
        parameters: [ { name: 'w', label: 'Load (w)', default: 1, unit: 'N/m' }, { name: 'l', label: 'Length (ℓ)', default: 10, unit: 'm' } ],
        equations: { R1V1: "R₁ (fixed)=V₁=5wℓ/8", R2V2: "R₂ (support)=V₂=3wℓ/8", M_fixed: "M(fixed)=-wℓ²/8 (hogging)", M_positive_max: "M(x=3ℓ/8)=+9wℓ²/128", Delta_max: "Δₘₐₓ(x≈0.4215ℓ from fixed)=wℓ⁴/(185EI)" },
        plotConfig: {
            shear: (params) => { const {w,l} = params; const R1_fixed = 5*w*l/8; return { data: generateCurvePoints(0, l, 21, x => R1_fixed - w*x, false), yAxisLabel: 'V' }; },
            moment: (params) => { const {w,l} = params; const R1_fixed = 5*w*l/8; const M_fixed_val = -w*l*l/8; return { data: generateCurvePoints(0, l, 31, x => M_fixed_val + R1_fixed*x - w*x*x/2, false), yAxisLabel: 'M (Standard Conv.)' }; }
        },
        visualizer: null
    },
    { // Figure 16
        id: 'fig16', title: 'Figure 16: Beam Fixed at One End, Supported at Other - Concentrated Load at Center',
        beamType: 'propped_cantilever_left_fixed',
        parameters: [ { name: 'P', label: 'Load (P)', default: 10, unit: 'N' }, { name: 'l', label: 'Length (ℓ)', default: 10, unit: 'm' } ],
        equations: { R1V1: "R₁ (fixed)=V₁=11P/16", R2V2: "R₂ (support)=V₂=5P/16", M_fixed: "M(fixed)=-3Pℓ/16 (hogging)", M_load: "M(load)=+5Pℓ/32 (sagging)", Delta_max: "Δₘₐₓ(x≈0.4472ℓ from fixed)=Pℓ³/(48EI√5)" },
        plotConfig: {
            shear: (params) => { const {P,l} = params; const R1_fixed = 11*P/16; const R2_support = 5*P/16; return { data: [ {x:0, y:R1_fixed}, {x:l/2-0.0001, y:R1_fixed}, {x:l/2+0.0001, y:R1_fixed-P}, {x:l, y:-R2_support} ], yAxisLabel: 'V' }; },
            moment: (params) => { const {P,l} = params; const R1_fixed = 11*P/16; const M_fixed_val = -3*P*l/16; let p=[]; p.push(...generateCurvePoints(0,l/2,2,x => M_fixed_val + R1_fixed*x, false)); if(p.length>0 && Math.abs(p[p.length-1].x - l/2) < 1e-5) p.pop(); p.push(...generateCurvePoints(l/2,l,2,x => M_fixed_val + R1_fixed*x - P*(x-l/2), false)); return { data: p, yAxisLabel: 'M (Standard Conv.)' }; }
        },
        visualizer: null
    },
    { // Figure 17
        id: 'fig17', title: 'Figure 17: Beam Fixed at One End, Supported at Other - Concentrated Load at Any Point',
        beamType: 'propped_cantilever_left_fixed',
        parameters: [ { name: 'P', label: 'Load (P)', default: 10, unit: 'N' }, { name: 'l', label: 'Length (ℓ)', default: 10, unit: 'm' }, { name: 'a_load', label: 'Dist from Fixed to Load (a)', default: 4, unit: 'm' } ],
        equations: { R1_fixed: "R₁ (fixed) = Pb²(ℓ+2a)/(2ℓ³)", R2_support: "R₂ (support) = Pa²(3ℓ-a)/(2ℓ³)", M_fixed: "M (fixed) = -Pab²/ℓ²", M_at_load: "M (at load) = R₁a + M_fixed" }, // Using standard formulas for fixed-left, supported-right
        plotConfig: {
            shear: (params) => { const {P,l,a_load} = params; if(a_load > l || a_load < 0) return {data:[], yAxisLabel:'V (Error: invalid a_load)'}; const b_load = l-a_load;
                                const R_fixed_end = P*b_load*b_load*(l+2*a_load) / (2*l*l*l);
                                const R_support_end = P*a_load*a_load*(3*l-a_load) / (2*l*l*l);
                                return { data: [ {x:0, y:R_fixed_end}, {x:a_load-0.0001, y:R_fixed_end}, {x:a_load+0.0001, y:R_fixed_end-P}, {x:l, y:-R_support_end} ], yAxisLabel: 'V' }; },
            moment: (params) => { const {P,l,a_load} = params; if(a_load > l || a_load < 0) return {data:[], yAxisLabel:'M (Error: invalid a_load)'}; const b_load = l-a_load;
                                 const M_fixed_val = -P*a_load*b_load*b_load / (l*l);
                                 const R_fixed_end = P*b_load*b_load*(l+2*a_load) / (2*l*l*l);
                                 let p=[]; p.push(...generateCurvePoints(0,a_load,2,x => M_fixed_val + R_fixed_end*x, false)); if(a_load>0 && p.length>0 && Math.abs(p[p.length-1].x - a_load) < 1e-5) p.pop(); p.push(...generateCurvePoints(a_load,l,2,x => M_fixed_val + R_fixed_end*x - P*(x-a_load), false)); return { data: p, yAxisLabel: 'M (Standard Conv.)' }; }
        },
        visualizer: null
    },
    { // Figure 18
        id: 'fig18', title: 'Figure 18: Beam Overhanging One Support - Uniformly Distributed Load',
        beamType: 'overhang_right',
        parameters: [ { name: 'w', label: 'Load (w)', default: 1, unit: 'N/m' }, { name: 'l_span', label: 'Span (ℓ)', default: 8, unit: 'm' }, { name: 'a_overhang', label: 'Overhang (a)', default: 2, unit: 'm' } ],
        equations: { R1: "R₁=w/(2ℓ)(ℓ²-a²)", R2: "R₂=w/(2ℓ)(ℓ+a)²", M2_support: "M₂(R₂)=-wa²/2 (hogging)", M_max_span: "M₁ₘₐₓ(span) if R₁>0" },
        plotConfig: {
            shear: (params) => { const { w, l_span, a_overhang } = params; const L_total = l_span + a_overhang; const R1 = (w / (2 * l_span)) * (l_span*l_span - a_overhang*a_overhang); const R2_val = (w / (2 * l_span)) * Math.pow(l_span + a_overhang, 2); let p = []; p.push({x: 0, y: R1}); let V_at_R2_left = R1 - w*l_span; p.push({x: l_span - 0.0001, y: V_at_R2_left}); p.push({x: l_span + 0.0001, y: V_at_R2_left + R2_val }); p.push({x: L_total, y: 0}); return { data: p, yAxisLabel: 'V' }; },
            moment: (params) => { const { w, l_span, a_overhang } = params; const L_total = l_span + a_overhang; const R1 = (w / (2 * l_span)) * (l_span*l_span - a_overhang*a_overhang); let p = []; p.push(...generateCurvePoints(0, l_span, 31, (x) => R1*x - w*x*x/2)); if(p.length > 0 && Math.abs(p[p.length-1].x - l_span) < 1e-5 ) p.pop(); p.push(...generateCurvePoints(l_span, L_total, Math.max(2, Math.ceil(a_overhang*5+1)), (x_abs) => w * Math.pow(L_total - x_abs, 2) / 2 )); return { data: p, yAxisLabel: 'M (Inverted)' }; }
        },
        visualizer: null
    },
    { // Figure 19
        id: 'fig19', title: 'Figure 19: Beam Overhanging One Support - UDL on Overhang',
        beamType: 'overhang_right',
        parameters: [ { name: 'w', label: 'Load (w)', default: 1, unit: 'N/m' }, { name: 'l_span', label: 'Span (ℓ)', default: 8, unit: 'm' }, { name: 'a_overhang', label: 'Overhang (a)', default: 3, unit: 'm' } ],
        equations: { R1: "R₁=-wa²/(2ℓ) (downward)", R2: "R₂=wa/(2ℓ)(2ℓ+a) (upward)", Mmax_R2: "Mₘₐₓ(R₂)=-wa²/2 (hogging)" },
        plotConfig: {
            shear: (params) => { const { w, l_span, a_overhang } = params; const L_total = l_span + a_overhang; const R1_val = -(w * a_overhang * a_overhang) / (2 * l_span); const R2_val = (w*a_overhang/(2*l_span))*(2*l_span+a_overhang); return { data: [ {x: 0, y: R1_val}, {x: l_span - 0.0001, y: R1_val}, {x: l_span + 0.0001, y: R1_val + R2_val }, {x: L_total, y: 0} ], yAxisLabel: 'V' }; },
            moment: (params) => { const { w, l_span, a_overhang } = params; const L_total = l_span + a_overhang; const R1_val = -(w * a_overhang * a_overhang) / (2 * l_span); let p = []; p.push(...generateCurvePoints(0, l_span, 2, (x) => R1_val * x )); if(p.length > 0 && Math.abs(p[p.length-1].x - l_span) < 1e-5 ) p.pop(); p.push(...generateCurvePoints(l_span, L_total, Math.max(2,Math.ceil(a_overhang*5+1)), (x_abs) => w * Math.pow(L_total - x_abs, 2) / 2 )); return { data: p, yAxisLabel: 'M (Inverted)' }; }
        },
        visualizer: null
    },
    { // Figure 20
        id: 'fig20', title: 'Figure 20: Beam Overhanging One Support - Concentrated Load at End of Overhang',
        beamType: 'overhang_right',
        parameters: [ { name: 'P', label: 'Load (P)', default: 5, unit: 'N' }, { name: 'l_span', label: 'Span (ℓ)', default: 8, unit: 'm' }, { name: 'a_overhang', label: 'Overhang (a)', default: 3, unit: 'm' } ],
        equations: { R1: "R₁=-Pa/ℓ (downward)", R2: "R₂=P(ℓ+a)/ℓ (upward)", Mmax_R2: "Mₘₐₓ(R₂)=-Pa (hogging)" },
        plotConfig: {
            shear: (params) => { const {P, l_span, a_overhang} = params; const L_total = l_span + a_overhang; const R1_val = -P * a_overhang / l_span; const R2_val = P*(l_span+a_overhang)/l_span; return { data: [ {x: 0, y: R1_val}, {x: l_span - 0.0001, y: R1_val}, {x: l_span + 0.0001, y: R1_val + R2_val}, {x: L_total - 0.0001, y: P}, {x: L_total, y: P} ], yAxisLabel: 'V' }; }, // Shear at overhang end is P just before load P acts
            moment: (params) => { const {P, l_span, a_overhang} = params; const L_total = l_span + a_overhang; const R1_val = -P * a_overhang / l_span; let p = []; p.push(...generateCurvePoints(0, l_span, 2, (x) => R1_val * x)); if(p.length > 0 && Math.abs(p[p.length-1].x - l_span) < 1e-5 ) p.pop(); p.push(...generateCurvePoints(l_span, L_total, 2, (x_abs) => P * (L_total - x_abs))); return { data: p, yAxisLabel: 'M (Inverted)' }; }
        },
        visualizer: null
    },
    { // Figure 21
        id: 'fig21', title: 'Figure 21: Beam Overhanging One Support - Concentrated Load Between Supports',
        beamType: 'overhang_right',
        parameters: [ { name: 'P', label: 'Load (P)', default: 10, unit: 'N' }, { name: 'l_span', label: 'Span (ℓ)', default: 10, unit: 'm' }, { name: 'a_load', label: 'Dist from Left to Load (a)', default: 3, unit: 'm' }, { name: 'x1_overhang', label: 'Overhang Length (x₁)', default: 2, unit: 'm' } ],
        equations: { R1: "R₁=Pb/ℓ (b=ℓ-a)", R2: "R₂=Pa/ℓ", M_load:"M(load)=Pab/ℓ" },
        plotConfig: {
            shear: (params) => { const {P, l_span, a_load, x1_overhang} = params; if(a_load > l_span || a_load < 0) return {data:[], yAxisLabel:'V (Error: invalid a_load)'}; const b_load = l_span - a_load; const R1 = P*b_load/l_span; const R2_val = P*a_load/l_span; const L_total = l_span + x1_overhang; return { data: [ {x:0, y:R1}, {x:a_load-0.0001,y:R1}, {x:a_load+0.0001,y:R1-P}, {x:l_span,y:-R2_val}, {x:L_total,y:-R2_val} ], yAxisLabel: 'V' }; }, // Shear in overhang is -R2_val (if R2 acts up) or 0 if overhang is unloaded and no moment at R2. Diagram shows 0.
            moment: (params) => { const {P, l_span, a_load, x1_overhang} = params; if(a_load > l_span || a_load < 0) return {data:[], yAxisLabel:'M (Error: invalid a_load)'}; const b_load = l_span - a_load; const M_max_orig = P*a_load*b_load/l_span; const L_total = l_span + x1_overhang; return { data: [ {x:0,y:0}, {x:a_load,y:-M_max_orig}, {x:l_span,y:0}, {x:L_total,y:0} ], yAxisLabel: 'M (Inverted)' }; }
        },
        visualizer: null
    },
    { // Figure 22
        id: 'fig22', title: 'Figure 22: Beam Overhanging Both Supports - UDL',
        beamType: 'double_overhang',
        parameters: [ { name: 'w', label: 'Load (w)', default: 1, unit: 'N/m' }, { name: 'l_span', label: 'Span (ℓ)', default: 10, unit: 'm' }, { name: 'a_left', label: 'Left Overhang (a)', default: 2, unit: 'm' }, { name: 'c_right', label: 'Right Overhang (c)', default: 3, unit: 'm' } ],
        equations: { R1: "R₁ = wℓ/2 + wa - wc²/(2ℓ) + wa²/(2ℓ)", R2: "R₂ = wℓ/2 + wc - wa²/(2ℓ) + wc²/(2ℓ)", M_at_R1:"M(R₁) = -wa²/2", M_at_R2:"M(R₂) = -wc²/2" },
        plotConfig: {
            shear: (params) => { const {w,l_span,a_left,c_right} = params; const L_total = a_left+l_span+c_right;
                                 const R1 = w*l_span/2 + w*a_left - (w*c_right*c_right)/(2*l_span) + (w*a_left*a_left)/(2*l_span);
                                 const R2 = w*l_span/2 + w*c_right - (w*a_left*a_left)/(2*l_span) + (w*c_right*c_right)/(2*l_span);
                                 let data = [];
                                 data.push({x:0, y:0}); data.push({x:a_left-0.0001, y:-w*a_left}); data.push({x:a_left+0.0001, y:-w*a_left+R1});
                                 data.push({x:a_left+l_span-0.0001, y:-w*a_left+R1-w*l_span}); data.push({x:a_left+l_span+0.0001, y:-w*a_left+R1-w*l_span+R2});
                                 data.push({x:L_total, y:0});
                                 return { data, yAxisLabel: 'V' }; },
            moment: (params) => { const {w,l_span,a_left,c_right} = params; const L_total = a_left+l_span+c_right;
                                  const R1 = w*l_span/2 + w*a_left - (w*c_right*c_right)/(2*l_span) + (w*a_left*a_left)/(2*l_span);
                                  let p = [];
                                  p.push(...generateCurvePoints(0, a_left, Math.max(2, Math.ceil(a_left*3+1)), x => w*x*x/2));
                                  if(a_left>0 && p.length>0 && Math.abs(p[p.length-1].x - a_left)<1e-5) p.pop();
                                  p.push(...generateCurvePoints(a_left, a_left+l_span, Math.max(2, Math.ceil(l_span*3+1)), x => w*x*x/2 - R1*(x-a_left) ));
                                  if(l_span>0 && p.length>0 && Math.abs(p[p.length-1].x - (a_left+l_span))<1e-5) p.pop();
                                  p.push(...generateCurvePoints(a_left+l_span, L_total, Math.max(2, Math.ceil(c_right*3+1)), x => w*Math.pow(L_total-x,2)/2 )); // Moment from right end
                                  return { data:p, yAxisLabel: 'M (Inverted)' }; }
        },
        visualizer: null
    },
    { // Figure 23
        id: 'fig23', title: 'Figure 23: Beam Fixed at Both Ends - Uniformly Distributed Load',
        beamType: 'fixed_both_ends',
        parameters: [ { name: 'w', label: 'Load (w)', default: 1, unit: 'N/m' }, { name: 'l', label: 'Length (ℓ)', default: 10, unit: 'm' } ],
        equations: { R_V: "R=V=wℓ/2", M_ends: "M(ends)=-wℓ²/12 (hogging)", M_center: "M(center)=+wℓ²/24 (sagging)", Delta_max: "Δₘₐₓ=wℓ⁴/(384EI)" },
        plotConfig: {
            shear: (params) => { const { w, l } = params; const R = w * l / 2; return { data: [ { x: 0, y: R }, { x: l / 2, y: 0 }, { x: l, y: -R } ], yAxisLabel: 'V' }; },
            moment: (params) => { const { w, l } = params; return { data: generateCurvePoints(0, l, 31, (x) => (w/12) * (6*l*x - l*l - 6*x*x), false ), yAxisLabel: 'M (Standard Conv.)' }; }
        },
        visualizer: null
    },
    { // Figure 24
        id: 'fig24', title: 'Figure 24: Beam Fixed at Both Ends - Concentrated Load at Center',
        beamType: 'fixed_both_ends',
        parameters: [ { name: 'P', label: 'Load (P)', default: 10, unit: 'N' }, { name: 'l', label: 'Length (ℓ)', default: 10, unit: 'm' } ],
        equations: { R_V: "R=V=P/2", M_ends_center: "M(ends & center)=±Pℓ/8", Delta_max: "Δₘₐₓ=Pℓ³/(192EI)" },
        plotConfig: {
            shear: (params) => { const { P, l } = params; const V = P / 2; return { data: [ { x: 0, y: V }, { x: l / 2 - 0.0001, y: V }, { x: l / 2 + 0.0001, y: -V }, { x: l, y: -V } ], yAxisLabel: 'V' }; },
            moment: (params) => { const { P, l } = params; let p = []; p.push(...generateCurvePoints(0, l/2, 2, (x) => (P/8)*(4*x - l), false )); if(p.length > 0 && Math.abs(p[p.length-1].x - l/2) < 1e-5) p.pop(); p.push(...generateCurvePoints(l/2, l, 2, (x) => (P/8)*(4*(l-x) - l), false )); return { data: p, yAxisLabel: 'M (Standard Conv.)' }; }
        },
        visualizer: null
    },
    { // Figure 25
        id: 'fig25', title: 'Figure 25: Beam Fixed at Both Ends - Concentrated Load at Any Point',
        beamType: 'fixed_both_ends',
        parameters: [ { name: 'P', label: 'Load (P)', default: 10, unit: 'N' }, { name: 'l', label: 'Length (ℓ)', default: 10, unit: 'm' }, { name: 'a_load', label: 'Dist to Load (a)', default: 3, unit: 'm' } ],
        equations: { R1: "R₁=Pb²(3a+b)/ℓ³", R2: "R₂=Pa²(a+3b)/ℓ³", M1_fixed: "M₁(left fixed)=-Pab²/ℓ²", M2_fixed: "M₂(right fixed)=-Pa²b/ℓ²", M_load: "M(load)=+2Pa²b²/ℓ³" },
        plotConfig: {
            shear: (params) => { const {P,l,a_load} = params; if(a_load > l || a_load < 0) return {data:[], yAxisLabel:'V (Error: invalid a_load)'}; const b_load = l-a_load; const R1 = P*b_load*b_load*(3*a_load+b_load)/(l*l*l); const R2 = P*a_load*a_load*(a_load+3*b_load)/(l*l*l); return { data: [ {x:0,y:R1}, {x:a_load-0.0001,y:R1}, {x:a_load+0.0001,y:R1-P}, {x:l,y:-R2} ], yAxisLabel: 'V' }; },
            moment: (params) => { const {P,l,a_load} = params; if(a_load > l || a_load < 0) return {data:[], yAxisLabel:'M (Error: invalid a_load)'}; const b_load = l-a_load; const M1_fixed = -P*a_load*b_load*b_load/(l*l); const R1 = P*b_load*b_load*(3*a_load+b_load)/(l*l*l); let p=[]; p.push(...generateCurvePoints(0,a_load,2,x => M1_fixed + R1*x, false)); if(a_load>0 && p.length>0 && Math.abs(p[p.length-1].x - a_load) < 1e-5) p.pop(); p.push(...generateCurvePoints(a_load,l,2,x => M1_fixed + R1*x - P*(x-a_load), false)); return { data: p, yAxisLabel: 'M (Standard Conv.)' }; }
        },
        visualizer: null
    },
    { // Figure 26
        id: 'fig26', title: 'Figure 26: Continuous Beam - Two Equal Spans - Uniform Load on One Span (Left)',
        beamType: 'continuous_two_equal_span',
        parameters: [ { name: 'w', label: 'Load (w)', default: 1, unit: 'N/m' }, { name: 'l_span', label: 'Span Length (ℓ)', default: 10, unit: 'm' } ],
        equations: { R1: "R₁=7wℓ/16", R2: "R₂=5wℓ/8", R3: "R₃=-wℓ/16 (downward)", M_R2: "M(R₂)=-wℓ²/16" },
        plotConfig: {
            shear: (params) => { const {w,l_span} = params; const R1=7*w*l_span/16; const R2_reaction=5*w*l_span/8; const R3=-w*l_span/16; let d=[]; d.push({x:0,y:R1}); d.push({x:l_span-0.0001,y:R1-w*l_span}); d.push({x:l_span+0.0001,y:R1-w*l_span+R2_reaction}); d.push({x:2*l_span,y:R3}); return {data:d, yAxisLabel:'V'}; },
            moment: (params) => { const {w,l_span} = params; const R1=7*w*l_span/16; const M_R2_val = -w*l_span*l_span/16; let p=[]; p.push(...generateCurvePoints(0,l_span,31,x=>R1*x - w*x*x/2, false)); if(p.length>0 && Math.abs(p[p.length-1].x - l_span)<1e-5) p.pop(); p.push(...generateCurvePoints(l_span,2*l_span,2,x=>M_R2_val*(2*l_span-x)/l_span, false)); return {data:p, yAxisLabel:'M (Standard Conv.)'};}
        },
        visualizer: null
    },
    { // Figure 27
        id: 'fig27', title: 'Figure 27: Continuous Beam - Two Equal Spans - Conc. Load at Center of One Span (Left)',
        beamType: 'continuous_two_equal_span',
        parameters: [ { name: 'P', label: 'Load (P)', default: 10, unit: 'N' }, { name: 'l_span', label: 'Span Length (ℓ)', default: 10, unit: 'm' } ],
        equations: { R1: "R₁=13P/32", R2: "R₂=11P/16", R3: "R₃=-3P/32 (downward)", M_R2: "M(R₂)=-3Pℓ/32" },
        plotConfig: {
            shear: (params) => { const {P,l_span} = params; const R1=13*P/32; const R2_reaction=11*P/16; const R3=-3*P/32; let d=[]; d.push({x:0,y:R1}); d.push({x:l_span/2-0.0001,y:R1}); d.push({x:l_span/2+0.0001,y:R1-P}); d.push({x:l_span-0.0001,y:R1-P}); d.push({x:l_span+0.0001,y:R1-P+R2_reaction}); d.push({x:2*l_span,y:R3}); return {data:d, yAxisLabel:'V'}; },
            moment: (params) => { const {P,l_span} = params; const R1=13*P/32; const M_R2_val = -3*P*l_span/32; let p=[]; p.push(...generateCurvePoints(0,l_span/2,2,x=>R1*x, false)); if(p.length>0) p.pop(); p.push(...generateCurvePoints(l_span/2,l_span,2,x=>R1*x - P*(x-l_span/2), false)); if(p.length>0) p.pop(); p.push(...generateCurvePoints(l_span,2*l_span,2,x=>M_R2_val*(2*l_span-x)/l_span, false)); return {data:p, yAxisLabel:'M (Standard Conv.)'};}
        },
        visualizer: null
    },
    { // Figure 28
        id: 'fig28', title: 'Figure 28: Continuous Beam - Two Equal Spans - Conc. Load at Any Point in One Span (Left)',
        beamType: 'continuous_two_equal_span',
        parameters: [ { name: 'P', label: 'Load (P)', default: 10, unit: 'N' }, { name: 'l_span', label: 'Span Length (ℓ)', default: 10, unit: 'm' }, { name: 'a_load', label: 'Dist to Load in Left Span (a)', default: 3, unit: 'm' } ],
        equations: { R1: "R₁=Pb/(4ℓ³)(4ℓ²-a(ℓ+a)) (b=ℓ-a)", R2: "R₂=Pa/(2ℓ³)(2ℓ²+b(ℓ+a))", R3: "R₃=-Pab/(4ℓ³)(ℓ+a)", M_R2: "M(R₂)=-Pab(ℓ+a)/(4ℓ²)" },
        plotConfig: {
            shear: (params) => { const {P,l_span,a_load} = params; const b_load=l_span-a_load; if(a_load>l_span || a_load<0) return {data:[], yAxisLabel:'V (Error)'}; const R1 = P*b_load/(4*l_span*l_span*l_span)*(4*l_span*l_span-a_load*(l_span+a_load)); const R2_reaction = P*a_load/(2*l_span*l_span*l_span)*(2*l_span*l_span+b_load*(l_span+a_load)); const R3 = -P*a_load*b_load/(4*l_span*l_span*l_span)*(l_span+a_load); let d=[]; d.push({x:0,y:R1}); d.push({x:a_load-0.0001,y:R1}); d.push({x:a_load+0.0001,y:R1-P}); d.push({x:l_span-0.0001,y:R1-P}); d.push({x:l_span+0.0001,y:R1-P+R2_reaction}); d.push({x:2*l_span,y:R3}); return {data:d, yAxisLabel:'V'}; },
            moment: (params) => { const {P,l_span,a_load} = params; const b_load=l_span-a_load; if(a_load>l_span || a_load<0) return {data:[], yAxisLabel:'M (Error)'}; const R1 = P*b_load/(4*l_span*l_span*l_span)*(4*l_span*l_span-a_load*(l_span+a_load)); const M_R2_val = -P*a_load*b_load*(l_span+a_load)/(4*l_span*l_span); let p=[]; p.push(...generateCurvePoints(0,a_load,2,x=>R1*x, false)); if(p.length>0) p.pop(); p.push(...generateCurvePoints(a_load,l_span,2,x=>R1*x - P*(x-a_load), false)); if(p.length>0) p.pop(); p.push(...generateCurvePoints(l_span,2*l_span,2,x=>M_R2_val*(2*l_span-x)/l_span, false)); return {data:p, yAxisLabel:'M (Standard Conv.)'};}
        },
        visualizer: null
    },
    { // Figure 29
        id: 'fig29', title: 'Figure 29: Continuous Beam - Two Equal Spans - Uniformly Distributed Load (on both)',
        beamType: 'continuous_two_equal_span',
        parameters: [ { name: 'w', label: 'Load (w)', default: 1, unit: 'N/m' }, { name: 'l_span', label: 'Span Length (ℓ)', default: 10, unit: 'm' } ],
        equations: { R1R3: "R₁=R₃=3wℓ/8", R2: "R₂=10wℓ/8", M_R2: "M(R₂)=-wℓ²/8", Delta_max: "Δₘₐₓ(0.4215ℓ from R1/R3)=wℓ⁴/(185EI)" },
        plotConfig: {
            shear: (params) => { const {w,l_span} = params; const R1=3*w*l_span/8; const R2_reaction=10*w*l_span/8; let d=[]; d.push({x:0,y:R1}); d.push({x:l_span-0.0001,y:R1-w*l_span}); d.push({x:l_span+0.0001,y:R1-w*l_span+R2_reaction}); d.push({x:2*l_span,y:R1-w*l_span+R2_reaction-w*l_span}); return {data:d, yAxisLabel:'V'}; },
            moment: (params) => { const {w,l_span} = params; const R1=3*w*l_span/8; const M_R2_val = -w*l_span*l_span/8; let p=[]; p.push(...generateCurvePoints(0,l_span,31,x=>R1*x - w*x*x/2, false)); if(p.length>0 && Math.abs(p[p.length-1].x - l_span)<1e-5) p.pop();
                                  const V_at_R2_left = R1-w*l_span; const R2_reaction_val = 10*w*l_span/8;
                                  p.push(...generateCurvePoints(l_span,2*l_span,31,x=>M_R2_val + (V_at_R2_left+R2_reaction_val)*(x-l_span) - w*(x-l_span)*(x-l_span)/2, false)); return {data:p, yAxisLabel:'M (Standard Conv.)'};}
        },
        visualizer: null
    },
    { // Figure 30
        id: 'fig30', title: 'Figure 30: Continuous Beam - Two Equal Spans - Two Equal Concentrated Loads Symmetrically Placed (on both)',
        beamType: 'continuous_two_equal_span',
        parameters: [ { name: 'P', label: 'Load (P)', default: 5, unit: 'N' }, { name: 'l_span', label: 'Span Length (ℓ)', default: 12, unit: 'm' }, { name: 'a_dist', label: 'Dist from Support (a)', default: 3, unit: 'm' } ],
        equations: { R1R3: "R₁=R₃=P(1-a²/ℓ²)", R2: "R₂=2Pa²/ℓ²", M_R2: "M(R₂)=-Pa²/ℓ" },
        plotConfig: {
            shear: (params) => { const {P,l_span,a_dist} = params; if(2*a_dist > l_span || a_dist < 0) return {data:[], yAxisLabel:'V (Error)'};
                                 const R1=P*(1-(a_dist*a_dist)/(l_span*l_span)); const R2_reaction=2*P*a_dist*a_dist/(l_span*l_span);
                                 let d=[];
                                 d.push({x:0,y:R1}); d.push({x:a_dist-0.0001,y:R1}); d.push({x:a_dist+0.0001,y:R1-P});
                                 d.push({x:l_span-a_dist-0.0001,y:R1-P}); d.push({x:l_span-a_dist+0.0001,y:R1-2*P}); d.push({x:l_span-0.0001,y:R1-2*P});
                                 d.push({x:l_span+0.0001,y:R1-2*P+R2_reaction});
                                 d.push({x:l_span+a_dist-0.0001,y:R1-2*P+R2_reaction}); d.push({x:l_span+a_dist+0.0001,y:R1-2*P+R2_reaction-P});
                                 d.push({x:2*l_span-a_dist-0.0001,y:R1-2*P+R2_reaction-P}); d.push({x:2*l_span-a_dist+0.0001,y:R1-2*P+R2_reaction-2*P});
                                 d.push({x:2*l_span,y:R1-2*P+R2_reaction-2*P}); // Should be -R1 by symmetry
                                 return {data:d, yAxisLabel:'V'}; },
            moment: (params) => { const {P,l_span,a_dist} = params; if(2*a_dist > l_span || a_dist < 0) return {data:[], yAxisLabel:'M (Error)'};
                                   const R1=P*(1-(a_dist*a_dist)/(l_span*l_span)); const M_R2_val = -P*a_dist*a_dist/l_span;
                                   let p=[];
                                   p.push(...generateCurvePoints(0,a_dist,2,x=>R1*x, false)); if(p.length>0)p.pop();
                                   p.push(...generateCurvePoints(a_dist,l_span-a_dist,2,x=>R1*x-P*(x-a_dist), false)); if(p.length>0)p.pop();
                                   p.push(...generateCurvePoints(l_span-a_dist,l_span,2,x=>R1*x-P*(x-a_dist)-P*(x-(l_span-a_dist)), false)); if(p.length>0)p.pop();
                                   
                                   const V_at_R2_left = R1-2*P; const R2_reaction_val = 2*P*a_dist*a_dist/(l_span*l_span);
                                   const R_start_span2 = V_at_R2_left + R2_reaction_val; // Shear at start of span 2
                                   p.push(...generateCurvePoints(l_span,l_span+a_dist,2,x=>M_R2_val+R_start_span2*(x-l_span), false)); if(p.length>0)p.pop();
                                   p.push(...generateCurvePoints(l_span+a_dist,2*l_span-a_dist,2,x=>M_R2_val+R_start_span2*(x-l_span)-P*(x-(l_span+a_dist)), false)); if(p.length>0)p.pop();
                                   p.push(...generateCurvePoints(2*l_span-a_dist,2*l_span,2,x=>M_R2_val+R_start_span2*(x-l_span)-P*(x-(l_span+a_dist))-P*(x-(2*l_span-a_dist)), false));
                                   return {data:p, yAxisLabel:'M (Standard Conv.)'};}
        },
        visualizer: null
    },
    { // Figure 31
        id: 'fig31', title: 'Figure 31: Continuous Beam - Two Unequal Spans - Uniformly Distributed Load (on both)',
        beamType: 'continuous_two_unequal_span',
        parameters: [ { name: 'w', label: 'Load (w)', default: 1, unit: 'N/m' }, { name: 'l1', label: 'Span 1 (ℓ₁)', default: 10, unit: 'm' }, { name: 'l2', label: 'Span 2 (ℓ₂)', default: 8, unit: 'm' } ],
        equations: { R1: "R₁=wℓ₁/2 - M₂/(ℓ₁)", R2: "R₂=w(ℓ₁+ℓ₂)/2 + M₂/ℓ₁ + M₂/ℓ₂", R3: "R₃=wℓ₂/2 - M₂/(ℓ₂)", M2: "M₂(support R₂)=-w(ℓ₁³+ℓ₂³)/(8(ℓ₁+ℓ₂))" }, // Corrected R1, R2, R3 from M2/l to M2/(2l) per image
        plotConfig: {
            shear: (params) => { const {w,l1,l2}=params; const M2_val = -w*(l1*l1*l1+l2*l2*l2)/(8*(l1+l2)); const R1=w*l1/2 - M2_val/l1; const R3=w*l2/2 - M2_val/l2; const R2_reaction=w*(l1+l2)/2 + M2_val*(1/l1+1/l2); let d=[]; d.push({x:0,y:R1}); d.push({x:l1-0.0001,y:R1-w*l1}); d.push({x:l1+0.0001,y:R1-w*l1+R2_reaction}); d.push({x:l1+l2,y:R3}); return {data:d, yAxisLabel:'V'};},
            moment: (params) => { const {w,l1,l2}=params; const M2_val = -w*(l1*l1*l1+l2*l2*l2)/(8*(l1+l2)); const R1=w*l1/2 - M2_val/l1; let p=[]; p.push(...generateCurvePoints(0,l1,31,x=>R1*x - w*x*x/2, false)); if(p.length>0 && Math.abs(p[p.length-1].x - l1)<1e-5) p.pop();
                                  const V_at_R2_left = R1-w*l1; const R2_reaction_val = w*(l1+l2)/2 + M2_val*(1/l1+1/l2);
                                  p.push(...generateCurvePoints(l1,l1+l2,31,x=>M2_val + (V_at_R2_left+R2_reaction_val)*(x-l1) - w*(x-l1)*(x-l1)/2, false)); return {data:p, yAxisLabel:'M (Standard Conv.)'};}
        },
        visualizer: null
    },
    { // Figure 32
        id: 'fig32', title: 'Figure 32: Continuous Beam - Two Unequal Spans - Concentrated Load on Each Span Symmetrically Placed (Center)',
        beamType: 'continuous_two_unequal_span',
        parameters: [ { name: 'P1', label: 'Load on Span 1 (P₁)', default: 10, unit: 'N' }, { name: 'P2', label: 'Load on Span 2 (P₂)', default: 8, unit: 'N' }, { name: 'l1', label: 'Span 1 (ℓ₁)', default: 10, unit: 'm' }, { name: 'l2', label: 'Span 2 (ℓ₂)', default: 12, unit: 'm' } ],
        equations: { R1: "R₁=P₁/2 - M₂/(ℓ₁)", R2: "R₂=(P₁+P₂)/2 + M₂/ℓ₁ + M₂/ℓ₂", R3: "R₃=P₂/2 - M₂/(ℓ₂)", M2: "M₂(support R₂)=-(P₁ℓ₁²+P₂ℓ₂²)/(8(ℓ₁+ℓ₂))" }, // Corrected R1, R2, R3 from M2/l to M2/(2l) per image
        plotConfig: {
            shear: (params) => { const {P1,P2,l1,l2}=params; const M2_val = -(P1*l1*l1+P2*l2*l2)/(8*(l1+l2)); const R1=P1/2 - M2_val/l1; const R3=P2/2 - M2_val/l2; const R2_reaction=(P1+P2)/2 + M2_val*(1/l1+1/l2); let d=[];
                                 d.push({x:0,y:R1}); d.push({x:l1/2-0.0001,y:R1}); d.push({x:l1/2+0.0001,y:R1-P1}); d.push({x:l1-0.0001,y:R1-P1});
                                 d.push({x:l1+0.0001,y:R1-P1+R2_reaction}); d.push({x:l1+l2/2-0.0001,y:R1-P1+R2_reaction}); d.push({x:l1+l2/2+0.0001,y:R1-P1+R2_reaction-P2}); d.push({x:l1+l2,y:R3}); return {data:d, yAxisLabel:'V'};},
            moment: (params) => { const {P1,P2,l1,l2}=params; const M2_val = -(P1*l1*l1+P2*l2*l2)/(8*(l1+l2)); const R1=P1/2 - M2_val/l1; let p=[];
                                  p.push(...generateCurvePoints(0,l1/2,2,x=>R1*x, false)); if(p.length>0)p.pop(); p.push(...generateCurvePoints(l1/2,l1,2,x=>R1*x - P1*(x-l1/2), false)); if(p.length>0)p.pop();
                                  const V_at_R2_left = R1-P1; const R2_reaction_val = (P1+P2)/2 + M2_val*(1/l1+1/l2);
                                  p.push(...generateCurvePoints(l1,l1+l2/2,2,x=>M2_val + (V_at_R2_left+R2_reaction_val)*(x-l1), false)); if(p.length>0)p.pop();
                                  p.push(...generateCurvePoints(l1+l2/2,l1+l2,2,x=>M2_val + (V_at_R2_left+R2_reaction_val)*(x-l1) - P2*(x-(l1+l2/2)), false)); return {data:p, yAxisLabel:'M (Standard Conv.)'};}
        },
        visualizer: null
    }
];