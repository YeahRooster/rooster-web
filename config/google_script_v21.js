/**
 * ROOSTER - Google Apps Script v25 (FINAL FIXED)
 * Objetivo: Sincronización completa incluyendo PROFESORES.
 */

const SCHOOL_EMAIL = "roosterespacio@gmail.com";
const SPREADSHEET_ID = "19fquDdwpUH8jH521e6Kh8ZX1tkdgarlQ_AFHywY38FU";

function getSS() {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function processAction(params, ss) {
    const action = params.action;

    if (action === 'updateStatus') {
        const sheet = ss.getSheetByName('ALUMNOS');
        if (!sheet) throw "No se encontró la hoja ALUMNOS";

        const data = sheet.getDataRange().getValues();
        const targetDni = String(params.dni || "").trim();
        const newStatus = String(params.status || "").toUpperCase();

        if (!targetDni) return { status: 'error', message: 'DNI vacío' };

        for (let i = 1; i < data.length; i++) {
            let currentDni = String(data[i][0] || "").trim();
            if (currentDni === targetDni) {
                sheet.getRange(i + 1, 6).setValue(newStatus);
                return { status: 'success', dni: targetDni, status: newStatus };
            }
        }
        return { status: 'error', message: 'DNI no encontrado' };
    }

    // --- PROCESO DE INSCRIPCIÓN ---
    const sheetAlum = ss.getSheetByName('ALUMNOS');
    const sheetInsc = ss.getSheetByName('INSCRIPCIONES');
    const dniInsc = String(params.dni || "").trim();
    const alumData = sheetAlum.getDataRange().getValues();
    let found = false;

    // 1. Verificar si el alumno ya existe para actualizar su status
    for (let i = 1; i < alumData.length; i++) {
        if (String(alumData[i][0]).trim() === dniInsc) {
            sheetAlum.getRange(i + 1, 6).setValue('PENDIENTE'); // Columna 6: WEB_STATUS
            found = true;
            break;
        }
    }

    // 2. Si no existe, crearlo en ALUMNOS (DNI, NOMBRE, EMAIL, CONTRASEÑA, FECHA, STATUS)
    if (!found) {
        sheetAlum.appendRow([
            dniInsc,               // A: DNI
            params.nombre,         // B: NOMBRE
            params.email,          // C: E-MAIL
            'alu1',                // D: CONTRASEÑA (Default)
            new Date(),            // E: FECHA_INGRESO
            'PENDIENTE'            // F: WEB_STATUS
        ]);
    }

    // 3. Registrar en INSCRIPCIONES (13 columnas exactas)
    // NOMBRE, DNI, ES MENOR?, TUTOR, CIUDAD, LOCALIDAD, DIRECCION, EMAIL, TELEFONO, CELULAR TUTOR, TALLER, FECHA, HORARIO
    sheetInsc.appendRow([
        params.nombre,           // A: NOMBRE
        dniInsc,                 // B: DNI
        params.es_menor_str,     // C: ES MENOR? (si/no)
        params.tutor,            // D: TUTOR
        params.ciudad,           // E: CIUDAD
        params.localidad,        // F: LOCALIDAD
        params.direccion,        // G: DIRECCION
        params.email,            // H: EMAIL
        params.telefono,         // I: TELEFONO (Alumno)
        params.tutor_celular,    // J: CELULAR TUTOR
        params.taller,           // K: TALLER
        new Date(),              // L: FECHA
        params.horario           // M: HORARIO
    ]);

    try {
        MailApp.sendEmail(SCHOOL_EMAIL, `SOLICITUD: ${params.nombre}`, `Nueva solicitud de: ${params.nombre}`);
    } catch (e) { }

    return { status: 'success', message: 'Inscripcion guardada correctamente' };
}

function doGet(e) {
    try {
        const ss = getSS();
        const data = {
            talleres: ss.getSheetByName('TALLERES').getDataRange().getValues().slice(1),
            alumnos: ss.getSheetByName('ALUMNOS').getDataRange().getValues().slice(1),
            profesores: ss.getSheetByName('PROFESORES').getDataRange().getValues().slice(1), // <--- ESTABA FALTANDO ESTA LÍNEA
            inscripciones: ss.getSheetByName('INSCRIPCIONES').getDataRange().getValues().slice(1),
            pagos: ss.getSheetByName('PAGOS').getDataRange().getValues().slice(1)
        };
        return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: data })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Error en doGet: ' + err.toString() })).setMimeType(ContentService.MimeType.JSON);
    }
}

function doPost(e) {
    try {
        const ss = getSS();
        let params = e.postData ? JSON.parse(e.postData.contents) : e.parameter;
        const result = processAction(params, ss);
        return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Error critico en doPost: ' + err.toString() })).setMimeType(ContentService.MimeType.JSON);
    }
}
