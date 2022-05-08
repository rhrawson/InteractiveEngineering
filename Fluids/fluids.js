// https://www.standards.doe.gov/standards-documents/1000/1012-bhdbk-1992-v3/@@images/file
// Bernoulli's on Pg 25
// Hp = (v2**2 - v1**2)/(2*gc) + (z2 - z1)*g/gc + (P2*nu2 - P1*nu1)*144 + ksys*Vdot**2

// Slider bar examples
// https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518

// Constants (some that the user will be able to set someday)
let z2 = 0, // [ft]
    z1 = 20, // [ft]
    A2 = 0.25, // [ft^2]
    A1 = 40, // [ft^2]
    g = 32, // [ft/sec^2]
    gc = 32, // [ft-lbm/lbf-sec^2]
    P2 = 30, // [psia]
    P1 = 100, // [psia]
    nu = 0.017, // [ft^3/lbm]
    ksys = 4; // [lbf-sec^2/lbm-ft^5]


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
function calcSLs(Vdots,A2,A1,z2,z1,P2,P1,nu,ksys,g=32,gc=32) {
    return Vdots.map(Vdot => {
        let v2 = Vdot / A2;
        let v1 = Vdot / A1;
        return (v2**2 - v1**2)/(2*gc) + (z2 - z1)*g/gc + (P2 - P1)*nu*144 + ksys*Vdot**2;
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
        //return HpMax - 25/9*Vdot**2;
        return HpMax*(1 - Vdot**2/VdotMax**2)**(1/2);
    });
};

// create arrays
let n = 100, // number of values in each array
    VdotMin = 0, // [ft^3/sec]
    VdotMax = 12; // [ft^3/sec]
    HpMax = 400; // [ft-lbf/lbm]
    VdotMax = VdotMax; // [ft^3/sec]

let Vdots = calcVdots(n,VdotMin,VdotMax);
let SLs = calcSLs(Vdots,A2,A1,z2,z1,P2,P1,nu,ksys);
    Hps = calcHps(Vdots,HpMax,VdotMax);

// Combine data in objects
lineData = [];
for (i=0; i<n; i++) {
    lineData.push({
        Vdot: Vdots[i],
        SL: SLs[i],
        Hp: Hps[i]
    });
};


// define margin and dimensions for svg
let margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 40
};

let width = 500 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// create sliders    
let sliderP1 = d3.sliderBottom()
    .min(P1)
    .max(150)
    .width(300)
    //.tickFormat()
    .default(P1)
    //.on('onchange', val=> {d3.select('#sliderP1').text(d3.format()(val))});
    .on('onchange', val=> {
        P1 = val;
    });

let gSliderP1 = d3.select('div#slider-P1')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', 80)
    .style("vertical-align", "middle")
    .append('g')
    .attr('transform', 'translate(30,30)');

gSliderP1.call(sliderP1)


// create svg
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
    .domain([d3.min(Vdots),d3.max(Vdots)])
    .range([margin.left,width-margin.right]);

let yScale = d3.scaleLinear()
    .domain([d3.min([d3.min(Hps),d3.min(SLs)]),d3.max([d3.max(Hps),d3.max(SLs)])])
    .range([height-margin.bottom,margin.top])

// create axes
let xAxis = d3.axisBottom().scale(xScale);
let yAxis = d3.axisLeft().scale(yScale);

let lineGenSL = d3.line()
    .x(d => xScale(d.Vdot))
    .y(d => yScale(d.SL));

let lineGenHp = d3.line()
    .x(d => xScale(d.Vdot))
    .y(d => yScale(d.Hp));

let linesG = svg.append("g")

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


