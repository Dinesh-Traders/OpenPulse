/**
 * OpenPulse — GitHub Labels Setup Script
 *
 * Usage:
 *   GITHUB_TOKEN=your_token ORG=Dinesh-Traders REPO=OpenPulse node scripts/setup-labels.js
 *
 * This script creates all required labels on the repository.
 * Existing labels with the same name will be updated.
 */

const TOKEN = process.env.GITHUB_TOKEN;
const ORG   = process.env.ORG   || 'Dinesh-Traders';
const REPO  = process.env.REPO  || 'OpenPulse';

if (!TOKEN) {
  console.error('ERROR: GITHUB_TOKEN env var is required.');
  process.exit(1);
}

const LABELS = [
  // Difficulty
  { name: 'good first issue',  color: '7057ff', description: 'Good for newcomers' },
  { name: 'help wanted',       color: '008672', description: 'Extra attention is needed' },
  { name: 'intermediate',      color: 'e4e669', description: 'Some experience required' },
  { name: 'advanced',          color: 'd93f0b', description: 'Requires deep knowledge' },

  // Type
  { name: 'bug',               color: 'd73a4a', description: 'Something is not working' },
  { name: 'feature',           color: 'a2eeef', description: 'New feature or request' },
  { name: 'docs',              color: '0075ca', description: 'Improvements to documentation' },
  { name: 'chore',             color: 'e4e669', description: 'Maintenance or tooling task' },
  { name: 'refactor',          color: 'f9d0c4', description: 'Code restructuring, no behavior change' },
  { name: 'test',              color: 'bfd4f2', description: 'Adding or fixing tests' },

  // Area
  { name: 'frontend',          color: '1d76db', description: 'HTML, CSS, JavaScript UI' },
  { name: 'backend',           color: '0e8a16', description: 'FastAPI, Python server' },
  { name: 'database',          color: 'b60205', description: 'PostgreSQL, migrations' },
  { name: 'devops',            color: 'c2e0c6', description: 'CI/CD, Docker, deployment' },
  { name: 'design',            color: 'e99695', description: 'UI/UX design' },

  // Status
  { name: 'needs-triage',      color: 'ededed', description: 'Needs maintainer review' },
  { name: 'blocked',           color: 'b60205', description: 'Blocked by another issue or PR' },
  { name: 'in-review',         color: 'fbca04', description: 'Currently being reviewed' },
  { name: 'claimed',           color: '006b75', description: 'Someone is working on this' },
  { name: 'stale',             color: 'cccccc', description: 'No activity for 14+ days' },

  // Priority
  { name: 'p0',                color: 'b60205', description: 'Critical — must be in next release' },
  { name: 'p1',                color: 'e4e669', description: 'High priority' },
  { name: 'p2',                color: 'c5def5', description: 'Nice to have' },

  // Special
  { name: 'security',          color: 'e11d48', description: 'Security-related issue' },
  { name: 'pinned',            color: '0075ca', description: 'Pinned — do not mark stale' },
  { name: 'hacktoberfest',     color: 'ff6600', description: 'Valid for Hacktoberfest' },
];

const BASE = `https://api.github.com/repos/${ORG}/${REPO}/labels`;
const HEADERS = {
  'Authorization': `Bearer ${TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'Content-Type': 'application/json',
  'X-GitHub-Api-Version': '2022-11-28',
};

async function upsertLabel(label) {
  // Try to create first
  const createRes = await fetch(BASE, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(label),
  });

  if (createRes.status === 201) {
    console.log(`  created : ${label.name}`);
    return;
  }

  if (createRes.status === 422) {
    // Already exists — update it
    const updateRes = await fetch(`${BASE}/${encodeURIComponent(label.name)}`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify(label),
    });
    if (updateRes.ok) {
      console.log(`  updated : ${label.name}`);
    } else {
      const err = await updateRes.json();
      console.error(`  FAILED  : ${label.name} — ${err.message}`);
    }
    return;
  }

  const err = await createRes.json();
  console.error(`  FAILED  : ${label.name} — ${err.message}`);
}

async function main() {
  console.log(`\nSetting up ${LABELS.length} labels on ${ORG}/${REPO}\n`);
  for (const label of LABELS) {
    await upsertLabel(label);
  }
  console.log('\nDone.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
