/* ============================================ 
 * wirm.js v0.9.1 
 * http://walkerjeffd.github.com/wirm/ 
 * ============================================= 
 * Copyright 2013 Jeffrey D. Walker 
 * 
 * Build Date: 2013-06-21 
 * ============================================= */ 
// helper function for getting CSRF from cookie
function getCookie(name) {
  var cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = jQuery.trim(cookies[i]);
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) == (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// modify backbone sync function to pass CSRF Token in request header
// https://gist.github.com/gcollazo/1240683
window.oldSync = Backbone.sync;
Backbone.sync = function(method, model, options){
    options.beforeSend = function(xhr){
        xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
    };
    return window.oldSync(method, model, options);
};

// backbone namespacing
window.App = {
  Models: {},
  Collections: {},
  Views: {},
  Router: {},
  Charts: {},
  Simulations: {}
};

// custom events object
App.vent = _.extend({}, Backbone.Events);

// template helper function
App.template = function(id) {
  return _.template( $('#' + id).html() );
};

App = window.App || {};

App.SimulationEngine = function(parameters) {
  var L_0 = parameters.L_0,
      o_0 = parameters.o_0,
      T = parameters.T,
      x_max = parameters.x_max,
      U = parameters.U,
      H = parameters.H,
      k_d_20 = parameters.k_d_20,
      k_so = parameters.k_so,
      theta_BOD = parameters.theta_BOD,
      theta_DO = parameters.theta_DO;
      
  var do_saturation = function(T) {
    // DO Saturation Concentration, o_s (mg/L)
    var Ta = T+273.15;
    return Math.exp(-139.34411 +
                    1.575701e5/Ta -
                    6.642308e7/Math.pow(Ta,2) +
                    1.243800e10/Math.pow(Ta,3) -
                    8.621949e11/Math.pow(Ta,4));
  };

  var do_reaeration = function(H, U) {
    // Covar chart for DO Reaeration Rate, k_a_20 (1/d)
    if (H <= 0.61) {
      return 5.32*Math.pow(U, 0.67)*Math.pow(H, -1.85); // Owens
    } else if (H > 4.145*Math.pow(U,2.711)) {
      return 3.93*Math.pow(U, 0.5)*Math.pow(H, -1.5); // O'Connor
    } else {
      return 5.026*Math.pow(U, 0.969)*Math.pow(H, -1.673); // Churchill
    }
  };

  var do_inhibition = function(o, k_so) {
    // DO Inhibition Factor, F_ox (-)
    return o/Math.max((k_so+o),0.001);
  };

  // compute derived parameters
  var o_s = do_saturation(T),
      k_a_20 = do_reaeration(H, U),
      k_a = k_a_20*Math.pow(theta_DO,T-20),
      k_d = k_d_20*Math.pow(theta_BOD,T-20);

  var t_rng = [0, x_max/(U*86.4)],
      h = 0.1,
      y0 = [L_0, o_0];

  var dydt = function(t, y) {
    var L_t = y[0],
        o_t = y[1],
        F_ox = do_inhibition(o_t, k_so),
        dL = -F_ox*k_d*L_t,
        dO = -F_ox*k_d*L_t + k_a*(o_s - o_t);
    return([dL, dO]);
  };

  var ode_rk4 = function(t_rng, y0, dy) {
      // var t = numeric.linspace(t_rng[0], t_rng[1], (Math.ceil((t_rng[1]-t_rng[0])/h)+1));
      var t = t_rng[0];
      var t_array = [t];
      var soln = y0;
      var soln_array = [soln];
      while (t+h <= t_rng[1]) {
          K1 = numeric.mul(h, dy(t, soln));
          K2 = numeric.mul(h, dy(t + h/2, numeric.add(soln, numeric.mul(0.5, K1))));
          K3 = numeric.mul(h, dy(t + h/2, numeric.add(soln, numeric.mul(0.5, K2))));
          K4 = numeric.mul(h, dy(t + h, numeric.add(soln, K3)));
          Ksum = numeric.add(numeric.add(numeric.add(K1, numeric.mul(2,K2)), numeric.mul(2,K3)), K4);
          soln = numeric.add(soln, numeric.mul((1/6), Ksum));
          t = t + h;
          t_array.push(t);
          soln_array.push(soln);
      }
      // for (var i=0; i<(t.length-1); i++) {
      //     K1 = numeric.mul(h, dy(t[i], soln[i]));
      //     K2 = numeric.mul(h, dy(t[i] + h/2, numeric.add(soln[i], numeric.mul(0.5, K1))));
      //     K3 = numeric.mul(h, dy(t[i] + h/2, numeric.add(soln[i], numeric.mul(0.5, K2))));
      //     K4 = numeric.mul(h, dy(t[i] + h, numeric.add(soln[i], K3)));
      //     Ksum = numeric.add(numeric.add(numeric.add(K1, numeric.mul(2,K2)), numeric.mul(2,K3)), K4);
      //     soln.push((numeric.add(soln[i],numeric.mul((1/6), Ksum))));
      // }
      return {t: t_array, y: soln_array};
  };

  var soln = ode_rk4(t_rng, y0, dydt);

  // console.log('t range: ', t_rng);
  // console.log('max t: ', soln.t[soln.t.length-1]);
  // console.log('max t->x: ', soln.t[soln.t.length-1]*U*86.4);

  var BOD = {'key': 'BOD',
             'geom': 'line',
             'data': d3.zip(soln.t.map(function(d) { return d*(U*86.4); }),
                            soln.y.map(function(d) { return d[0]; }))};
  var DO = {'key': 'DO',
            'geom': 'line',
            'data': d3.zip(soln.t.map(function(d) { return d*(U*86.4); }),
                           soln.y.map(function(d) { return d[1]; }))};
  var DO_sat = {'key': 'DO_sat',
            'geom': 'line',
            'color': 'black',
            'dashed': true,
            'data': [[0, o_s],[soln.t[soln.t.length-1]*U*86.4, o_s]]
          };
  return [BOD, DO, DO_sat];
};
App = window.App || {};

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
      .style("stroke-dasharray", function(d) { return d.dashed ? ("3, 3") : ("1, 0"); })
      .style('stroke', function (d) {return d.color || color(d.key);});
    lines
      .attr('d', function (d) { return line(d.data); });
    lines.exit()
      .remove();

    legend.selectAll('line')
        .data(geomData.lines)
      .enter()
        .append('line')
        .attr('x1', function(d, i) { return (xScale.range()[1]-80*(i+1));} )
        .attr('x2', function(d, i) { return (xScale.range()[1]-80*(i+1)+15);} )
        .attr('y1', 0.5)
        .attr('y2', 0.5)
        .style("stroke-dasharray", function(d) { return d.dashed ? ("3, 3") : ("1, 0"); })
        .style('stroke', function(d) { return d.color || color(d.key);});

    legend.selectAll('text')
        .data(geomData.lines)
      .enter()
        .append('text')
        .attr('x', function(d, i) { return (xScale.range()[1]-80*(i+1)+20);} )
        .attr('y', 4.5)
        .attr('text-anchor', 'start')
        .text(function(d) {return d.key;});

    return chart;
  };

  return chart;
};
App.Models.Comment = Backbone.Model.extend({
});
App.Models.Parameter = Backbone.Model.extend({
  urlRoot: '/api/parameters/',

  saveRevert: function() {
    this._revertAttributes = _.clone(this.attributes);
  },

  revert: function() {
    if (this._revertAttributes) {
      this.set(this._revertAttributes);
    }
  }
});
App.Models.Project = Backbone.Model.extend({
  urlRoot: '/api/projects/',

  defaults: {
    title: 'New Project',
    location: '',
    description: '',
    parameter_values: '',
    owner: null,
    comments: []
  },

  validate: function(attrs) {
    if (attrs.title.trim() === "") {
      return "Project title cannot be blank";
    }
    if (attrs.location.trim() === "") {
      return "Project location cannot be blank";
    }
    if (attrs.description.trim() === "") {
      return "Project description cannot be blank";
    }
  },

  save: function(attributes, options) {
      // cleanup attributes before saving
      var that = this;
      var attrs = ['comments'];
      _.each(attrs, function(attr){
        that.unset(attr);
      });
      Backbone.Model.prototype.save.call(this, attributes, options);
  }
});
App.Collections.Comments = Backbone.Collection.extend({
  model: App.Models.Comment,

  url: function() {
    return this.project.url() + '/comments/';
  },

  initialize: function(models, options) {
    this.project = options.project;
  }
});

