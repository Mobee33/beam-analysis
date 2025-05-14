// main_app.js

document.addEventListener('DOMContentLoaded', () => {
    const beamSelect = document.getElementById('beam-select');
    const loadParametersContainer = document.getElementById('load-parameters-inputs-container');
    const updateDiagramsButton = document.getElementById('update-diagrams-button');
    const beamTitleDisplay = document.getElementById('beam-title-display');
    const equationsContentArea = document.getElementById('equations-content-area');
    const beamSvg = document.getElementById('beam-svg');
    const outputPanel = document.getElementById('beam-output-section');

    let shearChartInstance = null;
    let momentChartInstance = null;
    let currentSelectedBeam = null;

    // --- SVG Definitions ---
    function addSvgDefsToDOM(svgElement) {
        let defs = svgElement.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS("http://www.w3.org/2000/svg", 'defs');
            svgElement.insertBefore(defs, svgElement.firstChild);
        }
        // Added specific IDs for different arrow directions for clarity
        defs.innerHTML = `
            <marker id="dimArrowEnd" viewBox="0 0 8 6" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#7f8c8d"/></marker>
            <marker id="dimArrowStart" viewBox="0 0 8 6" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto"><path d="M8,0 L0,3 L8,6 Z" fill="#7f8c8d"/></marker>
            <marker id="loadArrowheadGeneralDown" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" class="load-arrow-head" /></marker>
            <marker id="loadArrowheadGeneralUp" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 10 0 L 0 5 L 10 10 z" class="load-arrow-head" /></marker>
            <marker id="loadArrowheadUDL" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" class="udl-arrow-head" /></marker>
        `;
    }
    addSvgDefsToDOM(beamSvg); // Add defs once on load

    // --- Populate Select Dropdown ---
    function populateBeamSelect() {
        if (!beamData || beamData.length === 0) {
            console.error("beamData is not available or empty.");
            return;
        }
        beamData.sort((a, b) => {
            const numA = parseInt(a.title.match(/\d+/));
            const numB = parseInt(b.title.match(/\d+/));
            if (numA && numB) return numA - numB;
            return a.title.localeCompare(b.title);
        });

        beamData.forEach(beam => {
            const option = document.createElement('option');
            option.value = beam.id;
            option.textContent = beam.title;
            beamSelect.appendChild(option);
        });
        beamSelect.value = ""; // Ensure placeholder is shown initially
    }

    // --- Create Parameter Inputs ---
    function createParameterInputs(beam) {
        loadParametersContainer.innerHTML = ''; // Clear previous inputs
        if (!beam.parameters || beam.parameters.length === 0) {
            loadParametersContainer.innerHTML = '<p class="placeholder-text">This beam condition has no adjustable parameters.</p>';
            return;
        }

        beam.parameters.forEach(param => {
            const group = document.createElement('div');
            group.className = 'parameter-input-group';

            const label = document.createElement('label');
            label.htmlFor = `param-${param.name}`;
            label.textContent = `${param.label} (${param.unit || ''}):`;
            
            const input = document.createElement('input');
            input.type = 'number';
            input.id = `param-${param.name}`;
            input.name = param.name;
            input.value = param.default;
            input.step = param.step || 'any'; // Allow for decimal steps
            if (param.min !== undefined) input.min = param.min;
            if (param.max !== undefined) input.max = param.max;
            
            group.appendChild(label);
            group.appendChild(input);
            loadParametersContainer.appendChild(group);
        });
    }

    // --- Get Current Parameter Values ---
    function getCurrentParameters(beam) {
        const params = {};
        if (beam.parameters) {
            beam.parameters.forEach(param => {
                const inputElement = document.getElementById(`param-${param.name}`);
                if (inputElement) {
                    let value = parseFloat(inputElement.value);
                    // Use default if parsing fails or input is empty, but only if default exists
                    if (isNaN(value) && param.default !== undefined) {
                        value = param.default;
                    }
                    params[param.name] = value;
                } else {
                    // Fallback to default if input element not found (should not happen)
                    params[param.name] = param.default;
                }
            });
        }
        return params;
    }

    // --- Display Equations ---
    function displayEquations(beam) {
        let html = '<ul>';
        for (const key in beam.equations) {
            html += `<li><strong>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> <code>${beam.equations[key]}</code></li>`;
        }
        html += '</ul>';
        equationsContentArea.innerHTML = html;
    }

    // --- Create Chart ---
    function createChart(canvasId, plotConfig, chartLabel) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        const l_val = currentSelectedBeam.parameters.find(p => p.name === 'l' || p.name === 'l_span' || p.name ==='l1')?.default || 10;

        return new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: chartLabel,
                    data: plotConfig.data, // Expects {x, y} array
                    borderColor: canvasId === 'shear-chart' ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)', // Tailwind red-500, blue-500
                    backgroundColor: canvasId === 'shear-chart' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    tension: plotConfig.data.length > 10 ? 0.1 : 0, // Slight curve for smoother plots with many points
                    fill: true,
                    pointRadius: plotConfig.data.length < 20 ? 3 : (plotConfig.data.length < 40 ? 1.5 : 0),
                    pointHoverRadius: plotConfig.data.length < 20 ? 5 : 3,
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: { display: true, text: 'Position along beam (x)' },
                        ticks: {
                            callback: function(value) {
                                if (value === 0) return '0';
                                if (l_val && Math.abs(value - l_val / 2) < 0.01 * l_val) return 'ℓ/2';
                                if (l_val && Math.abs(value - l_val) < 0.01 * l_val) return 'ℓ';
                                if (l_val && l_val !== 0) return (value / l_val).toFixed(2) + 'ℓ';
                                return value.toFixed(1);
                            },
                            autoSkip: true,
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        title: { display: true, text: plotConfig.yAxisLabel },
                        ticks: {
                             callback: function(value) {
                                if (Math.abs(value) < 1e-9 && value !== 0) return '0';
                                return Number(value.toPrecision(3));
                            }
                        }
                    }
                },
                animation: { duration: 500, easing: 'easeInOutQuad' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                               let x_val = tooltipItems[0].parsed.x;
                               if (l_val && l_val !== 0) return `x = ${(x_val / l_val).toFixed(3)}ℓ (${x_val.toFixed(2)})`;
                               return `x = ${x_val.toFixed(2)}`;
                            },
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed.y !== null) { label += context.parsed.y.toFixed(3); }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // --- Update All Outputs ---
    function updateBeamOutputs() {
        if (!currentSelectedBeam) return;

        const modelParams = getCurrentParameters(currentSelectedBeam);
        const l_param_for_plot = modelParams.l || modelParams.l_span || (modelParams.l1 + (modelParams.l2 || 0)) || 10;


        // 1. Update Visualizer
        beamSvg.innerHTML = ''; // Clear previous SVG content
        addSvgDefsToDOM(beamSvg); // Re-add defs
        if (beamVisualizers[currentSelectedBeam.id]) {
            const svgRect = beamSvg.getBoundingClientRect();
            const svgViewBox = beamSvg.viewBox.baseVal;
            const svgWidth = svgRect.width > 0 ? svgRect.width : svgViewBox.width;
            const svgHeight = svgRect.height > 0 ? svgRect.height : svgViewBox.height;
            
            beamVisualizers[currentSelectedBeam.id](beamSvg, modelParams, { width: svgWidth, height: svgHeight, margin: 40 });
        } else {
            beamSvg.innerHTML = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" class="svg-placeholder-text">Visualizer not implemented for this case.</text>`;
            addSvgDefsToDOM(beamSvg);
        }

        // 2. Update Equations (already displayed, mostly static structure)
        // displayEquations(currentSelectedBeam); // Already done on select, uncomment if equations depend on params

        // 3. Update Charts
        const shearPlotConfig = currentSelectedBeam.plotConfig.shear(modelParams, l_param_for_plot);
        const momentPlotConfig = currentSelectedBeam.plotConfig.moment(modelParams, l_param_for_plot);

        if (shearChartInstance) shearChartInstance.destroy();
        if (momentChartInstance) momentChartInstance.destroy();

        if (shearPlotConfig && shearPlotConfig.data && shearPlotConfig.data.length > 0) {
            shearChartInstance = createChart('shear-chart', shearPlotConfig, 'Shear Force');
            const allShearValues = shearPlotConfig.data.map(p => p.y);
            const shearMin = Math.min(...allShearValues, 0); const shearMax = Math.max(...allShearValues, 0);
            const shearRange = shearMax - shearMin;
            shearChartInstance.options.scales.y.beginAtZero = (shearMin >= -0.01 * shearRange && shearMax >= -0.01 * shearRange) || (shearMin <= 0.01 * shearRange && shearMax <= 0.01 * shearRange);
            shearChartInstance.update('none'); // 'none' for no animation on update
        } else {
            document.getElementById('shear-chart').getContext('2d').clearRect(0,0,document.getElementById('shear-chart').width, document.getElementById('shear-chart').height);
            console.warn("No shear data for: ", currentSelectedBeam.id);
        }

        if (momentPlotConfig && momentPlotConfig.data && momentPlotConfig.data.length > 0) {
            momentChartInstance = createChart('moment-chart', momentPlotConfig, 'Bending Moment');
            const allMomentValues = momentPlotConfig.data.map(p => p.y);
            const momentMin = Math.min(...allMomentValues, 0); const momentMax = Math.max(...allMomentValues, 0);
            const momentRange = momentMax - momentMin;
            momentChartInstance.options.scales.y.beginAtZero = (momentMin >= -0.01 * momentRange && momentMax >= -0.01 * momentRange) || (momentMin <= 0.01 * momentRange && momentMax <= 0.01 * momentRange);
            momentChartInstance.update('none');
        } else {
             document.getElementById('moment-chart').getContext('2d').clearRect(0,0,document.getElementById('moment-chart').width, document.getElementById('moment-chart').height);
            console.warn("No moment data for: ", currentSelectedBeam.id);
        }
    }


    // --- Event Listener for Beam Selection ---
    beamSelect.addEventListener('change', (event) => {
        const beamId = event.target.value;
        if (!beamId) {
            // Clear everything if placeholder selected
            loadParametersContainer.innerHTML = '<p class="placeholder-text">Select a beam condition to see its parameters.</p>';
            beamTitleDisplay.textContent = 'Select a beam condition';
            equationsContentArea.innerHTML = '<p class="placeholder-text">Equations will be shown here.</p>';
            beamSvg.innerHTML = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" class="svg-placeholder-text">Beam visualization will appear here.</text>`;
            addSvgDefsToDOM(beamSvg);
            if (shearChartInstance) shearChartInstance.destroy();
            if (momentChartInstance) momentChartInstance.destroy();
            shearChartInstance = null; momentChartInstance = null;
            outputPanel.classList.remove('visible');
            currentSelectedBeam = null;
            return;
        }

        currentSelectedBeam = beamData.find(b => b.id === beamId);
        if (currentSelectedBeam) {
            beamTitleDisplay.textContent = currentSelectedBeam.title;
            createParameterInputs(currentSelectedBeam);
            displayEquations(currentSelectedBeam);
            updateBeamOutputs(); // Initial draw with default parameters
            outputPanel.classList.add('visible');
        }
    });

    // --- Event Listener for Update Button ---
    updateDiagramsButton.addEventListener('click', () => {
        if (currentSelectedBeam) {
            updateBeamOutputs();
        } else {
            // Optionally, provide feedback if no beam is selected
            alert("Please select a beam condition first.");
        }
    });
    
    // --- Event Listener for Enter key in parameter inputs ---
    loadParametersContainer.addEventListener('keypress', function(event) {
        if (event.key === 'Enter' && event.target.type === 'number') {
            event.preventDefault(); // Prevent form submission if it were in a form
            updateDiagramsButton.click(); // Trigger update
        }
    });


    // --- Initial Setup ---
    populateBeamSelect();
    outputPanel.classList.remove('visible'); // Ensure it's hidden initially

}); // End DOMContentLoaded