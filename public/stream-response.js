const API_URL = "https://api.openai.com/v1/chat/completions";

const API_KEY = "put your own key";

document.getElementById("generateBtn").style.display = "none";
document.getElementById("stopBtn").style.display = "none";

// Array containing texts for the chips
const texts = [
  "Target Audience",
  "Brand",
  "Market Research",
  "Digital Marketing",
  "Content Marketing",
  "SEO",
  "ROI",
  "Social Media Marketing",
  "Influencer Marketing",
  "Analytics",
];

// Function to be triggered when chip is clicked
function chipClicked(text) {
  document.getElementById("promptInput").value = text;
  setTimeout(() => {
    document.getElementById("generateBtn").click();
  }, 1000);
  //console.log("Chip clicked:", text);
  // You can perform any action you want here
}

// Reference to the container
const container = document.getElementById("chipContainer");

// Iterate over the array
texts.forEach((text) => {
  // Create a span element
  const span = document.createElement("span");
  span.className =
    "inline-flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2";
  span.textContent = text;

  // Create a button element
  const button = document.createElement("button");
  button.className = "ml-2 focus:outline-none";
  button.innerHTML = `
               <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-600 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                   <path fill-rule="evenodd" d="M10 18a.833.833 0 01-.833-.833v-6.667H2.5a.833.833 0 110-1.667h6.667V2.5a.833.833 0 111.667 0v6.667h6.667a.833.833 0 110 1.667h-6.667v6.667A.833.833 0 0110 18z" clip-rule="evenodd"/>
               </svg>
           `;

  // Add click event to the button
  button.addEventListener("click", function (event) {
    event.stopPropagation(); // Prevent the click event from bubbling to the span
    chipClicked(text);
  });

  // Add click event to the span
  span.addEventListener("click", function () {
    chipClicked(text);
  });

  // Append button to span
  span.appendChild(button);

  // Append span to container
  container.appendChild(span);
});

/**
 * This code demonstrates how to use the OpenAI API to generate chat completions.
 * The generated completions are received as a stream of data from the API and the
 * code includes functionality to handle errors and abort requests using an AbortController.
 * The API_KEY variable needs to be updated with the appropriate value from OpenAI for successful API communication.
 */

const promptInput = document.getElementById("promptInput");
const generateBtn = document.getElementById("generateBtn");
const stopBtn = document.getElementById("stopBtn");
const resultText = document.getElementById("resultText");

let controller = null; // Store the AbortController instance

const generate = async () => {
  // Alert the user if no prompt value
  if (!promptInput.value) {
    alert("Please enter a prompt.");
    return;
  }

  // Disable the generate button and enable the stop button
  generateBtn.disabled = true;
  stopBtn.disabled = false;
  resultText.innerText = "Generating...";

  // Create a new AbortController instance
  controller = new AbortController();
  const signal = controller.signal;

  try {
    // Fetch the response from the OpenAI API with the signal from AbortController
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: promptInput.value }],
        max_tokens: 500,
        stream: true, // For streaming responses
      }),
      signal, // Pass the signal to the fetch request
    });

    // Read the response as a stream of data
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    resultText.innerText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      // Massage and parse the chunk of data
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      console.log(lines);
      const parsedLines = lines
        .map((line) => line.replace(/^data: /, "").trim()) // Remove the "data: " prefix
        .filter((line) => line !== "" && line !== "[DONE]") // Remove empty lines and "[DONE]"
        .map((line) => JSON.parse(line)); // Parse the JSON string

      for (const parsedLine of parsedLines) {
        const { choices } = parsedLine;
        const { delta } = choices[0];
        const { content } = delta;
        // Update the UI with the new content
        if (content) {
          resultText.innerText += content;
        }
      }
    }
  } catch (error) {
    // Handle fetch request errors
    if (signal.aborted) {
      resultText.innerText = "Request aborted.";
    } else {
      console.error("Error:", error);
      resultText.innerText = "Error occurred while generating.";
    }
  } finally {
    // Enable the generate button and disable the stop button
    generateBtn.disabled = false;
    stopBtn.disabled = true;
    controller = null; // Reset the AbortController instance
  }
};

const stop = () => {
  // Abort the fetch request by calling abort() on the AbortController instance
  if (controller) {
    controller.abort();
    controller = null;
  }
};

promptInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    generate();
  }
});
generateBtn.addEventListener("click", generate);
stopBtn.addEventListener("click", stop);
