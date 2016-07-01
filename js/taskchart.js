class Task {
    constructor(start = 0, end = 0, lane = 0, name = "", type = -1) {
        if (name == "") { name = Math.random().toString(36).substring(0, 4); }
        if (type == -1) { type = Math.random() % 20; }
        this.start = start;
        this.end = end;
        this.name = name;
        this.lane = lane;
        this.type = type;
    }
};
colors = d3.scale.category20();
class TaskChart {
    constructor(container, data, numberOfLanes) {
        this.container = container
        this.data = data;
        this.ndata = d3.nest()
            .key(function (d) { return d.name; })
            .entries(this.data);
        this.numberOfLanes = numberOfLanes;
        this.padding = [0, 30, 20, 10];
        this.defaultfillFunc = function (d, i) { return d3.rgb(64 + Math.random() * 128, 64 + Math.random() * 128, 64 + Math.random() * 128); }
        this.fillfunc = this.defaultfillFunc;
    }
    Clear(){
        this.svg.remove();
    }
    Redraw() {
        this.width = parseInt(this.container.style("width"));
        this.height = parseInt(this.container.style("height"));
        this.InitDomains();
        console.log(this.container, this.width, this.height);
        this.svg = this.container.append('svg').attr('width', this.width).attr('height', this.height);

        //Create Axises
        let tickFormat = "%H:%M";
        this.xAxis = d3.svg.axis().scale(this.xScale).orient("bottom").tickSubdivide(true).tickSize(8).tickPadding(8);
        this.yAxis = d3.svg.axis().scale(this.yScale).orient("left").tickSize(0);
        this.svg.append("g").attr("class", "x axis")
            .attr("transform", "translate(" + this.padding[2] + ", " + (this.height - this.padding[1]) + ")")
            .transition().call(this.xAxis);
        this.svg.append("g").attr("class", "y axis")
            .attr("transform", "translate(" + this.padding[2] + ", 0)")
            .transition().call(this.yAxis);
        var rectTransform = function (d) {
            return "translate(" + this.xScale(d.start) + this.padding[2] + "," + this.yScale(d.lane) + ")";
        };

        this.svg.append("g")
            .attr("transform", "translate(" + this.padding[2] + ", 0)")
            .selectAll('.task').data(this.data).enter()
            .append("rect")
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("y", 0)
            .attr("transform", $.proxy(rectTransform, this))
            .attr("height", $.proxy(function (d) { return this.yScale.rangeBand(); }, this))
            .attr("width", $.proxy(function (d) { return (this.xScale(d.end) - this.xScale(d.start)); }, this))
            .attr("fill", this.fillfunc)
            .text(function (d) { return d; });
    }
    InitDomains() {
        this.min = this.data.reduce(
            (previousValue, currentValue) =>
                (previousValue < currentValue.start ? previousValue : currentValue.start)
            , this.data[0].start);
        this.max = this.data.reduce(
            (previousValue, currentValue) =>
                (previousValue > currentValue.end ? previousValue : currentValue.end)
            , this.data[0].end);
        this.xScale = d3.scale.linear().domain([this.min, this.max]).range([0, this.width - (this.padding[2] + this.padding[3])]).clamp(true);
        this.yScale = d3.scale.ordinal().domain(d3.range(this.numberOfLanes)).rangeRoundBands([0, this.height - (this.padding[0] + this.padding[1])]);
    }
    setFillfunc(f) {
        this.fillfunc = f;
    }
}