var vis = vis || {};

vis.init = function (container) {
	this.container = container;
	this.dcontainer = jqtod3(container);
	this.width = container.width();
	this.height = container.height();/*
	this.svg = this.dcontainer.append('svg')
		.attr('width', this.width)
		.attr('height', this.height);*/
}

var gantt;
vis.Go = function () {
	let tasks = [
		{
			"startDate": new Date("Sun Dec 09 01:36:45 EST 2012"),
			"endDate": new Date("Sun Dec 09 02:36:45 EST 2012"),
			"taskName": "E Job",
			"status": "FAILED"
		},
		{
			"startDate": new Date("Sun Dec 09 04:56:32 EST 2012"),
			"endDate": new Date("Sun Dec 09 06:35:47 EST 2012"),
			"taskName": "A Job",
			"status": "RUNNING"
		}];
	let taskStatus = {
		"SUCCEEDED": "bar",
		"FAILED": "bar-failed",
		"RUNNING": "bar-running",
		"KILLED": "bar-killed"
	};
	let taskNames = ["D Job", "P Job", "E Job", "A Job", "N Job"];
	//gantt = d3.gantt().selector('#visContainerDiv').margin({ top: 0, right: 0, bottom: 0, left: 60 }).width(this.width).height(this.height).taskTypes(taskNames).taskStatus(taskStatus);
	//gantt(tasks);
	//gantt.redraw(tasks);
};

vis.createNodeLink = function (nodeData, linkData) {

	//Create the SVG elemetns
	this.nodeElements = this.svg.selectAll('.node')
		.data(nodeData)				//Assosiate with the correct data
		.enter().append('circle') 	//Append a circle svg eleent
		.attr('class', 'node');		//Set the CSS class of the element

	this.linkElements = this.svg.selectAll('.link')
		.data(linkData)
		.enter().append('line')
		.attr('class', 'link');

	//Set the attributes of the elements based on the data
	this.nodeElements.attr('r', 20)		//circle radius
        .attr('cx', function (d) { return d.x; })	//svg uses cx and cy for circle positions
        .attr('cy', function (d) { return d.y; });

	this.linkElements.attr('x1', function (d) { return nodeData[d.source].x; })
        .attr('y1', function (d) { return nodeData[d.source].y; })
        .attr('x2', function (d) { return nodeData[d.target].x; })
        .attr('y2', function (d) { return nodeData[d.target].y; });
}

vis.shutdown = function () {
	//remove Vis from DOM
	this.linkElements.remove();
	this.nodeElements.remove();
	this.svg.remove();
	//now actually wipe the variables
	this.linkElements = null;
	this.nodeElements = null;
	this.svg = null;

	this.container = null;
	this.width = null;
	this.height = null;
}


