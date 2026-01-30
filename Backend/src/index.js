import express from "express";
import dotenv from "dotenv";



dotenv.config({ path: './.env' })

const app = express();
const port = process.env.PORT || 4000;


app.get('/', (req, res) => {
  res.send('Hello World')
})


app.listen(port, ()=>{
    console.log(`Server Running at port: ${port}`);
})