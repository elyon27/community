// 🔥 CONFIG


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

function addAccountLink() {
  const link = document.createElement("a");
  link.href = "/chambers/account.html";
  link.className = "chamber-link";
  link.textContent = "Open account page →";
  statusBox.append(document.createElement("br"), link);
}

function normalizePath(value) {
  const allowed = ["seeker", "walker", "watcher", "builder", "aligned", "teacher", "unspecified"];
  const cleaned = String(value || "").trim().toLowerCase();
  return allowed.includes(cleaned) ? cleaned : "unspecified";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submitBtn.disabled) return;

  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const path = normalizePath(pathInput.value);
  const intention = intentionInput.value.trim();

  if (!name || !email) {
    showStatus("Please enter your name and email.", "error");
    return;
  }

  submitBtn.disabled = true;
  showStatus("Submitting your entry...", "info");
  

  try {
    const payload = { name, email, path, intention };

    const { error } = await supabaseClient
      .from(TABLE_NAME)
      .insert(payload);


    if (error) throw error;

    showStatus("Your membership application has been submitted. Use the account page to create a sign-in account or sign in.", "success");
    addAccountLink();
    form.reset();
  } catch (error) {
    if (error.code === "23505") {
      showStatus("A membership application already exists for this email. Your existing application has been kept. To enter the chambers, sign in or create a sign-in account.", "info");
      addAccountLink();
    } else {
      showStatus("We could not submit your application. Please try again later. If you already applied, use the account page to sign in.", "error");
      addAccountLink();
    }
  } finally {
    submitBtn.disabled = false;
  }
});