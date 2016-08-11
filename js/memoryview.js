let memVisSvg = null;

function ClearCuvis() {
  if (cuVisSvg) {
    cuVisSvg.remove();
  }
}

function ClearMemvis() {
  if (tc) {
    tc.Clear();
  }
  if (cuVisSvg) {
    ClearCuvis();
  }
  if (memVisSvg) {
    memVisSvg.remove();
  }
  $("#visContainerDiv").toggleClass("visContainer", true);
  $("#visContainerDiv").toggleClass("visContainer1", false);
  $("#visContainerDiv2").remove();
  if (tc) {
    tc.Redraw();
  }
}

function handleMemCheck(cb) {
  if (cb.checked) {
    ShowMemVis();
  } else {
    ClearMemvis();
  }
}


function ShowMemVis() {
  //make the current vis smaller
  if (tc) {
    tc.Clear();
  }
  if (cuVisSvg) {
    ClearCuvis();
  }

  $("#visContainerDiv").toggleClass("visContainer", false);
  $("#visContainerDiv").toggleClass("visContainer1", true);
  $("#outercontainer").append('<div class="visContainer2" id="visContainerDiv2"></div>');
  tc.Redraw();

  let maxes = [
    metrics.maxMemoryLoadOps,
    metrics.maxMemoryStoreOps,
    metrics.mem_maxsimul_globalLoad,
    metrics.mem_maxsimul_globalStore,
    metrics.mem_maxsimul_ldsLoad,
    metrics.mem_maxsimul_ldsStore,
    metrics.mem_maxsimul_sgprLoad,
    metrics.mem_maxsimul_sgprStore,
    metrics.mem_maxsimul_vgprLoad,
    metrics.mem_maxsimul_vgprStore
  ]
  let labels = [
    "Total Load Ops",
    "Total Store Ops",
    "Global Loads",
    "Global Stores",
    "LDS Loads",
    "LDS Stores",
    "SGPR loads",
    "SGPR stores",
    "VGPR loads",
    "VGPR stores"
  ]
  let datums = [
    metrics.memoryLoad,
    metrics.memoryStore,
    metrics.globalLoad,
    metrics.globalStore,
    metrics.ldsLoad,
    metrics.ldsStore,
    metrics.sgprLoad,
    metrics.sgprStore,
    metrics.vgprLoad,
    metrics.vgprStore
  ]

  let filter = [true, true, true, true, false, false, false, false, false, false];
  let amount = filter.reduce(function(p, c) {
    return c ? ++p : p;
  }, 0);
  let Ymax = 0;
  for (let i = 0; i < maxes.length; ++i) {
    if (filter[i]) {
      Ymax = Math.max(Ymax, maxes[i]);
    }
  }

  let Ymin = 0;
  let Xmax = metrics.cu[0].instActivity.length;
  let Xmin = 0;
  let padding = [0, 2, 20, 10];
  let container = d3.select("#visContainerDiv2");
  let width = parseInt(container.style("width"), 10);
  let height = parseInt(container.style("height"), 10);
  let xScale = d3.scale.linear().domain([Xmin, Xmax]).range([0, width - (padding[2] + padding[3])]).clamp(true);
  let yScale = d3.scale.linear().domain([Ymin, Ymax]).range([0, height / amount - (padding[0] + padding[1])]);

  memVisSvg = container.append('svg').attr('width', width).attr('height', height);

  let data = metrics.memory;
  let area = d3.svg.area()
    .x(function(d, index) {
      return xScale(index);
    })
    .y1(yScale(Ymax))
    .y0(function(d) {
      return yScale(Ymax) - yScale(d);
    });

  let j = 0;
  for (let i = 0; i < maxes.length; ++i) {
    console.log(filter[i]);
    if (filter[i]) {
      let bar = memVisSvg.append("g");
      bar.attr("height", height / amount)
        .attr("transform", "translate(" + padding[2] + "," + j * (height / amount) + ")").append("path")
        .datum(datums[i])
        .attr("d", area)
        .attr("fill", "#1f77b4");
      bar.append("text")
        .attr("transform", "translate(0,20)")
        .attr("font-weight", "bold")
        .attr("text-anchor", "left")
        .text(labels[i]);
      ++j;
    }
  }

  /*
    {
      let loads = memVisSvg.append("g");
      loads.attr("height", height / 2)
        .attr("transform", "translate(" + padding[2] + ",0)").append("path")
        .datum(metrics.memoryLoad)
        .attr("d", area)
        .attr("fill", "#1f77b4");
      loads.append("text")
        .attr("transform", "translate(0,20)")
        .attr("font-weight", "bold")
        .attr("text-anchor", "left")
        .text("Load Ops");
    }
  
    let stores = memVisSvg.append("g");
    stores.attr("height", height / 2)
      .attr("transform", "translate(" + padding[2] + "," + height / 2 + ")").append("path")
      .datum(metrics.memoryStore)
      .attr("d", area)
      .attr("fill", "#d62728");
    stores.append("text")
      .attr("transform", "translate(0,20)")
      .attr("font-weight", "bold")
      .attr("text-anchor", "left")
      .text("Store Ops");
      */
}
