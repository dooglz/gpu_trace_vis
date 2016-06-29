
$(document).ready(function () { });

class InstructionInstance {
    constructor(id, cu, wf, startTick, name, type) {
        this.id = id;
		this.cu = cu;
		this.wf = wf;
        this.name = name;
		this.type = type;
		//used for vis
		this.start = startTick;
        this.end = startTick + 1;
		this.lane = wf;
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

var openFile = function (event) {
	var input = event.target;

	var reader = new FileReader();
	reader.onload = function () {
		var text = reader.result;
		console.log(reader.result.substring(0, 200));
		ParseTrace(reader.result);
		CalcMetrics();
		InitVis();
	};
	reader.readAsText(input.files[0]);
};

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
	obj.cu = parseInt(obj.cu);
	obj.wf = parseInt(obj.wf);
	return obj;
}

var Instuctions;
var metrics;
var ParseTrace = function (trace) {
	var allTextLines = [];
	allTextLines = trace.split(/\r\n|\n/);
	trace = "";
	var clock = 0;
	var mostCU=0;
	var step = 0;
	Instuctions = [];
	allTextLines.forEach(v => {
		if (v.startsWith("c clk=")) {
			//clock
			step++;
			clock = parseInt(v.substring(6));
		} else if (v.startsWith("si.new_inst")) {
			let oo = parseToObj(v);
			mostCU =  oo.cu > mostCU ? oo.cu : mostCU;
			let type = detemineAsmType(oo.asm);
			//Instuctions.set(oo.id + "_" + oo.cu, new InstructionInstance(oo.id, oo.cu, oo.wf, clock, oo.asm, type));
			Instuctions.push(new InstructionInstance(oo.id, oo.cu, oo.wf, clock, oo.asm, type));
		} else if (v.startsWith("si.inst")) {
			//parseToObj(v);
		} else if (v.startsWith("si.end_inst")) {
			var oo = parseToObj(v);
			var inst = Instuctions.find((it) => { return (oo.id == it.id && oo.cu == it.cu) });
			if (inst === undefined) {
				console.error(oo.id + "_" + oo.cu);
			} else {
				inst.end = clock;
			}
		}
	});
	metrics = new Array(mostCU+1);  
};

var CalcMetrics = function (trace) {
	for(let i = 0; i < metrics.length; i++){
		metrics[i] = {};
		metrics[i].asms = new Map();
	}
	Instuctions.forEach(i => {
		if (metrics[i.cu].asms.has(i.name)) {
			let mm = metrics[i.cu].asms.get(i.name);
			mm.count++;
			mm.ticks.push(i.end - i.start);
			mm.tickTotal += (i.end - i.start);
		} else {
			metrics[i.cu].asms.set(i.name, new InstructionMetric(i.name, i.end - i.start));
		}
	});
	let mostCalled = 0;
	let Expesnive = 0;
	let ExpesniveA = 0;
	let mostTicks = 0;
	metrics.forEach(m => {
		m.asms.forEach(im => {
			if (mostCalled === 0 || im.count > mostCalled.count) {
				mostCalled = im;
			}
			if (mostCalled === 0 || im.count > mostCalled.count) {
				mostCalled = im;
			}
			let avg = im.tickTotal / (im.ticks.length || 1);
			if (mostCalled === 0 || avg > ExpesniveA) {
				ExpesniveA = avg;
				Expesnive = im;
			}
			if (mostTicks === 0 || im.tickTotal > mostTicks.tickTotal) {
				mostTicks = im;
			}
		})
	});
	console.log(`Most called:`, mostCalled, mostCalled.count);
	console.log(`Most Expesnive call:`, Expesnive, ExpesniveA);
	console.log(`Longest Running:`, mostTicks, mostTicks.tickTotal);
}

var INSTRUCTIONTYPE = {
	SCALER: { value: 0, name: "Scaler", prefix: "S_" },
	VECTOR: { value: 1, name: "Vector", prefix: "V_" },
	DATA: { value: 2, name: "Data Share", prefix: "DS_" },
	IMAGE: { value: 3, name: "Image Memory", prefix: "IMAGE_" },
	TBUF: { value: 4, name: "Typed Buffer", prefix: "TBUFFER_" },
};

var detemineAsmType = function (ss) {
	for (var propt in INSTRUCTIONTYPE) {
		if (ss.startsWith(INSTRUCTIONTYPE[propt].prefix)) {
			return INSTRUCTIONTYPE[propt];
		}
	}
	console.error("Unkown Inst type: " + ss);
}