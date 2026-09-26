/**
 * Normalizes status data returned by different providers into a standardized, predictable shape.
 * 
 * Standard shape:
 * {
 *   status: 'operational' | 'degraded' | 'outage' | 'unknown',
 *   statusDescription: string,
 *   indicator: 'none' | 'minor' | 'major' | 'critical' | 'unknown',
 *   updatedAt: string | null,
 *   incidents: Array<{
 *     id: string,
 *     name: string,
 *     status: string,
 *     impact: 'none' | 'minor' | 'major' | 'critical',
 *     updatedAt: string,
 *     message: string,
 *   }>,
 *   components: Array<{
 *     id: string,
 *     name: string,
 *     status: 'operational' | 'degraded' | 'outage' | 'unknown',
 *     rawStatus?: string,
 *   }>
 * }
 */

/**
 * Normalizer for Atlassian Statuspage.io providers (/api/v2/summary.json)
 */
export function normalizeStatuspage(data) {
  if (!data || typeof data !== 'object') {
    return createUnknownState('Invalid data received from Statuspage');
  }

  const indicator = data.status?.indicator?.toLowerCase() || 'none';
  let status = 'operational';

  switch (indicator) {
    case 'none':
      status = 'operational';
      break;
    case 'minor':
    case 'maintenance':
      status = 'degraded';
      break;
    case 'major':
    case 'critical':
      status = 'outage';
      break;
    default:
      status = 'unknown';
  }

  // Normalize list of active incidents
  const rawIncidents = Array.isArray(data.incidents) ? data.incidents : [];
  const incidents = rawIncidents
    .filter((inc) => inc.status !== 'resolved' && inc.status !== 'postmortem')
    .map((inc) => ({
      id: String(inc.id || inc.name),
      name: inc.name || 'Untitled Incident',
      status: inc.status || 'investigating',
      impact: inc.impact || 'minor',
      updatedAt: inc.updated_at || inc.created_at || new Date().toISOString(),
      message: inc.incident_updates?.[0]?.body || '',
    }));

  // Normalize list of components
  const rawComponents = Array.isArray(data.components) ? data.components : [];
  const components = rawComponents
    .filter((comp) => !comp.group) // Exclude group header containers
    .map((comp) => {
      let compStatus = 'operational';
      const rawCompStatus = (comp.status || '').toLowerCase();

      if (rawCompStatus === 'operational') {
        compStatus = 'operational';
      } else if (
        rawCompStatus === 'degraded_performance' ||
        rawCompStatus === 'partial_outage' ||
        rawCompStatus === 'under_maintenance'
      ) {
        compStatus = 'degraded';
      } else if (rawCompStatus === 'major_outage') {
        compStatus = 'outage';
      } else {
        compStatus = 'unknown';
      }

      return {
        id: String(comp.id || comp.name),
        name: comp.name || 'Component',
        status: compStatus,
        rawStatus: rawCompStatus,
      };
    });

  return {
    status,
    statusDescription: data.status?.description || (status === 'operational' ? 'All Systems Operational' : 'Service Disruption Detected'),
    indicator,
    updatedAt: data.page?.updated_at || new Date().toISOString(),
    incidents,
    components,
  };
}

/**
 * Normalizer for Google Cloud Platform (/incidents.json)
 */
export function normalizeGcpJson(data) {
  if (!Array.isArray(data)) {
    return createUnknownState('Unexpected format for GCP');
  }

  // Active GCP incidents have no 'end' timestamp or end is in the future
  const now = Date.now();
  const activeIncidents = data.filter((inc) => {
    if (!inc.end) return true;
    const endTime = new Date(inc.end).getTime();
    return endTime > now;
  });

  if (activeIncidents.length === 0) {
    return {
      status: 'operational',
      statusDescription: 'All services operating normally',
      indicator: 'none',
      updatedAt: new Date().toISOString(),
      incidents: [],
      components: [],
    };
  }

  // Check severity of active incidents
  const hasOutage = activeIncidents.some(
    (inc) => inc.status_impact === 'SERVICE_OUTAGE' || inc.severity === 'high'
  );

  const status = hasOutage ? 'outage' : 'degraded';
  const indicator = hasOutage ? 'critical' : 'minor';

  const incidents = activeIncidents.map((inc) => ({
    id: inc.uri || String(inc.id || Math.random()),
    name: inc.external_desc || inc.service_name || 'Google Cloud Incident',
    status: inc.status_impact || 'active',
    impact: hasOutage ? 'major' : 'minor',
    updatedAt: inc.modified || inc.begin || new Date().toISOString(),
    message: inc.most_recent_update?.text || '',
  }));

  return {
    status,
    statusDescription: `${activeIncidents.length} active incident(s) ongoing`,
    indicator,
    updatedAt: activeIncidents[0]?.modified || new Date().toISOString(),
    incidents,
    components: [],
  };
}

