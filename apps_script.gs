// ============================================================
// GOOGLE APPS SCRIPT - "El Aprendiz" Flores de Bach
// v3 - Plantilla por cliente + Fórmulas de Flores + Normalización ARG
// ============================================================

var SPREADSHEET_ID  = '1T5--JXyChNXqLRqpiKAg81lwD-Y2tF8LxN1ivQPLy5Q';
var TEMPLATE_NAME   = 'Plantilla';
var FLORES_LIST     = 'Lista_Flores';
var MI_CORREO       = 'hugoalelopez@gmail.com';

// 39 Flores de Bach
var FLORES_DE_BACH = [
  'Agrimony', 'Aspen', 'Beech', 'Centaury', 'Cerato',
  'Cherry Plum', 'Chestnut Bud', 'Chicory', 'Clematis', 'Crab Apple',
  'Elm', 'Gentian', 'Gorse', 'Heather', 'Holly',
  'Honeysuckle', 'Hornbeam', 'Impatiens', 'Larch', 'Mimulus',
  'Mustard', 'Oak', 'Olive', 'Pine', 'Red Chestnut',
  'Rock Rose', 'Rock Water', 'Scleranthus', 'Star of Bethlehem', 'Sweet Chestnut',
  'Vervain', 'Vine', 'Walnut', 'Water Violet', 'White Chestnut',
  'Wild Oat', 'Wild Rose', 'Willow', 'Rescue Remedy'
];

// ============================================================
// SETUP: ejecutar UNA SOLA VEZ para crear Lista_Flores
// Ir a Apps Script → Ejecutar → setupFlores
// ============================================================
function setupFlores() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(FLORES_LIST);

  if (sheet) {
    sheet.clearContents();
  } else {
    sheet = ss.insertSheet(FLORES_LIST);
  }

  // Encabezado
  sheet.getRange(1, 1).setValue('Flor').setFontWeight('bold')
       .setBackground('#1DC2D6').setFontColor('#ffffff');

  // Cargar las flores
  var data = FLORES_DE_BACH.map(function(f) { return [f]; });
  sheet.getRange(2, 1, data.length, 1).setValues(data);
  sheet.setColumnWidth(1, 180);

  SpreadsheetApp.getUi().alert('✅ Lista_Flores creada con ' + data.length + ' flores.');
}


// ============================================================
// NORMALIZACIÓN DE TELÉFONOS ARGENTINOS
// ============================================================
function normalizePhone(raw) {
  var n = String(raw).replace(/\D/g, '');

  if (n.startsWith('549011'))      n = '11' + n.slice(6);
  else if (n.startsWith('549'))    n = n.slice(3);
  else if (n.startsWith('54'))     n = n.slice(2);

  if (n.startsWith('0'))           n = n.slice(1);
  if (n.length === 11 && n.charAt(0) === '9')         n = n.slice(1);
  if (n.length === 12 && n.slice(2,4) === '15')       n = n.slice(0,2) + n.slice(4);
  if (n.length === 11 && n.slice(2,4) === '15')       n = n.slice(0,2) + n.slice(4);
  if (n.length === 10 && n.startsWith('15'))           n = '11' + n.slice(2);
  if (n.length === 8)                                  n = '11' + n;

  return n;
}

