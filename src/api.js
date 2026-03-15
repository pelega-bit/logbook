const API_URL = "https://script.google.com/a/macros/skanarobotics.com/s/AKfycbw5fsb8QE5wnL6plSRIF8U9Q8roUZ00y6err07_T1zzltNcDLgqB8XNMrT9c1oWhHk3Pg/exec";

export async function fetchSheet(sheet) {
  const res = await fetch(`${API_URL}?sheet=${sheet}`);
  return res.json();
}

export async function addRow(sheet, data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sheet, data }),
  });
  return res.json();
}

export async function loadAppState(key) {
  const res = await fetch(`${API_URL}?mode=state&key=${encodeURIComponent(key)}`);
  return res.json();
}

export async function saveAppState(key, value) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode: "state",
      key,
      value,
    }),
  });
  return res.json();
}
