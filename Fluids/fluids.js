// https://www.standards.doe.gov/standards-documents/1000/1012-bhdbk-1992-v3/@@images/file
// Bernoulli's on Pg 25
// Hp = (v2**2 - v1**2)/(2*gc) + (z2 - z1)*g/gc + (P2*nu2 - P1*nu1)*144 + ksys*Vdot**2

// Slider bar examples
// https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518

/* Future ideas
    -Set a fixed width for label/slide bar divs
    -Create remaining sliders
    -Determine a set domain for the yScale function so that the slide bars don't change the graph dimensions
    -Find the operating point values of Hp and Vdot.
    -Mark/highlight the operating point on the graph
    -Display the operating point values of Hp and Vdot
    -Add gridlines
    -Show Bernoulli's Equation with symbols
    -Show Bernoulli's Equation with the current values of all parameters
    -Show the simplified SL equation
    -Show the system that Bernoulli's is being applied to

    -Add option to change pump speed
    -Add option to add a pump in series or parallel
    -Show pump efficiency line?
    -Show hydraullic and brake horsepower lines?
*/

// define extrema for each slider parameter
let z1Max = 100, // [ft]
    z1Min = -100, // [ft]
    A1Max = 1, // [ft^2]
    A1Min = 0.1, // [ft^2]
    P1Max = 150, // [psia]
    P1Min = 0, // [psia]
    nuMax = 0.0338 // [ft^3/lbm]
    nuMin = 0.0160 // [ft^3/lbm]
    ksysMax = 20, // [lbf-sec^2/lbm-ft^5]
    ksysMin = 4 // [lbf-sec^2/lbm-ft^5]

// define default parameters for Bernoulli's Equation
// (some that the user will be able to set with sliders)
let params = {
    g: 32, // [ft/sec^2]
    gc: 32, // [ft-lbm/lbf-sec^2]
    z2: 0, // [ft]
    z1: d3.mean([z1Max,z1Min]), // [ft]
    A2: 0.25, // [ft^2]
    A1: d3.mean([A1Max,A1Min]), // [ft^2]
    P2: 30, // [psia]
    P1: d3.mean([P1Max,P1Min]), // [psia]
    nu: 0.017, // [ft^3/lbm]
    ksys: d3.mean([ksysMax,ksysMin]) // [lbf-sec^2/lbm-ft^5]
}

// Update labels with initial values
d3.select("#P1-value").text(`${d3.format(".1f")(params.P1)} psia`);
d3.select("#A1-value").html(`${d3.format(".2f")(params.A1)} ft<sup>2</sup>`);
d3.select("#ksys-value").text(`${d3.format(".1f")(params.ksys)} 
            \\(\\frac{\\text{lbf-sec}^2}{\\text{lbm-ft}^5}\\)`);
MathJax.typeset(["#ksys-value"]); // render

/**
 * Creates an array of volume flow rates.
 * @param {int} n number of values in each array
 * @param {float or int} VdotMin [ft^3/sec]
 * @param {float or int} VdotMax [ft^3/sec]
 * @returns {array of floats} [ft^3/sec]
 */
 function calcVdots(n=100,VdotMin=0,VdotMax=12) {
    return [...Array(n).keys()].map(i => 
        i*(VdotMax - VdotMin)/(n-1) + VdotMin);
};

/**
 * Calculates system load as a function of volume flow rate.
 * @param {array of floats} Vdots [ft^3/sec]
 * @param {float or int} A2 [ft^2]
 * @param {float or int} A1 [ft^2]
 * @param {float or int} z2 [ft]
 * @param {float or int} z1 [ft]
 * @param {float or int} P2 [psia]
 * @param {float or int} P1 [psia]
 * @param {float or int} nu [ft^3/lbm]
 * @param {float or int} ksys [lbf-sec^2/lbm-ft^5]
 * @param {float or int} g [ft/sec^2]
 * @param {float or int} gc [ft-lbm/lbf-sec^2]
 * @returns [ft-lbf/lbm]
 */
function calcSLs(Vdots,params) {
    return Vdots.map(Vdot => {
        let v2 = Vdot / params.A2;
        let v1 = Vdot / params.A1;
        return (v2**2 - v1**2)/(2*params.gc) 
            + (params.z2 - params.z1)*params.g/params.gc 
            + (params.P2 - params.P1)*params.nu*144 
            + params.ksys*Vdot**2;
    });
};

