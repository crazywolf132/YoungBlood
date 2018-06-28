"use strict";
const EventEmitter = require("eventemitter3");
const Chat = require("./chat");
const Conversation = require("./conversations");
const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const fetch = require("node-fetch");

class YoungBlood extends EventEmitter {
	constructor(options) {
		super();
		if (
			!options ||
			(options &&
				(!options.accessToken || !options.verifyToken || !options.appSecret))
		) {
			throw new Error(
				"You need to specify an accessToken, verifyToken and an appSecret"
			);
		}
		this.actions = [];
		this._conversations = [];
		this.accessToken = options.accessToken;
		this.verifyToken = options.verifyToken;
		this.appSecret = options.appSecret;
		this.app = express();
		this.webhook = "/webhook";
		this.app.use(bodyParser.json({ verify: this._verifySignature.bind(this) }));
	}

	/*
  ███████ ███████ ██████  ██    ██ ███████ ██████
  ██      ██      ██   ██ ██    ██ ██      ██   ██
  ███████ █████   ██████  ██    ██ █████   ██████
       ██ ██      ██   ██  ██  ██  ██      ██   ██
  ███████ ███████ ██   ██   ████   ███████ ██   ██
  */

	start(port) {
		this._startWebhook();
		this.app.set("port", port || 80);
		this.server = this.app.listen(this.app.get("port"), () => {
			const portNum = this.app.get("port");
			console.log(`Core running on port: ${portNum}`);
		});
	}

	close() {
		this.server.close();
	}

	_startWebhook() {
		this.app.get(this.webhook, (req, res) => {
			if (
				req.query["hub.mode"] === "subscrive" &&
				req.query["hub.verify_token"] === this.verifyToken
			) {
				console.log("Validation Succeded.");
				res.status(200).send(req.query["hub.challenge"]);
			} else {
				console.error(
					"Failed validation. Make sure the validation tokens match."
				);
				res.sendStatus(403);
			}
		});

		this.app.post(this.webhook, (req, res) => {
			var data = req.body;
			if (data.object !== "page") {
				return;
			}
			this.handleFacebookData(data);

			res.sendStatus(200);
		});
	}

	/*
  ███    ███ ███████ ████████ ██   ██  ██████  ██████  ███████
  ████  ████ ██         ██    ██   ██ ██    ██ ██   ██ ██
  ██ ████ ██ █████      ██    ███████ ██    ██ ██   ██ ███████
  ██  ██  ██ ██         ██    ██   ██ ██    ██ ██   ██      ██
  ██      ██ ███████    ██    ██   ██  ██████  ██████  ███████
  */

	say(recipientID, message, options) {
		if (typeof message === "string") {
			return this.sendTextMessage(recipientID, message, [], options);
		} else if (message && message.text) {
			if (message.quickReplies && message.quickReplies.length > 0) {
				return this.sendTextMessage(
					recipientID,
					message.text,
					message.quickReplies,
					options
				);
			}
		}
		console.error("Invalid format for .say() message");
	}

	sendTextMessage(recipientID, text, quickReplies, options) {
		const message = { text };
		const formattedQuickReplies = this._formatQuickReplies(quickReplies);
		if (formattedQuickReplies && formattedQuickReplies.length > 0) {
			message.quick_replies = formattedQuickReplies;
		}
		return this.sendMessage(recipientID, message, options);
	}

	setGreetingText(text) {
		const greeting =
			typeof text !== "string" ? text : [{ locale: "default", text }];
		return this.sendProfileRequest({ greeting });
	}

	setGetStartedButton(action) {
		const payload =
			typeof action === "string" ? action : "YOUNGBLOOD_GET_STARTED";
		if (typeof action === "function") {
			this.on(`postback:${payload}`, action);
		}
		return this.sendProfileRequest({
			get_started: {
				payload,
			},
		});
	}

	deletedGetStartedButton() {
		return this.sendProfileRequest({ fields: ["get_started"] }, "DELETE");
	}

