const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const matchRoutes = require('./routes/match');

const app = express();

app.use(cors());
app.use(express.json());
app.use(fileUpload());

// ✅ This is the fix — mount at /api (not /api/match)
app.use('/api/match', matchRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
