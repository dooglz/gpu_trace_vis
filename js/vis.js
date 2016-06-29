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