	getUserProfile(userID) {
		const url = `https://graph.facebook.com/v2.6/${userID}?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=${
			this.accessToken
		}`;
		return fetch(url)
			.then((res) => res.json())
			.catch((err) => console.log(`Error getting user profile: ${err}`));
	}

	hear(keywords, callback) {
		keywords = Array.isArray(keywords) ? keywords : [keywords];
		keywords.forEach((keyword) => this.actions.push({ keyword, callback }));
		return this;
	}

	conversation(recipientId, factory) {
		if (!recipientId || !factory || typeof factory !== "function") {
			return console.error(
				`You need to specify a recipient and a callback to start a conversation`
			);
		}
		const convo = new Conversation(this, recipientId);
		this._conversations.push(convo);
		convo.on("end", (endedConvo) => {
			const removeIndex = this._conversations.indexOf(endedConvo);
			this._conversations.splice(removeIndex, 1);
		});
		factory.apply(this, [convo]);
		return convo;
	}

	/*
  ██      ██ ███████ ████████ ███████ ███    ██ ███████ ██████  ███████
  ██      ██ ██         ██    ██      ████   ██ ██      ██   ██ ██
  ██      ██ ███████    ██    █████   ██ ██  ██ █████   ██████  ███████
  ██      ██      ██    ██    ██      ██  ██ ██ ██      ██   ██      ██
  ███████ ██ ███████    ██    ███████ ██   ████ ███████ ██   ██ ███████
  */

	handleFacebookData(data) {
		data.entry.forEach((entry) => {
			if (entry.messaging) {
				entry.messaging.forEach((event) => {
					if (event.message && event.message.text) {
						this._handleMessageEvent(event);
						if (event.message.quick_reply) {
							this._handleQuickReplyEvent(event);
						}
					} else if (event.postback) {
						console.log("button was pressed");
						this._handlePostbackEvent(event);
					} else if (event.delivery) {
						this._handleEvent("delivery", event);
					} else if (event.read) {
						this._handleEvent("read", event);
					} else {
						console.log("Webhook received unknown event: ", event);
					}
				});
			}
		});
	}

	_handleMessageEvent(event) {
		if (this._handleConversationResponse("message", event)) {
			return;
		}
		const text = event.message.text;
		const senderId = event.sender.id;
		let captured = false;
		if (!text) {
			return;
		}

		this.actions.forEach((hear) => {
			if (
				typeof hear.keyword === "string" &&
				hear.keyword.toLowerCase() === text.toLowerCase()
			) {
				const res = hear.callback.apply(this, [
					event,
					new Chat(this, senderId),
					{ keyword: hear.keyword, captured },
				]);
				captured = true;
				return res;
			}
		});

		this._handleEvent("message", event, { captured });
	}

	_handleEvent(type, event, data) {
		const recipient =
			type === "authentication" && !event.sender
				? { user_ref: event.optin.user_ref }
				: event.sender.id;
		const chat = new Chat(this, recipient);
		this.emit(type, event, chat, data);
	}

	_handleConversationResponse(type, event) {
		const userID = event.sender.id;
		let captured = false;
		this._conversations.forEach((convo) => {
			if (userID && userID === convo.userID && convo.isActive()) {
				captured = true;
				return convo.respond(event, { type });
			}
		});
		return captured;
	}

	_handlePostbackEvent(event) {
		if (this._handleConversationResponse("postback", event)) {
			return;
		}
		const payload = event.postback.payload;
		if (payload) {
			this._handleEvent(`postback:${payload}`, event);
		}
		this._handleEvent("postback", event);
	}

	_handleQuickReplyEvent(event) {
		if (this._handleConversationResponse("quick_reply", event)) {
			return;
		}
		const payload =
			event.message.quick_reply && event.message.quick_reply.payload;
		if (payload) {
			this._handleEvent(`quick_reply:${payload}`, event);
		}
		this._handleEvent("quick_reply", event);
	}

