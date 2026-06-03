export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const PAT = process.env.ASANA_PAT;
  if (!PAT) return res.status(500).json({ error: "ASANA_PAT not configured" });

  const { taskName, notes } = req.body;
  if (!taskName) return res.status(400).json({ error: "taskName required" });

  const PROJECT_GID  = "1214564678858480";
  const SECTION_GID  = "1214702463408669"; // 📥 New — Pending Review

  try {
    const response = await fetch("https://app.asana.com/api/1.0/tasks", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAT}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        data: {
          name: taskName,
          notes: notes || "",
          projects: [PROJECT_GID],
          memberships: [{ project: PROJECT_GID, section: SECTION_GID }],
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.status(200).json({ gid: data.data?.gid, permalink_url: data.data?.permalink_url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
