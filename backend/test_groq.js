import 'dotenv/config';
import fs from 'fs';
import axios from 'axios';

async function test() {
  try {
    const formData = new FormData();
    // create fake webm
    const blob = new Blob([Buffer.from([0,0,0])], { type: "audio/webm" });
    formData.append("file", blob, "test.webm");
    formData.append("model", "whisper-large-v3-turbo");

    const res = await axios.post("https://api.groq.com/openai/v1/audio/transcriptions", formData, {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }
    });
    console.log(res.data);
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
}
test();
