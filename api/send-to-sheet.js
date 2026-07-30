function setCors(res, methods = "POST, OPTIONS") {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const webhookUrl = body.webhookUrl || process.env.SHEET_WEBHOOK_URL;

    if (!webhookUrl || String(webhookUrl).includes("COLOQUE")) {
      res.status(400).json({ ok: false, error: "webhookUrl não configurada" });
      return;
    }

    const { webhookUrl: _ignored, ...payload } = body;

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const text = await response.text();

    res.status(200).json({
      ok: response.ok,
      status: response.status,
      saved: {
        tipo: payload.tipo,
        mensagem: payload.mensagem || payload.recado || "",
        presenteadoPor: payload.presenteadoPor || "",
      },
      response: text.slice(0, 500),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
