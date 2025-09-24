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

  // Show loading
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
      generatedImage.src = data.image_url;
      generatedImage.style.display = "block";
    }

    // Caption
    if (data.caption) {
      captionEl.innerText = "Caption: " + data.caption;
    } else {
      captionEl.innerText = "";
    }

    // Hashtags
    if (data.hashtags && Array.isArray(data.hashtags)) {
      hashtagsEl.innerText = "Hashtags: " + data.hashtags.join(", ");
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
