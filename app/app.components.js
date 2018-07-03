// making sure my files load so we need to import each module here.
// services
import './scripts/services/utils';
import './scripts/services/clusterEventsHandler';

import './scripts/services/sql';
import './scripts/services/health';
import './scripts/services/stats';
import './scripts/services/tableinfo';
import './scripts/services/shardinfo';
import './scripts/services/viewinfo';
import './scripts/services/nodeinfo';
import './scripts/services/checks';
import './scripts/services/udc';
import './scripts/services/translation';
import './scripts/services/datatypechecks';
import './scripts/services/segmentio';

//controllers
import './scripts/controllers/common';
import './scripts/controllers/feed';
import './scripts/controllers/overview';
import './scripts/controllers/console';
import './scripts/controllers/tables';
import './scripts/controllers/views';
import './scripts/controllers/cluster';

//filters
import './scripts/filter/text';
import './scripts/filter/numbers';

// loading all vendor module
import './vendor.module';
