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