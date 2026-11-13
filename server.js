import OpenAI from "openai";
import http from "node:http";
import fs from "node:fs/promises";

const client = new OpenAI({
  baseURL: "https://api.sailresearch.com/v1",
  apiKey: process.env.SAIL_API_KEY,
});

// console.log(process.env.SAIL_API_KEY ? "Key loaded" : "Key missing");
// this tests that the API key works without using tokens

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    const html = await fs.readFile("public/index.html");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);

  } else if (req.method === "GET" && req.url === "/main.js") {
    const js = await fs.readFile("public/main.js");
    res.writeHead(200, { "Content-Type": "text/javascript" });
    res.end(js);

  } else if (req.method === "POST" && req.url === "/api/chat") {
    let reqBody = "";

    for await (const chunk of req) {
      reqBody += chunk
    };

    const completion = await client.chat.completions.create({
      model: "zai-org/GLM-5.3",
      messages: [
        {
          role: "user",
          content: reqBody,
        },
      ],
    });
    const aiReply = completion.choices[0].message.content;

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(aiReply);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
