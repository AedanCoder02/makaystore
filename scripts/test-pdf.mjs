import { htmlToPdf } from '../src/lib/pdf.ts';
import fs from 'fs';

const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="font-family:Arial;padding:40px;">
  <h1>Makay Beach Club</h1>
  <p>Test contract PDF generation.</p>
</body>
</html>
`;

console.log('Generating PDF...');
try {
  const buf = await htmlToPdf(html);
  fs.writeFileSync('test-output.pdf', buf);
  console.log('✓ PDF generated:', buf.length, 'bytes → test-output.pdf');
} catch (e) {
  console.error('✗ PDF generation failed:', e.message);
  console.error(e.stack);
}
