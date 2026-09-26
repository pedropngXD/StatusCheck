export function normalizeStatuspage(data, provider) {
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

  const rawIncidents = Array.isArray(data.incidents) ? data.incidents : [];
  let incidents = rawIncidents
    .filter((inc) => inc.status !== 'resolved' && inc.status !== 'postmortem')
    .map((inc) => ({
      id: String(inc.id || inc.name),
      name: inc.name || 'Untitled Incident',
      status: inc.status || 'investigating',
      impact: inc.impact || 'minor',
      updatedAt: inc.updated_at || inc.created_at || new Date().toISOString(),
      message: inc.incident_updates?.[0]?.body || '',
    }));

  const rawComponents = Array.isArray(data.components) ? data.components : [];
  let components = rawComponents
    .filter((comp) => !comp.group)
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

  if (provider?.id === 'openai') {
    components = components.filter((comp) => !comp.name.toLowerCase().includes('codex'));
    incidents = incidents.filter(
      (inc) =>
        !inc.name.toLowerCase().includes('codex') &&
        !inc.message.toLowerCase().includes('codex')
    );
  }

  return {
    status,
    statusDescription: data.status?.description || (status === 'operational' ? 'All Systems Operational' : 'Service Disruption Detected'),
    indicator,
    updatedAt: data.page?.updated_at || new Date().toISOString(),
    incidents,
    components,
  };
}

export function normalizeGcpJson(data) {
  if (!Array.isArray(data)) {
    return createUnknownState('Unexpected format for GCP');
  }

  const now = Date.now();
  const activeIncidents = data.filter((inc) => {
    if (!inc.end) return true;
    const endTime = new Date(inc.end).getTime();
    return endTime > now;
  });

  const coreComponents = [
    { id: 'gcp-gemini', name: 'Gemini & Vertex AI Platform', status: 'operational' },
    { id: 'gcp-compute', name: 'Compute Engine & Kubernetes (GKE)', status: 'operational' },
    { id: 'gcp-storage', name: 'Cloud Storage & Firestore', status: 'operational' },
    { id: 'gcp-network', name: 'Cloud Networking & Cloud CDN', status: 'operational' },
  ];

  if (activeIncidents.length === 0) {
    return {
      status: 'operational',
      statusDescription: 'All services operating normally',
      indicator: 'none',
      updatedAt: new Date().toISOString(),
      incidents: [],
      components: coreComponents,
    };
  }

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

  const components = coreComponents.map((c) => ({
    ...c,
    status: hasOutage ? 'outage' : 'degraded',
  }));

  return {
    status,
    statusDescription: `${activeIncidents.length} active incident(s) ongoing`,
    indicator,
    updatedAt: activeIncidents[0]?.modified || new Date().toISOString(),
    incidents,
    components,
  };
}

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
    const msg = (data.message || '').toLowerCase();
    if (msg.includes('online') || msg.includes('operational')) {
      status = 'operational';
      indicator = 'none';
    } else {
      status = 'degraded';
      indicator = 'minor';
    }
  }

  const components = [];
  if (data.statuses && typeof data.statuses === 'object') {
    if (Array.isArray(data.statuses)) {
      data.statuses.forEach((item, idx) => {
        components.push({
          id: `stripe-${idx}`,
          name: item.title || item.name || 'Service',
          status: item.status === 'up' ? 'operational' : item.status === 'down' ? 'outage' : 'degraded',
        });
      });
    } else {
      const nameMap = {
        api: 'API Platform',
        webhooks: 'Webhooks',
        dashboard: 'Dashboard',
        stripejs: 'Stripe.js & Elements',
        checkout: 'Checkout',
        supportsite: 'Support Site',
      };
      Object.entries(data.statuses).forEach(([key, val]) => {
        components.push({
          id: `stripe-${key}`,
          name: nameMap[key] || key.charAt(0).toUpperCase() + key.slice(1),
          status: val === 'up' ? 'operational' : val === 'down' ? 'outage' : 'degraded',
        });
      });
    }
  }

  return {
    status,
    statusDescription: data.message || (status === 'operational' ? 'All services online' : 'Interruption detected'),
    indicator,
    updatedAt: data.time || new Date().toISOString(),
    incidents: [],
    components,
  };
}

export function normalizeStatusioJson(data) {
  if (!data || !data.result) {
    return createUnknownState('Invalid data from Status.io');
  }

  const statusCode = data.result.status_overall?.status_code;
  let status = 'operational';
  let indicator = 'none';

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

  const rawComponents = Array.isArray(data.result.status) ? data.result.status : [];
  const components = rawComponents.map((item) => {
    let compStatus = 'operational';
    if (item.status_code === 100) {
      compStatus = 'operational';
    } else if (item.status_code === 200 || item.status_code === 300 || item.status_code === 400) {
      compStatus = 'degraded';
    } else if (item.status_code === 500) {
      compStatus = 'outage';
    }
    return {
      id: String(item.id || item.name),
      name: item.name || 'Service',
      status: compStatus,
    };
  });

  return {
    status,
    statusDescription: data.result.status_overall?.status || (status === 'operational' ? 'All Systems Operational' : 'Service Disruption Detected'),
    indicator,
    updatedAt: data.result.status_overall?.updated || new Date().toISOString(),
    incidents,
    components,
  };
}

