const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': 'Bearer ' + SERVICE_KEY,
  'Content-Type': 'application/json'
};

async function main() {
  const report = [];
  report.push('# EDUNODE ANALYTICS - DATABASE SCHEMA');
  report.push('# Generated: ' + new Date().toISOString());
  report.push('# Supabase: ' + SUPABASE_URL);
  report.push('');

  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/', {
      headers: { ...headers, 'Accept': 'application/openapi+json' }
    });

    if (res.ok) {
      const schema = await res.json();
      const defs = schema.definitions || {};
      const tableNames = Object.keys(defs).sort();

      report.push('## TABLES (' + tableNames.length + ' found)');
      report.push('');

      for (const name of tableNames) {
        const props = defs[name].properties || {};
        const required = defs[name].required || [];
        const cols = Object.entries(props).sort(([a],[b]) => a.localeCompare(b));

        report.push('### ' + name + ' (' + cols.length + ' columns)');
        for (const [col, def] of cols) {
          const type = def.format || def.type || 'unknown';
          const nullable = required.includes(col) ? 'NOT NULL' : 'NULL';
          report.push('  ' + col.padEnd(35) + type.padEnd(20) + nullable);
        }
        report.push('');
      }
    } else {
      report.push('## SCHEMA FETCH FAILED: HTTP ' + res.status);
    }
  } catch (err) {
    report.push('## SCHEMA FETCH ERROR: ' + err.message);
  }

  report.push('');
  report.push('## ROW COUNTS');
  const tables = [
    'schools', 'students', 'enrollments', 'interventions',
    'notifications', 'audit_logs', 'data_sources', 'sync_logs',
    'users', 'profiles', 'risk_model_configs', 'student_metrics',
    'student_metric_history', 'risk_evaluations', 'risk_alerts'
  ];

  for (const table of tables) {
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/' + table + '?select=count',
        { headers: { ...headers, 'Prefer': 'count=estimated' }, method: 'HEAD' }
      );
      if (res.ok) {
        const range = res.headers.get('content-range') || '?';
        report.push('  ' + table.padEnd(30) + range);
      } else {
        report.push('  ' + table.padEnd(30) + 'NOT FOUND (HTTP ' + res.status + ')');
      }
    } catch (e) {
      report.push('  ' + table.padEnd(30) + 'ERROR: ' + e.message);
    }
  }

  report.push('');
  report.push('## RISK ENGINE TABLE STATUS');
  const riskTables = [
    'risk_model_configs', 'student_metrics', 'student_metric_history',
    'risk_evaluations', 'risk_alerts'
  ];
  for (const t of riskTables) {
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/' + t + '?limit=0', { headers });
      const icon = res.ok ? '[EXISTS]' : '[MISSING]';
      report.push('  ' + icon + ' ' + t);
    } catch (e) {
      report.push('  [MISSING] ' + t);
    }
  }

  console.log(report.join('\n'));
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });