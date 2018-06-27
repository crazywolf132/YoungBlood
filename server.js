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



const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const EventEmitter = require("eventemitter3");
const nlp = require("compromise");

const presets = require("./helper/presets");
const config = require("./config/config");
const messenger = require("./helper/messenger");

const app = express();
const port = process.env.PORT || 80;
const token = config.accessToken;
const appSecret = config.appSecret;


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
var connections = {}


/**
 * This will be used to remember who is what.
 * For example, it will remember ur information such as BDAY, USERNAME.
 * It will also keep information such as whether or not you are a listener
 */
var status = {}



// The exports...
var share = (module.exports = {});


share.db = status;

/**
 * This function is used for showing the sender that we have recieved their message...
 * Eventually I would like to make it so the first user only gets this once the second user has seen the message.
 * @param {String} sender 
 */
share.seenMessage = (sender) => {
    const recipient = _createRecipient(sender);
    return sendRequest({
        recipient,
        sender_action: "mark_seen"
    });
};


/**
 * This is where every message is processed. Everything that comes through the bot,
 * will first come here... so we can workout what the hell to do with it.
 * @param {String} message 
 * @param {String} sender 
 */
share.handle = (message, sender) => {
    /**
     * We cannot assume that the first person is already connected to the second person...
     * So we need to perform a few checks.
     * 1) Check to see if person is in the database... if not, add them.
     * 2) Check to see what mode they want, Helper or In-need.
     * Only then can we send the message from person1 to person2.
     */
    console.log(`Recieved from ${sender}: ${message}`);

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
            status[sender].gettingStartedStage == 0;
            presets.getStarted(messenger.respond, sender);
        }
    }

}



_verifyRequestSignature = (req, res, buf) => {
  var signature = req.headers["x-hub-signature"];
  if (!signature) {
    throw new Error("Couldn't validate the request signature.");
  } else {
    var elements = signature.split("=");
    var method = elements[0];
    var signatureHash = elements[1];
    var expectedHash = crypto
      .createHmac("sha1", appSecret)
      .update(buf)
      .digest("hex");

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
};


/*
 ██████  ██████  ██████  ███████
██      ██    ██ ██   ██ ██
██      ██    ██ ██████  █████
██      ██    ██ ██   ██ ██
 ██████  ██████  ██   ██ ███████
*/
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)
app.use(
  bodyParser.json({
    verify: _verifyRequestSignature.bind()
  })
);
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
})


/*
██████   ██████  ██    ██ ████████ ███████ ███████
██   ██ ██    ██ ██    ██    ██    ██      ██
██████  ██    ██ ██    ██    ██    █████   ███████
██   ██ ██    ██ ██    ██    ██    ██           ██
██   ██  ██████   ██████     ██    ███████ ███████
*/
const webhook = require("./routes/webhook");
app.use("/webhook", webhook);



/*
██      ██ ███████ ████████ ███████ ███    ██ ███████ ██████
██      ██ ██         ██    ██      ████   ██ ██      ██   ██
██      ██ ███████    ██    █████   ██ ██  ██ █████   ██████
██      ██      ██    ██    ██      ██  ██ ██ ██      ██   ██
███████ ██ ███████    ██    ███████ ██   ████ ███████ ██   ██
*/
setTimeout(() => {
  app.listen(port);
  console.log(`Enlightenment on port ${port}\n\n`);
}, 1000);