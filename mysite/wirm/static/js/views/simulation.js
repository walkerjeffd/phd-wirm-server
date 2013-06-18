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
