
$(document).ready(function () { GetFilesList();});

class ComputeUnitOccupancy {
    constructor(cu, startTick, occ) {
		this.occ = occ;
		//used for vis
		this.start = startTick;
        this.end = startTick + 1;
		this.lane = cu;
    }
}

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

function Loadfies(name){
 let jqxhr = $.get("data/"+name, function (data2) {
		console.log(data2.substring(0, 200));
		ParseTrace(data2);
		CalcMetrics();
		InitVis();
	});
	jqxhr.fail(function (e) {
		console.log("error", e);
	});
}


function GetFilesList() {
  let jqxhr = $.getJSON("files.php", function (data) {
	  console.log(data);
	  data.forEach(function(element) {
		  $('<button/>').text(element).click(function () { Loadfies(element); }).appendTo($("#filesDiv"));
	  }, this);
  });
  jqxhr.fail(function (e) {
    console.log("error", e);
  });
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
	var startTick =-1;
	var mostCU=0;
	var mostWF=0;
	Instuctions = [];
	metrics = {};
	metrics.wavefronts = [];
	allTextLines.forEach(v => {
		if (v.startsWith("c clk=")) {
			//clock
			clock = parseInt(v.substring(6));
			if (startTick === -1){startTick = clock;}
		} else if (v.startsWith("si.new_inst")) {
			let oo = parseToObj(v);
			mostCU =  oo.cu > mostCU ? oo.cu : mostCU;
			mostWF =  oo.wf > mostWF ? oo.wf : mostWF;
			if(metrics.wavefronts[oo.wf] === undefined){
				metrics.wavefronts[oo.wf] = {};
				metrics.wavefronts[oo.wf].cu = oo.cu;
			}
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

	metrics.wfCount = mostWF+1;
	metrics.cuCount = mostCU+1;
	metrics.cu = new Array(mostCU+1);  
	metrics.startTick = startTick;
	metrics.endTick = clock;
};
var cuocc;
var CalcMetrics = function (trace) {
	for(let i = 0; i < metrics.cu.length; i++){
		metrics.cu[i] = {};
		metrics.cu[i].asms = new Map();
		metrics.cu[i].occupancy = [new ComputeUnitOccupancy(i,metrics.startTick,0)];	
		metrics.cu[i].rawOccupancy = new Array(metrics.endTick+1 - metrics.startTick);
		metrics.cu[i].rawOccupancy.fill(0); 
		metrics.cu[i].wfActivity = new Array(metrics.endTick+1 - metrics.startTick);
		metrics.cu[i].wfboolActivity = new Array(metrics.endTick+1 - metrics.startTick);
		metrics.cu[i].maxWfAcitivity =0;
		metrics.cu[i].maxboolWfAcitivity =0;
		metrics.cu[i].maxRawWfAcitivity =0;
		for(let k = 0; k < metrics.cu[i].wfActivity.length; k++){
			metrics.cu[i].wfActivity[k] = new Array(metrics.wfCount);
			metrics.cu[i].wfActivity[k].fill(0);
			metrics.cu[i].wfboolActivity[k] = new Array(metrics.wfCount);
			metrics.cu[i].wfboolActivity[k].fill(false);
		}
	}

	Instuctions.forEach(i => {
		//oocupancy
		for(let j = (i.start - metrics.startTick); j < ((i.end-1) - metrics.startTick); j++){
			metrics.cu[i.cu].rawOccupancy[j]++;
			metrics.cu[i.cu].wfActivity[j][i.wf]++;
			metrics.cu[i.cu].wfboolActivity[j][i.wf] = true;
			metrics.cu[i.cu].maxboolWfAcitivity = Math.max(metrics.cu[i.cu].maxboolWfAcitivity,metrics.cu[i.cu].wfboolActivity[j].reduce(function (a, b) {
				return a + b;
			} ));
			metrics.cu[i.cu].maxWfAcitivity = Math.max(metrics.cu[i.cu].maxboolWfAcitivity,metrics.cu[i.cu].wfActivity[j][i.wf] );
			metrics.cu[i.cu].maxRawWfAcitivity = Math.max(metrics.cu[i.cu].maxRawWfAcitivity,metrics.cu[i.cu].rawOccupancy[j]);
		}
		if (metrics.cu[i.cu].asms.has(i.name)) {
			let mm = metrics.cu[i.cu].asms.get(i.name);
			mm.count++;
			mm.ticks.push(i.end - i.start);
			mm.tickTotal += (i.end - i.start);
		} else {
			metrics.cu[i.cu].asms.set(i.name, new InstructionMetric(i.name, i.end - i.start));
		}
	});
	let mostCalled = 0;
	let Expesnive = 0;
	let ExpesniveA = 0;
	let mostTicks = 0;
	metrics.cu.forEach(m => {
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