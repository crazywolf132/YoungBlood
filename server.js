/**
 * This is YoungBlood. Developed by Brayden Moon AKA Crazywolf132.
 *
 * This is a facebook messenger bot re-imagined. This is developed to help teenagers and young
 * adults talk to someone without needing to signup to a completely different website and using
 * a hard to use chat system.
 *
 * They will be able to use their more familiar facebook messenger chat.
 *
 * To make this different and confidential. Users will talk to our bot, which will
 * relay the messages to the helper on the other end. Rather than directly talking to that person,
 * as some might feel embarassed or such. As it is a way to mask ones identity.
 *
 * The only information we ask for is a username and a DOB. The DOB is required so we can
 * try to keep the 17 and unders, talking to themselves. As we dont want "creepy" older people to be
 * able to talk to them.
 *
 * We could always follow this up by requesting their facebook DOB.
 *
 *
 * There will be a way for the In-need to report a helper if shit does hit the fan aswell.
 * As we dont want people abusing the system and using it as a way to push people to doing things
 * they dont want to.
 *
 * There will also be a system to allow for the listeners to Notify us that there is a problem in the
 * chat, that they are not comfortable with. An admin should be able to step in then.
 *
 * Another system should be inplace to detect life threatening messages coming from the in-need.
 * Such as talk of killing one's self. At which point the bot will display a quick toggle to call the
 * suicide-hotline.
 *
 * This bot is not being created as a replacement to an organsiation such as suicide-hotline. Instead
 * it is a replacement to other peer support websites and applications/services.
 */
const nlp = require("compromise");
const config = require("./config/config");

("use strict");
const YoungBlood = require("./core/youngblood");

const messenger = new YoungBlood({
	accessToken: config.accessToken,
	verifyToken: config.verifyToken,
	appSecret: config.appSecret,
});

/*
███████ ██    ██ ███    ██  ██████ ████████ ██  ██████  ███    ██ ███████
██      ██    ██ ████   ██ ██         ██    ██ ██    ██ ████   ██ ██
█████   ██    ██ ██ ██  ██ ██         ██    ██ ██    ██ ██ ██  ██ ███████
██      ██    ██ ██  ██ ██ ██         ██    ██ ██    ██ ██  ██ ██      ██
██       ██████  ██   ████  ██████    ██    ██  ██████  ██   ████ ███████
*/

// The in-memory database...
/**
 * All information we keep is purely a username, and an age. Along with userID.
 * We keep this information so we can inform the Listener when you connect.
 * As this will make it easier for them.
 *
 * Maybe we could keep a log of the Listeners messages, so then if there is any reports
 * of miss use of the system, we could see and potentially ban that user from being a listener?
 * Though, this may break a few of the privacy rules... idk?
 */

/**
 * An example of a connection might be:
 * {'listenerID':'inneedID', 'inneedID':'listenerID'}
 * That way we have a solid memory of who is connected to who.
 */
var interactions = {};

/**
 * This will be used to remember who is what.
 * For example, it will remember ur information such as BDAY, USERNAME.
 * It will also keep information such as whether or not you are a listener
 */
var information = {};

var waitingListeners = [];

var waitingInneeds = [];

/**
 *	To make it easier on the user to distinguish what messages are from a human,
 *	and what are from the bot, we will use some emojies...
 */

const connect2people = (person1, person2) => {
	information[person1].waiting = false;
	information[person2].waiting = false;
	information[person1].connected = true;
	information[person2].connected = true;
	interactions[person1] = person2;
	interactions[person2] = person1;
};

const createMessageMenu = (person) => {
	var type = information[person].status;
	var quickReplies = [];
	var otherPerson = interactions[person];
	var otherPerson = information[otherPerson].username;
	if (type == "listener") {
		quickReplies.push(`Talking to: ${otherPerson}`);
		quickReplies.push(`I can't handle this`);
		quickReplies.push(`End Chat`);
	} else {
		quickReplies.push(`Talking to: ${otherPerson}`);
		quickReplies.push(`Report Listener`);
		quickReplies.push(`End Chat`);
	}
	return quickReplies;
};

