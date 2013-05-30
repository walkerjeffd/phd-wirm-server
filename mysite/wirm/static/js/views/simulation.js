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
  }

  var do_reaeration = function(H, U) {
    // Covar chart for DO Reaeration Rate, k_a_20 (1/d)
    if (H <= 0.61) {
      return 5.32*Math.pow(U, 0.67)*Math.pow(H, -1.85) // Owens
    } else if (H > 4.145*Math.pow(U,2.711)) {
      return 3.93*Math.pow(U, 0.5)*Math.pow(H, -1.5) // O'Connor
    } else {
      return 5.026*Math.pow(U, 0.969)*Math.pow(H, -1.673) // Churchill
    }
  }

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
             // 'color': 'red',
             'data': d3.zip(soln.t.map(function(d) { return d*(U*86.4); }),
                            soln.y.map(function(d) { return d[0]; }))};
  var DO = {'key': 'DO',
            'geom': 'line',
            // 'color': 'blue',
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