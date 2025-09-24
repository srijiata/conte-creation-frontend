const API_URL = "https://wq3sish8bk.execute-api.ap-south-1.amazonaws.com/dev/generate"; // replace with your POST API

const promptInput = document.getElementById("promptInput");
const generateBtn = document.getElementById("generateBtn");
const generatedImage = document.getElementById("generatedImage");
const captionEl = document.getElementById("caption");
const hashtagsEl = document.getElementById("hashtags");

generateBtn.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    alert("Please enter a prompt!");
    return;
  }

  // show loading
  captionEl.innerText = "Generating...";
  hashtagsEl.innerText = "";
  generatedImage.style.display = "none";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    console.log("API response:", data);

    // Image
    if (data.image_url) {
      generatedImage.src = data.image_url; // S3 URL version
      generatedImage.style.display = "block";
    } else if (data.image_base64) {
      generatedImage.src = `data:image/png;base64,${data.image_base64}`; // Base64 version
      generatedImage.style.display = "block";
    } else {
      generatedImage.style.display = "none";
    }

    // Caption
    if (data.caption) {
      captionEl.innerText = "Caption: " + (typeof data.caption === "string" ? data.caption : data.caption.S || "");
    } else {
      captionEl.innerText = "";
    }

    // Hashtags
    if (data.hashtags && Array.isArray(data.hashtags)) {
      const tags = data.hashtags.map(h => (typeof h === "string" ? h : h.S)).filter(Boolean).join(", ");
      hashtagsEl.innerText = tags ? "Hashtags: " + tags : "";
    } else {
      hashtagsEl.innerText = "";
    }

  } catch (err) {
    console.error("Error:", err);
    captionEl.innerText = "Something went wrong!";
    hashtagsEl.innerText = "";
    generatedImage.style.display = "none";
  }
});
