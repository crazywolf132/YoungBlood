var share = (module.exports = {});
const core = require(process.cwd() + "/server");
const words = require(process.cwd() + "/helper/words");
var respond = core.sendOff;

console.log(core);

share.getStarted = async (respond, sendTo) => {
    var intro = "";
    var state = core.db[sendTo]['gettingStartedStage'];
    if (state == 0) {
        respond(
            sendTo, 
            "Welcome! We are glad you found us.", 
            { typing: true }
        );
        respond(
            sendTo,
            "Before we get started, we just need a bit of information. We will start off with a username!",
            { typing: true }
        );
    } else if (state == 1) {
        handleUsername(respond, sendTo, message);
        respond(
            sendTo,
            "1 more thing... a date of birth. Eg. dd/mm/yyyy.",
            { typing: true }
        );
    } else if (state == 2) {
        dob(respond, sendTo, message);
    }
    (core.db[sendTo].gettingStartedStatus == 2) ? core.db[sendTo].gettingStartedStatus = -1: core.db[sendTo].gettingStartedStatus++;
}

share.handleUsername = (respond, sendTo, message) => {
    if (words.analyze(message).score < 0){
        var response = "Lets try again shall we.";
        core.db[sendTo].gettingStartedStatus--;
    } else {
         core.db[sendTo].username = message;
         var response = "Great start!";
    }
   
    respond(sendTo, response, { typing: true });
}

share.dob = (respond, sendTo, message) => {
    var today = new Date();
    var todayYear = today.getFullYear();
    // Need to get the year of the inputted DOB... if it is
    // within 5 years ago... then we cant allow it.
    core.db[sendTo].dob = message;
    var response = "Thankyou.";
    respond(sendTo, response, { typing: true });
}