// ============================================================
// OBTENER O CREAR HOJA DE CLIENTE A PARTIR DE LA PLANTILLA
// ============================================================
function getOrCreateClientSheet(ss, canon) {
  var sheet = ss.getSheetByName(canon);
  if (sheet) return sheet;

  // Buscar la Plantilla
  var template = ss.getSheetByName(TEMPLATE_NAME);

  if (template) {
    // Copiar la plantilla y renombrarla con el número del cliente
    sheet = template.copyTo(ss);
    sheet.setName(canon);
    // Mover la hoja nueva al final (antes de Plantilla)
    var lastPos = ss.getNumSheets();
    ss.moveActiveSheet(lastPos);

  } else {
    // Si no existe Plantilla, crear con estructura completa
    sheet = ss.insertSheet(canon);

    var headers = [
      'Fecha',
      'WhatsApp',
      'Estado de ánimo',
      'Notas',
      'Nombre Cliente',   // Manual
      'Flor 1',           // Manual + Dropdown
      'Flor 2',
      'Flor 3',
      'Flor 4',
      'Flor 5'
    ];

    sheet.appendRow(headers);

    // Estilo encabezados
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold')
               .setBackground('#1DC2D6')
               .setFontColor('#ffffff')
               .setHorizontalAlignment('center');

    // Anchos de columna
    sheet.setColumnWidth(1, 130);  // Fecha
    sheet.setColumnWidth(2, 150);  // WhatsApp
    sheet.setColumnWidth(3, 130);  // Estado
    sheet.setColumnWidth(4, 300);  // Notas
    sheet.setColumnWidth(5, 160);  // Nombre Cliente
    sheet.setColumnWidth(6, 140);  // Flor 1
    sheet.setColumnWidth(7, 140);  // Flor 2
    sheet.setColumnWidth(8, 140);  // Flor 3
    sheet.setColumnWidth(9, 140);  // Flor 4
    sheet.setColumnWidth(10, 140); // Flor 5

    // Separador visual entre datos automáticos y manuales (columna 5 en adelante)
    sheet.getRange(1, 5, 1, 6)
         .setBackground('#ECDC63')
         .setFontColor('#000000');
  }

  // Configurar dropdowns de flores en las columnas 6-10 (solo si existe Lista_Flores)
  applyFloresDropdowns(ss, sheet);

  return sheet;
}

// ============================================================
// APLICA DROPDOWNS DE FLORES EN COLUMNAS 6-10
// ============================================================
function applyFloresDropdowns(ss, sheet) {
  var floresSheet = ss.getSheetByName(FLORES_LIST);
  if (!floresSheet) return; // Si no existe Lista_Flores, no hace nada

  var lastRow = floresSheet.getLastRow();
  if (lastRow < 1) return;

  // Rango fuente: Lista_Flores!A1:A(n)
  var sourceRange = floresSheet.getRange(1, 1, lastRow, 1);
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(sourceRange, true)
    .setAllowInvalid(false)
    .build();

  // Aplicar a columnas 6-10, filas 2 en adelante (100 filas suficientes)
  for (var col = 6; col <= 10; col++) {
    sheet.getRange(2, col, 100, 1).setDataValidation(rule);
  }
}

// ============================================================
// ENDPOINT GET (desde la web vía query string)
// ============================================================
function doGet(e) {
  if (!e.parameter || !e.parameter.id) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'activo', version: '3.0' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return saveData(e.parameter);
}

// ============================================================
// ENDPOINT POST (alternativa)
// ============================================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    return saveData(data);
  } catch (f) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: f.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// LÓGICA CENTRAL: normaliza → hoja → guarda fila → manda mail
// ============================================================
function saveData(data) {
  try {
    var id        = String(data.id        || '').trim();
    var timestamp = String(data.timestamp || new Date().toLocaleString('es-AR'));
    var mood      = String(data.mood      || '');
    var notes     = String(data.notes     || '');

    var canon = normalizePhone(id);

    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = getOrCreateClientSheet(ss, canon);

    // Guardar solo las 4 columnas automáticas; las manuales quedan vacías
    sheet.appendRow([timestamp, id, mood, notes, '', '', '', '', '', '']);

    // Alarma por correo
    try {
      var asunto = '🔔 Nuevo Avance - ' + canon;
      var cuerpo = 'Hola Alejandro,\n\nNuevo reporte recibido.\n\n' +
                   'ID canónico : ' + canon + '\n' +
                   'WhatsApp    : ' + id    + '\n' +
                   'Estado      : ' + mood  + '\n' +
                   'Notas       : ' + notes + '\n\n' +
                   'Ver en el Spreadsheet:\n' +
                   'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID + '/';
      MailApp.sendEmail(MI_CORREO, asunto, cuerpo);
    } catch (eMail) {
      console.error('Error mail: ' + eMail.toString());
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', canonicalId: canon }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
