import * as nodemailer from "nodemailer";
import { STMP_CONFIG } from "./constants";

const transporter = nodemailer.createTransport(STMP_CONFIG);

transporter.verify((error, success) => {
  if (error) {
    console.log("An error occurred configuring nodemailer: ", error);
  } else {
    console.log("nodemailer configured successfully");
  }
});

const loggingCallback = (error, info) => {
  if (error) {
    return console.log("An error occurred sending the email: ", error);
  } else {
    return console.log("Message sent successfully: ", info);
  }
};
export const SendEmail = message =>
  transporter.sendMail(message, loggingCallback).catch(console.log);
