const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Lade Umgebungsvariablen aus .env.local
dotenv.config({ path: '.env.local' });

// Access environment variables directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// Überprüfe, ob die erforderlichen Umgebungsvariablen vorhanden sind
if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'FEHLER: NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY müssen in .env.local definiert sein'
  );
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Directory containing seed files
const seedDir = path.join(__dirname);

// Definiere die richtige Ausführungsreihenfolge der Seed-Dateien
const executionOrder = [
  'lessons_structure-seed.sql',
  'exercises_structure-seed.sql',
  'exercises_content-seed.sql',
  'plans-seed.sql',
  'course-seed.sql',

  // Alle anderen Dateien werden danach in alphabetischer Reihenfolge ausgeführt
];

async function executeSeedFiles() {
  try {
    console.log('Starte die Ausführung aller Seed-Dateien...');

    // Get all SQL files in directory
    let files = fs.readdirSync(seedDir).filter((file) => file.endsWith('.sql'));

    // Sortiere Dateien gemäß der definierten Reihenfolge
    const orderedFiles = [];

    // Zunächst die Dateien in der definierten Reihenfolge hinzufügen
    for (const orderFile of executionOrder) {
      if (files.includes(orderFile)) {
        orderedFiles.push(orderFile);
        // Entferne die Datei aus der ursprünglichen Liste
        files = files.filter((file) => file !== orderFile);
      }
    }

    // Dann die restlichen Dateien in alphabetischer Reihenfolge hinzufügen
    orderedFiles.push(...files.sort());

    if (orderedFiles.length === 0) {
      console.log('Keine SQL-Seed-Dateien im Verzeichnis gefunden.');
      return;
    }

    console.log(`${orderedFiles.length} Seed-Dateien gefunden.`);
    console.log('Ausführungsreihenfolge:');
    orderedFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });

    // Execute each file
    for (const file of orderedFiles) {
      const filePath = path.join(seedDir, file);
      console.log(`Führe Seed-Datei aus: ${file}`);

      // Read SQL content
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      try {
        // Führe die SQL-Anfrage direkt über die RPC-Methode aus
        const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });

        if (error) {
          console.error(`Fehler beim Ausführen der Datei ${file}:`, error);
          // Bei einem Fehler in einer der kritischen Dateien, brechen wir ab
          if (executionOrder.includes(file)) {
            console.error(
              `Kritische Datei ${file} konnte nicht ausgeführt werden. Breche ab.`
            );
            process.exit(1);
          }
        } else {
          console.log(`Datei ${file} erfolgreich ausgeführt`);
        }
      } catch (error) {
        console.error(`Fehler beim Ausführen der Datei ${file}:`, error);
        // Bei einem Fehler in einer der kritischen Dateien, brechen wir ab
        if (executionOrder.includes(file)) {
          console.error(
            `Kritische Datei ${file} konnte nicht ausgeführt werden. Breche ab.`
          );
          process.exit(1);
        }
      }
    }

    console.log('Alle Seed-Dateien wurden erfolgreich ausgeführt!');
  } catch (error) {
    console.error('Fehler beim Ausführen der Seed-Dateien:', error);
    process.exit(1);
  }
}

// Execute the main function
executeSeedFiles().catch((err) => {
  console.error('Unerwarteter Fehler:', err);
  process.exit(1);
});