export function normalizeAwsJson(data) {
  if (!Array.isArray(data)) {
    return createUnknownState('Unexpected format for AWS');
  }

  if (data.length === 0) {
    return {
      status: 'operational',
      statusDescription: 'All AWS services operating normally',
      indicator: 'none',
      updatedAt: new Date().toISOString(),
      incidents: [],
      components: [
        { id: 'aws-ec2', name: 'Amazon EC2', status: 'operational' },
        { id: 'aws-s3', name: 'Amazon S3', status: 'operational' },
        { id: 'aws-rds', name: 'Amazon RDS', status: 'operational' },
        { id: 'aws-lambda', name: 'AWS Lambda', status: 'operational' },
        { id: 'aws-bedrock', name: 'Amazon Bedrock (AI)', status: 'operational' },
        { id: 'aws-dynamodb', name: 'Amazon DynamoDB', status: 'operational' },
      ],
    };
  }

  const hasOutage = data.some((item) => String(item.status) === '3' || String(item.current_status) === '3');
  const hasDegraded = data.some((item) => String(item.status) === '2' || String(item.current_status) === '2');

  const status = hasOutage ? 'outage' : hasDegraded ? 'degraded' : 'operational';
  const indicator = hasOutage ? 'critical' : hasDegraded ? 'minor' : 'none';

  const incidents = data.map((event, idx) => {
    const logs = Array.isArray(event.event_log) ? event.event_log : [];
    const latestLog = logs[logs.length - 1] || logs[0];
    const isOutage = String(event.status) === '3' || String(event.current_status) === '3';
    return {
      id: event.arn || `aws-${event.date || idx}`,
      name: `${event.region_name ? `[${event.region_name}] ` : ''}${event.summary || event.service_name || 'AWS Service Event'}`,
      status: isOutage ? 'Service Disruption' : 'Performance Degraded',
      impact: isOutage ? 'major' : 'minor',
      updatedAt: latestLog?.timestamp
        ? new Date(Number(latestLog.timestamp) * (Number(latestLog.timestamp) > 1e11 ? 1 : 1000)).toISOString()
        : new Date().toISOString(),
      message: (latestLog?.message || latestLog?.summary || `${event.service_name || 'AWS'} incident reported.`).trim(),
    };
  });

  const componentMap = new Map();

  const coreServices = [
    { id: 'aws-bedrock', name: 'Amazon Bedrock (AI)', status: 'operational' },
    { id: 'aws-ec2', name: 'Amazon EC2', status: 'operational' },
    { id: 'aws-s3', name: 'Amazon S3', status: 'operational' },
    { id: 'aws-rds', name: 'Amazon RDS', status: 'operational' },
    { id: 'aws-lambda', name: 'AWS Lambda', status: 'operational' },
    { id: 'aws-dynamodb', name: 'Amazon DynamoDB', status: 'operational' },
    { id: 'aws-cloudwatch', name: 'Amazon CloudWatch', status: 'operational' },
    { id: 'aws-iam', name: 'AWS IAM', status: 'operational' },
  ];

  coreServices.forEach((core) => {
    componentMap.set(core.name.toLowerCase(), { ...core });
  });

  data.forEach((event) => {
    if (Array.isArray(event.impacted_service_status_changes)) {
      event.impacted_service_status_changes.forEach((sc) => {
        const name = (sc.service_name || sc.service || '').trim();
        if (!name) return;
        const key = name.toLowerCase();
        const itemStatus = String(sc.current_status) === '3' ? 'outage' : String(sc.current_status) === '2' ? 'degraded' : 'operational';

        if (componentMap.has(key)) {
          const existing = componentMap.get(key);
          if (itemStatus === 'outage' || (itemStatus === 'degraded' && existing.status !== 'outage')) {
            existing.status = itemStatus;
          }
        } else {
          componentMap.set(key, {
            id: sc.service || `aws-${key.replace(/[^a-z0-9]/g, '-')}`,
            name,
            status: itemStatus,
          });
        }
      });
    }
  });

  const components = Array.from(componentMap.values());

  return {
    status,
    statusDescription: status === 'operational'
      ? 'All AWS services operating normally'
      : `${incidents.length} regional service ${incidents.length === 1 ? 'event' : 'events'} reported`,
    indicator,
    updatedAt: new Date().toISOString(),
    incidents,
    components,
  };
}

