import OpenAI from "openai";
import http from "node:http";
import fs from "node:fs/promises";

const client = new OpenAI({
  baseURL: "https://api.sailresearch.com/v1",
  apiKey: process.env.SAIL_API_KEY,
});

const interviewPrompt = {
  role: "system",
  content: `You help users plan travel itineraries within 1 city. Ask one or two
      questions at a time, not a whole list at once. Find out these things: the
      start and end dates, travel destination, budget and currency, dietary needs,
      and interests. If the start and finish dates are the same or consecutive,
      then ask them for their arrival time (on start date) and departure time
      (on finish date). Don't suggest an itinerary yet. Don't assist with planning
      accommodation, or intercity, interstate, or international travel. Focus on
      daily activities to explore the city based on the user's interests.

      For each field under "profile", you can fill it in with either:
      i) the information from the user;
      ii) "flexible" if they say so;
      iii) "unsure" if they say so;
      iv) null if the user has not provided any information for this field; or
      v) "n/a" applies to "arrivalTime" and "departureTime" if the trip start
      date and finish date are not the same nor consecutive, or to "dietaries"
      if they have none. "n/a" doesn't apply to other fields.

      Under "profile", "budget" refers to total budget across all days for all
      activities and meals but excluding accommodation and any intercity,
      interstate, or international transport.

      Under "profile", for "startDate" and "finishDate", store the dates in this
      format: DD-MM-YYYY. If they give you a start date and a duration,
      calculate the end date.

      Under "profile", for "arrivalTime" and "departureTime", follow this
      format: 24-hour HH:MM. However they can give you the time in any format,
      e.g. they can say "5pm" or "5 in the afternoon" or "5:00pm" or "17:00" and
      you translate and store it in the correct format.

      For the field "ready", the options are true or false. The user
      questionnaire is "ready" when each field is either answered, or has been
      asked twice without an answer. Don't enquire after any topic more than
      twice.

      If the user starts to talk about topics not related to travel, tell them
      politely you cannot assist, and redirect them to the topic of travel.`,
};

const interviewSchema = {
  description: "Information for assistant to gather through user interview",
  type: "object",
  properties: {
    reply: { type: "string" },
    profile: {
      type: "object",
      properties: {
        destination: { type: [ "string", "null"] },
        startDate: { type: [ "string", "null"] },
        finishDate: { type: [ "string", "null"] },
        budget: { type: [ "string", "null"] },
        currency: { type: [ "string", "null"] },
        dietaries: { type: [ "array", "null" ], items: { type: "string" } },
        interests: { type: [ "array", "null"], items: { type: "string" } },
        arrivalTime: { type: [ "string", "null" ] },
        departureTime: { type: [ "string", "null" ] },
      },
      required: [ "destination", "startDate", "finishDate", "budget", "currency", "dietaries", "interests", "arrivalTime", "departureTime" ],
      additionalProperties: false,
    },
    ready: { type: "boolean" },
  },
  required: [ "reply", "profile", "ready"],
  additionalProperties: false,
}

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

  } else if (req.method === "GET" && req.url === "/markdown-it.js") {
    const mjs = await fs.readFile("node_modules/markdown-it/dist/browser/markdown-it.esm.min.mjs");
    res.writeHead(200, { "Content-Type": "text/javascript" });
    res.end(mjs);

  } else if (req.method === "POST" && req.url === "/api/chat") {
    let reqBody = "";

    for await (const chunk of req) {
      reqBody += chunk;
    };

    const messages = JSON.parse(reqBody);
    messages.splice(0, 0, interviewPrompt);

    try {
      const completion = await client.chat.completions.create({
        model: "deepseek-ai/DeepSeek-V4-Flash-0731",
        messages: messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "interview",
            strict: true,
            schema: interviewSchema,
          }
        }
      });

      const response = JSON.parse(completion.choices[0].message.content);
      const reply = response.reply;

      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(reply);
    } catch (error) {
      console.log(error); // this shows in the terminal
      console.log(error.message); // this shows in the terminal

      if (error.status === 404 || error.status === undefined) {
        console.log(error.message);
        res.writeHead("502", { "Content-Type": "text/plain" }); // this is sent to the browser in devtools
        res.end("Something went wrong and we're working to fix it."); // this shows in the browser
      } else if (error.status === 401) {
        console.log(error.message);
        res.writeHead("511", { "Content-Type": "text/plain" });
        res.end("Authentication failed.");
      } else if (error.status === 503) {
        console.log(error.message);
        res.writeHead("503", { "Content-Type": "text/plain" });
        res.end("Service temporarily unavailable. Try again shortly.");
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
