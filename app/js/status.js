define(['jquery',
        'underscore',
        'backbone',
        'base',
        'SQL',
        'text!views/statusbar.html',
        'bootstrap',
        'flot'
    ], function ($, _, Backbone, base, SQL, StatusBarTemplate) {

    var Status = {};

    Status._refreshTimeout = 5000; // msec

    Status._loadHistoryLen = 100; // 100 points of 5sec

    Status.ClusterStatus = Backbone.Model.extend({

        defaults: {
            cluster_name: '',
            cluster_state: '',
            load: ['-.-', '-.-', '-.-'],
            replicated_data: 0,
            available_data: 0,
            records_total: 0,
            records_underreplicated: 0,
            records_unavailable: 0,
            loadHistory: [[], [], []]
        },

        _normalizeClusterLoad: function (nodes) {
            var i, node;
            var nodes_count = 0;
            var load = [0.0, 0.0, 0.0];
            for (node in nodes) {
                nodes_count++;
                for (i=0; i<3; i++) {
                    load[i] = load[i]+nodes[node].os.load_average[i];
                }
            }
            for (i=0; i<3; i++) {
                load[i] = load[i]/nodes_count;
            }
            return load;
        },

        _updateHealth: function () {
            var self = this,
                sq;

            sq = new SQL.Query("select sum(number_of_shards) from information_schema.tables where schema_name = 'doc'");
            sq.execute().done(function (res) {
                var configuredShards = 0;
                if (res.rowcount > 0) {
                    configuredShards = res.rows[0][0];
                }

                sq = new SQL.Query('select count(*), "primary", state from sys.shards group by "primary", state');
                sq.execute().done(function (res) {
                    var activePrimaryShards = 0;
                    var unassignedShards = 0;
                    for (var row in res.rows) {
                        if (res.rows[row][1] === true && res.rows[row][2] in {'STARTED':'', 'RELOCATING':''} ) {
                            activePrimaryShards = res.rows[row][0];
                        } else if (res.rows[row][2] == 'UNASSIGNED') {
                            unassignedShards = res.rows[row][0];
                        }
                    }
                    if (activePrimaryShards < configuredShards) {
                        self.set({
                            cluster_state: 'critical',
                        });
                    } else if (unassignedShards > 0) {
                        self.set({
                            cluster_state: 'warning',
                        });
                    } else {
                        self.set({
                            cluster_state: 'good',
                        });
                    }
                });
            }).fail(function (err) {});
        },

        _updateTableData: function (resTables, resRecords) {
            var self = this,
                records_total = 0,
                records_not_replicated = 0,
                records_unavailable = 0,
                table_state = {},
                row, current_row;

            // fill table state with response from 1st query
            for (row in resTables.rows) {
                current_row = resTables.rows[row];
                if (table_state[current_row[0]] === undefined) {
                    table_state[current_row[0]] = {'total':0, 'replicated': -1, 'avg_docs': 0, 'active_shards': 0};
                }
                if (current_row[2] === true) {
                    table_state[current_row[0]].total = current_row[1];
                    table_state[current_row[0]].avg_docs += current_row[4];
                    table_state[current_row[0]].active_shards += current_row[5];
                } else if (current_row[6] != 'UNASSIGNED') {
                    table_state[current_row[0]].replicated = current_row[1];
                }
            }
            // fill table state with response from 2st query
            if (resRecords !== undefined) {
                for (row in resRecords.rows) {
                    current_row = resRecords.rows[row];
                    if (table_state[current_row[0]] === undefined) {
                        table_state[current_row[0]] = {'total_shards':0};
                    }
                    table_state[current_row[0]].total_shards = current_row[1];
                }
            }

            // calculated cluster numbers
            for (var table in table_state) {
                if (table_state[table].total) {
                    records_total += table_state[table].total;
                }
                if (table_state[table].replicated > -1) {
                    records_not_replicated += (table_state[table].total - table_state[table].replicated);
                }
                var unavailable_shards = table_state[table].total_shards - table_state[table].active_shards;
                    if (unavailable_shards > 0) {
                        records_unavailable = unavailable_shards * table_state[table].avg_docs;
                }
            }

            if (records_not_replicated < 0) {
                records_not_replicated = 0;
            }

            if (records_total===0) {
                self.set({
                    'records_total': 0,
                    'records_underreplicated': 0,
                    'replicated_data': 100,
                    'records_unavailable': 0,
                    'available_data': 100
                });
            } else {
                self.set({
                    'records_total': records_total,
                    'records_underreplicated': records_not_replicated.toFixed(0),
                    'replicated_data': Math.floor(100-((records_not_replicated/records_total)*100)),
                    'records_unavailable': records_unavailable.toFixed(0),
                    'available_data': Math.floor(100-((records_unavailable/records_total)*100))
                });
            }

        },

        _updateTableStatus: function () {
            var self = this,
                sqRecords,
                dRecords;

            sqRecords = new SQL.Query(
                'select table_name, sum(num_docs), "primary", relocating_node, avg(num_docs), count(*), state '+
                'from sys.shards group by table_name, "primary", relocating_node, state ' +
                'order by table_name, "primary"');
            sqTables = new SQL.Query(
                'select table_name, sum(number_of_shards) from information_schema.tables ' +
                'group by table_name');
            dRecords = sqRecords.execute();
            dTables = sqTables.execute();
            dRecords.done(function (resTables) {
                dTables.done(function (resRecords) {
                    self._updateTableData(resTables, resRecords);
                }).fail(function () {
                    self._updateTableData(resTables);
                });
            });

        },

        _updateLoadHistory: function (load) {
            var lh = this.get('loadHistory'), i;

            for (i=0; i<3; i++) {
                lh[i].push(load[i]);
                lh[i] = lh[i].splice(-Status._loadHistoryLen, Status._loadHistoryLen);
            }
            this.set('loadHistory', lh);
            this.trigger('change:loadHistory', lh);
        },

        fetch: function () {
            var self = this,
                load, i;
            $.get('/_nodes/stats?all=true')
                .done(function (data) {
                    var load = self._normalizeClusterLoad(data.nodes);
                    self._updateLoadHistory(load);
                    for (i=0 ; i<3 ; i++) {
                        load[i] = load[i].toFixed(2);
                    }
                    self.set({
                        cluster_name: data.cluster_name,
                        load: load
                    });
                })
                .error(function() {
                    delete self.data;
                });
            this._updateHealth();
            this._updateTableStatus();
            setTimeout(function () { self.fetch(); }, Status._refreshTimeout);
        },

    });


    Status.StatusView = base.CrateView.extend({

        el: '#topstatusbar',
        template: _.template(StatusBarTemplate),
        model: Status.ClusterStatus,

        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });

    return Status;
});