export function normalizeBetterstackBadge(htmlData) {
  const html = typeof htmlData === 'string' ? htmlData : String(htmlData || '');
  if (!html) {
    return createUnknownState('No badge data received');
  }

  const isGreen = html.includes('text-statuspage-green') || html.toLowerCase().includes('all services are online');
  const isYellow = html.includes('text-statuspage-yellow') || html.toLowerCase().includes('degraded');
  const isRed = html.includes('text-statuspage-red') || html.toLowerCase().includes('outage') || html.toLowerCase().includes('downtime');

  let status = 'operational';
  let indicator = 'none';

  if (isRed) {
    status = 'outage';
    indicator = 'critical';
  } else if (isYellow) {
    status = 'degraded';
    indicator = 'minor';
  } else if (isGreen) {
    status = 'operational';
    indicator = 'none';
  } else {
    status = 'unknown';
    indicator = 'unknown';
  }

  const descMatch = html.match(/<div[^>]*class='[^']*font-medium[^']*'>\s*([^<]+)\s*<\/div>/i);
  const statusDescription = descMatch ? descMatch[1].trim() : (status === 'operational' ? 'All services are online' : 'Service Disruption Detected');

  const components = [
    { id: 'hf-hub', name: 'Model Hub & Datasets', status },
    { id: 'hf-spaces', name: 'Spaces & Inference Endpoints', status },
    { id: 'hf-platform', name: 'Platform, Auth & Website', status },
  ];

  return {
    status,
    statusDescription,
    indicator,
    updatedAt: new Date().toISOString(),
    incidents: [],
    components,
  };
}

export function normalizeOpenAiCodex(data) {
  const baseStatus = normalizeStatuspage(data);

  const codexComponents = baseStatus.components.filter((c) => {
    const name = c.name.toLowerCase();
    return name.includes('codex');
  });

  const codexIncidents = baseStatus.incidents.filter((inc) => {
    return (
      inc.name.toLowerCase().includes('codex') ||
      inc.message.toLowerCase().includes('codex')
    );
  });

  const hasOutage = codexComponents.some((c) => c.status === 'outage') ||
    codexIncidents.some((i) => i.impact === 'major' || i.impact === 'critical');
  const hasDegraded = codexComponents.some((c) => c.status === 'degraded') ||
    codexIncidents.some((i) => i.impact === 'minor');

  const status = hasOutage ? 'outage' : hasDegraded ? 'degraded' : 'operational';
  const statusDescription = status === 'operational'
    ? 'All Codex services operational'
    : hasOutage
    ? 'Codex service outage'
    : 'Codex performance degraded';

  return {
    status,
    statusDescription,
    indicator: hasOutage ? 'critical' : hasDegraded ? 'minor' : 'none',
    updatedAt: baseStatus.updatedAt,
    incidents: codexIncidents,
    components: codexComponents.length > 0 ? codexComponents : [
      { id: 'codex-api', name: 'Codex API', status: 'operational' },
      { id: 'codex-web', name: 'Codex Web', status: 'operational' },
    ],
  };
}

export function normalizeApiHealth(data, provider) {
  const isHealthy = Boolean(
    data?.operational ||
    data?.httpStatus === 200 ||
    data?.httpStatus === 401 ||
    data?.httpStatus === 429 ||
    (!data?.error && typeof data === 'object')
  );

  const status = isHealthy ? 'operational' : 'outage';
  const indicator = isHealthy ? 'none' : 'critical';

  let components = [];
  if (provider?.id === 'mistral') {
    components = [
      { id: 'mistral-api', name: 'Mistral API (api.mistral.ai)', status: isHealthy ? 'operational' : 'outage' },
      { id: 'mistral-chat', name: 'Le Chat & Model Gateway', status: isHealthy ? 'operational' : 'outage' },
      { id: 'mistral-platform', name: 'La Plateforme Developer Console', status: isHealthy ? 'operational' : 'outage' },
    ];
  } else if (provider?.id === 'xai') {
    components = [
      { id: 'xai-api', name: 'Grok API (api.x.ai)', status: isHealthy ? 'operational' : 'outage' },
      { id: 'xai-platform', name: 'xAI Console & Auth Gateway', status: isHealthy ? 'operational' : 'outage' },
    ];
  } else {
    components = [
      { id: `${provider?.id}-api`, name: 'Public API Gateway', status: isHealthy ? 'operational' : 'outage' },
    ];
  }

  return {
    status,
    statusDescription: isHealthy ? 'All Systems Operational' : 'Service Disruption Detected',
    indicator,
    updatedAt: new Date().toISOString(),
    incidents: [],
    components,
  };
}

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

export function normalizeStatus(provider, rawData) {
  if (!rawData) {
    return createUnknownState();
  }

  switch (provider.adapter) {
    case 'statuspage':
      return normalizeStatuspage(rawData, provider);

    case 'openai-codex':
      return normalizeOpenAiCodex(rawData);

    case 'betterstack-badge':
      return normalizeBetterstackBadge(rawData);

    case 'gcp-json':
      return normalizeGcpJson(rawData);

    case 'stripe-json':
      return normalizeStripeJson(rawData);

    case 'statusio-json':
      return normalizeStatusioJson(rawData);

    case 'aws-json':
      return normalizeAwsJson(rawData);

    case 'api-health':
      return normalizeApiHealth(rawData, provider);

    default:
      if (rawData.status?.indicator) {
        return normalizeStatuspage(rawData);
      }
      return createUnknownState('Provider format in development');
  }
}
