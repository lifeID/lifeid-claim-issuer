import { EventEmitter } from "events";
import { sendEmail } from "./services/emailService";
const pubsub = new EventEmitter();

function setupEvents() {
  pubsub.on("email:sendConfirmationEmail", sendEmail);
}

export { pubsub, setupEvents };
