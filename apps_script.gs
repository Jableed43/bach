// ============================================================
// GOOGLE APPS SCRIPT - "El Aprendiz" Flores de Bach
// v2 - Una hoja por cliente + normalización de teléfonos ARG
// ============================================================

/**
 * Normaliza números de teléfono argentinos a formato canónico
 * (código de área 2 dígitos + 8 dígitos locales = 10 dígitos)
 * 
 * Casos manejados:
 *   +54 9 11 5596-4569  → 1155964569
 *   +54 9 15 5596-4569  → 1155964569 (el 15 es prefijo móvil, no área)
 *   +549 011 5596-4569  → 1155964569
 *   011 15 5596-4569    → 1155964569
 *   011 5596-4569       → 1155964569
 *   011 5596 4569       → 1155964569
 *   15 5596-4569        → 1155964569 (asume área 11, CABA/GBA)
 *   11 5596-4569        → 1155964569
 */
function normalizePhone(raw) {
  // 1. Dejar solo dígitos
  let n = String(raw).replace(/\D/g, '');

  // 2. Quitar código de país 54 / 549, y posible trunk 0 después
  if (n.startsWith('549011'))  n = '11' + n.slice(6);   // +549 + 011 + 8
  else if (n.startsWith('549')) n = n.slice(3);          // +54 9 → quita 549
  else if (n.startsWith('54'))  n = n.slice(2);          // +54   → quita 54

  // 3. Quitar trunk 0 (ej: 011… → 11…)
  if (n.startsWith('0')) n = n.slice(1);

  // 4. Quitar indicador móvil 9 cuando el resultado tiene 11 dígitos
  //    Ej: 9 + 11 + 8 = 11 dígitos  → quita el 9 → 10 dígitos
  if (n.length === 11 && n.charAt(0) === '9') n = n.slice(1);

  // 5. Quitar prefijo 15 después del código de área (2 dígitos)
  //    Ej: 11 + 15 + 8 = 12 dígitos o 11 + 15 + 8 = 11 dígitos (ya sin 9)
  if (n.length === 12 && n.slice(2, 4) === '15') n = n.slice(0, 2) + n.slice(4);
  if (n.length === 11 && n.slice(2, 4) === '15') n = n.slice(0, 2) + n.slice(4);

  // 6. Caso: usuario escribió solo "15 XXXXXXXX" (sin área, asume CABA/GBA = 11)
  //    15 + 8 dígitos = 10 dígitos empezando con 15
  if (n.length === 10 && n.startsWith('15')) n = '11' + n.slice(2);

  // 7. Caso: solo 8 dígitos (sin área) → asume área 11
  if (n.length === 8) n = '11' + n;

  return n; // canónico: 10 dígitos (ej: 1155964569)
}

/**
 * Devuelve (o crea) la hoja del cliente identificado por su número normalizado.
 */
function getOrCreateClientSheet(ss, normalizedId) {
  const sheetName = normalizedId; // nombre de la hoja = número canónico

  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);

    // Encabezados
    const headers = ['Fecha', 'WhatsApp ID original', 'Estado de ánimo', 'Notas'];
    sheet.appendRow(headers);

    // Formato: negrita + color de fondo suave
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1DC2D6');
    headerRange.setFontColor('#ffffff');

    // Ancho de columnas automático
    sheet.setColumnWidth(1, 130);
    sheet.setColumnWidth(2, 160);
    sheet.setColumnWidth(3, 140);
    sheet.setColumnWidth(4, 350);
  }

  return sheet;
}

// ============================================================
// ENDPOINT GET (recibe datos desde la web vía query string)
// ============================================================
function doGet(e) {
  // Sin parámetros: verificación de estado
  if (!e.parameter || !e.parameter.id) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'activo', version: '3.0' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  // Con parámetros: guardar avance
  return saveData(e.parameter);
}

// ============================================================
// ENDPOINT POST (alternativa via fetch POST)
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
// LÓGICA CENTRAL: normaliza, crea/abre hoja y guarda fila
// ============================================================
function saveData(data) {
  try {
    var id        = String(data.id || '').trim();
    var timestamp = String(data.timestamp || new Date().toLocaleString());
    var mood      = String(data.mood || '');
    var notes     = String(data.notes || '');

    // Normalización del número
    var canon = id.replace(/\D/g, '');
    if (canon.startsWith('549011'))  canon = '11' + canon.slice(6);  // 549011 = 6 chars
    else if (canon.startsWith('549')) canon = canon.slice(3);
    else if (canon.startsWith('54'))  canon = canon.slice(2);
    if (canon.startsWith('0'))  canon = canon.slice(1);
    if (canon.length === 11 && canon.charAt(0) === '9') canon = canon.slice(1);
    if (canon.length === 11 && canon.slice(2,4) === '15') canon = canon.slice(0,2) + canon.slice(4);
    if (canon.length === 10 && canon.startsWith('15')) canon = '11' + canon.slice(2);
    if (canon.length === 8) canon = '11' + canon;

    // Abrir spreadsheet
    var ss = SpreadsheetApp.openById('1T5--JXyChNXqLRqpiKAg81lwD-Y2tF8LxN1ivQPLy5Q');

    // Obtener o crear hoja por cliente
    var sheet = ss.getSheetByName(canon);
    if (!sheet) {
      sheet = ss.insertSheet(canon);
      sheet.appendRow(['Fecha', 'WhatsApp Original', 'Estado', 'Notas']);
      sheet.getRange(1, 1, 1, 4)
           .setFontWeight('bold')
           .setBackground('#1DC2D6')
           .setFontColor('#ffffff');
      sheet.setColumnWidths(1, 4, 170);
    }

    // Guardar fila
    sheet.appendRow([timestamp, id, mood, notes]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', canonicalId: canon }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
