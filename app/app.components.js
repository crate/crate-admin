// making sure my files load so we need to import each module here.
// services
import './scripts/services/utils';
import './scripts/services/clusterEventsHandler';

import './scripts/services/sql';
import './scripts/services/health';
import './scripts/services/stats';
import './scripts/services/tableinfo';
import './scripts/services/shardinfo';
import './scripts/services/nodeinfo';
import './scripts/services/checks';
import './scripts/services/udc';
import './scripts/services/translation';
import './scripts/services/datatypechecks';
import './scripts/services/segmentio';
import './scripts/services/apollo.provider.js';

//controllers
import './scripts/controllers/common';
import './scripts/controllers/feed';
import './scripts/controllers/overview';
import './scripts/controllers/console';
import './scripts/controllers/tables';
import './scripts/controllers/cluster';
import './scripts/controllers/authentication';

//filters
import './scripts/filter/text';
import './scripts/filter/numbers';

//constants
import './scripts/constants/client';
import './scripts/constants/auth';
