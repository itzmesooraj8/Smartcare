// Use the configured API base (falls back to localhost)
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1") + '/chat';

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
