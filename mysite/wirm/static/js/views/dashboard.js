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
