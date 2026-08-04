/**
 * Cole em Extensões → Apps Script → Salvar → Implantar → Nova versão
 */

function normalizeHeader(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function headerMatches(header, aliases) {
  var h = normalizeHeader(header);
  if (!h) return false;
  for (var i = 0; i < aliases.length; i++) {
    var alias = normalizeHeader(aliases[i]);
    if (h === alias || h.indexOf(alias) !== -1 || alias.indexOf(h) !== -1) return true;
  }
  return false;
}

function setFieldByHeaders(headers, row, aliases, value) {
  for (var i = 0; i < headers.length; i++) {
    if (headerMatches(headers[i], aliases)) {
      row[i] = value;
      return true;
    }
  }
  return false;
}

function appendPresenteRow(sheet, data, comprovanteLink) {
  var mensagem = String(data.mensagem || data.recado || data.mensagemParaNoivos || "").trim();
  var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  var row = new Array(headers.length).fill("");

  var mensagemSalva = setFieldByHeaders(headers, row, ["mensagem", "recado", "message", "carinho", "texto", "msg"], mensagem);
  setFieldByHeaders(headers, row, ["data"], data.dataEnvio);
  setFieldByHeaders(headers, row, ["presente"], data.presente);
  setFieldByHeaders(headers, row, ["valor"], data.valor);
  setFieldByHeaders(headers, row, ["presenteado por", "presenteadopor", "quem deu", "nome"], data.presenteadoPor || "");
  setFieldByHeaders(headers, row, ["comprovante"], comprovanteLink);
  setFieldByHeaders(headers, row, ["origem"], data.origem || "Pix");

  // Se não achou coluna Mensagem/Recado, grava no fim ou em Origem
  if (mensagem && !mensagemSalva) {
    var origemIdx = -1;
    for (var j = 0; j < headers.length; j++) {
      if (headerMatches(headers[j], ["origem"])) origemIdx = j;
    }
    if (origemIdx !== -1) {
      row[origemIdx] = (row[origemIdx] || data.origem || "Pix") + " | Recado: " + mensagem;
    } else {
      row[row.length - 1] = mensagem;
    }
  }

  sheet.appendRow(row);
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tipo = e && e.parameter ? e.parameter.tipo : "";

  if (tipo === "config") {
    var gifts = [];
    var giftsSheet = ss.getSheetByName("Catálogo Presentes");
    if (giftsSheet) {
      var giftsData = giftsSheet.getDataRange().getValues();
      for (var i = 1; i < giftsData.length; i++) {
        var row = giftsData[i];
        if (!row[0] || !row[2]) continue;
        gifts.push({
          id: String(row[0]).trim(),
          tag: row[1] || "Presente",
          name: row[2],
          price: row[3],
          icon: String(row[4] || "").trim().toLowerCase()
        });
      }
    }

    var guestList = [];
    var guestSheet = ss.getSheetByName("Convidados");
    if (guestSheet) {
      var guestData = guestSheet.getDataRange().getValues();
      for (var k = 1; k < guestData.length; k++) {
        if (guestData[k][0]) guestList.push(String(guestData[k][0]).trim());
      }
    }

    return jsonResponse({ gifts: gifts, guestList: guestList });
  }

  return jsonResponse({ error: "tipo inválido" });
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (data.tipo === "rsvp") {
    var rsvpSheet = ss.getSheetByName("RSVP");
    if (!rsvpSheet) return jsonResponse({ status: "error", error: "Aba RSVP não encontrada" });
    var headers = rsvpSheet.getRange(1, 1, 1, Math.max(rsvpSheet.getLastColumn(), 1)).getValues()[0];
    var row = new Array(headers.length).fill("");
    setFieldByHeaders(headers, row, ["data"], data.dataEnvio);
    setFieldByHeaders(headers, row, ["nome"], data.nome);
    rsvpSheet.appendRow(row);

  } else if (data.tipo === "presente") {
    var presentesSheet = ss.getSheetByName("Presentes");
    if (!presentesSheet) return jsonResponse({ status: "error", error: "Aba Presentes não encontrada" });

    var comprovanteLink = "";
    if (data.comprovanteBase64 && data.comprovanteBase64.indexOf("base64,") > -1) {
      var folderName = "Comprovantes Pix - Casamento Wdmar e Adylla";
      var folders = DriveApp.getFoldersByName(folderName);
      var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
      var base64Data = data.comprovanteBase64.split("base64,")[1];
      var mimeMatch = data.comprovanteBase64.match(/data:(.*);base64/);
      var mimeType = mimeMatch ? mimeMatch[1] : "image/png";
      var fileName = (data.presente || "presente") + " - " + (data.comprovanteNome || "comprovante");
      var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      comprovanteLink = file.getUrl();
    }

    appendPresenteRow(presentesSheet, data, comprovanteLink);
  }

  var msg = data.mensagem || data.recado || "";
  return jsonResponse({ status: "ok", mensagemRecebida: msg, scriptVersion: 2 });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
