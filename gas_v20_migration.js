/* SÚPER SCRIPT ROOSTER - v20.0 (MIGRACIÓN A SUPABASE) */

var EXCEL_ID = "19fquDdwpUH8jH521e6Kh8ZX1tkdgarlQ_AFHywY38FU";

function autorizarPermisos() {
    var ss = SpreadsheetApp.openById(EXCEL_ID);
    DriveApp.getRootFolder();
    return "Permisos destrabados para v20";
}

function doGet(e) {
    try {
        var action = e.parameter.action;
        var ss = SpreadsheetApp.openById(EXCEL_ID);

        // --- NUEVA ACCIÓN DE VOLCADO TOTAL PARA MIGRACIÓN ---
        if (action === "dumpAll") {
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

        if (!action) return handleLogin(e, ss);
        if (action === "getWorkshops") return getWorkshops(ss);
        if (action === "getAccounting") return getAccounting(ss);
        if (action === "getTeacherData") return getTeacherData(ss, e.parameter.taller);
        return response({ "status": "error", "message": "Acción no válida" });
    } catch (err) { return response({ "status": "error", "message": err.toString() }); }
}

function handleLogin(e, ss) {
    var dni = String(e.parameter.dni || "").trim();
    var pass = String(e.parameter.pass || "").trim();

    if (dni === "999" && pass === "adminRooster") return response({ status: "success", role: "admin", nombre: "Administrador" });

    var sP = ss.getSheetByName("PROFESORES").getDataRange().getValues();
    for (var i = 1; i < sP.length; i++) if (String(sP[i][0]) == dni && String(sP[i][3]) == pass) return response({ status: "success", role: "teacher", nombre: sP[i][1], taller: sP[i][4] });

    var sA = ss.getSheetByName("ALUMNOS").getDataRange().getValues();
    for (var j = 1; j < sA.length; j++) {
        if (String(sA[j][0]) == dni && String(sA[j][3]) == pass) {
            var misTalleres = [];
            var sI = ss.getSheetByName("INSCRIPCIONES").getDataRange().getValues();
            for (var k = 1; k < sI.length; k++) if (String(sI[k][1]) == dni) misTalleres.push(sI[k][10]);

            return response({
                status: "success", role: "student", nombre: sA[j][1], email: sA[j][2], dni: sA[j][0],
                pagos: getPagosAlumno(ss, dni),
                talleresInscriptos: misTalleres
            });
        }
    }
    return response({ status: "error", message: "Credenciales incorrectas" });
}

function getWorkshops(ss) {
    var data = ss.getSheetByName("TALLERES").getDataRange().getValues();
    var w = [];
    for (var i = 1; i < data.length; i++) if (data[i][1]) w.push({ id: data[i][0], title: data[i][1], day: data[i][2], time: data[i][3], description: data[i][4], fullDescription: data[i][5], image: String(data[i][6]).trim() || "", seats: parseInt(data[i][7]) || 0, enrolled: parseInt(data[i][8]) || 0 });
    return response({ "status": "success", "workshops": w });
}

function getPagosAlumno(ss, dni) {
    var sheet = ss.getSheetByName("PAGOS");
    var list = [];
    if (sheet) {
        var data = sheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) if (String(data[i][0]) == dni) list.push({ taller: data[i][2], mes: data[i][3], anio: data[i][4], estado: data[i][5], monto: data[i][6] });
    }
    return list;
}

function getTeacherData(ss, t) {
    var sInsc = ss.getSheetByName("INSCRIPCIONES");
    var tB = String(t || "").toLowerCase().trim();
    var mapPagos = {};
    var sPag = ss.getSheetByName("PAGOS");
    if (sPag) {
        var pD = sPag.getDataRange().getValues();
        var mesActualNum = new Date().getMonth() + 1;
        var meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        var mStr = meses[new Date().getMonth()];
        for (var k = 1; k < pD.length; k++) if ((String(pD[k][3]).toLowerCase() == mesActualNum || String(pD[k][3]).toLowerCase() == mStr) && String(pD[k][5]).toLowerCase() == "pagado") mapPagos[String(pD[k][0])] = true;
    }
    var students = [];
    if (sInsc) {
        var dI = sInsc.getDataRange().getValues();
        for (var i = 1; i < dI.length; i++) if (String(dI[i][10]).toLowerCase().includes(tB)) students.push({ nombre: dI[i][0], estado: (mapPagos[String(dI[i][1])] ? "al dia" : "deudor") });
    }
    var resources = [];
    try {
        var folder = getOrCreateFolder(t);
        var files = folder.getFiles();
        while (files.hasNext()) {
            var f = files.next();
            resources.push({
                id: f.getId(),
                nombre: f.getName(),
                url: f.getUrl(),
                fecha: Utilities.formatDate(f.getDateCreated(), "GMT-3", "dd/MM/yyyy")
            });
        }
    } catch (e) { }
    return response({ "status": "success", "students": students, "resources": resources });
}

function getAccounting(ss) {
    var dp = ss.getSheetByName("PAGOS").getDataRange().getValues();
    var n = 0;
    for (var i = 1; i < dp.length; i++) if (String(dp[i][5]).toLowerCase() === "pagado") n += parseFloat(dp[i][6]) || 0;
    return response({ status: "success", netoMensual: Math.round(n), totalAlumnos: ss.getSheetByName("ALUMNOS").getLastRow() - 1, totalProfesores: ss.getSheetByName("PROFESORES").getLastRow() - 1 });
}

function doPost(e) {
    try {
        var p = JSON.parse(e.postData.contents);
        var blob = Utilities.newBlob(Utilities.base64Decode(p.data), p.filetype, p.filename);
        var folder = getOrCreateFolder(p.taller);
        var file = folder.createFile(blob).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        return response({ "status": "success", "url": file.getUrl() });
    } catch (err) { return response({ "status": "error", "message": "Error Drive: " + err.toString() }); }
}

function getOrCreateFolder(n) {
    var mainName = "Rooster_Archivos";
    var main = DriveApp.getFoldersByName(mainName).hasNext() ? DriveApp.getFoldersByName(mainName).next() : DriveApp.createFolder(mainName);
    var target = String(n).trim().toLowerCase();
    var subFolders = main.getFolders();
    while (subFolders.hasNext()) {
        var sub = subFolders.next();
        if (sub.getName().toLowerCase().trim() === target) return sub;
    }
    return main.createFolder(String(n).trim());
}

function response(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
