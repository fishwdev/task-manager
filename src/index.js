const express = require('express');
// no need for returns, use require to get it run
// Database
require('./db/mongoose');
// Routers
const userRouter = require('./routers/users');
const taskRouter = require('./routers/tasks');

const app = express();
const port = process.env.PORT;

app.use(express.json());

app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
    console.log(`Server is up on port: ${port}`);
});