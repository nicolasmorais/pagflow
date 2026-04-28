const fs = require('fs');
const path = 'src/app/checkout/CheckoutForm.tsx';

let content = fs.readFileSync(path, 'utf8');

// Correções de caracteres corrompidos comuns vistos no screenshot
const map = {
    'informaÃ§Ãµes': 'informações',
    'bÃ¡sicas': 'básicas',
    'informaes': 'informações',
    'bǭsicas': 'básicas',
    'GRÃ€TIS': 'GRÁTIS',
    'Envio RÃ¡pido': 'Envio Rápido',
    'DevoluÃ§Ãµes': 'Devoluções',
    'não': 'não', // Garantir que 'não' está ok
    'Ã£o': 'ão',
    'Ã§': 'ç',
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ãº': 'ú',
    'â€': '—',
    'Ã': 'Á',
    'Â': '', // Remover artefatos de encoding
};

// Iterar várias vezes para casos aninhados se houver
for (const [bad, good] of Object.entries(map)) {
    content = content.split(bad).join(good);
}

// Fix específicos do screenshot
content = content.replace(/Passo 1 â€/g, 'Passo 1 —');
content = content.replace(/â†’/g, '→');

fs.writeFileSync(path, content, 'utf8');
console.log('Encoding fixed for CheckoutForm.tsx');
