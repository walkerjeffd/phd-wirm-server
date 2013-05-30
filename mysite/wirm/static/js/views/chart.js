App.Chart = function() {
  // private variables
  var margin = {top: 40, right: 20, bottom: 40, left: 50},
      width = 500,
      height = 500,
      xValue = function(d) { return d[0]; },
      yValue = function(d) { return d[1]; },
      xScale = d3.scale.linear(),
      yScale = d3.scale.linear(),
      xAxis = d3.svg.axis(),
      yAxis = d3.svg.axis(),
      color = d3.scale.category10(),
      line = d3.svg.line().x(X).y(Y),
      xDomain,
      yDomain,
      xLabel,
      yLabel,
      legend,
      svg;

  // closure return
  function chart(selection) {
    xScale
      .range([0, width - margin.left - margin.right])
      .domain([0, 1]);

    yScale
      .range([height - margin.top - margin.bottom, 0])
      .domain([0, 1]);

    svg = d3.select(selection).append('svg')
      .attr('width', width)
      .attr('height', height);

    var g = svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    xAxis
      .scale(xScale)
      .orient('bottom');

    yAxis
      .scale(yScale)
      .orient('left');

    g.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + yScale.range()[0] + ')')
        .call(xAxis)
      .append("text")
        .attr("transform", "translate("+(width-margin.left-margin.right)/2+",0)")
        .attr("y", 6)
        .attr("dy", "2em")
        .style("text-anchor", "middle")
        .text(xLabel);

    g.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
      .append("text")
        .attr("transform", "translate(0,"+(height-margin.top-margin.bottom)/2+")rotate(-90)")
        .attr("y", 6)
        .attr("dy", "-3em")
        .style("text-anchor", "middle")
        .text(yLabel);

    g.append('g').attr('class','lines');
    g.append('g').attr('class','points');

    legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(' + (margin.left) + ',' + (margin.top/2) + ')');
  }

  // private functions
  function X(d) {
    return xScale(d[0]);
  }

  function Y(d) {
    return yScale(d[1]);
  }

  // public methods
  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.x = function(_) {
    if (!arguments.length) return xValue;
    xValue = _;
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return yValue;
    yValue = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    if (color) {
      color = _;
    }
    return chart;
  };

  chart.xDomain = function(_) {
    if (!arguments.length) return xDomain;
    xDomain = _;
    return chart;
  };

  chart.yDomain = function(_) {
    if (!arguments.length) return yDomain;
    yDomain = _;
    return chart;
  };

  chart.xLabel = function(_) {
    if (!arguments.length) return xLabel;
    xLabel = _;
    return chart;
  };

  chart.yLabel = function(_) {
    if (!arguments.length) return yLabel;
    yLabel = _;
    return chart;
  };

  chart.data = function(data) {
    var geomData = {'lines': data.filter(function(d) { return d.geom=='line'; }),
                    'points': data.filter(function(d) { return d.geom=='point'; })};

    if (xDomain) {
      xScale.domain(xDomain);
    } else {
      var maxPointX = d3.max(geomData.points.map(function(d) { return xValue(d.data); })),
          maxLineX = d3.max(d3.merge(geomData.lines.map(function(d) { return d.data.map(xValue); })));
      xScale.domain([0, d3.max([maxPointX, maxLineX])]).nice();
    }

    if (yDomain) {
      yScale.domain(yDomain);
    } else {
      var maxPointY = d3.max(geomData.points.map(function(d) { return yValue(d.data); })),
          maxLineY = d3.max(d3.merge(geomData.lines.map(function(d) { return d.data.map(yValue); })));
      yScale.domain([0, d3.max([maxPointY, maxLineY])]).nice();
    }

    svg.select('g.x.axis').call(xAxis);
    svg.select('g.y.axis').call(yAxis);

    circles = svg.select('g.points').selectAll('circle').data(geomData.points);
    circles.enter()
      .append('circle');
    circles.attr('cx', function(d) { return xScale(xValue(d.data)); })
      .attr('cy', function(d) { return yScale(yValue(d.data)); })
      .attr('r', 10)
      .attr('fill', 'red');
    circles.exit()
      .remove();

    lines = svg.select('g.lines').selectAll('path').data(geomData.lines);
    lines.enter()
      .append('path')
      .attr('d', function (d) { return line(d.data); })
      .style('stroke', function (d) {return color(d.key);});
    lines
      .attr('d', function (d) { return line(d.data); });
    lines.exit()
      .remove();

    legend.selectAll('line')
        .data(color.domain())
      .enter()
        .append('line')
        .attr('x1', function(d, i) { return (xScale.range()[1]-80*(i+1));} )
        .attr('x2', function(d, i) { return (xScale.range()[1]-80*(i+1)+15);} )
        .attr('y1', 0.5)
        .attr('y2', 0.5)
        .style('stroke', function(d) { return color(d);});

    legend.selectAll('text')
        .data(color.domain())
      .enter()
        .append('text')
        .attr('x', function(d, i) { return (xScale.range()[1]-80*(i+1)+20);} )
        .attr('y', 4.5)
        .attr('text-anchor', 'start')
        .text(function(d) {return d;});

    return chart;
  };

  return chart;
};