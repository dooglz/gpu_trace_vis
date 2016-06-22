var visContainerDiv;

$(document).ready(function () {
	visContainerDiv = $("#visContainerDiv");
	vis.init(visContainerDiv);
	//vis.createNodeLink(nodes, links);
	vis.Go();
});

var openFile = function (event) {
	var input = event.target;

	var reader = new FileReader();
	reader.onload = function () {
		var text = reader.result;
		console.log(reader.result.substring(0, 200));
		ParseTrace(reader.result);
		CalcMetrics();

	};
	reader.readAsText(input.files[0]);

};
var ConvertforD3 = function () {
	let tasks = [];
	Instuctions.forEach(i => {
		tasks.push(new Task(i.startTick, i.endTick, i.wf,i.name,i.type));
	});
	var tc = new TaskChart(d3.select("#visContainerDiv"), tasks, 4);
}

var parseToObj = function (line) {
	var v = false;
	var obj = {}
	var ks = "";
	var vs = "";
	[...line].forEach(c => {
		switch (c) {
			case " ":
				v = false;
				obj[ks.replace(/['"]+/g, '')] = vs.replace(/['"]+/g, '');
				ks = "";
				vs = "";
				break;
			case "=":
				v = true;
				break;
			default:
				if (v) {
					vs += c;
				} else {
					ks += c;
				}
				break;
		}
	});
	obj[ks.replace(/['"]+/g, '')] = vs.replace(/['"]+/g, '');
	return obj;
}

class InstructionInstance {
    constructor(id, cu, wf, startTick, name, type) {
        this.id = id;
		this.cu = cu;
		this.wf = wf;
		this.startTick = startTick;
		this.endTick = 0;
        this.name = name;
		this.type = type;
    }
}
class InstructionMetric {
    constructor(name, ticks) {
        this.name = name;
		this.count = 1;
		this.ticks = [ticks];
		this.tickTotal = ticks;
    }
}

var Instuctions;
var metrics;
var ParseTrace = function (trace) {
	var allTextLines = [];
	allTextLines = trace.split(/\r\n|\n/);
	trace = "";
	var clock = 0;
	var step = 0;
	Instuctions = new Map();
	allTextLines.forEach(v => {
		if (v.startsWith("c clk=")) {
			//clock
			step++;
			clock = parseInt(v.substring(6));
		} else if (v.startsWith("si.new_inst")) {
			let oo = parseToObj(v);
			let type = 0;
			if (oo.asm.startsWith("S_")) {
				type = 1;
			} else if (oo.asm.startsWith("V_")) {
				type = 2;
			} else if (oo.asm.startsWith("T")) {
				type = 3;
			} else if (oo.asm.startsWith("DS")) {
				type = 4;
			}
			Instuctions.set(oo.id + "_" + oo.cu, new InstructionInstance(oo.id, oo.cu, oo.wf, clock, oo.asm, type));
		} else if (v.startsWith("si.inst")) {
			//parseToObj(v);
		} else if (v.startsWith("si.end_inst")) {
			var oo = parseToObj(v);
			if (Instuctions.has(oo.id + "_" + oo.cu) === false) {
				console.error(oo.id + "_" + oo.cu);
			} else {
				Instuctions.get(oo.id + "_" + oo.cu).endTick = clock;
			}
		}
	});
};

var CalcMetrics = function (trace) {
	metrics = new Map();
	Instuctions.forEach(i => {
		if (metrics.has(i.name)) {
			let mm = metrics.get(i.name);
			mm.count++;
			mm.ticks.push(i.endTick - i.startTick);
			mm.tickTotal += (i.endTick - i.startTick);
		} else {
			metrics.set(i.name, new InstructionMetric(i.name, i.endTick - i.startTick));
		}
	});
	let mostCalled = 0;
	let Expesnive = 0;
	let ExpesniveA = 0;
	let mostTicks = 0;
	metrics.forEach(m => {
		if (mostCalled === 0 || m.count > mostCalled.count) {
			mostCalled = m;
		}
		if (mostCalled === 0 || m.count > mostCalled.count) {
			mostCalled = m;
		}
		let avg = m.tickTotal / (m.ticks.length || 1);
		if (mostCalled === 0 || avg > ExpesniveA) {
			ExpesniveA = avg;
			Expesnive = m;
		}
		if (mostTicks === 0 || m.tickTotal > mostTicks.tickTotal) {
			mostTicks = m;
		}
	});
	console.log(`Most called:`, mostCalled, mostCalled.count);
	console.log(`Most Expesnive call:`, Expesnive, ExpesniveA);
	console.log(`Longest Running:`, mostTicks, mostTicks.tickTotal);
}