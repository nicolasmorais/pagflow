const fs = require('fs');

const path = 'src/app/checkout/CheckoutForm.tsx';
let buffer = fs.readFileSync(path);
let content = buffer.toString('utf8');

// Se o conteúdo tiver muitos caracteres de substituição, ele pode estar em outra codificação
// Mas como eu usei Set-Content UTF8 no PowerShell, ele provavelmente tem um BOM.
// Vamos remover o BOM se existir.
if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    buffer = buffer.slice(3);
    content = buffer.toString('utf8');
}

// Mapa de substituições para limpar a sujeira do PowerShell
const cleanMap = {
    'informaes': 'informações',
    'bsicas': 'básicas',
    'confirmao': 'confirmação',
    'atengo': 'atenção',
    'ateno': 'atenção',
    'aprovao': 'aprovação',
    'entregao': 'confirmação',
    'operao': 'operação',
    'emisso': 'emissão',
    'carto': 'cartão',
    'crdito': 'crédito',
    'disponvel': 'disponível',
    'necessrio': 'necessário',
    'ser': 'será',
    'voc': 'você',
    'aps': 'após',
    'confirmago': 'confirmação',
    'separago': 'separação',
    'at': 'até',
    'So Paulo': 'São Paulo',
    'h': 'há',
    'j': 'já',
    'Ã': 'Á', // Às vezes o Á vira Ã no mangling
};

// Aplicar limpeza
for (const [bad, good] of Object.entries(cleanMap)) {
    content = content.split(bad).join(good);
}

// Emojis específicos que vi no Select-String
content = content.replace(/s\?/g, '⚠️');
content = content.replace(/Y"/g, '🚀');
content = content.replace(/\?O/g, '❌');
content = content.replace(/Y""/g, '🔄');
content = content.replace(/Y"'/g, '🛡️');
content = content.replace(/~./g, '⭐');
content = content.replace(/o\^\?/g, '⚡');

// Símbolos de progresso
content = content.replace(/'o"' : '1'/g, "'✓' : '1'");
content = content.replace(/'o"' : '2'/g, "'✓' : '2'");

fs.writeFileSync(path, content, 'utf8');
console.log('Final encoding cleanup done.');
