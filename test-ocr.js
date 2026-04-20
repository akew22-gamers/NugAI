const Tesseract = require('tesseract.js');

async function run() {
  try {
    console.log("Creating worker...");
    const result = await Tesseract.recognize('https://tesseract.projectnaptha.com/img/eng_bw.png', 'eng');
    console.log("Result length:", result.data.text.length);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
