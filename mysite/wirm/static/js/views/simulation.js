App.Views.Simulation = Backbone.View.extend({
  initialize: function(options) {
    console.log('INIT: simulation');
    var view = this;

    this.compute = options.compute;
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
      this.chart.data( this.compute( this.parameters.getKeyValuePairs() ) );
    }
    return this;
  }
});

App.Simulations.StreeterPhelps = function(parameters) {
  var L_0 = parameters.L_0,
      o_0 = parameters.o_0,
      k_d = parameters.k_d,
      k_a = parameters.k_a,
      o_s = parameters.o_s,
      k_so = parameters.k_so;

  var h = 0.1,
      t_rng = [0, 20],
      y0 = [L_0, o_0];

  var calc_F_ox = function(o, k_so) {
    return o/(k_so+o);
  };

  var dydt = function(t, y) {
    var L_t = y[0],
        o_t = y[1],
        F_ox = calc_F_ox(o_t, k_so),
        dL = -F_ox*k_d*L_t,
        dO = -F_ox*k_d*L_t + k_a*(o_s - o_t);
    return([dL, dO]);
  };

  var ode_rk4 = function(t_rng, y0, dy) {
      var t = numeric.linspace(t_rng[0], t_rng[1], (Math.ceil((t_rng[1]-t_rng[0])/h)+1));
      var soln = [y0];
      for (var i=0; i<(t.length-1); i++) {
          K1 = numeric.mul(h, dy(t[i], soln[i]));
          K2 = numeric.mul(h, dy(t[i] + h/2, numeric.add(soln[i], numeric.mul(0.5, K1))));
          K3 = numeric.mul(h, dy(t[i] + h/2, numeric.add(soln[i], numeric.mul(0.5, K2))));
          K4 = numeric.mul(h, dy(t[i] + h, numeric.add(soln[i], K3)));
          Ksum = numeric.add(numeric.add(numeric.add(K1, numeric.mul(2,K2)), numeric.mul(2,K3)), K4);
          soln.push((numeric.add(soln[i],numeric.mul((1/6), Ksum))));
      }
      return {t: t, y: soln};
  };

  var soln = ode_rk4(t_rng, y0, dydt);
  var BOD = {'key': 'BOD',
             'geom': 'line',
             'data': d3.zip(soln.t, soln.y.map(function(d) { return d[0]; }))};
  var DO = {'key': 'DO',
            'geom': 'line',
            'data': d3.zip(soln.t, soln.y.map(function(d) { return d[1]; }))};
  return [BOD, DO];
};