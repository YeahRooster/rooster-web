/* SÚPER SCRIPT ROOSTER - VERSIÓN 19.0 (INTEGRATED PW CHANGE) */

const SCHOOL_EMAIL = "roosterespacio@gmail.com";

function doGet(e) {
    try {
        var action = e.parameter.action;
        if (!action) return handleLogin(e);
        if (action === "getWorkshops") return getWorkshops();
        if (action === "getAccounting") return getAccounting();
        if (action === "getTeacherData") return getTeacherData(e.parameter.taller);
        if (action === "dumpAll") return dumpAll();
        return response({ "status": "error", "message": "Acción no válida" });
    } catch (err) {
        return response({ "status": "error", "message": err.toString() });
    }
}

/**
 * MANEJADOR DE SOLICITUDES POST
 * Detecta: Subida de archivo, Inscripción o Cambio de Contraseña.
 */
function doPost(e) {
    try {
        var p = JSON.parse(e.postData.contents);

        // 1. SI ES CAMBIO DE CONTRASEÑA
        if (p.action === "changePassword") {
            return handleChangePassword(p);
        }

        // 2. SI ES UNA SUBIDA DE ARCHIVO (Viene con campo 'data')
        if (p.data) {
            var blob = Utilities.newBlob(Utilities.base64Decode(p.data), p.filetype, p.filename);
            var folderId = getOrCreateFolderId(p.taller);
            var folder = DriveApp.getFolderById(folderId);
            var file = folder.createFile(blob);
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            return response({ "status": "success", "url": file.getUrl(), "filename": p.filename });
        }

        // 3. SI ES UNA INSCRIPCIÓN (Viene con DNI pero sin action changePassword)
        if (p.dni) {
            return handleEnrollment(p);
        }

        return response({ "status": "error", "message": "Acción no reconocida" });
    } catch (err) {
        return response({ "status": "error", "message": "Error crítico: " + err.toString() });
    }
}

/**
 * CAMBIA LA CONTRASEÑA EN LA HOJA CORRESPONDIENTE
 */
function handleChangePassword(p) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var targetDni = String(p.dni || "").trim();
    var newPass = String(p.password || "").trim();
    var role = p.role; // 'student' o 'teacher'
    var sheetName = role === 'teacher' ? 'PROFESORES' : 'ALUMNOS';
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) return response({ status: 'error', message: 'No se encontró la hoja ' + sheetName });

    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
        if (String(data[i][0] || "").trim() === targetDni) {
            sheet.getRange(i + 1, 4).setValue(newPass); // Columna D (Índice 3)
            return response({ status: 'success', message: 'Contraseña actualizada en Google Sheets' });
        }
    }
    return response({ status: 'error', message: 'DNI no encontrado en ' + sheetName });
}

/**
 * PROCESA LA INSCRIPCIÓN Y GUARDA EN ALUMNOS E INSCRIPCIONES
 */
function handleEnrollment(params) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetAlum = ss.getSheetByName('ALUMNOS');
    var sheetInsc = ss.getSheetByName('INSCRIPCIONES');
    var dni = String(params.dni || "").trim();

    // 1. CHEQUEO EN ALUMNOS
    var alumData = sheetAlum.getDataRange().getValues();
    var found = false;
    for (var i = 1; i < alumData.length; i++) {
        if (String(alumData[i][0]).trim() === dni) {
            sheetAlum.getRange(i + 1, 6).setValue('PENDIENTE'); // WEB_STATUS
            found = true;
            break;
        }
    }

    // 2. SI ES NUEVO, AGREGAR A ALUMNOS (DNI, NOMBRE, EMAIL, PASS, FECHA, STATUS)
    if (!found) {
        sheetAlum.appendRow([
            dni,                // A: DNI
            params.nombre,      // B: NOMBRE
            params.email,       // C: E-MAIL
            "alu1",             // D: CONTRASEÑA (Por defecto)
            new Date(),         // E: FECHA_INGRESO
            "PENDIENTE"         // F: WEB_STATUS
        ]);
    }

    // 3. REGISTRAR EN INSCRIPCIONES (Orden exacto A a M)
    sheetInsc.appendRow([
        params.nombre,        // A: NOMBRE
        dni,                  // B: DNI
        params.es_menor_str,  // C: ES MENOR? (si/no)
        params.tutor,         // D: TUTOR
        params.ciudad,        // E: CIUDAD
        params.localidad,     // F: LOCALIDAD
        params.direccion,     // G: DIRECCION
        params.email,         // H: EMAIL
        params.telefono,      // I: TELEFONO (del Alumno)
        params.tutor_celular, // J: CELULAR TUTOR
        params.taller,        // K: TALLER (Nombre)
        new Date(),           // L: FECHA
        params.horario        // M: HORARIO (Ej: Sabados 09hs)
    ]);

    try {
        MailApp.sendEmail(SCHOOL_EMAIL, "NUEVA SOLICITUD: " + params.nombre, "Se ha registrado una nueva inscripción para el " + params.taller);
    } catch (e) { }

    return response({ status: "success", message: "Inscripción guardada correctamente" });
}

// --- FUNCIONES DE SOPORTE ---

