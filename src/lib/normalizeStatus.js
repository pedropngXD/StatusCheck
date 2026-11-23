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
    (typeof data === 'string' && data.trim().length > 0) ||
    (!data?.error && typeof data === 'object' && data !== null)
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
  } else if (provider?.id === 'nuget') {
    components = [
      { id: 'nuget-v3', name: 'NuGet V3 Service Index', status: isHealthy ? 'operational' : 'outage' },
      { id: 'nuget-restore', name: 'Package Restore & Search API', status: isHealthy ? 'operational' : 'outage' },
    ];
  } else if (provider?.id === 'packagist') {
    components = [
      { id: 'packagist-api', name: 'Packagist Registry API', status: isHealthy ? 'operational' : 'outage' },
      { id: 'packagist-meta', name: 'Composer Package Metadata', status: isHealthy ? 'operational' : 'outage' },
    ];
  } else if (provider?.id === 'go-proxy') {
    components = [
      { id: 'go-proxy-main', name: 'Go Module Proxy (proxy.golang.org)', status: isHealthy ? 'operational' : 'outage' },
      { id: 'go-sumdb', name: 'Checksum Database & Index', status: isHealthy ? 'operational' : 'outage' },
    ];
  } else if (provider?.id === 'pub-dev') {
    components = [
      { id: 'pub-dev-api', name: 'pub.dev Package API', status: isHealthy ? 'operational' : 'outage' },
      { id: 'pub-dev-cdn', name: 'Dart & Flutter Package Archive', status: isHealthy ? 'operational' : 'outage' },
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

const DAY_MS = 24 * 60 * 60 * 1000;

function matchesKeyword(haystack, rawKeyword) {
  const kw = rawKeyword.toLowerCase();
  if (!kw) return false;
  const trimmed = kw.trim();
  if (kw !== trimmed || trimmed.includes(' ')) {
    return haystack.includes(kw);
  }
  const startsAlnum = /^[a-z0-9]/.test(trimmed);
  const endsAlnum = /[a-z0-9]$/.test(trimmed);
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = `${startsAlnum ? '(?<![a-z0-9])' : ''}${escaped}${endsAlnum ? '(?![a-z0-9])' : ''}`;
  return new RegExp(pattern, 'i').test(haystack);
}

function extractCveAdvisories(data) {
  if (Array.isArray(data?.advisories)) {
    return data.advisories;
  }
  if (Array.isArray(data)) {
    return data.map((a) => ({
      id: a.cve_id || a.ghsa_id,
      cveId: a.cve_id || null,
      ghsaId: a.ghsa_id || null,
      severity: (a.severity || 'high').toLowerCase(),
      isKev: false,
      source: 'github',
      publishedAt: a.published_at || a.updated_at || new Date().toISOString(),
      summary: (a.summary || a.description || '').slice(0, 240),
      url: a.html_url || (a.cve_id ? `https://nvd.nist.gov/vuln/detail/${a.cve_id}` : 'https://github.com/advisories'),
      ecosystems: Array.from(
        new Set((a.vulnerabilities || []).map((v) => v.package?.ecosystem?.toLowerCase()).filter(Boolean))
      ),
      packages: Array.from(
        new Set((a.vulnerabilities || []).map((v) => v.package?.name).filter(Boolean))
      ).slice(0, 5),
    }));
  }
  return null;
}

function matchesLanguageCve(adv, cfg) {
  const ecosystems = cfg?.ecosystems || [];
  const keywords = cfg?.keywords || [];
  const haystack = `${adv.summary || ''} ${(adv.packages || []).join(' ')}`.toLowerCase();
  const kwMatch = keywords.some((kw) => matchesKeyword(haystack, kw));

  if (ecosystems.length > 0) {
    const ecoMatch = (adv.ecosystems || []).some((e) => ecosystems.includes(e));
    if (cfg?.requireKeywordWithEcosystem) {
      return (ecoMatch && kwMatch) || (Boolean(adv.isKev) && kwMatch);
    }
    return ecoMatch || ((adv.ecosystems || []).length === 0 && kwMatch);
  }

  return kwMatch;
}

function mapAdvisoryToIncident(adv) {
  const tag = adv.isKev ? 'CISA KEV' : (adv.severity || 'HIGH').toUpperCase();
  const code = adv.cveId || adv.ghsaId || adv.id;
  const pkg = adv.packages?.[0] ? ` — ${adv.packages[0]}` : '';
  return {
    id: String(adv.id),
    name: `[${tag}] ${code}${pkg}`,
    status: adv.isKev ? 'actively_exploited' : (adv.severity || 'high'),
    impact: adv.isKev || adv.severity === 'critical' ? 'critical' : 'minor',
    updatedAt: adv.publishedAt || new Date().toISOString(),
    message: adv.summary || 'Security advisory published.',
    url: adv.url,
  };
}

export function normalizeCveFeed(data, provider) {
  const advisories = extractCveAdvisories(data);
  if (!advisories) {
    return createUnknownState('Invalid CVE feed data');
  }

  const cfg = provider?.cveConfig || {};
  const matched = advisories.filter((adv) => matchesLanguageCve(adv, cfg));
  const now = Date.now();

  const ageOf = (adv) => {
    const t = new Date(adv.publishedAt).getTime();
    return Number.isFinite(t) ? Math.max(0, now - t) : Number.MAX_SAFE_INTEGER;
  };

  const kev30d = matched.filter((a) => a.isKev);
  const crit3d = matched.filter((a) => a.severity === 'critical' && ageOf(a) <= 3 * DAY_MS);
  const crit7d = matched.filter((a) => a.severity === 'critical' && ageOf(a) <= 7 * DAY_MS);
  const high3d = matched.filter((a) => a.severity === 'high' && ageOf(a) <= 3 * DAY_MS);
  const high7d = matched.filter((a) => a.severity === 'high' && ageOf(a) <= 7 * DAY_MS);

  let status = 'operational';
  let indicator = 'none';
  let activeList = [];

  if (kev30d.length > 0 || crit3d.length > 0) {
    status = 'outage';
    indicator = 'critical';
    activeList = [...kev30d, ...crit3d, ...high3d];
  } else if (crit7d.length > 0 || high3d.length > 0) {
    status = 'degraded';
    indicator = 'minor';
    activeList = [...crit7d, ...high3d];
  }

  const uniqueMap = new Map();
  for (const adv of activeList) {
    if (!uniqueMap.has(adv.id)) {
      uniqueMap.set(adv.id, adv);
    }
  }
  const incidents = Array.from(uniqueMap.values()).slice(0, 15).map(mapAdvisoryToIncident);

  const components = [
    {
      id: `${provider.id}-kev`,
      name: `CISA KEV (30d): ${kev30d.length}`,
      status: kev30d.length > 0 ? 'outage' : 'operational',
    },
    {
      id: `${provider.id}-crit`,
      name: `Critical CVEs (7d): ${crit7d.length}`,
      status: crit3d.length > 0 ? 'outage' : crit7d.length > 0 ? 'degraded' : 'operational',
    },
    {
      id: `${provider.id}-high`,
      name: `High CVEs (7d): ${high7d.length}`,
      status: high3d.length > 0 ? 'degraded' : 'operational',
    },
  ];

  const statusDescription =
    status === 'operational'
      ? 'No critical or high CVEs in the last 72h'
      : `${crit7d.length} critical / ${high7d.length} high recent CVEs detected`;

  return {
    status,
    statusDescription,
    indicator,
    updatedAt: data.fetchedAt || new Date().toISOString(),
    incidents,
    components,
  };
}

export function normalizeCisaKev(data) {
  const advisories = extractCveAdvisories(data);
  if (!advisories) {
    return createUnknownState('Invalid CISA KEV feed data');
  }

  const kevList = advisories.filter((a) => a.isKev || a.source === 'cisa-kev');
  const now = Date.now();
  const ageOf = (adv) => {
    const t = new Date(adv.publishedAt).getTime();
    return Number.isFinite(t) ? Math.max(0, now - t) : Number.MAX_SAFE_INTEGER;
  };

  const kev3d = kevList.filter((a) => ageOf(a) <= 3 * DAY_MS);
  const kev7d = kevList.filter((a) => ageOf(a) <= 7 * DAY_MS);

  let status = 'operational';
  let indicator = 'none';
  if (kev3d.length > 0) {
    status = 'outage';
    indicator = 'critical';
  } else if (kev7d.length > 0) {
    status = 'degraded';
    indicator = 'minor';
  }

  const incidents = kev7d.slice(0, 15).map(mapAdvisoryToIncident);

  const components = [
    { id: 'kev-3d', name: `Added last 3d: ${kev3d.length}`, status: kev3d.length > 0 ? 'outage' : 'operational' },
    { id: 'kev-7d', name: `Added last 7d: ${kev7d.length}`, status: kev7d.length > 0 ? 'degraded' : 'operational' },
    { id: 'kev-30d', name: `Added last 30d: ${kevList.length}`, status: 'operational' },
  ];

  return {
    status,
    statusDescription:
      kev7d.length === 0
        ? 'No new actively exploited CVEs added in the last 7 days'
        : `${kev7d.length} actively exploited CVE(s) added to CISA KEV in the last 7 days`,
    indicator,
    updatedAt: data.fetchedAt || new Date().toISOString(),
    incidents,
    components,
  };
}

export function normalizeM365Json(data, provider) {
  if (!Array.isArray(data)) {
    return createUnknownState('Unexpected format for Microsoft 365');
  }

  const workload = (provider?.workload || '').toLowerCase();
  const item =
    data.find((entry) => (entry.ServiceWorkloadName || '').toLowerCase() === workload) ||
    data.find((entry) => (entry.ServiceDisplayName || '').toLowerCase().includes(workload));

  if (!item) {
    return createUnknownState('Microsoft workload not found in feed');
  }

  const rawStatus = (item.Status || '').toLowerCase();
  let status = 'operational';
  let indicator = 'none';

  if (rawStatus === 'operational') {
    status = 'operational';
    indicator = 'none';
  } else if (rawStatus.includes('interruption') || rawStatus.includes('outage') || rawStatus.includes('down') || rawStatus.includes('unavailable')) {
    status = 'outage';
    indicator = 'critical';
  } else if (rawStatus.includes('degrad') || rawStatus.includes('advisory') || rawStatus.includes('issue') || rawStatus.includes('investigat')) {
    status = 'degraded';
    indicator = 'minor';
  } else {
    status = 'unknown';
    indicator = 'unknown';
  }

  const updatedAt =
    item.LastUpdatedTime && !String(item.LastUpdatedTime).startsWith('0001-')
      ? item.LastUpdatedTime
      : new Date().toISOString();

  const incidents = [];
  if (status !== 'operational' && (item.Title || item.Message)) {
    incidents.push({
      id: String(item.Id || `${provider.id}-incident`),
      name: item.Title || `${item.ServiceDisplayName || provider.name} ${item.Status}`,
      status: item.Status || 'active',
      impact: status === 'outage' ? 'critical' : 'minor',
      updatedAt,
      message: item.Message || '',
    });
  }

  const components = [
    {
      id: provider.id,
      name: item.ServiceDisplayName || provider.name,
      status,
    },
  ];

  return {
    status,
    statusDescription: item.Title || (status === 'operational' ? 'All Systems Operational' : `Microsoft 365 status: ${item.Status}`),
    indicator,
    updatedAt,
    incidents,
    components,
  };
}

export function normalizeGoogleWorkspaceJson(data) {
  if (!Array.isArray(data)) {
    return createUnknownState('Unexpected format for Google Workspace');
  }

  const now = Date.now();
  const activeIncidents = data.filter((inc) => {
    if (!inc.end) return true;
    const endTime = new Date(inc.end).getTime();
    return endTime > now;
  });

  const coreComponents = [
    { id: 'gws-gmail', name: 'Gmail', status: 'operational' },
    { id: 'gws-drive', name: 'Google Drive', status: 'operational' },
    { id: 'gws-meet', name: 'Google Meet', status: 'operational' },
    { id: 'gws-calendar', name: 'Google Calendar', status: 'operational' },
    { id: 'gws-docs', name: 'Google Docs & Sheets', status: 'operational' },
  ];

  if (activeIncidents.length === 0) {
    return {
      status: 'operational',
      statusDescription: 'All Google Workspace services operating normally',
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
    name: inc.external_desc || inc.service_name || 'Google Workspace Incident',
    status: inc.status_impact || 'active',
    impact: hasOutage ? 'major' : 'minor',
    updatedAt: inc.modified || inc.begin || new Date().toISOString(),
    message: inc.most_recent_update?.text || '',
  }));

  const components = coreComponents.map((c) => {
    const matching = activeIncidents.some((inc) => {
      const affected = (inc.affected_products || []).map((p) => (p.title || '').toLowerCase()).join(' ');
      return (
        (inc.service_name || '').toLowerCase().includes(c.name.split(' ').pop().toLowerCase()) ||
        affected.includes(c.name.split(' ').pop().toLowerCase())
      );
    });
    return {
      ...c,
      status: matching ? status : 'operational',
    };
  });

  return {
    status,
    statusDescription: `${activeIncidents.length} active incident(s) ongoing`,
    indicator,
    updatedAt: activeIncidents[0]?.modified || new Date().toISOString(),
    incidents,
    components,
  };
}

export function normalizeAppleJson(data) {
  let parsed = data;
  if (typeof data === 'string') {
    const trimmed = data.trim();
    const unwrapped = trimmed.replace(/^[a-zA-Z0-9_$.]+\(\s*/, '').replace(/\s*\);?\s*$/, '');
    try {
      parsed = JSON.parse(unwrapped);
    } catch {
      return createUnknownState('Invalid JSONP data from Apple System Status');
    }
  }

  if (!parsed || !Array.isArray(parsed.services)) {
    return createUnknownState('Unexpected format for Apple System Status');
  }

  const incidents = [];
  let hasOutage = false;
  let hasDegraded = false;

  const serviceComponents = parsed.services.map((svc, idx) => {
    const activeEvents = (svc.events || []).filter(
      (ev) => !ev.eventStatus || ev.eventStatus.toLowerCase() === 'ongoing' || !ev.endDate
    );

    let compStatus = 'operational';
    for (const ev of activeEvents) {
      const type = (ev.statusType || '').toLowerCase();
      if (type === 'outage') {
        compStatus = 'outage';
        hasOutage = true;
      } else {
        if (compStatus !== 'outage') compStatus = 'degraded';
        hasDegraded = true;
      }

      incidents.push({
        id: `${svc.serviceName}-${ev.messageId || ev.startDate || idx}`,
        name: `${svc.serviceName}: ${ev.statusType || 'Issue'}`,
        status: ev.eventStatus || 'ongoing',
        impact: type === 'outage' ? 'critical' : 'minor',
        updatedAt: ev.datePosted || ev.startDate || new Date().toISOString(),
        message: ev.message || ev.usersAffected || 'Ongoing service issue.',
      });
    }

    return {
      id: `apple-${idx}`,
      name: svc.serviceName,
      status: compStatus,
    };
  });

  const priorityNames = new Set([
    'App Store',
    'iCloud',
    'iCloud Drive',
    'iCloud Mail',
    'iMessage',
    'FaceTime',
    'Apple Music',
    'Apple Pay & Wallet',
    'Find My',
    'Apple ID',
    'Apple TV+',
    'Photos',
  ]);

  const prioritized = serviceComponents
    .sort((a, b) => {
      const aActive = a.status !== 'operational' ? 0 : priorityNames.has(a.name) ? 1 : 2;
      const bActive = b.status !== 'operational' ? 0 : priorityNames.has(b.name) ? 1 : 2;
      if (aActive !== bActive) return aActive - bActive;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 24);

  const status = hasOutage ? 'outage' : hasDegraded ? 'degraded' : 'operational';
  const indicator = hasOutage ? 'critical' : hasDegraded ? 'minor' : 'none';

  return {
    status,
    statusDescription:
      status === 'operational'
        ? 'All Apple & iCloud Services Operational'
        : `${incidents.length} active Apple service ${incidents.length === 1 ? 'event' : 'events'}`,
    indicator,
    updatedAt: new Date().toISOString(),
    incidents,
    components: prioritized,
  };
}

export function normalizeSlackJson(data) {
  if (!data || typeof data !== 'object') {
    return createUnknownState('Invalid data from Slack');
  }

  const activeIncidents = Array.isArray(data.active_incidents) ? data.active_incidents : [];
  let status = 'operational';
  let indicator = 'none';

  if (data.status !== 'ok' || activeIncidents.length > 0) {
    const hasOutage = activeIncidents.some((inc) => (inc.type || '').toLowerCase() === 'outage');
    status = hasOutage ? 'outage' : 'degraded';
    indicator = hasOutage ? 'critical' : 'minor';
  }

  const incidents = activeIncidents.map((inc) => ({
    id: String(inc.id || inc.title),
    name: inc.title || 'Slack Incident',
    status: inc.status || 'active',
    impact: (inc.type || '').toLowerCase() === 'outage' ? 'critical' : 'minor',
    updatedAt: inc.date_updated || inc.date_created || data.date_updated || new Date().toISOString(),
    message: inc.notes?.[0]?.body || '',
    url: inc.url,
  }));

  const affectedLower = activeIncidents
    .flatMap((inc) => inc.services || [])
    .map((s) => String(s).toLowerCase());

  const checkComponent = (keywords) => {
    if (status === 'operational') return 'operational';
    if (affectedLower.length === 0) return status;
    return affectedLower.some((s) => keywords.some((kw) => s.includes(kw))) ? status : 'operational';
  };

  const components = [
    { id: 'slack-messaging', name: 'Messaging', status: checkComponent(['messag']) },
    { id: 'slack-huddles', name: 'Huddles & Calls', status: checkComponent(['huddle', 'call']) },
    { id: 'slack-apps', name: 'Apps, Integrations & Workflows', status: checkComponent(['app', 'workflow', 'api']) },
    { id: 'slack-files', name: 'Files & Search', status: checkComponent(['file', 'search']) },
  ];

  return {
    status,
    statusDescription:
      status === 'operational'
        ? 'Slack is up and running'
        : `${activeIncidents.length} active incident(s)`,
    indicator,
    updatedAt: data.date_updated || new Date().toISOString(),
    incidents,
    components,
  };
}

export function normalizeHerokuJson(data) {
  if (!data || !Array.isArray(data.status)) {
    return createUnknownState('Invalid data from Heroku');
  }

  const mapColor = (c) => {
    const val = (c || '').toLowerCase();
    if (val === 'green') return 'operational';
    if (val === 'red') return 'outage';
    if (val === 'yellow' || val === 'blue') return 'degraded';
    return 'unknown';
  };

  const components = data.status.map((item) => ({
    id: `heroku-${(item.system || '').toLowerCase().replace(/\s+/g, '-')}`,
    name: item.system || 'System',
    status: mapColor(item.status),
  }));

  const hasOutage = components.some((c) => c.status === 'outage');
  const hasDegraded = components.some((c) => c.status === 'degraded');
  const status = hasOutage ? 'outage' : hasDegraded ? 'degraded' : 'operational';
  const indicator = hasOutage ? 'critical' : hasDegraded ? 'minor' : 'none';

  const rawIncidents = Array.isArray(data.incidents) ? data.incidents : [];
  const incidents = rawIncidents.map((inc) => ({
    id: String(inc.id || inc.title),
    name: inc.title || 'Heroku Incident',
    status: inc.state || 'open',
    impact: hasOutage ? 'critical' : 'minor',
    updatedAt: inc.updated_at || inc.created_at || new Date().toISOString(),
    message: inc.updates?.[0]?.contents || '',
    url: inc.full_url,
  }));

  return {
    status,
    statusDescription:
      status === 'operational'
        ? 'All Systems Operational'
        : `${incidents.length || 1} active Heroku issue(s)`,
    indicator,
    updatedAt: new Date().toISOString(),
    incidents,
    components,
  };
}

export function normalizeNetflixHealth(data, provider) {
  if (typeof data === 'object' && data !== null) {
    return normalizeApiHealth(data, provider);
  }

  const html = typeof data === 'string' ? data.toLowerCase() : '';
  if (!html) {
    return createUnknownState('No response from Netflix status page');
  }

  const hasOutage =
    html.includes('currently experiencing an issue') ||
    html.includes('experiencing an outage') ||
    html.includes('currently down') ||
    html.includes('service disruption');

  const isUp = !hasOutage && (html.includes('netflix is up') || html.length > 200);
  const status = hasOutage ? 'outage' : isUp ? 'operational' : 'unknown';

  return {
    status,
    statusDescription: hasOutage
      ? 'Netflix is experiencing a streaming disruption'
      : isUp
      ? 'Netflix is up'
      : 'Status currently unavailable',
    indicator: hasOutage ? 'critical' : isUp ? 'none' : 'unknown',
    updatedAt: new Date().toISOString(),
    incidents: hasOutage
      ? [
          {
            id: 'netflix-outage',
            name: 'Netflix Streaming Disruption',
            status: 'active',
            impact: 'critical',
            updatedAt: new Date().toISOString(),
            message: 'Netflix Help Center reports an ongoing service interruption.',
          },
        ]
      : [],
    components: [
      { id: 'netflix-streaming', name: 'Streaming Playback', status },
      { id: 'netflix-apps', name: 'Web & TV Apps', status },
      { id: 'netflix-auth', name: 'Account & Auth', status },
    ],
  };
}

export function normalizeAzureRss(xmlData) {
  if (typeof xmlData !== 'string' || (!xmlData.includes('<rss') && !xmlData.includes('<channel'))) {
    return createUnknownState('Unexpected format for Azure Status');
  }

  const extractTag = (block, tag) => {
    const match = block.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    if (!match) return '';
    return match[1]
      .replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i, '$1')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  };

  const items = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xmlData)) !== null) {
    const block = match[1];
    const title = extractTag(block, 'title');
    const description = extractTag(block, 'description');
    const pubDate = extractTag(block, 'pubDate');
    const link = extractTag(block, 'link');
    items.push({ title, description, pubDate, link });
  }

  const coreComponents = [
    { id: 'azure-compute', name: 'Azure Compute & VMs', status: 'operational' },
    { id: 'azure-app', name: 'Azure App Service & Functions', status: 'operational' },
    { id: 'azure-sql', name: 'Azure SQL & Cosmos DB', status: 'operational' },
    { id: 'azure-storage', name: 'Azure Storage & Networking', status: 'operational' },
    { id: 'azure-ai', name: 'Azure AI & OpenAI Service', status: 'operational' },
  ];

  if (items.length === 0) {
    return {
      status: 'operational',
      statusDescription: 'All Azure services operating normally',
      indicator: 'none',
      updatedAt: new Date().toISOString(),
      incidents: [],
      components: coreComponents,
    };
  }

  const hasOutage = items.some((it) => {
    const txt = `${it.title} ${it.description}`.toLowerCase();
    return txt.includes('outage') || txt.includes('unavailable') || txt.includes('down');
  });

  const status = hasOutage ? 'outage' : 'degraded';
  const indicator = hasOutage ? 'critical' : 'minor';

  const incidents = items.map((it, idx) => {
    const parsedDate = it.pubDate ? new Date(it.pubDate) : null;
    const updatedAt = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();
    return {
      id: it.link || `azure-${idx}`,
      name: it.title || 'Azure Service Incident',
      status: 'active',
      impact: hasOutage ? 'critical' : 'minor',
      updatedAt,
      message: it.description || '',
      url: it.link || undefined,
    };
  });

  const components = coreComponents.map((c) => ({
    ...c,
    status,
  }));

  return {
    status,
    statusDescription: `${items.length} active Azure ${items.length === 1 ? 'incident' : 'incidents'} reported`,
    indicator,
    updatedAt: incidents[0]?.updatedAt || new Date().toISOString(),
    incidents,
    components,
  };
}

