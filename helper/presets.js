var share = (module.exports = {});
const core = require(process.cwd() + "/server");
const words = require(process.cwd() + "/helper/words");
var respond = core.sendOff;

share.getStarted = (respond, sendTo) => {
    switch(core.db[sendTo].gettingStartedStatus) {
        case "0":
            var intro = "Welcome! We are glad you found us."
            respond(sendTo, intro, { typing : true });
            var intro = "Before we get started, we just need a bit of information. We will start off with a username!";
            break;
        case "1":
            handleUsername(respond, sendTo, message);
            var intro = "1 more thing... a date of birth. Eg. dd/mm/yyyy.";
            break;
        case "2":
            break;
    }
    (core.db[sendTo].gettingStartedStatus == 2) ? core.db[sendTo].gettingStartedStatus = -1: core.db[sendTo].gettingStartedStatus += 1;
    respond(sendTo, intro, { typing: true });
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