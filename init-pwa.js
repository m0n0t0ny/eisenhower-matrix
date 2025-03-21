#!/usr/bin/env node

/**
 * Script di inizializzazione della PWA Eisenhower Matrix
 * Questo script configura l'ambiente di sviluppo e crea tutti i file necessari
 * per il funzionamento dell'applicazione.
 * 
 * Uso: node init-pwa.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Banner di avvio
console.log('\n===================================================');
console.log("🚀 Inizializzazione PWA Eisenhower Matrix");
console.log('===================================================\n');

// Creazione delle directory necessarie
const directories = [
  'icons',
  'screenshots'
];

console.log('📁 Creazione delle directory...');
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    console.log(`  ✅ Creata directory: ${dir}`);
  } else {
    console.log(`  ℹ️ La directory ${dir} esiste già.`);
  }
});

// Verifica dei file essenziali
console.log('\n📋 Verifica dei file essenziali...');
const essentialFiles = [
  { name: 'index.html', desc: 'Pagina principale' },
  { name: 'styles.css', desc: 'Foglio di stile' },
  { name: 'app.js', desc: 'Script applicazione' },
  { name: 'sw.js', desc: 'Service Worker' },
  { name: 'manifest.json', desc: 'Web App Manifest' }
];

const missingFiles = [];
essentialFiles.forEach(file => {
  if (fs.existsSync(file.name)) {
    console.log(`  ✅ ${file.name} (${file.desc})`);
  } else {
    console.log(`  ❌ ${file.name} (${file.desc}) - MANCANTE`);
    missingFiles.push(file.name);
  }
});

if (missingFiles.length > 0) {
  console.log('\n⚠️ Attenzione: Alcuni file essenziali sono mancanti!');
  console.log('   Assicurati di creare i seguenti file prima di continuare:');
  missingFiles.forEach(file => console.log(`   - ${file}`));
  process.exit(1);
}

// Creazione delle icone
console.log('\n🖼️ Generazione delle icone...');
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const shortcutIcons = ['add-task', 'completed'];

// Funzione per verificare se un programma è installato
function isCommandAvailable(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Controlla se ImageMagick è installato
const hasImageMagick = isCommandAvailable('convert');

if (hasImageMagick) {
  console.log('  ✅ ImageMagick trovato, procedo con la generazione delle icone.');
  
  // Crea file SVG temporaneo per l'icona
  const svgIconContent = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="100" fill="#4a6fa5"/>
  <g transform="translate(100, 100) scale(0.6)">
    <rect x="0" y="0" width="220" height="220" rx="20" fill="#e74c3c" stroke="white" stroke-width="10"/>
    <rect x="240" y="0" width="220" height="220" rx="20" fill="#f39c12" stroke="white" stroke-width="10"/>
    <rect x="0" y="240" width="220" height="220" rx="20" fill="#3498db" stroke="white" stroke-width="10"/>
    <rect x="240" y="240" width="220" height="220" rx="20" fill="#7f8c8d" stroke="white" stroke-width="10"/>
  </g>
  <g transform="translate(340, 340)">
    <circle cx="30" cy="30" r="50" fill="white"/>
    <path d="M15,30 L25,40 L45,20" stroke="#28a745" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

  fs.writeFileSync('temp-icon.svg', svgIconContent);
  
  // Genera le icone in diverse dimensioni
  iconSizes.forEach(size => {
    const iconPath = path.join('icons', `icon-${size}x${size}.png`);
    console.log(`  🔄 Generazione icona ${size}x${size}...`);
    try {
      execSync(`convert -background none temp-icon.svg -resize ${size}x${size} ${iconPath}`);
      console.log(`    ✅ Creata icona: ${iconPath}`);
    } catch (error) {
      console.log(`    ❌ Errore durante la generazione di ${iconPath}: ${error.message}`);
    }
  });
  
  // Genera le icone delle scorciatoie
  shortcutIcons.forEach(icon => {
    const iconPath = path.join('icons', `${icon}.png`);
    console.log(`  🔄 Generazione icona scorciatoia ${icon}...`);
    try {
      execSync(`convert -background none temp-icon.svg -resize 192x192 ${iconPath}`);
      console.log(`    ✅ Creata icona scorciatoia: ${iconPath}`);
    } catch (error) {
      console.log(`    ❌ Errore durante la generazione di ${iconPath}: ${error.message}`);
    }
  });
  
  // Rimuovi il file SVG temporaneo
  fs.unlinkSync('temp-icon.svg');
  console.log('  ✅ Rimozione file temporaneo.');
  
} else {
  console.log('  ⚠️ ImageMagick non trovato. Le icone dovranno essere create manualmente.');
  console.log('  ℹ️ Installa ImageMagick per generare automaticamente le icone:');
  console.log('    - Su macOS: brew install imagemagick');
  console.log('    - Su Linux: sudo apt-get install imagemagick');
  console.log('    - Su Windows: Scarica da https://imagemagick.org/script/download.php');
  
  // Crea file di esempio per le icone
  iconSizes.forEach(size => {
    const iconPath = path.join('icons', `icon-${size}x${size}.png`);
    if (!fs.existsSync(iconPath)) {
      console.log(`  ⚠️ Manca l'icona: ${iconPath}`);
    }
  });
  
  shortcutIcons.forEach(icon => {
    const iconPath = path.join('icons', `${icon}.png`);
    if (!fs.existsSync(iconPath)) {
      console.log(`  ⚠️ Manca l'icona scorciatoia: ${iconPath}`);
    }
  });
}

// Genera screenshots placeholder
console.log('\n📸 Creazione screenshots di esempio...');
const screenshots = [
  { name: 'desktop.png', width: 1280, height: 720 },
  { name: 'mobile.png', width: 720, height: 1280 }
];

screenshots.forEach(screenshot => {
  const screenshotPath = path.join('screenshots', screenshot.name);
  if (!fs.existsSync(screenshotPath)) {
    console.log(`  ⚠️ Screenshot mancante: ${screenshotPath}`);
    console.log(`     Dovrebbe essere di dimensioni ${screenshot.width}x${screenshot.height}`);
    
    if (hasImageMagick) {
      try {
        execSync(`convert -size ${screenshot.width}x${screenshot.height} canvas:white -fill "#4a6fa5" -gravity center -pointsize 30 -annotate 0 "Screenshot ${screenshot.name}" ${screenshotPath}`);
        console.log(`    ✅ Creato screenshot di esempio: ${screenshotPath}`);
      } catch (error) {
        console.log(`    ❌ Errore durante la generazione di ${screenshotPath}: ${error.message}`);
      }
    }
  } else {
    console.log(`  ✅ Screenshot esistente: ${screenshotPath}`);
  }
});

// Verifica che il manifest.json sia configurato correttamente
console.log('\n📝 Verifica del manifest.json...');
try {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  console.log('  ✅ manifest.json è valido JSON.');
  
  // Verifica i campi essenziali
  const requiredFields = [
    'name', 
    'short_name', 
    'start_url', 
    'display', 
    'icons',
    'background_color',
    'theme_color'
  ];
  
  const missingFields = requiredFields.filter(field => !manifest[field]);
  
  if (missingFields.length > 0) {
    console.log('  ⚠️ Campi mancanti in manifest.json:');
    missingFields.forEach(field => console.log(`    - ${field}`));
  } else {
    console.log('  ✅ manifest.json contiene tutti i campi essenziali.');
  }
  
  // Verifica che le icone dichiarate esistano
  if (manifest.icons && Array.isArray(manifest.icons)) {
    console.log('  🔍 Verifica della presenza delle icone dichiarate...');
    const missingIcons = manifest.icons.filter(icon => !fs.existsSync(icon.src));
    
    if (missingIcons.length > 0) {
      console.log('  ⚠️ Alcune icone dichiarate non esistono:');
      missingIcons.forEach(icon => console.log(`    - ${icon.src}`));
    } else {
      console.log('  ✅ Tutte le icone dichiarate sono presenti.');
    }
  }
  
} catch (error) {
  console.log('  ❌ Errore nella lettura o parsing di manifest.json:', error.message);
}

// Verifica che il Service Worker sia configurato correttamente
console.log('\n👷 Verifica del Service Worker (sw.js)...');
try {
  const swContent = fs.readFileSync('sw.js', 'utf8');
  
  // Verifica che le risorse essenziali siano cachate
  const essentialCachedResources = [
    'index.html',
    'styles.css',
    'app.js',
    'manifest.json'
  ];
  
  const missingCachedResources = essentialCachedResources.filter(resource => !swContent.includes(resource));
  
  if (missingCachedResources.length > 0) {
    console.log('  ⚠️ Alcune risorse essenziali potrebbero non essere cachate nel Service Worker:');
    missingCachedResources.forEach(resource => console.log(`    - ${resource}`));
  } else {
    console.log('  ✅ Il Service Worker sembra configurato per cachare le risorse essenziali.');
  }
  
} catch (error) {
  console.log('  ❌ Errore nella lettura del Service Worker:', error.message);
}

// Crea un file README.md con istruzioni
console.log('\n📄 Creazione del file README.md...');
const readmeContent = `# Eisenhower Matrix - PWA

Un'applicazione web progressiva (PWA) per gestire le attività utilizzando il metodo della Eisenhower Matrix.

## Caratteristiche

- Organizzazione visiva delle attività in quattro quadranti (Urgente/Importante)
- Aggiunta, spostamento ed eliminazione delle attività
- Marcatura delle attività come completate
- Visualizzazione delle attività completate
- Funzionalità offline
- Installabile come app sul dispositivo

## Sviluppo

### Prerequisiti

- Node.js
- Opzionale: ImageMagick per la generazione delle icone

### Setup

1. Clona il repository
2. Esegui \`node init-pwa.js\` per inizializzare l'ambiente
3. Serve la directory con un server web:
   - Con Node.js: \`npx serve\`
   - Con Python: \`python -m http.server 8000\`

### File principali

- \`index.html\`: Struttura dell'applicazione
- \`styles.css\`: Stili dell'applicazione
- \`app.js\`: Logica dell'applicazione
- \`sw.js\`: Service Worker per funzionalità offline
- \`manifest.json\`: Configurazione della PWA

## Uso

1. Aggiungi un'attività specificando il testo e il quadrante
2. Sposta le attività tra i quadranti in base alla priorità
3. Segna come completate le attività terminate
4. Visualizza le ultime attività completate o l'elenco completo

## Installazione come App

1. Apri l'applicazione nel browser
2. Fai clic sul pulsante "Installa App" o usa l'opzione del browser "Installa applicazione"

## Note

- I dati vengono salvati nel localStorage del browser
- L'app funziona offline dopo il primo caricamento
`;

if (!fs.existsSync('README.md')) {
  fs.writeFileSync('README.md', readmeContent);
  console.log('  ✅ Creato file README.md con istruzioni.');
} else {
  console.log('  ℹ️ Il file README.md esiste già.');
}

// Controllo finale e suggerimenti
console.log('\n🔍 Controllo finale...');

const hasMissingFiles = missingFiles.length > 0;
const hasIssues = hasMissingFiles;

if (!hasIssues) {
  console.log('  ✅ Tutti i controlli sono passati! L\'applicazione è pronta.');
} else {
  console.log('  ⚠️ Ci sono alcuni problemi da risolvere prima di procedere.');
}

// Suggerimenti per il testing
console.log('\n🧪 Suggerimenti per il testing:');
console.log('  1. Avvia un server web locale:');
console.log('     - Usando Node.js: npx serve');
console.log('     - Usando Python: python -m http.server 8000');
console.log('  2. Apri l\'app nel browser (preferibilmente Chrome)');
console.log('  3. Nella scheda "Applicazione" degli strumenti di sviluppo, verifica:');
console.log('     - Manifest: dovrebbe mostrare i dettagli della PWA');
console.log('     - Service Workers: dovrebbe essere attivo');
console.log('     - Storage: controlla i dati nel localStorage');
console.log('  4. Prova ad installare l\'app usando il pulsante "Installa" o l\'opzione del browser');
console.log('  5. Testa la funzionalità offline disabilitando la rete negli strumenti di sviluppo\n');

console.log('===================================================');
console.log('✨ Inizializzazione PWA completata!');
console.log('===================================================\n');