App.Collections.Parameters = Backbone.Collection.extend({
  model: App.Models.Parameter,

  url: '/api/parameters/',

  initialize: function(models, options) {
    // console.log('INIT: parameters');
    App.vent.bind('reset:parameters', this.revert, this);
    App.vent.bind('save:parameters', this.saveRevert, this);
  },

  saveRevert: function() {
    console.log('parameters: saving parameter state');
    this.each(function(parameter) {
      parameter.saveRevert();
    });
  },

  revert: function() {
    console.log('parameters: reverting parameter state');
    this.each(function(parameter) {
      parameter.revert();
    });
  },

  // helper function to convert parameter values to key->value pairs
  getKeyValuePairs: function() {
      var keyValues = {};
      this.each(function(d) { keyValues[d.get('key')] = d.get('value'); });
      return keyValues;
  }
});

App.Collections.Projects = Backbone.Collection.extend({
  model: App.Models.Project,

  url: '/api/projects/'
});
App.Views.CommentTab = Backbone.View.extend({
  template: App.template('template-comment'),

  events: {
    'click #submit-comment': 'submitComment'
  },

  initialize: function() {
    console.log('INIT: comment tab');
    this.listenTo(this.collection, 'sync', this.render, this);
    this.listenTo(this.collection, 'change', this.render, this);
    this.listenTo(this.collection, 'remove', this.render, this);
    this.listenTo(this.collection, 'add', this.render, this);
    this.listenTo(this.collection, 'reset', this.render, this);
  },

  render: function() {
    console.log('RENDER: comment tab');
    var view = this;
    view.$el.html(this.template());
    if (this.collection.isEmpty()) {
      this.$('.comment-list-container').html('<p>No comments</p>');
    } else {
      var commentList = new App.Views.CommentList({collection: this.collection});
      this.$('.comment-list-container').html( commentList.render().el );
    }
    return this;
  },

  submitComment: function(e) {
    e.preventDefault();
    var comment = this.$("input[name='comment']").val();
    this.collection.create({'comment': comment},
      { wait: true,
        success:function() {
          this.$("input[name='comment']").val('');
          console.log('added comment');
        },
        error: function(model, xhr, options) {
          this.$("input[name='comment']").val('');
          App.vent.trigger('status', 'error', 'Unable to save comment');
          console.log(xhr);
      }
    });
  }
});