/**
 * Normalizer for Stripe (/current)
 */
export function normalizeStripeJson(data) {
  if (!data || typeof data !== 'object') {
    return createUnknownState('Invalid data from Stripe');
  }

  const largestatus = (data.largestatus || '').toLowerCase();
  let status = 'operational';
  let indicator = 'none';

  if (largestatus === 'up') {
    status = 'operational';
    indicator = 'none';
  } else if (largestatus === 'degraded') {
    status = 'degraded';
    indicator = 'minor';
  } else if (largestatus === 'down') {
    status = 'outage';
    indicator = 'critical';
  } else {
    // Fallback checking message content
    const msg = (data.message || '').toLowerCase();
    if (msg.includes('online') || msg.includes('operational')) {
      status = 'operational';
      indicator = 'none';
    } else {
      status = 'degraded';
      indicator = 'minor';
    }
  }

  const rawStatuses = Array.isArray(data.statuses) ? data.statuses : [];
  const components = rawStatuses.map((item, idx) => ({
    id: `stripe-${idx}`,
    name: item.title || item.name || 'Service',
    status: item.status === 'up' ? 'operational' : item.status === 'down' ? 'outage' : 'degraded',
  }));

  return {
    status,
    statusDescription: data.message || (status === 'operational' ? 'All services online' : 'Interruption detected'),
    indicator,
    updatedAt: data.time || new Date().toISOString(),
    incidents: [],
    components,
  };
}

/**
 * Normalizer for GitLab / Status.io (/1.0/status/:page_id)
 */
export function normalizeStatusioJson(data) {
  if (!data || !data.result) {
    return createUnknownState('Invalid data from Status.io');
  }

  const statusCode = data.result.status_overall?.status_code;
  let status = 'operational';
  let indicator = 'none';

  // Status.io codes: 100: Operational, 200: Planned Maintenance, 300: Degraded Performance, 400: Partial Outage, 500: Major Outage
  if (statusCode === 100) {
    status = 'operational';
    indicator = 'none';
  } else if (statusCode === 200 || statusCode === 300 || statusCode === 400) {
    status = 'degraded';
    indicator = 'minor';
  } else if (statusCode === 500) {
    status = 'outage';
    indicator = 'critical';
  } else {
    status = 'unknown';
    indicator = 'unknown';
  }

  const rawIncidents = Array.isArray(data.result.incidents) ? data.result.incidents : [];
  const incidents = rawIncidents.map((inc) => ({
    id: String(inc._id || inc.id),
    name: inc.name || 'GitLab Incident',
    status: inc.current_status || 'active',
    impact: status === 'outage' ? 'major' : 'minor',
    updatedAt: inc.datetime_updated || new Date().toISOString(),
    message: inc.messages?.[0]?.details || '',
  }));

  return {
    status,
    statusDescription: data.result.status_overall?.status || (status === 'operational' ? 'All Systems Operational' : 'Service Disruption Detected'),
    indicator,
    updatedAt: data.result.status_overall?.updated || new Date().toISOString(),
    incidents,
    components: [],
  };
}

/**
 * Default fallback state when data is unavailable or an error occurs
 */
export function createUnknownState(description = 'Status currently unavailable') {
  return {
    status: 'unknown',
    statusDescription: description,
    indicator: 'unknown',
    updatedAt: null,
    incidents: [],
    components: [],
  };
}

/**
 * Main dispatcher function: takes provider config and raw data,
 * and delegates to the appropriate normalizer.
 */
export function normalizeStatus(provider, rawData) {
  if (!rawData) {
    return createUnknownState();
  }

  switch (provider.adapter) {
    case 'statuspage':
      return normalizeStatuspage(rawData);

    case 'gcp-json':
      return normalizeGcpJson(rawData);

    case 'stripe-json':
      return normalizeStripeJson(rawData);

    case 'statusio-json':
      return normalizeStatusioJson(rawData);

    default:
      // If custom/unmapped adapter, test if it looks like standard Statuspage
      if (rawData.status?.indicator) {
        return normalizeStatuspage(rawData);
      }
      return createUnknownState('Provider format in development');
  }
}
