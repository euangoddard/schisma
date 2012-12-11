(function () {
    var MONGOLAB_API_URL = 'https://api.mongolab.com/api/1/databases/schisma/';
    
    var MONGOLAB_API_KEY = '50c48d11e4b012b961327393';
    
    angular.module('schisma.backend', ['ngResource'])
        .factory('Schism', function ($resource) {
            var Schism = $resource(
                MONGOLAB_API_URL + 'collections/schisms/:id',
                {apiKey: MONGOLAB_API_KEY},
                {update: { method: 'PUT'}}
            );
            
            Schism.prototype.update = function (callback) {
                return Schism.update(
                    {id: this._id.$oid},
                    angular.extend({}, this, {_id: undefined}),
                    callback
                );
            };
            
            Schism.prototype.destroy = function (callback) {
                return Schism.remove({id: this._id.$oid}, callback);
            };
            
            return Schism;
        });
    
})(); 
