
/* global GetFilesList InitVis*/
/* exported InitVis*/
var totalChartSpaceHeight; 
$(document).ready(function() {
  GetFilesList();
  INSTRUCTIONTYPEARR = [];
  for (let propt in INSTRUCTIONTYPE) {
    INSTRUCTIONTYPEARR.push(INSTRUCTIONTYPE[propt]);
  }
  totalChartSpaceHeight = parseInt(d3.select("#outercontainer").style("height"), 10);
});

class ComputeUnitOccupancy {
  constructor(cu, startTick, occ) {
    this.occ = occ;
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

let parser;
let metricsGen;
let loadingDiv = $('#loading-indicator');
let loadingTextDiv = $('#load-Text');

function Init(file) {
  CloseMemvis();
  loadingDiv.show();
  console.log(file.substring(0, 200));
  parser = ParseTrace(file);
  Init2();
}

function Init2() {
  let p = parser.next();
  if (!p.done) {
    setTimeout(function() { Init2() }, 0);
    loadingTextDiv.html("Stage 1: " + Math.floor(p.value) + "%");
  } else {
    metricsGen = CalcMetrics();
    Init3();
  }
}

function Init3(file) {
  let p = metricsGen.next();
  if (!p.done) {
    setTimeout(function() { Init3() }, 0);
    loadingTextDiv.html("Stage 2: " + Math.floor(p.value) + "%");
  } else {
    InitVis();
    loadingDiv.hide();
  }
}


function InitWork(file) {
  console.log(file.substring(0, 200));
  ParseTrace(file);
  yield;
  CalcMetrics();
  yield;

}

function OpenFileFromXHR(name) {
  console.log("data/" + name);
  let jqxhr = $.get("data/" + name, function(data2) {
    Init(data2);
  });
  jqxhr.fail(function(e) {
    console.log("error Loading File from net", e);
  });
}

function GetFilesList() {
  let jqxhr = $.getJSON("files.php", function(data) {
    console.log(data);
    data.forEach(function(element) {
      $('<button/>').text(element).click(function() {
        OpenFileFromXHR(element);
      }).appendTo($("#filesDiv"));
    }, this);
  });
  jqxhr.fail(function(e) {
    console.log("error", e);
  });
}

function openFileFromDisk(event) {
  var input = event.target;
  var reader = new FileReader();
  reader.onload = function() {
    Init(reader.result);
  };
  reader.readAsText(input.files[0]);
}

function parseToObj(line) {
  var v = false;
  var obj = {};
  var ks = "";
  var vs = "";
  [...line].forEach(c => {
    switch (c) {
      case " ":
        if (v) {
          obj[ks.replace(/['"]+/g, '')] = vs.replace(/['"]+/g, '');
        }
        v = false;
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
  if (obj.cu) {
    obj.cu = parseInt(obj.cu, 10);
  }
  if (obj.wf) {
    obj.wf = parseInt(obj.wf, 10);
  }
  return obj;
}

var Instuctions;
var memops;
var metrics;
function* ParseTrace(trace) {
  var allTextLines = [];
  allTextLines = trace.split(/\r\n|\n/);
  trace = "";
  var clock = 0;
  var startTick = -1;
  var mostCU = 0;
  var mostWF = 0;
  Instuctions = [];
  memops = [];
  metrics = {};
  metrics.wavefronts = [];
  for (var i = 0; i < allTextLines.length; ++i) {
    if (i > 0 && i % 4000 == 0) {
      yield ((i / allTextLines.length) * 100);
    }
    let v = allTextLines[i].trim()
    if (v.startsWith("c clk=")) {
      // clock
      clock = parseInt(v.substring(6), 10);
      if (startTick === -1) {
        startTick = clock;
      }
    } else if (v.startsWith("mem.new_access name=")) {
      let om = parseToObj(v);
      om.start = clock;
      om.memoryRoute = {};
      memops.push(om);
    } else if (v.startsWith("mem.end_access name=")) {
      let om = parseToObj(v);
      let inst = undefined;
      for (let j = memops.length; j > 0; --j) {
        if (memops[j - 1].name === om.name) {
          inst = memops[j - 1];
          break;
        }
      }
      if (inst === undefined) {
        console.error(om.name);
      } else {
        inst.end = clock;
      }
    } else if (v.startsWith("mem.access")) {
      let om = parseToObj(v);
      let inst = undefined;
      for (let j = memops.length; j > 0; --j) {
        if (memops[j - 1].name === om.name) {
          inst = memops[j - 1];
          break;
        }
      }
      if (inst !== undefined && om.state !== undefined) {
        let re = /((LDS)|si-(\w*)-)/;
        let m;
        if ((m = re.exec(om.state)) !== null) {
          if (m.index === re.lastIndex) {
            re.lastIndex++;
          }
          m = (m[2] === undefined ? m[3] : m[2]);
          inst.memoryRoute[m] === undefined ? inst.memoryRoute[m] = 0 : inst.memoryRoute[m]++;
        }
      } else {
        console.error(om.name);
      }
    } else if (v.startsWith("mem")) {

    } else if (v.startsWith("si.new_inst")) {
      let oo = parseToObj(v);
      mostCU = oo.cu > mostCU ? oo.cu : mostCU;
      mostWF = oo.wf > mostWF ? oo.wf : mostWF;
      if (metrics.wavefronts[oo.wf] === undefined) {
        metrics.wavefronts[oo.wf] = {};
        metrics.wavefronts[oo.wf].cu = oo.cu;
      }
      let type = detemineAsmType(oo.asm);
      // Instuctions.set(oo.id + "_" + oo.cu, new InstructionInstance(oo.id, oo.cu, oo.wf, clock, oo.asm, type));
      Instuctions.push(new InstructionInstance(oo.id, oo.cu, oo.wf, clock, oo.asm, type));
    } else if (v.startsWith("si.inst")) {
      // parseToObj(v);
    } else if (v.startsWith("si.end_inst")) {
      let oo = parseToObj(v);
      let inst = undefined;
      for (let j = Instuctions.length; j > 0; --j) {
        if (oo.id === Instuctions[j - 1].id && oo.cu === Instuctions[j - 1].cu) {
          inst = Instuctions[j - 1];
          break;
        }
      }
      if (inst === undefined) {
        console.error(oo.id + "_" + oo.cu);
      } else {
        inst.end = clock;
      }

    } else {
      console.warn("unkown line: ", i, v);
    }
  }

  metrics.wfCount = mostWF + 1;
  metrics.cuCount = mostCU + 1;
  metrics.cu = new Array(mostCU + 1);
  metrics.startTick = startTick;
  metrics.endTick = clock;
  metrics.ticks = clock - startTick;
}

var cuocc;
function* CalcMetrics(trace2) {
  let trace = trace2;
  metrics.globalMaxInstActivity = 0; // most instructions in flight at any one time on any CU
  metrics.globalMaxWfInstActivity = 0; // most instructions in flight at any one time on a single WF on any CU
  metrics.globalMaxWfActivity = 0; // Most wavefronts doing anything at one time on any cu;

  for (let i = 0; i < metrics.cu.length; i++) {
    metrics.cu[i] = {};
    metrics.cu[i].asms = new Map();

    // number of isntructions in flight at this tick in this cu;
    metrics.cu[i].instActivity = new Array(metrics.endTick + 1 - metrics.startTick);
    metrics.cu[i].instActivity.fill(0);
    // number of isntructions in flight at this tick in this cu, per WF;
    metrics.cu[i].wfInstActivity = new Array(metrics.endTick + 1 - metrics.startTick);
    // number of wavefronts doing anything at this tick on this CU;
    metrics.cu[i].wfActivity = new Array(metrics.endTick + 1 - metrics.startTick);

    metrics.cu[i].maxInstActivity = 0; // most instructions in flight at any one time on a CU
    metrics.cu[i].maxWfInstActivity = 0; // most instructions in flight at any one time on a single WF on a CU
    metrics.cu[i].maxWfActivity = 0; // Most wavefronts doing anything at one time on a cu;

    for (let k = 0; k < metrics.cu[i].wfActivity.length; k++) {
      metrics.cu[i].wfInstActivity[k] = new Array(metrics.wfCount);
      metrics.cu[i].wfInstActivity[k].fill(0);
      metrics.cu[i].wfActivity[k] = new Array(metrics.wfCount);
      metrics.cu[i].wfActivity[k].fill(false);
    }
    yield null;
  }

  for (var jj = 0; jj < Instuctions.length; ++jj) {
    let i = Instuctions[jj];
    if (jj > 0 && jj % 1000 == 0) {
      yield ((jj / Instuctions.length) * 100);
    }
    // oocupancy
    for (let j = (i.start - metrics.startTick); j < ((i.end - 1) - metrics.startTick); j++) {
      metrics.cu[i.cu].instActivity[j]++;
      metrics.cu[i.cu].wfInstActivity[j][i.wf]++;
      metrics.cu[i.cu].wfActivity[j][i.wf] = true;

      metrics.cu[i.cu].maxInstActivity = Math.max(metrics.cu[i.cu].maxInstActivity, metrics.cu[i.cu].instActivity[j]);
      metrics.cu[i.cu].maxWfInstActivity = Math.max(metrics.cu[i.cu].maxWfInstActivity, metrics.cu[i.cu].wfInstActivity[j][i.wf]);
      metrics.cu[i.cu].maxWfActivity = Math.max(metrics.cu[i.cu].maxWfActivity, metrics.cu[i.cu].wfActivity[j].reduce(function(a, b) {
        return a + b;
      }));

      metrics.globalMaxInstActivity = Math.max(metrics.globalMaxInstActivity, metrics.cu[i.cu].maxInstActivity);
      metrics.globalMaxWfInstActivity = Math.max(metrics.globalMaxWfInstActivity, metrics.cu[i.cu].maxWfInstActivity);
      metrics.globalMaxWfActivity = Math.max(metrics.globalMaxWfActivity, metrics.cu[i.cu].maxWfActivity);
    }
    if (metrics.cu[i.cu].asms.has(i.name)) {
      let mm = metrics.cu[i.cu].asms.get(i.name);
      mm.count++;
      mm.ticks.push(i.end - i.start);
      mm.tickTotal += (i.end - i.start);
    } else {
      metrics.cu[i.cu].asms.set(i.name, new InstructionMetric(i.name, i.end - i.start));
    }
  };
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
    });
  });
  console.log(`Most called:`, mostCalled, mostCalled.count);
  console.log(`Most Expesnive call:`, Expesnive, ExpesniveA);
  console.log(`Longest Running:`, mostTicks, mostTicks.tickTotal);

  metrics.memory = new Array(metrics.ticks);
  metrics.memory.fill(0);
  metrics.maxMemoryOps = 0;
  metrics.memoryLoad = new Array(metrics.ticks);
  metrics.memoryLoad.fill(0);
  metrics.maxMemoryLoadOps = 0;
  metrics.memoryStore = new Array(metrics.ticks);
  metrics.memoryStore.fill(0);
  metrics.maxMemoryStoreOps = 0;

  metrics.globalStore = new Array(metrics.ticks);
  metrics.globalStore.fill(0);
  metrics.mem_maxsimul_globalStore = 0;
  metrics.ldsStore = new Array(metrics.ticks);
  metrics.ldsStore.fill(0);
  metrics.mem_maxsimul_ldsStore = 0;
  metrics.sgprStore = new Array(metrics.ticks);
  metrics.sgprStore.fill(0);
  metrics.mem_maxsimul_sgprStore = 0;
  metrics.vgprStore = new Array(metrics.ticks);
  metrics.vgprStore.fill(0);
  metrics.mem_maxsimul_vgprStore = 0;

  metrics.globalLoad = new Array(metrics.ticks);
  metrics.globalLoad.fill(0);
  metrics.mem_maxsimul_globalLoad = 0;
  metrics.ldsLoad = new Array(metrics.ticks);
  metrics.ldsLoad.fill(0);
  metrics.mem_maxsimul_ldsLoad = 0;
  metrics.sgprLoad = new Array(metrics.ticks);
  metrics.sgprLoad.fill(0);
  metrics.mem_maxsimul_sgprLoad = 0;
  metrics.vgprLoad = new Array(metrics.ticks);
  metrics.vgprLoad.fill(0);
  metrics.mem_maxsimul_vgprLoad = 0;

  metrics.mem_total_scalerLoads = 0;
  metrics.mem_total_vectorLoads = 0;
  metrics.mem_total_globalLoads = 0;
  metrics.mem_total_ldsLoads = 0;
  metrics.mem_total_scalerStores = 0;
  metrics.mem_total_vectorStores = 0;
  metrics.mem_total_globalStores = 0;
  metrics.mem_total_ldsStores = 0;

  metrics.mem_routes = {};

  for (let j = 0; j < memops.length; j++) {
    if (j > 0 && j % 400 == 0) {
      yield ((j / memops.length) * 100);
    }
    let m = memops[j];
    if (Object.keys(m.memoryRoute).length > 1) {
      // console.error(m);
    } else {
      for (var propertyName in m.memoryRoute) {
        metrics.mem_routes[propertyName] = 1;
      }
    }
    if (m.type === "load") {
      if (m.memoryRoute.vector !== undefined) { metrics.mem_total_vectorLoads++; }
      if (m.memoryRoute.scalar !== undefined) { metrics.mem_total_scalerLoads++; }
      if (m.memoryRoute.gm !== undefined) { metrics.mem_total_globalLoads++; }
      if (m.memoryRoute.LDS !== undefined) { metrics.mem_total_ldsLoads++; }
    } else if (m.type === "store" || m.type === "nc_store") {
      if (m.memoryRoute.vector !== undefined) { metrics.mem_total_vectorStores++; }
      if (m.memoryRoute.scalar !== undefined) { metrics.mem_total_scalerStores++; }
      if (m.memoryRoute.gm !== undefined) { metrics.mem_total_globalStores++; }
      if (m.memoryRoute.LDS !== undefined) { metrics.mem_total_ldsStores++; }
    }
    for (let i = m.start; i < m.end + 1; i++) {
      metrics.memory[i - metrics.startTick]++;
      metrics.maxMemoryOps = Math.max(metrics.maxMemoryOps, metrics.memory[i - metrics.startTick]);
      if (m.type === "load") {
        metrics.memoryLoad[i - metrics.startTick]++;
        metrics.maxMemoryLoadOps = Math.max(metrics.maxMemoryLoadOps, metrics.memoryLoad[i - metrics.startTick]);
        if (m.memoryRoute.gm !== undefined) {
          metrics.globalLoad[i - metrics.startTick]++;
          metrics.mem_maxsimul_globalLoad = Math.max(metrics.mem_maxsimul_globalLoad, metrics.globalLoad[i - metrics.startTick]);
        }
        if (m.memoryRoute.LDS !== undefined) {
          metrics.ldsLoad[i - metrics.startTick]++;
          metrics.mem_maxsimul_ldsLoad = Math.max(metrics.mem_maxsimul_ldsLoad, metrics.ldsLoad[i - metrics.startTick]);
        }
        if (m.memoryRoute.scalar !== undefined) {
          metrics.sgprLoad[i - metrics.startTick]++;
          metrics.mem_maxsimul_sgprLoad = Math.max(metrics.mem_maxsimul_sgprLoad, metrics.sgprLoad[i - metrics.startTick]);
        }
        if (m.memoryRoute.vector !== undefined) {
          metrics.vgprLoad[i - metrics.startTick]++;
          metrics.mem_maxsimul_vgprLoad = Math.max(metrics.mem_maxsimul_vgprLoad, metrics.vgprLoad[i - metrics.startTick]);
        }
      } else if (m.type === "store" || m.type === "nc_store") {
        metrics.memoryStore[i - metrics.startTick]++;
        metrics.maxMemoryStoreOps = Math.max(metrics.maxMemoryStoreOps, metrics.memoryStore[i - metrics.startTick]);
        if (m.memoryRoute.gm !== undefined) {
          metrics.globalStore[i - metrics.startTick]++;
          metrics.mem_maxsimul_globalStore = Math.max(metrics.mem_maxsimul_globalStore, metrics.globalStore[i - metrics.startTick]);
        }
        if (m.memoryRoute.LDS !== undefined) {
          metrics.ldsStore[i - metrics.startTick]++;
          metrics.mem_maxsimul_ldsStore = Math.max(metrics.mem_maxsimul_ldsStore, metrics.ldsStore[i - metrics.startTick]);
        }
        if (m.memoryRoute.scalar !== undefined) {
          metrics.sgprStore[i - metrics.startTick]++;
          metrics.mem_maxsimul_sgprStore = Math.max(metrics.mem_maxsimul_sgprStore, metrics.sgprStore[i - metrics.startTick]);
        }
        if (m.memoryRoute.vector !== undefined) {
          metrics.vgprStore[i - metrics.startTick]++;
          metrics.mem_maxsimul_vgprStore = Math.max(metrics.mem_maxsimul_vgprStore, metrics.vgprStore[i - metrics.startTick]);
        }
      } else {
        console.warn("Mmeory op type: " + m.type);
      }
    }
  }
}
var INSTRUCTIONTYPEARR = [];

var INSTRUCTIONTYPE = {
  SCALER: { value: 0, name: "Scaler", prefix: "S_" },
  VECTOR: { value: 1, name: "Vector", prefix: "V_" },
  DATA: { value: 2, name: "Data Share", prefix: "DS_" },
  IMAGE: { value: 3, name: "Image Memory", prefix: "IMAGE_" },
  TBUF: { value: 4, name: "Typed Buffer", prefix: "TBUFFER_" },
};


function detemineAsmType(ss) {
  for (var propt in INSTRUCTIONTYPE) {
    if (ss.startsWith(INSTRUCTIONTYPE[propt].prefix)) {
      return INSTRUCTIONTYPE[propt];
    }
  }
  console.error("Unkown Inst type: " + ss);
}