App.Views.CommentList = Backbone.View.extend({
  tagName: 'ul',

  className: 'comment-list',

  initialize: function() {
    console.log('INIT: comment list');
  },

  render: function() {
    console.log('RENDER: comment list');
    var view = this;
    view.$el.empty();
    if (this.collection.isEmpty()) {
      this.$el.html('No comments');
    } else {
      this.collection.each(function(comment) {
        var commentListItem = new App.Views.CommentListItem({model: comment});
        view.$el.append( commentListItem.render().el );
      });
    }
    return this;
  }
});

App.Views.CommentListItem = Backbone.View.extend({
  tagName: 'li',

  className: 'comment-item',

  template: App.template('template-comment-item'),

  events: {
    'click .btn-delete': 'deleteComment'
  },

  initialize: function() {
  },

  render: function() {
    var context = this.model.toJSON();
    // context.formatCreated = moment(context.created).format("MMM D YYYY, h:mm a");
    context.formatCreated = moment(context.created).fromNow();
    this.$el.html( this.template( context ) );
    return this;
  },

  deleteComment: function() {
    this.model.destroy({
      wait: true,
      success: function() {
        App.vent.trigger('status', 'success', 'Comment deleted');
      },
      error: function() {
        App.vent.trigger('status', 'error', 'Unable to delete comment');
      }
    });
  }
});
App.Views.Controls = Backbone.View.extend({
  template: App.template('template-controls'),

  events: {
    "click .btn-save": "saveProject",
    "click .btn-reset": "resetParameters",
    "click .btn-share": "shareProject"
  },

  initialize: function(options) {
    console.log('INIT: controls');
    this.project = options.project;
    this.parameters = options.parameters;
    this.listenTo(this.project, 'change', this.render, this);
    App.vent.bind('status', this.showStatus, this);
  },

  render: function() {
    console.log('RENDER: controls');
    this.$el.html(this.template());
    this.delegateEvents();
    if (this.project.isNew()) {
      this.$('.btn-share').remove();
      this.$('.btn-reset').tooltip({placement: 'bottom', trigger: 'hover', container: 'body', title: 'Reset parameters to default values'});
    } else {
      this.$('.btn-reset').tooltip({placement: 'bottom', trigger: 'hover', container: 'body', title: 'Reset parameters to last saved values'});
    }
    this.$('.alert').hide();
    this.$('.btn-save').tooltip({placement: 'bottom', trigger: 'hover', container: 'body', title: 'Save to new project'});
    this.$('.btn-share').tooltip({placement: 'bottom', trigger: 'hover', container: 'body', title: 'Share saved project with others'});
    return this;
  },

  saveProject: function() {
    console.log('controls: save project');
    var view = this;
    if (this.project.isNew()) {
      // project is new
      if (App.router.isAuthenticated()) {
        // user is logged in
        this.$('.btn-save').tooltip('hide');
        var projectModal = new App.Views.ProjectModal({project: this.project, parameters: this.parameters, parent: this});
      } else {
        // user is not logged in
        App.vent.trigger('status', 'error', 'Error: You must <a href="/accounts/login/">log in</a> first to save a new project', 5000);
      }
    } else {
      // project already exists
      if (App.user === this.project.get('owner').username) {
        // current user owns project
        this.project.save({parameter_values: this.parameters.getKeyValuePairs()}, {
          success: function() {
            console.log('success');
            App.vent.trigger('status', 'success', 'Success: Project saved');
          }
        });
      } else {
        // current user does not own project
        App.vent.trigger('status', 'error', 'Error: Only the owner of this project can save changes');
      }
    }
  },

  showStatus: function(statusType, message, delay) {
    delay = delay || 3000;
    this.$('.alert').clearQueue();
    this.$('.alert').removeClass().addClass('alert alert-' + statusType);
    this.$('#status').html(message);
    this.$('.alert').show(0);
    this.$('.alert').delay(delay).fadeOut();
  },

  resetParameters: function() {
    console.log('controls: reset parameters');
    App.vent.trigger('reset:parameters');
  },

  shareProject: function() {
    console.log('Sharing project ' + this.project.get('id'));
    var modal = new App.Views.ShareModal();
  }
});


