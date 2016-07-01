let catagoryColourScale = null;
var colourScalefunc = function (d) {
	if (catagoryColourScale === null) {
		if (Object.keys(INSTRUCTIONTYPE).length > 10) {
			catagoryColourScale = d3.scale.category20();
		} else {
			catagoryColourScale = d3.scale.category10();
		}
	}
	return catagoryColourScale(d.type.value);
}

let tc;
var InitVis = function () {
	tc = new TaskChart(d3.select("#visContainerDiv"), Instuctions, 4);
	tc.setFillfunc(colourScalefunc);
	tc.Redraw();
}
var maxOcc;
var acitivityMode = false;
var ShowCuvis = function () {
//	tc.Clear();
	let data = metrics.cu[0];/*
	for(let i = 0; i < metrics.cu.length; i++){
		for(let j = 0; j < metrics.cu[i].rawOccupancy.length; j++){
			data.push({tick:metrics.cu[i]})
		}
	}*/
	let padding = [0, 30, 20, 10];
	let container = d3.select("#visContainerDiv");
	let width = parseInt(container.style("width"));
	let height = parseInt(container.style("height"));
	let numberOfLanes = 4;

	//let min = Instuctions.reduce((previousValue, currentValue) => (previousValue < currentValue.start ? previousValue : currentValue.start) , Instuctions[0].start);
	//let max = Instuctions.reduce((previousValue, currentValue) => (previousValue > currentValue.end ? previousValue : currentValue.end), Instuctions[0].end);
	let max = data.wfboolActivity.length;
	let min = 0;

	if (acitivityMode) {
		 maxOcc = data.maxRawWfAcitivity
	} else {
		 maxOcc = data.maxWfAcitivity
	}
	let xScale = d3.scale.linear().domain([min, max]).range([0, width - (padding[2] + padding[3])]).clamp(true);
	let yCatScale = d3.scale.ordinal().domain(d3.range(numberOfLanes)).rangeRoundBands([0, height - (padding[0] + padding[1])]);
	let yScale = d3.scale.linear().domain([0,maxOcc]).range([0, yCatScale.rangeBand() ]);
	let xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickSubdivide(true).tickSize(8).tickPadding(8);
	let yAxis = d3.svg.axis().scale(yCatScale).orient("left").tickSize(0);

	let area = d3.svg.area()
		.x(function (d, i) { return xScale(i); })
		.y0(yCatScale.rangeBand())
		.y1(function (d, i) {
			return yCatScale.rangeBand() - yScale((acitivityMode ? d : d.reduce(function (a, b) {
				return a + b;
			})))
		})


	let svg = container.append('svg').attr('width', width).attr('height', height);
        svg.append("g").attr("class", "x axis")
            .attr("transform", "translate(" + padding[2] + ", " + (height - padding[1]) + ")")
            .transition().call(xAxis);
        svg.append("g").attr("class", "y axis")
            .attr("transform", "translate(" + padding[2] + ", 0)")
            .transition().call(yAxis);


	svg.append("g")
		.attr("transform", "translate(" + padding[2] + ", 0)").append("path")
		.datum(acitivityMode ? data.rawOccupancy : data.wfboolActivity)
		.attr("class", "area")
		.attr("d", area);

	//x.domain(d3.extent(data, function (d) { return d.date; }));
	//y.domain([0, d3.max(data, function (d) { return d.close; })]);
}
