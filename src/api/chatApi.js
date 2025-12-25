// The Live Render URL
const API_URL = "https://smartcare-zflo.onrender.com/api/v1/chat";

export const sendMessageToAI = async (message) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || "AI unavailable");
    }

    return data.response; // Returns the AI text
  } catch (error) {
    console.error("Chat Error:", error);
    return "Sorry, I cannot connect to the Smartcare server right now.";
  }
};
