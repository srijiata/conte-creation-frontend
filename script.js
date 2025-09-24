const API_URL = "https://wkyj4z62zi.execute-api.ap-south-1.amazonaws.com"; // <-- Replace with your API Gateway URL

async function generateImage() {
  const prompt = document.getElementById("promptInput").value;
  if (!prompt) {
    alert("Please enter a prompt!");
    return;
  }

  document.getElementById("caption").innerText = "Generating...";
  document.getElementById("hashtags").innerText = "";
  document.getElementById("generatedImage").style.display = "none";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();

    if (data.s3_url) {
      document.getElementById("generatedImage").src = data.s3_url;
      document.getElementById("generatedImage").style.display = "block";
    }

    if (data.caption) {
      document.getElementById("caption").innerText = "Caption: " + data.caption;
    }

    if (data.hashtags) {
      // DynamoDB saves hashtags as [{S:"#AI"}...], so flatten
      let tags = data.hashtags.map(h => h.S).join(", ");
      document.getElementById("hashtags").innerText = "Hashtags: " + tags;
    }

  } catch (error) {
    console.error("Error:", error);
    document.getElementById("caption").innerText = "Something went wrong!";
  }
}
