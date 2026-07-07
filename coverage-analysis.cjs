const cov = require('./coverage/coverage-final.json');
const sep = /\/|\/;
const comps = Object.entries(cov)
  .filter(function(e){ return e[0].indexOf('components') > -1 && e[0].indexOf('providers') === -1; })
  .map(function(e){
    const f = e[0], d = e[1];
    const total = Object.keys(d.s).length;
    const covered = Object.values(d.s).filter(Boolean).length;
    return { name: f.split(sep).pop(), total: total, covered: covered };
  });
const totLines = comps.reduce(function(s,c){ return s+c.total; }, 0);
const covLines = comps.reduce(function(s,c){ return s+c.covered; }, 0);
console.log('total stmts:', totLines, 'covered:', covLines, 'pct:', Math.round(covLines/totLines*100)+'%');
console.log('need for 60%:', Math.round(totLines*0.6-covLines), 'more stmts');
comps.filter(function(c){ return c.covered===0; }).sort(function(a,b){ return a.total-b.total; }).forEach(function(c){ console.log(c.total+'\t'+c.name); });
