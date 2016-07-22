let catagoryColourScale20 = d3.scale.category20();
let catagoryColourScale10 = d3.scale.category10();
var colourScalefunc = function (d) {
		if (Object.keys(INSTRUCTIONTYPE).length > 10) {
			return catagoryColourScale20(d.type.value);
		} else {
			return catagoryColourScale10(d.type.value);
		}
}
var colourCUfunc = function (d) {
	return catagoryColourScale10(d.cu);
}
let showWfCu = false;
let tc;
let cuVisSvg = null;
var InitVis = function () {
	if(tc){tc.Clear()};
	if(cuVisSvg){ClearCuvis() ;}
	tc = new TaskChart(d3.select("#visContainerDiv"), Instuctions, metrics.wfCount);
	tc.setFillfunc(showWfCu ? colourCUfunc : colourScalefunc);
	tc.Redraw();
}
var maxOcc;
var acitivityMode = false;

var ClearCuvis = function () {
	cuVisSvg.remove();
}

var ShowCuvis = function () {
	tc.Clear();


	let max =  metrics.cu[0].wfboolActivity.length;
	let min = 0;


	let padding = [0, 30, 20, 10];
	let container = d3.select("#visContainerDiv");
	let width = parseInt(container.style("width"));
	let height = parseInt(container.style("height"));
	let numberOfLanes = metrics.cuCount;
	let xScale = d3.scale.linear().domain([min, max]).range([0, width - (padding[2] + padding[3])]).clamp(true);
	let yCatScale = d3.scale.ordinal().domain(d3.range(numberOfLanes)).rangeRoundBands([0, height - (padding[0] + padding[1])]);
	let yScale = d3.scale.ordinal().domain(d3.range(numberOfLanes)).rangeRoundBands([0, height - (padding[0] + padding[1])]);
	let xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickSubdivide(true).tickSize(8).tickPadding(8);
	let yAxis = d3.svg.axis().scale(yCatScale).orient("left").tickSize(0);

	cuVisSvg = container.append('svg').attr('width', width).attr('height', height);
        cuVisSvg.append("g").attr("class", "x axis")
            .attr("transform", "translate(" + padding[2] + ", " + (height - padding[1]) + ")")
            .transition().call(xAxis);
        cuVisSvg.append("g").attr("class", "y axis")
            .attr("transform", "translate(" + padding[2] + ", 0)")
            .transition().call(yAxis);


	for(let i =0; i < metrics.cuCount; i++){
	let data = metrics.cu[i];/*
	for(let i = 0; i < metrics.cu.length; i++){
		for(let j = 0; j < metrics.cu[i].rawOccupancy.length; j++){
			data.push({tick:metrics.cu[i]})
		}
	}*/


	//let min = Instuctions.reduce((previousValue, currentValue) => (previousValue < currentValue.start ? previousValue : currentValue.start) , Instuctions[0].start);
	//let max = Instuctions.reduce((previousValue, currentValue) => (previousValue > currentValue.end ? previousValue : currentValue.end), Instuctions[0].end);

	if (acitivityMode) {
		 maxOcc = data.maxRawWfAcitivity;
	} else {
		 maxOcc = data.maxboolWfAcitivity;
	}

	let area = d3.svg.area()
		.x(function (d, i) { return xScale(i); })
		.y0(yCatScale.rangeBand())
		.y1(function (d, i) {
			return yCatScale.rangeBand() - yScale((acitivityMode ? d : d.reduce(function (a, b) {
				return a + b;
			})))
		})

	cuVisSvg.append("g")
		.attr("transform", "translate(" + padding[2] + "," + yScale(i) + ")").append("path")
		.datum(acitivityMode ? data.rawOccupancy : data.wfboolActivity)
		.attr("class", "area")
		.attr("d", area);

	//x.domain(d3.extent(data, function (d) { return d.date; }));
	//y.domain([0, d3.max(data, function (d) { return d.close; })]);
	}
}
