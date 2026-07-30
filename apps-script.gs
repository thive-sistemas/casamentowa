/**
 * Cole este arquivo em Extensões → Apps Script na planilha.
 * Salve → Implantar → Gerenciar implantações → Editar → Nova versão → Implantar
 */

function normalizeHeader(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function appendRowByHeaders(sheet, fieldMap) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const row = new Array(headers.length).fill("");

  Object.keys(fieldMap).forEach(function(key) {
    const aliases = key.split("|").map(normalizeHeader);
    const value = fieldMap[key];
    for (var i = 0; i < headers.length; i++) {
      var header = normalizeHeader(headers[i]);
      if (aliases.indexOf(header) !== -1) {
        row[i] = value;
        break;
      }
    }
  });

  sheet.appendRow(row);
}

function appendPresenteRow(sheet, data, comprovanteLink) {
  var mensagem = data.mensagem || data.recado || "";
  var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  var normalized = headers.map(normalizeHeader);

  var hasMensagemCol = normalized.indexOf("mensagem") !== -1 || normalized.indexOf("recado") !== -1;

  if (hasMensagemCol) {
    appendRowByHeaders(sheet, {
      "Data": data.dataEnvio,
      "Presente": data.presente,
      "Valor": data.valor,
      "Presenteado por|Quem deu|Presenteadopor": data.presenteadoPor || "",
      "Mensagem|Recado": mensagem,
      "Comprovante": comprovanteLink,
      "Origem": data.origem || "Pix"
    });
    return;
  }

  // Planilha antiga com 6 colunas (sem Presenteado por)
  sheet.appendRow([
    data.dataEnvio,
    data.presente,
    data.valor,
    mensagem,
    comprovanteLink,
    data.origem || "Pix"
  ]);
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
      for (var j = 1; j < guestData.length; j++) {
        if (guestData[j][0]) guestList.push(String(guestData[j][0]).trim());
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
    appendRowByHeaders(rsvpSheet, {
      "Data": data.dataEnvio,
      "Nome": data.nome
    });
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

  return jsonResponse({ status: "ok", mensagemRecebida: data.mensagem || data.recado || "" });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