/**
 * Calculates pump head as a function of volume flow rate.
 * @param {array of floats} Vdots [ft^3/sec]
 * @param {float or int} HpMax [ft-lbf/lbm]
 * @param {flaot or int} VdotMax [ft^3/sec]
 * @returns [ft-lbf/lbm]
 */
function calcHps(Vdots,HpMax,VdotMax) {
    return Vdots.map(Vdot => {
        // Ellipse equation:
        return HpMax*(1 - Vdot**2/VdotMax**2)**(1/2);
    });
};

/**
 * 
 * @param {function} xScale 
 * @param {array of floats} Vdots [ft^3/sec]
 */
 function updateXScaleDomain(xScale,Vdots) {
    xScale.domain([d3.min(Vdots),d3.max(Vdots)])
};

/**
 * 
 * @param {function} yScale 
 * @param {array of floats} Hps [ft-lbf/lbm]
 * @param {array of floats} SLs [ft-lbf/lbm]
 */
 function updateYScaleDomain(yScale,Hps,SLs) {
    yScale.domain([d3.min([d3.min(Hps),d3.min(SLs)]),
                    d3.max([d3.max(Hps),d3.max(SLs)])])
};

/**
 * 
 * @param {*} Vdots 
 * @param {*} SLs 
 * @param {*} Hps 
 * @returns 
 */
 function combineLineData(Vdots,SLs,Hps) {
    let _lineData = [];
    for (i=0; i<n; i++) {
        _lineData.push({
            Vdot: Vdots[i],
            SL: SLs[i],
            Hp: Hps[i]
        });
    };
    return _lineData;
};

// Line plot functions
let lineGenSL = d3.line()
    .x(d => xScale(d.Vdot))
    .y(d => yScale(d.SL));

let lineGenHp = d3.line()
    .x(d => xScale(d.Vdot))
    .y(d => yScale(d.Hp));

/**
 * Clears the plot
 */
function clearPlot() {
    d3.select("#x-axis").remove();
    d3.select("#y-axis").remove();
};

/**
 * Updates the plot with new SLs and Hps
 * @param {*} Vdots 
 * @param {*} SLs 
 * @param {*} Hps 
 */
function updatePlot(Vdots,SLs,Hps) {
    lineData = combineLineData(Vdots,SLs,Hps);
    // update y scale
    // updateYScaleDomain(yScale,Hps,SLs);
    // update y axis
    yAxis.scale(yScale);
    // update lines
    linesG.select("#Hpline")
        .datum(lineData)
        .attr("d",lineGenHp)
    linesG.select("#SLline")
        .datum(lineData)
        .attr("d",lineGenSL)

    // update opPoint
    linesG.select("#op-point")
        .attr("cx",xScale(opPoint.Vdot))
        .attr("cy",yScale(opPoint.Hp));

    // update axes
    // add the x-axis
    svg.append("g")
        .attr("id","x-axis")
        .attr("transform",`translate(0,${yScale(0)})`)
        .call(xAxis);

    // remove the first label on the x-axis
    svg.selectAll(".tick")
        .filter(d => d === 0)
        .remove();

    // add the y-axis
    svg.append("g")
        .attr("id","y-axis")
        .attr("transform",`translate(${xScale(0)},0)`)
        .call(yAxis);
};

/**
 * Linear interpolator function
 * @param {float array} xArray 
 * @param {float array} yArray 
 * @returns interpolator(x) = interpolated y value
 */
 function interp1d(xArray,yArray) {
    return function(x) {
        return d3.piecewise(yArray)(
        (x - xArray[0]) / (xArray[xArray.length-1] - xArray[0])
        );
    };
};

// function for finding operating point values
// // Optimization approach
// function findOP(Vdots,Hps) {
//     let SLfromVdot = interp1d(Vdots,SLs),
//         HpfromVdot = interp1d(Vdots,Hps),
//         HpMinusSL = [];
//     for (let i = 0; i < Vdots.length; i++) {
//         HpMinusSL.push(Math.abs(Hps[i]-SLs[i]));
//     };
//     let minIndex = HpMinusSL.indexOf(Math.min(...HpMinusSL));
// }

