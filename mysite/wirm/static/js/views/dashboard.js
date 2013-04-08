App.Views.Dashboard = Backbone.View.extend({
  template: App.template('template-dashboard'),

  initialize: function(options) {
    console.log('INIT: dashboard');

    this.parameters = this.options.parameters;
    this.project = this.options.project;

    // create sub-views
    this.subViews = {};
    this.subViews.projectInfo = new App.Views.ProjectInfo({project: this.project, parameters: this.parameters});
    this.subViews.controls = new App.Views.Controls({project: this.project, parameters: this.parameters});
    this.subViews.simulationView = new App.Views.Simulation({
      el: this.$('#chart-container'),
      chartOptions: {
        width: 500,
        height: 300,
        color: d3.scale.category10(),
        xLabel: 'Travel Time (days)',
        yLabel: 'Concentration (mg/L)'
      },
      parameters: this.parameters,
      compute: App.Simulations.StreeterPhelps
    });
    this.subViews.tabsView = new App.Views.Tabs({project: this.project, parameters: this.parameters});

    this.render();
  },

  render: function() {
    console.log('RENDER: dashboard');

    // initialize element
    this.$el.html( this.template() );

    this.subViews.projectInfo.setElement(this.$('#project-info')).render();
    this.subViews.controls.setElement(this.$('#controls')).render();
    this.subViews.simulationView.setElement(this.$('#chart-container')).render().update();
    this.subViews.tabsView.setElement(this.$('#param-container')).render();

    return this;
  }
});

App.Views.Tabs = Backbone.View.extend({
  template: App.template('template-tabs'),

  initialize: function(options) {
    console.log('INIT: tabs');
    this.parameters = options.parameters;
    this.project = options.project;
    this.comments = new App.Collections.Comments(this.project.get('comments'), {project: this.project} );

    this.subViews = {};
    this.subViews.parametersTab = new App.Views.ParametersTab({parameters: this.parameters});
    this.subViews.commentTab = new App.Views.CommentTab({collection: this.comments});

    this.listenTo(this.project, 'change:comments', this.updateComments);
    this.listenTo(this.project, 'sync', this.updateComments);
  },

  updateComments: function() {
    console.log('Updating comments');
    this.comments.reset(this.project.get('comments'));
  },

  render: function() {
    console.log('RENDER: tabs');
    this.$el.html( this.template() );
    this.subViews.parametersTab.setElement(this.$('#tab-param')).render();
    this.subViews.commentTab.setElement(this.$('#tab-comments')).render();
    return this;
  }
});