	/*
  ██   ██  █████  ███    ██ ██████  ██      ███████ ██████  ███████
  ██   ██ ██   ██ ████   ██ ██   ██ ██      ██      ██   ██ ██
  ███████ ███████ ██ ██  ██ ██   ██ ██      █████   ██████  ███████
  ██   ██ ██   ██ ██  ██ ██ ██   ██ ██      ██      ██   ██      ██
  ██   ██ ██   ██ ██   ████ ██████  ███████ ███████ ██   ██ ███████
  */

	sendAction(recipientId, action, options) {
		const recipient = this._createRecipient(recipientId);
		return this.sendRequest({
			recipient,
			sender_action: action,
		});
	}

	sendTypingIndicator(recipientId, milliseconds) {
		const timeout = isNaN(milliseconds) ? 0 : milliseconds;
		if (milliseconds > 20000) {
			milliseconds = 20000;
			console.error(
				"Typing indicator cant be longer than 20000 milliseconds (20 seconds)"
			);
		}
		return new Promise((resolve, reject) => {
			return this.sendAction(recipientId, "typing_on").then(() => {
				setTimeout(
					() =>
						this.sendAction(recipientId, "typing_off").then((json) =>
							resolve(json)
						),
					timeout
				);
			});
		});
	}

	sendRequest(body, endpoint, method) {
		endpoint = endpoint || "messages";
		method = method || "POST";
		return fetch(
			`https://graph.facebook.com/v2.6/me/${endpoint}?access_token=${
				this.accessToken
			}`,
			{
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			}
		)
			.then((res) => res.json())
			.then((res) => {
				return res;
			})
			.catch((err) => console.log(`Error sending message: ${err}`));
	}

	sendProfileRequest(body, method) {
		return this.sendRequest(body, "messenger_profile", method);
	}

	sendMessage(recipientId, message, options) {
		console.log("runnign");
		const recipient = this._createRecipient(recipientId);
		const messagingType = options && options.messagingType;
		const notificationType = options && options.notificationType;
		const tag = options && options.tag;
		const onDelivery = options && options.onDelivery;
		const onRead = options && options.onRead;
		const reqBody = {
			recipient,
			message,
			messaging_type: messagingType || "RESPONSE",
		};

		// These are optional params, only add them to the request body
		// if they're defined.
		if (notificationType) {
			reqBody.notification_type = notificationType;
		}
		if (tag) {
			reqBody.tag = tag;
		}
		const req = () =>
			this.sendRequest(reqBody).then((json) => {
				if (typeof onDelivery === "function") {
					this.once("delivery", onDelivery);
				}
				if (typeof onRead === "function") {
					this.once("read", onRead);
				}
				return json;
			});
		if (options && options.typing) {
			const autoTimeout =
				message && message.text ? message.text.length * 10 : 1000;
			const timeout =
				typeof options.typing === "number" ? options.typing : autoTimeout;
			return this.sendTypingIndicator(recipientId, timeout).then(req);
		}
		return req();
	}

	_formatQuickReplies(quickReplies) {
		return (
			quickReplies &&
			quickReplies.map((reply) => {
				if (typeof reply === "string") {
					return {
						content_type: "text",
						title: reply,
						payload: "BOOTBOT_QR_" + reply,
					};
				} else if (reply && reply.title) {
					return Object.assign(
						{
							content_type: "text",
							payload: "BOOTBOT_QR_" + reply.title,
						},
						reply
					);
				}
				return reply;
			})
		);
	}

	_createRecipient(recipient) {
		return typeof recipient === "object" ? recipient : { id: recipient };
	}

	_verifySignature(req, res, buf) {
		var signature = req.headers["x-hub-signature"];
		if (!signature) {
			throw new Error("Couldn't validate the request signature.");
		} else {
			var elements = signature.split("=");
			var method = elements[0];
			var signatureHash = elements[1];
			var expectedHash = crypto
				.createHmac("sha1", this.appSecret)
				.update(buf)
				.digest("hex");

			if (signatureHash != expectedHash) {
				throw new Error("Couldnt validate the requested signature.");
			}
		}
	}
}

module.exports = YoungBlood;
