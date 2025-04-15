import axios from "axios";

const useChatbot = () => {
  const sendMessage = async (message) => {
    const API_KEY = import.meta.env.VITE_AI_API_KEY;
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    try {
      const response = await axios.post(
        API_URL,
        {
          contents: [{ parts: [{ text: message }] }],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const botMessage =
        response?.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't understand that.";

      return { success: true, botMessage };
    } catch (error) {
      console.error("Error fetching AI response:", error);
      return {
        success: false,
        botMessage: "Sorry, something went wrong!",
      };
    }
  };

  return { sendMessage };
};

export default useChatbot;