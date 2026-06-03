export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const PAT = process.env.ASANA_PAT;
  if (!PAT) return res.status(500).json({ error: "ASANA_PAT not configured" });

  const { taskGid } = req.body;
  if (!taskGid) return res.status(400).json({ error: "taskGid required" });

  try {
    const response = await fetch(`https://app.asana.com/api/1.0/tasks/${taskGid}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${PAT}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }
    res.status(200).json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
