const searchBox = document.getElementById("search-box");
let userInput = "";

const outputDiv = document.getElementById("output-div");

const submitBtn = document.getElementById("submit-btn");

async function callLocalServer(url, prompt) {
  const response = await fetch(url, {
    method: 'POST',
    body: prompt,
  });

  return response
};

submitBtn.addEventListener("click", async () => {
  userInput = searchBox.value;

  const response = await callLocalServer("http://localhost:3000/api/chat", userInput);

  const responseText = await response.text();

  const textPlaceholder = document.createElement("p");
  textPlaceholder.textContent = responseText;
  outputDiv.appendChild(textPlaceholder);
})
