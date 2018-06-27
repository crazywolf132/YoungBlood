var share = (module.exports = {});
var core = require(process.cwd() + "/server");

share.getStarted = (sendTo) => {
    var intro = "Welcome! We are glad you found us.";
    core.sendMessage(sendTo, intro, {typing: true});

    var intro = "Before we get started, we just need a bit of information. We will start off with a username!";
    core.sendMessage(sendTo, intro, {typing: true});

    var intro = "Welcome! We are glad you found us.";
    core.sendMessage(sendTo, intro, {typing: true});
}

share.handleUsername = (sendTo, message) => {
    core.db[sendTo].username = message;
    var response = "Wow! That is a brilliant username!";
    core.sendMessage(sendTo, response, {typing: true});
    
    share.getStarted(sendTo);
}