App.Views.ShareModal = Backbone.View.extend({
  template: App.template('template-share'),

  events: {
    'click .close': 'close',
    'click .btn-close': 'close'
  },

  initialize: function(options) {
    console.log('INIT: share modal');
    this.render();
  },

  render: function() {
    console.log('RENDER: share modal');
    this.$el.html( this.template( {url: location.href } ) );
    $('body').append( this.el );
    this.$('.modal').modal();
    return this;
  },

  close: function() {
    console.log('project modal: close');
    this.$('.modal').modal('hide');
    this.remove();
  }
});

App.Views.Dashboard = Backbone.View.extend({
  template: App.template('template-dashboard'),

  initialize: function(options) {
    console.log('INIT: dashboard');

    this.parameters = this.options.parameters;
    this.project = this.options.project;
    this.comments = this.options.comments;

    // create sub-views
    this.subViews = {};
    this.subViews.projectInfo = new App.Views.ProjectInfo({project: this.project, parameters: this.parameters});
    this.subViews.controls = new App.Views.Controls({project: this.project, parameters: this.parameters});
    this.subViews.simulationView = new App.Views.Simulation({
      el: this.$('#chart-container'),
      chartOptions: {
        width: 500,
        height: 400,
        color: d3.scale.category10(),
        xLabel: 'Distance Downstream (km)',
        yLabel: 'Concentration (mg/L)'
      },
      parameters: this.parameters,
      engine: App.SimulationEngine
    });
    this.subViews.tabsView = new App.Views.Tabs({project: this.project, parameters: this.parameters, comments: this.comments});

    this.render();
  },

  render: function() {
    console.log('RENDER: dashboard');

    // initialize element
    this.$el.html( this.template() );

    this.subViews.projectInfo.setElement(this.$('#project-info')).render();
    this.subViews.controls.setElement(this.$('#controls')).render();
    this.subViews.simulationView.setElement(this.$('#chart-container')).render().update();
    this.subViews.tabsView.setElement(this.$('#tabs-container')).render();

    return this;
  }
});

