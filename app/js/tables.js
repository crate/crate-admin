define(['jquery',
        'underscore',
        'backbone',
        'base',
        'SQL',
        'text!views/tablelist.html',
        'text!views/tableinfo.html',
        'bootstrap',
    ], function ($, _, Backbone, base,  TableTemplate, RowTemplate) {

    var Tables = {};

    Tables.TableList = Backbone.Collection.extend({

    });

    Tables.TableInfo = Backbone.Model.extend({

    });

    Tables.TableListView = base.CrateView.extend({

    });

    Tables.TableInfoView = base.CrateView.extend({

    });

    return Tables;
});
