const fs = require('fs');
const path = 'src/app/checkout/CheckoutForm.tsx';

let content = fs.readFileSync(path, 'utf8');

// Replace common HTML entities that were causing issues
const replacements = [
    { from: /&#243;/g, to: 'ó' },
    { from: /&#233;/g, to: 'é' },
    { from: /&#225;/g, to: 'á' },
    { from: /&#234;/g, to: 'ê' },
    { from: /&#231;/g, to: 'ç' },
    { from: /&#227;/g, to: 'ã' },
    { from: /&#250;/g, to: 'ú' },
    { from: /&#9200;/g, to: '⏰' },
    { from: /&#8212;/g, to: '—' },
    { from: /&#8226;/g, to: '•' },
    { from: /&#10003;/g, to: '✓' },
    { from: /&#195;/g, to: 'Ã' },
    { from: /&#211;/g, to: 'Ó' },
];

replacements.forEach(r => {
    content = content.replace(r.from, r.to);
});

fs.writeFileSync(path, content, 'utf8');
console.log('CheckoutForm.tsx cleaned and fixed safely.');
