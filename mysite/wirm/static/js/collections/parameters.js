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