// Explicit approach
function findOP(params,HpMax,VdotMax,Vdots,Hps,SLs) {
    let dpewf = (params.z2 - params.z1)*params.g/params.gc 
                + (params.P2 - params.P1)*params.nu*144,
        dkeConstantsksys = (1/params.A2**2 - 1/params.A1**2)/(2*params.gc) 
            + params.ksys
        //SL = dkeConstantsksys*Vdot**2 + dpewf;
        //Hp = HpMax*(1 - Vdot**2/VdotMax**2)**(1/2);
    let a = dkeConstantsksys**2,
        b = 2*dkeConstantsksys*dpewf + HpMax**2/VdotMax**2,
        c = dpewf**2 - HpMax**2;
    let Vdot = ((-b + (b**2 - 4*a*c)**(1/2)) / (2*a))**(1/2);
    if (!isNaN(Vdot)) {
        let Hp = interp1d(Vdots,Hps)(Vdot),
            SL = interp1d(Vdots,SLs)(Vdot)
        if (Math.abs(Hp-SL) < 1e-1) {
            return {
                "Vdot": Vdot,
                "Hp": Hp
            };
        } else {
            console.log('Hp <> SL in findOP!',Hp,SL);
        }    
    } else {
        console.log('No intersection between SL and Pump curves')
    };
};

/**
 * Updates the equations with numbers
 * @param {*} params 
 * @param {*} opPoint 
 */
function updateNumbers(params,opPoint) {
    // plug new numbers into equations
    let bernoullisNums = `
            \\(
                H_p = \\frac{(${d3.format(".1f")(params.z2)}-${d3.format(".1f")(params.z1)})
                        ${d3.format(".1f")(params.g)}}
                        {${d3.format(".1f")(params.gc)}} 
                    + \\frac{${d3.format(".1f")(params.P2)}-${d3.format(".1f")(params.P1)}}
                        {${d3.format(".1f")(1/params.nu)}} 
                    + \\left[
                        \\frac{1}{${d3.format(".1f")(2*params.gc)}}
                        \\left(
                            \\frac{1}{${d3.format(".2f")(params.A2)}^2}
                            - \\frac{1}{${d3.format(".2f")(params.A1)}^2}
                        \\right)
                        + ${d3.format(".2f")(params.ksys)}
                    \\right]\\dot{V}^2
            \\)
        `,
        simpleSLNums = `\\(
            H_p = ${d3.format(".0f")((params.z2-params.z1)*params.g/params.gc 
                    + (params.P2-params.P1)*params.nu*144)} 
                + ${d3.format(".2f")(1/(2*params.gc)*(1/params.A2**2 - 1/params.A1**2) 
                    + params.ksys)}\\dot{V}^2\\)`,
        opPointNums = `
            \\(H_p = ${d3.format(".0f")(opPoint.Hp)} \\frac{\\text{ft-lbf}}{\\text{lbm}},\\quad
            \\dot{V} = ${d3.format(".2f")(opPoint.Vdot)} \\frac{\\text{ft}^3}{\\text{sec}}\\)
        `;
    
    // update the html for each div
    d3.select('#bernoullis-nums')
        .html(bernoullisNums);
    d3.select('#simple-SL-nums')
        .html(simpleSLNums);
    d3.select('#op-point-nums')
        .html(opPointNums);
    
    // render the new equations
    MathJax.typeset(["#numbers-display"]);
};

// create arrays
let n = 400, // number of values in each array
    VdotMin = 0, // [ft^3/sec]
    VdotMax = 12; // [ft^3/sec]
    HpMax = 400; // [ft-lbf/lbm]
    VdotMax = VdotMax; // [ft^3/sec]
let Vdots = calcVdots(n,VdotMin,VdotMax);
let SLs = calcSLs(Vdots,params);
    Hps = calcHps(Vdots,HpMax,VdotMax);

// display OP
let opPoint = findOP(params,HpMax,VdotMax,Vdots,Hps,SLs);
updateNumbers(params,opPoint);

// Combine data in objects
let lineData = combineLineData(Vdots,SLs,Hps);

// define margin and dimensions for svg
let margin = {
    top: 20,
    right: 20,
    bottom: 0,
    left: 40
};

let width = 500 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// create sliders    
let sliderWidth = 300,
    sliderHeight = 70;

let sliderP1 = d3.sliderBottom()
    .min(P1Min)
    .max(P1Max)
    .width(sliderWidth)
    //.tickFormat()
    .default(params.P1)
    .on('onchange', val=> {
        // update P1
        params.P1 = val;
        // update P1 label
        d3.select("#P1-value").text(`${d3.format(".1f")(params.P1)} psia`);
        // recalculate SL
        SLs = calcSLs(Vdots,params);
        // recalculate opPoint
        opPoint = findOP(params,HpMax,VdotMax,Vdots,Hps,SLs);
        // clear Plot
        clearPlot();
        // update plot
        updatePlot(Vdots,SLs,Hps);
        // update numbers
        updateNumbers(params,opPoint);
    });

