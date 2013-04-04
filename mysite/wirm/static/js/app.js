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
