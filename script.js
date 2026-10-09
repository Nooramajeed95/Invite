// Your Google Apps Script web app URL (where answers get saved).
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwYkhlXr491nyOx3Vkpev9uT2rQx4M-Fz_hxQPN351KbOYxpKwcNDz9EeM0Pn28OYmJ/exec";


// Each key is what goes after "?for=" in a person's personal link.
const NAMES = {
  "harrm-fatima": "Harrm Fatima",
  "noor-ul-huda": "Noor-Ul-Huda",
  "kashaf-fatima": "Kashaf Fatima",
  "fatima": "Fatima",
  "amna": "Amna",
  "tayyab-bhai": "Tayyab bhai",
  "muneeb-khilji": "Muneeb Khilji",
  "abu-bakar": "Abu bakar",
  "muaaz-ahmed": "Muaaz Ahmed",
  "abdullah-talish": "Abdullah Talish",
  "adeel": "Adeel"
  "muhammad-abdullah": "Muhammad Abdullah",
  "mateen": "Mateen",
  "faizan": "Faizan",
  "pakiza-syed": "Pakiza Syed",
  "sameer-awan" : "Sameer Awan"
};

const ROLES = [
  ["Opening", "Introduces the group and topic"],
  ["Part 1", "Main content, first section"],
  ["Part 2", "Main content, middle section"],
  ["Part 3", "Main content, last section"],
  ["Closing", "Wraps up and thanks everyone"],
  ["Slides / support", "Helps with design and backup"],
  ["Anywhere is fine", "Happy to take whatever is left"]
];


const $ = id => document.getElementById(id);

// Work out who is opening the page from the link (?for=amna)
let who = new URLSearchParams(location.search).get("for");

if (!NAMES[who]) {
  who = null;
}

let answer = null;


// A small ID so we can tell devices apart in the sheet
let device = "unknown";

try {
  device = localStorage.getItem("dev") || ("d" + Math.random().toString(36).slice(2, 10));
  localStorage.setItem("dev", device);
} catch (e) {}


function post(data) {

  if (!SCRIPT_URL) {
    return Promise.resolve(false);
  }

  return fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(Object.assign({
      device: device,
      time: new Date().toISOString()
    }, data))
  })
    .then(() => true)
    .catch(() => false);

}


function setName() {

  $("hello").textContent = who
    ? "Hi " + NAMES[who] + ", you're invited to our group"
    : "You're invited to our group";

}


function renderList(names) {

  const box = $("inList");

  if (!names.length) {
    box.innerHTML = "<p>Nobody has confirmed yet. You could be the first.</p>";
    return;
  }

  const ul = document.createElement("ul");

  names.forEach(n => {
    const li = document.createElement("li");
    li.textContent = n;
    ul.appendChild(li);
  });

  box.replaceChildren(ul);

}


function loadList() {

  if (!SCRIPT_URL) {
    return;
  }

  fetch(SCRIPT_URL + "?action=list")
    .then(r => r.json())
    .then(d => renderList(d.confirmed || []))
    .catch(() => {});

}


// Build the role options
ROLES.forEach(([r, d]) => {

  const l = document.createElement("label");

  l.innerHTML =
    '<input type="radio" name="role" value="' + r + '">' +
    "<span>" + r + "<small>" + d + "</small></span>";

  $("roles").appendChild(l);

});


setName();


function pick(v) {

  answer = v;

  $("yesBtn").setAttribute("aria-pressed", v === "yes");
  $("noBtn").setAttribute("aria-pressed", v === "no");

  $("roleBlock").classList.toggle("hidden", v !== "yes");
  $("msg").textContent = "";

}

$("yesBtn").onclick = () => pick("yes");
$("noBtn").onclick = () => pick("no");


$("sendBtn").onclick = async () => {

  const msg = $("msg");

  if (!who) {
    msg.textContent = "This link is missing your name. Please ask for your personal link.";
    return;
  }

  if (!answer) {
    msg.textContent = "Please tap Yes or Can't this time.";
    return;
  }

  const roleEl = document.querySelector('input[name="role"]:checked');

  if (answer === "yes" && !roleEl) {
    msg.textContent = "Please pick the part you'd like to cover.";
    return;
  }

  const btn = $("sendBtn");
  btn.disabled = true;
  btn.textContent = "Sending...";

  const ok = await post({
    type: "answer",
    who: NAMES[who],
    answer: answer,
    role: answer === "yes" ? roleEl.value : "",
    note: $("note").value.trim()
  });

  btn.disabled = false;
  btn.textContent = "Send my answer";

  if (SCRIPT_URL && !ok) {
    msg.textContent = "That didn't go through. Please check your connection and try again.";
    return;
  }

  $("formCard").classList.add("hidden");
  $("thanksCard").classList.remove("hidden");

  if (answer === "yes") {

    $("thanksTitle").textContent = "You're in. Thank you!";
    $("thanksText").textContent = "We've noted your choice: " + roleEl.value + ". We'll get in touch soon.";

    if (!SCRIPT_URL) {
      renderList([NAMES[who]]);
    } else {
      loadList();
    }

  } else {

    $("thanksTitle").textContent = "Thanks for letting us know";
    $("thanksText").textContent = "No problem at all. We appreciate you answering.";

  }

};


if (!SCRIPT_URL) {
  $("demoNote").classList.remove("hidden");
}

post({ type: "open", who: who ? NAMES[who] : "" });
loadList();