App.Views.Tabs = Backbone.View.extend({
  template: App.template('template-tabs'),

  initialize: function(options) {
    console.log('INIT: tabs');
    this.parameters = options.parameters;
    this.project = options.project;
    this.comments = options.comments;

    this.subViews = {};
    // this.subViews.basicTab = new App.Views.ParametersTab({parameters: this.parameters});
    this.subViews.basicTab = new App.Views.ParametersTab({parameters: this.parameters, group: 'basic'});
    this.subViews.advancedTab = new App.Views.ParametersTab({parameters: this.parameters, group: 'advanced'});

    this.subViews.commentTab = new App.Views.CommentTab({collection: this.comments});

    // this.listenTo(this.project, 'change:comments', this.updateComments);
    // this.listenTo(this.project, 'sync', this.updateComments);
  },

  updateComments: function() {
    console.log('Updating comments');
    // this.comments.reset(this.project.get('comments'));
    // this.comments.fetch();
  },

  render: function() {
    console.log('RENDER: tabs');
    this.$el.html( this.template() );

    this.subViews.basicTab.setElement(this.$('#tab-param-basic')).render();
    this.subViews.advancedTab.setElement(this.$('#tab-param-advanced')).render();

    // if project is not new, add comments tab
    if (!this.project.isNew()) {
      this.$('ul.nav').append('<li><a href="#tab-comments" data-toggle="tab">Comments</a></li>');
      this.$('.tab-content').append('<div class="tab-pane fade" id="tab-comments"></div>');
      this.subViews.commentTab.setElement(this.$('#tab-comments')).render();
    }
    
    return this;
  }
});

App.Views.Error = Backbone.View.extend({
  template: App.template('template-error'),

  initialize: function(options) {
    this.title = options.title;
    this.message = options.message;
  },

  render: function() {
    this.$el.html( this.template( {title: this.title, message: this.message} ) );
    return this;
  }
});
App.Views.ParametersTab = Backbone.View.extend({
  initialize: function(options) {
    console.log('INIT: parameters view');
    var view = this;
    this.parameters = options.parameters;
    this.group = options.group;
    this.listenToOnce(this.parameters, 'sync', this.render);
  },

  render: function() {
    console.log('RENDER: parameters view');
    var view = this;
    this.$el.empty();
    var basicParameters = this.parameters.filter(function (model) { return model.get('group')===view.group;});
    _.each(basicParameters, function(parameter) {
        var parameterContainer = new App.Views.ParameterContainer({model: parameter});
        view.$el.append(parameterContainer.el);
      });
    return this;
  }
});

