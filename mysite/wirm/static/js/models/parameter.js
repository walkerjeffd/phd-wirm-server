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