const express = require('express');
const app = express();
const PORT = 3000;

let lastChanged = null; // Store the last time the litter was changed

app.use(express.json());

app.get('/lastChanged', (req, res) => {
  res.json({ lastChanged });
});

app.post('/changeLitter', (req, res) => {
  lastChanged = new Date(); // Update lastChanged to the current date and time
  res.json({ success: true, lastChanged });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
