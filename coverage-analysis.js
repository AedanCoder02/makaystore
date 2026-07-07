const cov = require('./coverage/coverage-final.json');
const comps = Object.entries(cov)
  .filter(([f]) => f.indexOf('src') > -1 && f.indexOf('components') > -1 && f.indexOf('providers') === -1)
  .map(([f, d]) => {
    const total = Object.keys(d.s).length;
    const covered = Object.values(d.s).filter(Boolean).length;
    return { name: f.split(/[/\\]/).pop(), total, covered, pct: total ? Math.round(covered / total * 100) : 0 };
  });

const totLines = comps.reduce((s, c) => s + c.total, 0);
const covLines = comps.reduce((s, c) => s + c.covered, 0);
console.log('total stmts:', totLines, 'covered:', covLines, 'pct:', Math.round(covLines / totLines * 100) + '%');
console.log('need for 60%:', Math.round(totLines * 0.6 - covLines), 'more stmts');
console.log('\nZero-coverage components (sorted by size):');
comps.filter(c => c.pct === 0).sort((a, b) => a.total - b.total).forEach(c => {
  console.log(c.total + '\t' + c.name);
});
