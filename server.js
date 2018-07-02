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

var interactions = {};

var information = {};

var waitingListeners = [];

var waitingInneeds = [];

const connect2people = (person1, person2) => {
	information[person1].waiting = false;
	information[person2].waiting = false;
	information[person1].connected = true;
	information[person2].connected = true;
	interactions[person1] = person2;
	interactions[person2] = person1;
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
			chat.say(`You are number: ${amount}, in the que.`, typing);
		} else {
			// There are some listeners avaliable.
			// We will now connect to the first waiting Listener...
			var person = information[waitingListeners[0]].username;
			var me = information[inneed].username;
			chat.sendToID(
				waitingListeners[0],
				`Here they come! You are being connected to ${me}`,
				typing
			);
			chat.sendToID(
				inneed,
				`Woohoo! You are being connected to ${person}`,
				typing
			);
			connect2people(inneed, waitingListeners[0]);
			waitingListeners.shift();
		}
	}
};

/**const connectToListener = (inneedID, chat) => {
	if (waitingListeners.length == 0) {
		waitingInneeds.push(inneedID);
		information[inneedID].waiting = true;
		var amount = waitingInneeds.length;
		chat.say(`You are number: ${amount}, in the que.`, { typing: true });
	} else {
		// We should really check to make sure someone else isnt first...
		// as we never know, someone could have been placed in the que at the same time someone became avaliable...
		if (waitingInneeds.length == 0) {
			// There is no-one else in the que, so lets connect this user to a listener.
			//var person = information[waitingListeners[0]].username;
			var person = waitingListeners[0];
			chat.sendToID(
				waitingListeners[0],
				`Here they come! You are being connected to ${me}`,
				{ typing: true }
			);
			chat.sendToID(inneedID, `Woohoo! You are being connected to ${person}`, {
				typing: true,
			});
			waitingListeners.shift();
		} else {
			// This is for when there is someone else first...
			// We need to also add them to the array.
			var person = information[waitingListeners[0]].username;
			var me = information[waitingInneeds[0]].username;
			chat.sendToID(
				waitingInneeds[0],
				`Woohoo! You are being connected to ${person}`,
				{ typing: true }
			);
			chat.sendToID(
				waitingListeners[0],
				`Here they come! You are being connected to ${me}`,
				{ typing: true }
			);
			waitingListeners.shift();
			waitingInneeds.shift();
		}
	}
};
**/
const connectToInNeed = (Listener, chat) => {
	if (
		information[Listener].waiting == false &&
		information[Listener].connected == false
	) {
		if (waitingInneeds.length == 0) {
			waitingListeners.push(Listener);
			var amount = waitingListeners.length;
			information[Listener].waiting = true;
			chat.say(`You are number: ${amount}, in the que.`, { typing: true });
		} else {
			// We just need to connect the listener with the first person in the in-needs list.
			var person = information[waitingInneeds[0]].username;
			var me = information[Listener].username;
			chat.sendToID(
				Listener,
				`Here they come! You are being connected to ${person}.`,
				{ typing: true }
			);
			chat.sendToID(
				waitingInneeds[0],
				`Woohoo! You are being connect to ${me}.`,
				{ typing: true }
			);
			connect2people(Listener, waitingInneeds[0]);
			waitingInneeds.shift();
		}
	}
};

const passOntoSender = (RecieverID, chat, message) => {
	chat.sendToID(RecieverID, message, { typing: true });
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
			`Sure thing! You will be connected to a listener as soon as possible`,
			{ typing: true }
		)
		.then(() => {
			connectToListener(sender, chat);
		});
});

messenger.on("postback:PERSISTENT_MENU_LISTENER", (payload, chat) => {
	var sender = payload.sender.id;
	chat
		.say(`Thankyou! We will connect you to someone in-need soon.`, {
			typing: true,
		})
		.then(() => {
			connectToInNeed(sender, chat);
		});
});

messenger.hear(["hi", "hello"], (payload, chat) => {
	chat.say("Oh shit!", { typing: true });
});

messenger.hear("Become a listener", (payload, chat) => {
	var sender = payload.sender.id;
	chat
		.say(`Thankyou! We will connect you to someone in-need soon.`, {
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
			`Sure thing! You will be connected to a listener as soon as possible`,
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

messenger.start(); /*



// The in-memory database...
// The exports...
var share = (module.exports = {});
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
//var connections = {}

/**
 * This will be used to remember who is what.
 * For example, it will remember ur information such as BDAY, USERNAME.
 * It will also keep information such as whether or not you are a listener
 */
//share.db = status = {};

/**
 * This function is used for showing the sender that we have recieved their message...
 * Eventually I would like to make it so the first user only gets this once the second user has seen the message.
 * @param {String} sender
 */
/*share.seenMessage = (sender) => {
    const recipient = _createRecipient(sender);
    return sendRequest({
        recipient,
        sender_action: "mark_seen"
    });
};*/

// Loading this here so then it gets access to the above exports...

/**
 * This is where every message is processed. Everything that comes through the bot,
 * will first come here... so we can workout what the hell to do with it.
 * @param {String} message
 * @param {String} sender
 */
/*share.handle = (message, sender) => {
    /**
     * We cannot assume that the first person is already connected to the second person...
     * So we need to perform a few checks.
     * 1) Check to see if person is in the database... if not, add them.
     * 2) Check to see what mode they want, Helper or In-need.
     * Only then can we send the message from person1 to person2.
     */
/*console.log(`Recieved from ${sender}: ${message}`);

    if (sender in connections && status[sender].gettingStartedStage == -1) {
        // Cool. so the person is in here... we just have to pass on the message...
        var partner = connection[sender]; // Collecting their partners ID.

    } else {
        // We need to ask them for some details now...
        // First we are going to check to see if we have ever seen this person...
        if (sender in status && status[sender].gettingStartedStage == -1) {
            // Guess we dont need to ask them any questions... We already have their information.
            // We just need to connect them to someone.
            // or check to see if they have entered a known command.

        } else {
            // This person is brand new. Lets get them setup.
            // We will send them a few messages asking for some details, aswell as saying what this service is.
            // Aswell as what information we will be keeping and such.
            status[sender] = {}
            status[sender].username = ""
            status[sender].gettingStartedStage = 0;
            presets.getStarted(messenger.respond, sender);
        }
    }
*/

/*messenger.on('message', (payload, chat) => {
    const text = payload.message.text;
    chat.say(`Echo: ${text}`);
});*/

/*
██      ██ ███████ ████████ ███████ ███    ██ ███████ ██████
██      ██ ██         ██    ██      ████   ██ ██      ██   ██
██      ██ ███████    ██    █████   ██ ██  ██ █████   ██████
██      ██      ██    ██    ██      ██  ██ ██ ██      ██   ██
███████ ██ ███████    ██    ███████ ██   ████ ███████ ██   ██
*/
//messenger.start();