const connectToListener = (inneed, chat) => {
	// We just need to make sure they arent already in a chat...
	if (
		information[inneed].waiting == false &&
		information[inneed].connected == false
	) {
		// Starting off a typing const...
		const typing = { typing: true };
		// First check to see if there are any listeners waiting...
		if (waitingListeners.length == 0) {
			// There are no avaliable listeners.
			// We will just add the inneed to the waiting list and let them know.
			waitingInneeds.push(inneed);
			// Setting them to waiting status...
			information[inneed].waiting = true;
			var amount = waitingInneeds.length;
			chat.say(`🤖 You are number: ${amount}, in the que.`, typing);
		} else {
			// There are some listeners avaliable.
			// We will now connect to the first waiting Listener...
			var person = information[waitingListeners[0]].username;
			var me = information[inneed].username;
			information[inneed].status = "inneed";
			information[waitingListeners[0]].status = "listener";

			chat.sendToID(
				waitingListeners[0],
				`🤖 Here they come! You are being connected to ${me}`,
				typing
			);
			chat.sendToID(
				inneed,
				`🤖 Woohoo! You are being connected to ${person}`,
				typing
			);

			connect2people(inneed, waitingListeners[0]);
			waitingListeners.shift();
		}
	}
};

const connectToInNeed = (Listener, chat) => {
	if (
		information[Listener].waiting == false &&
		information[Listener].connected == false
	) {
		if (waitingInneeds.length == 0) {
			waitingListeners.push(Listener);
			var amount = waitingListeners.length;
			information[Listener].waiting = true;
			chat.say(`🤖 You are number: ${amount}, in the que.`, { typing: true });
		} else {
			// We just need to connect the listener with the first person in the in-needs list.
			var person = information[waitingInneeds[0]].username;
			var me = information[Listener].username;
			information[Listener].status = "listener";
			information[waitingInneeds[0]].status = "inneed";

			chat.sendToID(
				Listener,
				`🤖 Here they come! You are being connected to ${person}.`,
				{ typing: true }
			);
			chat.sendToID(
				waitingInneeds[0],
				`🤖 Woohoo! You are being connect to ${me}.`,
				{ typing: true }
			);

			connect2people(Listener, waitingInneeds[0]);
			waitingInneeds.shift();
		}
	}
};

const disconnectPeople = (person, chat) => {
	// We only need the person who asked for the chat to end.
	// We will be able to get their partner from it.
	var personName = information[person].username;
	chat.sendToID(
		interactions[person],
		`🤖 ${personName}, has disconnected the chat.`,
		{ typing: true }
	);
	chat.sendToID(person, `🤖 You have ended the chat.`, { typing: true });

	information[person].connected = false;
	information[interactions[person]].connected = false;
	information[person].status = "";
	information[interactions[person]].status = "";
	delete interactions[interactions[person]];
	delete interactions[person];
};

const passOntoSender = (RecieverID, chat, message) => {
	//We are just going to get the quick replies menu and add it...
	var qReplies = createMessageMenu(RecieverID);

	chat.sendToID(
		RecieverID,
		{ text: message, quickReplies: qReplies },
		{ typing: true }
	);
	//chat.sendToID(RecieverID, message, { typing: true });
};

messenger.setGreetingText("Hey there! Welcome to Young Blood!");

