define(['jquery', 'underscore'], function ($, _) {

    var SQL  = {};

    SQL.Query = function (query) {
        this.query = query;
        return this;
    };

    _.extend(SQL.Query.prototype, {

        execute: function (args) {
            var d, data;

            data = {
                stmt: this.query
            };

            if (args !== undefined) {
                data.args = args;
            }
            d = $.post(SQL.host + '/_sql', JSON.stringify(data));
            return d;
        }

    });

    return SQL;
});