App.Views.ParameterContainer = Backbone.View.extend({
  className: 'param-row',

  initialize: function() {
    console.log('INIT: container for ' + this.model.get('key'));
    this.parameterLabel = new App.Views.ParameterLabel({model: this.model});
    this.parameterSlider = new App.Views.ParameterSlider({model: this.model});
    this.render();
  },

  render: function() {
    this.$el.empty();
    this.$el.append( this.parameterLabel.render().el );
    this.$el.append( this.parameterSlider.render().el );
    return this;
  }
});

App.Views.ParameterLabel = Backbone.View.extend({
  className: 'param-label',

  template: App.template('template-parameter-label'),

  initialize: function() {
    this.listenTo(this.model, 'change:value', this.render);
  },

  render: function() {
    this.$el.html( this.template( this.model.toJSON() ));
    return this;
  }
});

App.Views.ParameterSlider = Backbone.View.extend({
  className: 'slider param-slider',

  events: {
    'slide': 'slideUpdate'
  },

  initialize: function() {
    this.$el.slider( this.model.toJSON() );
    var max = this.model.get('max'),
        min = this.model.get('min');
    this.$el.slider( 'option', 'step', Math.pow(10,Math.round(Math.log(max-min)/Math.log(10))-2));
    this.listenTo(this.model, 'change:value', this.render);
  },

  slideUpdate: function(event, ui) {
    this.model.set('value', ui.value);
  },

  render: function() {
    this.$el.slider( this.model.toJSON() );
    return this;
  }
});

// project info in dashboard header
App.Views.ProjectInfo = Backbone.View.extend({
  template: App.template('template-project-info'),

  events: {
    "click .btn-edit": "editProject",
    "click .btn-delete": "deleteProject"
  },

  initialize: function(options) {
    console.log('INIT: project info');
    this.project = options.project;
    this.parameters = options.parameters;
    this.listenTo(this.project, 'change', this.render, this);
    this.listenTo(this.project, 'destroy', function() { App.router.navigate('/', {trigger: true}); });
  },

  render: function() {
    var view = this;
    console.log('RENDER: project info');
    this.$el.html( this.template( this.project.toJSON() ) );
    this.$('#project-details').toggle(!(this.project.isNew()));
    this.$('.alert').hide();
    this.$('.alert .btn-confirm').on('click', function() {
      view.project.destroy();
    });
    this.$('.alert .btn-cancel').on('click', function() {
      view.$('.alert').toggle();
    });
    
    return this;
  },

  editProject: function() {
    console.log('controls: edit project ' + this.project.get('id'));
    if (App.user === this.project.get('owner').username) {
      // current user owns project
      var projectModal = new App.Views.ProjectModal({project: this.project, parameters: this.parameters, title: 'Edit Project Info'});
    } else {
      // current user does not own project
      App.vent.trigger('status', 'error', 'Error: Only the owner of this project can edit it');
    }
  },

  deleteProject: function() {
    var view = this;
    console.log('controls: delete project ' + this.project.get('id'));
    if (App.user === this.project.get('owner').username) {
      // current user owns project
      this.$('.alert').slideDown();
    } else {
      // current user does not own project
      App.vent.trigger('status', 'error', 'Error: Only the owner of this project can delete it');
    }
  }
});

// project list
App.Views.ProjectContainer = Backbone.View.extend({
  template: App.template('template-project-container'),

  initialize: function() {
    console.log('INIT: project list view');
    this.subViews = {};
    this.subViews.projectList = new App.Views.ProjectList({collection: this.collection});
    this.listenTo(this.collection, 'sync add remove change', this.render);
  },

  render: function() {
    this.$el.html( this.template() );
    if (!(App.router.isAuthenticated())) {
      this.$el.append('<p>You must be logged in to view saved projects. Click here to <a href="/accounts/login/">log in</a> or <a href="/accounts/register/">sign up</a>.</p>');
    } else if (this.collection.isEmpty()) {
      this.$el.append('<p>You have no saved projects. <a href="#">Click here</a> to start a new project</p>');
    } else {
      this.$el.append(this.subViews.projectList.render().el);
    }
  }
});