messenger.setGetStartedButton((payload, chat) => {
	let typing = { typing: true };
	if (payload.sender.id in interactions) {
		let username = information[payload.sender.id]["username"];
		chat.say(`Welcome back ${username}!`);
	} else {
		information[payload.sender.id] = {};
		information[payload.sender.id].waiting = false;
		information[payload.sender.id].connected = false;
		interactions[payload.sender.id] = {};

		const askUsername = (convo) => {
			convo.ask(
				`What would you like your username to be?`,
				(payload, convo) => {
					const text = payload.message.text;
					information[payload.sender.id]["username"] = text;
					convo.say(`Oh, awesome!`, typing).then(() => askDOB(convo));
				}
			);
		};

		const askDOB = (convo) => {
			convo.ask(
				`Last question. Whats your date of birth?`,
				(payload, convo) => {
					const text = payload.message.text;
					information[payload.sender.id]["dob"] = text;
					convo
						.say(
							{
								text: `Sweet! Thankyou.`,
								quickReplies: ["Become a listener", "I need some help"],
							},
							typing
						)
						.then(() => convo.end());
				}
			);
		};

		chat.conversation((convo) => {
			chat
				.say("Howdy partner! We are sure glad you found us.", typing)
				.then(() => askUsername(convo));
		});
	}
});

messenger.setPersistentMenu([
	{
		type: "postback",
		title: "Become a listener",
		payload: "PERSISTENT_MENU_LISTENER",
	},
	{
		type: "postback",
		title: "I need some help",
		payload: "PERSISTENT_MENU_HELP",
	},
]);

messenger.on("postback:PERSISTENT_MENU_HELP", (payload, chat) => {
	var sender = payload.sender.id;
	chat
		.say(
			`🤖 Sure thing! You will be connected to a listener as soon as possible`,
			{ typing: true }
		)
		.then(() => {
			connectToListener(sender, chat);
		});
});

messenger.on("postback:PERSISTENT_MENU_LISTENER", (payload, chat) => {
	var sender = payload.sender.id;
	chat
		.say(`T🤖 hankyou! We will connect you to someone in-need soon.`, {
			typing: true,
		})
		.then(() => {
			connectToInNeed(sender, chat);
		});
});

messenger.hear("Report listener", (payload, chat) => {
	// For this function we need to get the listener of this client...
	// We then need to notify an admin...
	// We need to workout if we keep the last 10 or so listeners messages.
	// so then we can easily see them or whatnot.
	chat
		.say(`🤖 Dont worry. We have reported them to an admin.`, { typing: true })
		.then(() => {
			chat.say(
				`🤖 Just letting you know... you are still connected to the chat.`,
				{ typing: true }
			);
		});
});

messenger.hear("I can't handle this", (payload, chat) => {
	var typing = { typing: true };
	chat.say(`🤖 Dont worry, we cant all handle everything!`, typing).then(() => {
		chat.say(
			`🤖 This chat will be escalated and taken off your hands.`,
			typing
		);
	});
});

messenger.hear("End Chat", (payload, chat) => {
	chat.say(`🤖 Thankyou for your chat. We hope you had a good expirence.`, {
		typing: true,
	});
});

messenger.hear("Become a listener", (payload, chat) => {
	var sender = payload.sender.id;
	chat
		.say(`🤖 Thankyou! We will connect you to someone in-need soon.`, {
			typing: true,
		})
		.then(() => {
			connectToInNeed(sender, chat);
		});
});

messenger.hear("I need some help", (payload, chat) => {
	var sender = payload.sender.id;
	chat
		.say(
			`🤖 Sure thing! You will be connected to a listener as soon as possible`,
			{ typing: true }
		)
		.then(() => {
			connectToListener(sender, chat);
		});
});

messenger.on("message", (payload, chat) => {
	if (
		payload.sender.id in interactions &&
		information[payload.sender.id].connected == true
	) {
		passOntoSender(interactions[payload.sender.id], chat, payload.message.text);
	}
});

/*
██      ██ ███████ ████████ ███████ ███    ██ ███████ ██████
██      ██ ██         ██    ██      ████   ██ ██      ██   ██
██      ██ ███████    ██    █████   ██ ██  ██ █████   ██████
██      ██      ██    ██    ██      ██  ██ ██ ██      ██   ██
███████ ██ ███████    ██    ███████ ██   ████ ███████ ██   ██
*/

messenger.start();
