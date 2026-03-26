// 🔥 CONFIG
console.log("JOIN SCRIPT LOADED");

const SUPABASE_URL = "https://mzpuuukpqjmxezltekxy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cHV1dWtwcWpteGV6bHRla3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzg5NzMsImV4cCI6MjA4OTk1NDk3M30.U8PBcRYo9p5J5yhyh0AGKS0t9hHJDPjgfAc47Mqs3_Y";
const TABLE_NAME = "join_circle_entries";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("joinCircleForm");
const statusBox = document.getElementById("joinFormStatus");
const submitBtn = document.getElementById("joinSubmitBtn");

const nameInput = form.querySelector('[name="name"]');
const emailInput = form.querySelector('[name="email"]');
const pathInput = form.querySelector('[name="path"]');
const intentionInput = form.querySelector('[name="intention"]');

function showStatus(message, type = "info") {
  statusBox.textContent = message;
  statusBox.className = `form-status ${type}`;
}

function normalizePath(value) {
  const allowed = ["seeker", "walker", "watcher", "builder", "aligned", "teacher", "unspecified"];
  const cleaned = String(value || "").trim().toLowerCase();
  return allowed.includes(cleaned) ? cleaned : "unspecified";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  console.log("FORM SUBMIT INTERCEPTED");

  event.preventDefault();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const path = normalizePath(pathInput.value);
  const intention = intentionInput.value.trim();

  if (!name || !email) {
    showStatus("Please enter your name and email.", "error");
    return;
  }

  submitBtn.disabled = true;
  console.log("Submitting payload", { name, email, path, intention });
  showStatus("Submitting your entry...", "info");
  

  try {
    const payload = { name, email, path, intention };

    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .upsert(payload)
      .select();

    console.log("Supabase response:", { data, error });

    if (error) throw error;

    showStatus("You have successfully entered the Circle.", "success");
    form.reset();
  } catch (error) {
    console.error("Join Circle submit error:", error);
    showStatus(error.message || "Failed to submit entry.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});