App.Views.ProjectList = Backbone.View.extend({
  tagName: 'ul',

  className: 'project-list',

  render: function() {
    console.log('RENDER: project list view');
    var view = this;
    this.$el.empty();
    this.collection.each(function(project) {
      var projectItem = new App.Views.ProjectListItem({model: project});
      view.$el.append(projectItem.render().el );
    });
    return this;
  }
});

// project list item
App.Views.ProjectListItem = Backbone.View.extend({
  tagName: 'li',

  className: 'project-item',

  model: App.Models.Project,

  template: App.template('template-project-item'),

  events: {
    'click .btn-delete': 'deleteProject'
  },

  render: function() {
    console.log('RENDER: project list item');
    var context = this.model.toJSON();
    var view = this;
    context.created = moment(context.created).format('MMM D YYYY h:mm a');
    context.updated = moment(context.updated).format('MMM D YYYY h:mm a');
    context.createdFromNow = moment(context.created).fromNow();
    context.updatedFromNow = moment(context.updated).fromNow();
    this.$el.html( this.template( context ) );
    this.$('.alert').hide();
    this.$('.alert .btn-confirm').on('click', function() {
      view.model.destroy();
    });
    this.$('.alert .btn-cancel').on('click', function() {
      view.$('.alert').toggle();
    });
    return this;
  },

  deleteProject: function() {
    this.$('.alert').slideDown();
  }
});

// modal for saving/editing project
App.Views.ProjectModal = Backbone.View.extend({
  template: App.template('template-project-modal'),

  events: {
    'click .btn-save': 'saveProject',
    'click .close': 'close',
    'click .btn-close': 'close'
  },

  initialize: function(options) {
    console.log('INIT: project modal');
    this.project = options.project;
    this.parameters = options.parameters;
    this.title = options.title || 'Create Project';
    this.project.set('parameter_values', this.parameters.getKeyValuePairs());
    this.listenTo(this.project, 'sync', this.postSave, this);
    this.listenTo(this.project, 'error', this.showError);
    this.listenTo(this.project, 'invalid', this.showInvalid);
    this.render();
  },

  render: function() {
    console.log('RENDER: project modal');
    this.$el.html( this.template( this.project.toJSON() ) );
    this.$('#projectModalLabel').text(this.title);
    $('body').append( this.el );
    this.$('.alert').hide();
    this.$('.modal').modal();
    return this;
  },

  saveProject: function() {
    console.log('project modal: saving project');
    this.project.save({
      title: this.$("input[name='title']").val(),
      location: this.$("input[name='location']").val(),
      description: this.$("textarea[name='description']").val()
    }, {
      wait: true
    });
  },

  postSave: function() {
    console.log('project model: project saved');
    App.vent.trigger('status', 'success', 'Project saved');
    this.close();
    App.router.navigate('/projects/' + this.project.get('id'), {trigger: true});
  },

  close: function() {
    console.log('project modal: close');
    this.$('.modal').modal('hide');
    this.remove();
  },

  showError: function(model, xhr, options) {
    console.log('Error saving model:');
    this.showStatus('Error: Unable to save model.');
    // App.vent.trigger('status', 'error', 'Error saving model');
    console.log(xhr);
  },

  showInvalid: function(model, error, options) {
    this.showStatus('Error: ' + error);
    // App.vent.trigger('status', 'error', 'Model Validation Failed');
    console.log('Invalid model: ' + error);
  },

  showStatus: function(message) {
    this.$('.alert').clearQueue();
    this.$('.alert').html(message);
    this.$('.alert').show();
  }
});