function getOrCreateFolderId(n) {
    var mainName = "Rooster_Archivos";
    var main;
    var folders = DriveApp.getFoldersByName(mainName);
    if (folders.hasNext()) { main = folders.next(); } else { main = DriveApp.createFolder(mainName); }
    var subFolders = main.getFoldersByName(n);
    if (subFolders.hasNext()) { return subFolders.next().getId(); } else { return main.createFolder(n).getId(); }
}

function getWorkshops() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("TALLERES");
    if (!sheet) return response({ "status": "error", "message": "No existe la pestaña TALLERES" });
    var data = sheet.getDataRange().getValues();
    var workshops = [];
    for (var i = 1; i < data.length; i++) {
        if (data[i][1]) {
            workshops.push({
                id: data[i][0], title: data[i][1], day: data[i][2], time: data[i][3],
                description: data[i][4], fullDescription: data[i][5],
                image: String(data[i][6]).trim() || "",
                seats: parseInt(data[i][7]) || 0, enrolled: parseInt(data[i][8]) || 0
            });
        }
    }
    return response({ "status": "success", "workshops": workshops });
}

function handleLogin(e) {
    var dni = String(e.parameter.dni || "").trim();
    var pass = String(e.parameter.pass || "").trim();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (dni === "999" && pass === "adminRooster") return response({ status: "success", role: "admin", nombre: "Administrador" });
    var sP = ss.getSheetByName("PROFESORES").getDataRange().getValues();
    for (var i = 1; i < sP.length; i++) if (String(sP[i][0]) == dni && String(sP[i][3]) == pass) return response({ status: "success", role: "teacher", nombre: sP[i][1], taller: sP[i][4] });
    var sA = ss.getSheetByName("ALUMNOS").getDataRange().getValues();
    for (var j = 1; j < sA.length; j++) {
        if (String(sA[j][0]) == dni && String(sA[j][3]) == pass) {
            return response({ status: "success", role: "student", nombre: sA[j][1], email: sA[j][2], dni: sA[j][0], pagos: getPagosAlumno(dni) });
        }
    }
    return response({ status: "error", message: "Credenciales incorrectas" });
}

function getPagosAlumno(dni) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("PAGOS");
    var list = [];
    if (sheet) {
        var data = sheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) if (String(data[i][0]) == dni) list.push({ taller: data[i][2], mes: data[i][3], anio: data[i][4], estado: data[i][5], monto: data[i][6] });
    }
    return list;
}

function getTeacherData(tallerNombre) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tallerBusqueda = String(tallerNombre || "").toLowerCase().trim();
    var mapPagos = {};
    var sPag = ss.getSheetByName("PAGOS");
    if (sPag) {
        var pD = sPag.getDataRange().getValues();
        var mesActualNum = new Date().getMonth() + 1;
        var meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        var mesActualStr = meses[new Date().getMonth()];
        for (var k = 1; k < pD.length; k++) {
            var mesCelda = String(pD[k][3]).toLowerCase().trim();
            var estadoCelda = String(pD[k][5]).toLowerCase().trim();
            if ((mesCelda == mesActualNum || mesCelda == mesActualStr) && estadoCelda == "pagado") mapPagos[String(pD[k][0])] = true;
        }
    }
    var students = [];
    var sheetInsc = ss.getSheetByName("INSCRIPCIONES");
    if (sheetInsc) {
        var dI = sheetInsc.getDataRange().getValues();
        for (var i = 1; i < dI.length; i++) {
            if (String(dI[i][10]).toLowerCase().includes(tallerBusqueda)) {
                var dniAlu = String(dI[i][1]);
                students.push({ nombre: dI[i][0], estado: (mapPagos[dniAlu] ? "al dia" : "deudor") });
            }
        }
    }
    var resources = [];
    try {
        var folderId = getOrCreateFolderId(tallerNombre);
        var files = DriveApp.getFolderById(folderId).getFiles();
        while (files.hasNext()) {
            var f = files.next();
            resources.push({ nombre: f.getName(), url: f.getUrl(), fecha: Utilities.formatDate(f.getDateCreated(), "GMT-3", "dd/MM/yyyy") });
        }
    } catch (e) { }
    return response({ "status": "success", "students": students, "resources": resources });
}

function getAccounting() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dp = ss.getSheetByName("PAGOS").getDataRange().getValues();
    var neto = 0;
    for (var i = 1; i < dp.length; i++) if (String(dp[i][5]).toLowerCase() === "pagado") neto += parseFloat(dp[i][6]) || 0;
    return response({ status: "success", netoMensual: Math.round(neto), totalAlumnos: ss.getSheetByName("ALUMNOS").getLastRow() - 1, totalProfesores: ss.getSheetByName("PROFESORES").getLastRow() - 1 });
}

function dumpAll() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    return response({
        status: "success",
        data: {
            talleres: ss.getSheetByName("TALLERES").getDataRange().getValues().slice(1),
            alumnos: ss.getSheetByName("ALUMNOS").getDataRange().getValues().slice(1),
            profesores: ss.getSheetByName("PROFESORES").getDataRange().getValues().slice(1),
            inscripciones: ss.getSheetByName("INSCRIPCIONES").getDataRange().getValues().slice(1),
            pagos: ss.getSheetByName("PAGOS").getDataRange().getValues().slice(1)
        }
    });
}

function response(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
