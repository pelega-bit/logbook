const PLATFORM_FIELD = "1214564678858501";
const PLATFORM_MAP = {
  "BullShark 401": "1214564678858502",
  "BullShark 403": "1214564678858503",
  "Tigershark 601": "1214564678858504",
  "Alligator 501": "1214564678858505",
  "Unicorn":        "1215265125118172",
  "Seame":          "1215265125118173",
  "Sali":           "1215265125118174",
  "Rib":            "1215265125118175",
  "GCS":            "1215265125118176",
};

function getPlatformGid(boatName) {
  if (!boatName) return null;
  // exact match first
  if (PLATFORM_MAP[boatName]) return PLATFORM_MAP[boatName];
  // partial match fallback
  const lower = boatName.toLowerCase();
  if (lower.includes("401")) return PLATFORM_MAP["BullShark 401"];
  if (lower.includes("403")) return PLATFORM_MAP["BullShark 403"];
  if (lower.includes("tiger") || lower.includes("601")) return PLATFORM_MAP["Tigershark 601"];
  if (lower.includes("alligator") || lower.includes("501")) return PLATFORM_MAP["Alligator 501"];
  if (lower.includes("unicorn")) return PLATFORM_MAP["Unicorn"];
  if (lower.includes("seame")) return PLATFORM_MAP["Seame"];
  if (lower.includes("sali")) return PLATFORM_MAP["Sali"];
  if (lower.includes("rib")) return PLATFORM_MAP["Rib"];
  if (lower.includes("gcs")) return PLATFORM_MAP["GCS"];
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const PAT = process.env.ASANA_PAT;
  if (!PAT) return res.status(500).json({ error: "ASANA_PAT not configured" });

  const { taskName, notes, boatName } = req.body;
  if (!taskName) return res.status(400).json({ error: "taskName required" });

  const PROJECT_GID = "1214564678858480";
  const SECTION_GID = "1214702463408669"; // 📥 New — Pending Review

  const platformGid = getPlatformGid(boatName);
  const customFields = platformGid ? { [PLATFORM_FIELD]: platformGid } : {};

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
          custom_fields: customFields,
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