App.Views.Simulation = Backbone.View.extend({
  initialize: function(options) {
    console.log('INIT: simulation');
    var view = this;

    this.engine = options.engine;
    this.parameters = options.parameters;

    this.listenToOnce(this.parameters, 'sync', this.update);
    this.listenTo(this.parameters, 'change:value', this.update);

    this.chart = new App.Chart();

    _.each(this.options.chartOptions, function(value, key) {
      view.chart[key](value);
    });
  },

  render: function() {
    console.log('RENDER: simulation');
    this.chart(this.el);
    return this;
  },

  update: function() {
    if (this.parameters.length > 0) {
      this.chart.data( this.engine( this.parameters.getKeyValuePairs() ) );
    }
    return this;
  }
});

App.Router.Workspace = Backbone.Router.extend({
  routes: {
    "": "newProject",
    "projects": "projectList",
    "projects/:id": "loadProject",
    "*path": "unknownPath"
  },

  initialize: function(options) {
    this.el = options.el;

    // set up models/collections
    this.project = new App.Models.Project();
    this.projects = new App.Collections.Projects();
    this.parameters = new App.Collections.Parameters();
    this.comments = new App.Collections.Comments([], {project: this.project});

    // set up dashboard view
    this.dashboard = new App.Views.Dashboard({parameters: this.parameters, project: this.project, comments: this.comments});

    // set up project list view
    this.projectContainer = new App.Views.ProjectContainer({collection: this.projects});

    // fetch default parameters
    this.parameters.fetch();

    // update values in parameters collection when project is fetched
    this.listenTo(this.parameters, 'sync', function() {App.vent.trigger('save:parameters');});
    this.listenTo(this.project, 'sync', this.updateParameters);

    // show all events for debugging
    // this.listenTo(this.project, 'all', function(eventName) {console.log('EVENT - project : ' + eventName);});
    // this.listenTo(this.projects, 'all', function(eventName) {console.log('EVENT - projects : ' + eventName);});
    // this.listenTo(this.parameters, 'all', function(eventName) {console.log('EVENT - parameters : ' + eventName);});
  },

  unknownPath: function(path) {
    this.showError('Unknown Path', 'The URL path #' + path + ' in invalid.');
  },

  newProject: function() {
    console.log('ROUTE: new project');

    // reset project to new project
    if (!(this.project.isNew())) {
      console.log('workspace: resetting project to new project');
      this.project.clear({silent: true});
      var newProject = new App.Models.Project();
      this.project.set(newProject.toJSON());
    }

    this.parameters.fetch();

    // show dashboard
    this.showDashboard();
  },

  showDashboard: function() {
    console.log('workspace: show dashboard');
    this.dashboard.setElement(this.el).render();
  },

  projectList: function() {
    console.log('ROUTE: project list');
    this.projectContainer.setElement(this.el).render();
    this.projects.fetch();
  },

  loadProject: function(id) {
    console.log('ROUTE: load project');
    var that = this;

    this.project.set({id: id});

    this.project.fetch({
      success: function(model, response, options) {
        that.comments.fetch();
        that.updateParameters();
        that.showDashboard();
      },
      error: function(model, response, options) {
        console.log('Error fetching project ' + id);
        if (response.status === 404) {
          that.showError('Project not found', 'The project with id ' + id + ' was not found.');
        } else {
          that.showError('Unknown Error', 'Server responded with status ' + response.status + ': ' + response.statusText + '.');
        }
      }
    });
  },

  showError: function(title, message) {
    errorView = new App.Views.Error({title: title, message: message});
    errorView.setElement(this.el).render();
  },

  updateParameters: function() {
    console.log('workspace: updating parameters');
    var newParameters = this.project.get('parameter_values');
    this.parameters.each(function(parameter) {
      parameter.set('value', newParameters[parameter.get('key')]);
    });
    App.vent.trigger('save:parameters');
  },

  isAuthenticated: function() {
    return App.user !== null;
  }
});

App.boot = function(container) {
  container = $(container);
  App.router = new App.Router.Workspace({el: container});
  Backbone.history.start({root: "/client/"});
};