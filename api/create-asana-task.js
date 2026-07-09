import nodemailer from "nodemailer";

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
  "Stingray":       "1215332306493746",
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
  if (lower.includes("stingray")) return PLATFORM_MAP["Stingray"];
  return null;
}

async function sendEmailNotification({ taskName, notes, boatName, asanaUrl }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return; // אם אין הגדרות מייל — ממשיכים בשקט

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"LogBook" <${user}>`,
    to: user,
    subject: `🔧 בקשת עבודה חדשה: ${taskName}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #d97706;">⏳ בקשת עבודה ממתינה לאישורך</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #555;">משימה:</td>
            <td style="padding: 8px;">${taskName}</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px; font-weight: bold; color: #555;">כלי שיט:</td>
            <td style="padding: 8px;">${boatName || "לא צוין"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #555;">הערות:</td>
            <td style="padding: 8px;">${notes || "אין"}</td>
          </tr>
        </table>
        ${asanaUrl ? `<p style="margin-top: 20px;"><a href="${asanaUrl}" style="background: #4f46e5; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">פתח ב-Asana ←</a></p>` : ""}
      </div>
    `,
  });
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

    // שלח מייל התראה — לא חוסם את התגובה אם נכשל
    sendEmailNotification({
      taskName,
      notes,
      boatName,
      asanaUrl: data.data?.permalink_url,
    }).catch((err) => console.error("Email notification failed:", err));

    res.status(200).json({ gid: data.data?.gid, permalink_url: data.data?.permalink_url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
