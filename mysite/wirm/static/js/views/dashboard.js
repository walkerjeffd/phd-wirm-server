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
    this.subViews.parametersView = new App.Views.ParametersView({parameters: this.parameters});
    this.render();
  },

  render: function() {
    console.log('RENDER: dashboard');

    // initialize element
    this.$el.html( this.template() );

    this.subViews.projectInfo.setElement(this.$('#project-info')).render();
    this.subViews.controls.setElement(this.$('#controls')).render();
    this.subViews.simulationView.setElement(this.$('#chart-container')).render().update();
    this.subViews.parametersView.setElement(this.$('#param-container')).render();
    return this;
  }
});