let gSliderP1 = d3.select('div#slider-P1')
    .append('svg')
    .attr('width', sliderWidth + 30*2)
    .attr('height', sliderHeight)
    .style("vertical-align", "middle")
    .append('g')
    .attr('transform', 'translate(30,30)');

gSliderP1.call(sliderP1)

let sliderA1 = d3.sliderBottom()
    .min(A1Min)
    .max(A1Max)
    .width(sliderWidth)
    //.tickFormat()
    .default(params.A1)
    .on('onchange', val=> {
        // update A1
        params.A1 = val;
        // update A1 label
        d3.select("#A1-value").html(`${d3.format(".2f")(params.A1)} ft<sup>2</sup>`);
        // recalculate SL
        SLs = calcSLs(Vdots,params);
        // recalculate opPoint
        opPoint = findOP(params,HpMax,VdotMax,Vdots,Hps,SLs);
        // clear Plot
        clearPlot();
        // update plot
        updatePlot(Vdots,SLs,Hps);
        // update numbers
        updateNumbers(params,opPoint);
    });

let gSliderA1 = d3.select('div#slider-A1')
    .append('svg')
    .attr('width', sliderWidth + 30*2)
    .attr('height', sliderHeight)
    .style("vertical-align", "middle")
    .append('g')
    .attr('transform', 'translate(30,30)');

gSliderA1.call(sliderA1)

let sliderKsys = d3.sliderBottom()
    .min(ksysMin)
    .max(ksysMax)
    .width(sliderWidth)
    //.tickFormat()
    .default(params.ksys)
    .on('onchange', val=> {
        // update ksys
        params.ksys = val;
        // update ksys label
        d3.select("#ksys-value").text(`${d3.format(".1f")(params.ksys)} 
            \\(\\frac{\\text{lbf-sec}^2}{\\text{lbm-ft}^5}\\)`);
        MathJax.typeset(["#ksys-value"]); // render
        // recalculate SL
        SLs = calcSLs(Vdots,params);
        // recalculate opPoint
        opPoint = findOP(params,HpMax,VdotMax,Vdots,Hps,SLs);
        // clear Plot
        clearPlot();
        // update plot
        updatePlot(Vdots,SLs,Hps);
        // update numbers
        updateNumbers(params,opPoint);
    });

let gSliderKsys = d3.select('div#slider-ksys')
    .append('svg')
    .attr('width', sliderWidth + 30*2)
    .attr('height', sliderHeight)
    .style("vertical-align", "middle")
    .append('g')
    .attr('transform', 'translate(30,30)');

gSliderKsys.call(sliderKsys)

// create svg for plot
let svg = d3.select("body").append("svg")
    .attr("id", "plots_svg")
    .attr("width",width + margin.left + margin.right)
    .attr("height",height + margin.top + margin.bottom)
    .attr("transform","scale(1,1)")
    // .append("g")
    // .call(d3.zoom().on("zoom", function () {
    //     svg.attr("transform", d3.event.transform)
    //  }));

// create scales for x & y axes
let xScale = d3.scaleLinear()
    .range([margin.left,width-margin.right]);

let yScale = d3.scaleLinear()
    .domain([-300,500])
    .range([height-margin.bottom,margin.top]);

updateXScaleDomain(xScale,Vdots);
// updateYScaleDomain(yScale,Hps,SLs);

// create axes
let xAxis = d3.axisBottom().scale(xScale);
let yAxis = d3.axisLeft().scale(yScale);

let linesG = svg.append("g")
    .attr("id","linesG");

linesG.append("path")
    .datum(lineData)
    .attr("class", "plotLine")
    .attr("id", "Hpline")
    .attr("d",lineGenHp)

linesG.append("path")
    .datum(lineData)
    .attr("class", "plotLine")
    .attr("id", "SLline")
    .attr("d",lineGenSL)

linesG.append("circle")
    .attr("id","op-point")
    .attr("cx",xScale(opPoint.Vdot))
    .attr("cy",yScale(opPoint.Hp))
    .attr("r",7);

// add the x-axis
svg.append("g")
    .attr("id","x-axis")
    .attr("transform",`translate(0,${yScale(0)})`)
    .call(xAxis);

// remove the first label on the x-axis
svg.selectAll(".tick")
    .filter(d => d === 0)
    .remove();

// add the y-axis
svg.append("g")
    .attr("id","y-axis")
    .attr("transform",`translate(${xScale(0)},0)`)
    .call(yAxis);