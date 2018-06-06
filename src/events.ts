import { EventEmitter } from "events";
import { SendEmail } from "./emailConfig";
const pubsub = new EventEmitter();

pubsub.on("email", SendEmail);

export { pubsub };