export function normalizeFirebaseJson(data) {
  if (!Array.isArray(data)) {
    return createUnknownState('Unexpected format for Firebase');
  }

  const now = Date.now();
  const activeIncidents = data.filter((inc) => {
    if (!inc.end) return true;
    const endTime = new Date(inc.end).getTime();
    return endTime > now;
  });

  const coreComponents = [
    { id: 'fb-firestore', name: 'Cloud Firestore', status: 'operational' },
    { id: 'fb-auth', name: 'Firebase Authentication', status: 'operational' },
    { id: 'fb-functions', name: 'Cloud Functions', status: 'operational' },
    { id: 'fb-hosting', name: 'Firebase Hosting', status: 'operational' },
    { id: 'fb-rtdb', name: 'Realtime Database', status: 'operational' },
  ];

  if (activeIncidents.length === 0) {
    return {
      status: 'operational',
      statusDescription: 'All Firebase services operating normally',
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
    name: inc.external_desc || inc.service_name || 'Firebase Incident',
    status: inc.status_impact || 'active',
    impact: hasOutage ? 'major' : 'minor',
    updatedAt: inc.modified || inc.begin || new Date().toISOString(),
    message: inc.most_recent_update?.text || '',
  }));

  const components = coreComponents.map((c) => {
    const keyword = c.name.split(' ').pop().toLowerCase();
    const matching = activeIncidents.some((inc) => {
      const affected = (inc.affected_products || []).map((p) => (p.title || '').toLowerCase()).join(' ');
      return (inc.service_name || '').toLowerCase().includes(keyword) || affected.includes(keyword);
    });
    return {
      ...c,
      status: matching ? status : 'operational',
    };
  });

  return {
    status,
    statusDescription: `${activeIncidents.length} active incident(s) ongoing`,
    indicator,
    updatedAt: activeIncidents[0]?.modified || new Date().toISOString(),
    incidents,
    components,
  };
}

