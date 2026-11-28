import MarkdownIt from '/markdown-it.js';

const md = new MarkdownIt();

const searchBox = document.getElementById("search-box");
let userInput = "";

const outputDiv = document.getElementById("output-div");

const submitBtn = document.getElementById("submit-btn");

const messages = [];

async function callLocalServer(url, prompt) {
  const response = await fetch(url, {
    method: 'POST',
    body: prompt,
  });

  return response
};

async function handleSubmit() {
  let textPlaceholder = document.createElement("p");
  textPlaceholder.textContent = "Curating information just for you ...";
  outputDiv.appendChild(textPlaceholder);

  userInput = searchBox.value;

  messages.push( {
    role: "user",
    content: userInput,
  });

  const response = await callLocalServer("http://localhost:3000/api/chat", JSON.stringify(messages));

  const responseText = await response.text();

  if (response.ok) {
    messages.push( {
      role: "assistant",
      content: responseText,
    });
  }

  const result = md.render(responseText);

  textPlaceholder.setHTML(result);
}

submitBtn.addEventListener("click", handleSubmit);

searchBox.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleSubmit();
    searchBox.value = "";
    searchBox.focus();
  }
});
