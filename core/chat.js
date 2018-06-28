"use scrict";

const EventEmitter = require("eventEmitter3");

class Chat extends EventEmitter {
	constructor(core, userID) {
		super();
		if (!core || !userID) {
			throw new Error("You need to specify a core and userID");
		}
		this.handler = core;
		this.userID = userID;
	}

	say(message, options) {
		return this.handler.say(this.userID, message, options);
	}

	sendTextMessage(text, quickReplies, options) {
		return this.handler.sendTextMessage(
			this.userId,
			text,
			quickReplies,
			options
		);
	}

	conversation(factory) {
		return this.handler.conversation(this.userID, factory);
	}
}

module.exports = Chat;