export function normalizeInstatusJson(data, provider) {
  if (!data || !data.page) {
    return createUnknownState('Invalid data from Instatus');
  }

  const pageStatus = (data.page.status || '').toUpperCase();
  const rawIncidents = Array.isArray(data.activeIncidents) ? data.activeIncidents : [];
  const rawMaint = Array.isArray(data.activeMaintenances) ? data.activeMaintenances : [];

  let status = 'unknown';
  let indicator = 'unknown';

  if (pageStatus === 'UP') {
    status = 'operational';
    indicator = 'none';
  } else if (pageStatus === 'UNDERMAINTENANCE') {
    status = 'degraded';
    indicator = 'minor';
  } else if (pageStatus === 'HASISSUES') {
    const isMinorOnly =
      rawIncidents.length > 0 &&
      rawIncidents.every((inc) => (inc.impact || '').toLowerCase() === 'minor');
    status = isMinorOnly ? 'degraded' : 'outage';
    indicator = isMinorOnly ? 'minor' : 'critical';
  }

  const incidents = [...rawIncidents, ...rawMaint].map((inc, idx) => {
    const impactRaw = (inc.impact || '').toLowerCase();
    const isMajor = impactRaw === 'major' || impactRaw === 'critical' || status === 'outage';
    return {
      id: String(inc.id || inc.name || idx),
      name: inc.name || `${provider?.name || 'Service'} Incident`,
      status: inc.status || 'active',
      impact: isMajor ? 'critical' : 'minor',
      updatedAt: inc.updatedAt || inc.started || new Date().toISOString(),
      message: inc.message || '',
      url: inc.url || data.page.url || undefined,
    };
  });

  const components = [
    {
      id: provider?.id || 'instatus-main',
      name: data.page.name || provider?.name || 'Core Service',
      status,
    },
  ];

  const statusDescription =
    status === 'operational'
      ? 'All Systems Operational'
      : pageStatus === 'UNDERMAINTENANCE'
      ? 'Scheduled Maintenance in Progress'
      : `${incidents.length || 1} active issue(s) reported`;

  return {
    status,
    statusDescription,
    indicator,
    updatedAt: new Date().toISOString(),
    incidents,
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

    case 'google-workspace-json':
      return normalizeGoogleWorkspaceJson(rawData);

    case 'azure-rss':
      return normalizeAzureRss(rawData);

    case 'firebase-json':
      return normalizeFirebaseJson(rawData);

    case 'instatus-json':
      return normalizeInstatusJson(rawData, provider);

    case 'stripe-json':
      return normalizeStripeJson(rawData);

    case 'statusio-json':
      return normalizeStatusioJson(rawData);

    case 'aws-json':
      return normalizeAwsJson(rawData);

    case 'api-health':
      return normalizeApiHealth(rawData, provider);

    case 'cve-feed':
      return normalizeCveFeed(rawData, provider);

    case 'cisa-kev':
      return normalizeCisaKev(rawData);

    case 'm365-json':
      return normalizeM365Json(rawData, provider);

    case 'apple-json':
      return normalizeAppleJson(rawData);

    case 'slack-json':
      return normalizeSlackJson(rawData);

    case 'heroku-json':
      return normalizeHerokuJson(rawData);

    case 'netflix-health':
      return normalizeNetflixHealth(rawData, provider);

    default:
      if (rawData.status?.indicator) {
        return normalizeStatuspage(rawData);
      }
      return createUnknownState('Provider format in development');
  }
}
