import express, {
  Application, 
  Request, Response
} from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
dotenv.config();

const app: Application = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.listen(process.env.PORT, () => console.log(`server is running on http://localhost:${process.env.PORT}`))