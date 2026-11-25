import OpenAI from "openai";
import http from "node:http";
import fs from "node:fs/promises";
import MarkdownIt from 'markdown-it';

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

  } else if (req.method === "GET" && req.url === "/styles.css") {
    const css = await fs.readFile("public/styles.css");
    res.writeHead(200, { "Content-Type": "text/css" });
    res.end(css);

  } else if (req.method === "POST" && req.url === "/api/chat") {
    let reqBody = "";

    for await (const chunk of req) {
      reqBody += chunk;
    };

    const messages = JSON.parse(reqBody);

    try {
      const completion = await client.chat.completions.create({
        model: "deepseek-ai/DeepSeek-V4-Flash-0731",
        messages: messages,
      });

      const md = new MarkdownIt();
      const response = completion.choices[0].message.content;
      const result = md.render(response);

      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(result);
    } catch (error) {
      console.log(error); // this shows in the terminal
      console.log(error.message); // this shows in the terminal

      if (error.status === 404 || error.status === undefined) {
        console.log(error.message);
        res.writeHead("502", { "Content-Type": "text/plain" }); // this is sent to the browser in devtools
        res.end("Something went wrong  and we're working to fix it."); // this shows in the browser
      } else if (error.status === 401) {
        console.log(error.message);
        res.writeHead("511", { "Content-Type": "text/plain" });
        res.end("Authentication failed.");
      }
    } finally {
      res.end();
    };
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
