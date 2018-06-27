var express = require("express");
var router = express.Router();
const core = require(process.cwd() + "/server");

router.route("/").post((req, res, next) => {

    let messaging_events = req.body.entry[0].messaging;
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i];
        let sender = event.sender.id;
        if (event.message && event.message.text) {
            let text = event.message.text;
            core.seenMessage(sender);
            core.handle(text, sender);
            res.sendStatus(200);
        }
    }
    //res.sendStatus(200);
})

module.exports = router;