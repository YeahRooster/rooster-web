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

    // Inscripcion
    const sheetAlum = ss.getSheetByName('ALUMNOS');
    const sheetInsc = ss.getSheetByName('INSCRIPCIONES');

    const dniInsc = String(params.dni || "").trim();
    const alumData = sheetAlum.getDataRange().getValues();
    let found = false;

    for (let i = 1; i < alumData.length; i++) {
        if (String(alumData[i][0]).trim() === dniInsc) {
            sheetAlum.getRange(i + 1, 6).setValue('PENDIENTE');
            found = true; break;
        }
    }
    if (!found) sheetAlum.appendRow([dniInsc, params.nombre, params.email, dniInsc, new Date(), 'PENDIENTE']);

    sheetInsc.appendRow([new Date(), dniInsc, params.nombre, params.email, params.edad, params.telefono, params.tutor, params.ciudad, params.experiencia, params.conocio, params.taller, params.horario, new Date()]);

    try {
        MailApp.sendEmail(SCHOOL_EMAIL, `SOLICITUD: ${params.nombre}`, `Nueva solicitud.`);
    } catch (e) { }

    return { status: 'success', message: 'Inscripcion guardada' };
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
