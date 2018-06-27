'use strict';
const EventEmitter = require('eventemitter3');
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fetch = require('node-fetch');

class YoungBlood extends EventEmitter {
  constructor(options) {
    super();
    if (
      !options ||
      (options &&
        (!options.accessToken || !options.verifyToken || !options.appSecret))
    ) {
      throw new Error(
        "Please specify my accessToken, verifyToekn and appSecret. Thankyou."
      );
    }

    this.accessToken = options.accessToken;
    this.verifyToken = options.verifyToken;
    this.appSecret = options.appSecret;
    this.app = express();
    this.webhook = "/webhook";
    this.app.use(bodyParser.json({ verify: this._verifySignature.bind(this) }));
  }

  start(port) {
    this._startWebhook();
    this.app.set("port", port || 80);
    this.server = this.app.listen(this.app.get("port"), () => {
      const portNum = this.app.get("port");
      console.log("Bot running on port", portNum);
      console.log(`Webhook avaliable at localhost:${portNum}${this.webhook}`);
    });
  }

  close() {
    this.server.close();
  }

  _startWebhook() {
    this.app.get(this.webhook, (req, res) => {
      if (
        req.query["hub.mode"] === "subscribe" &&
        req.query["hub.verify_token"] === this.verifyToken
      ) {
        console.log("Validation Succeded.");
        res.status(200).send(req.query["hub.challenge"]);
      } else {
        console.log(
          "Failed to validate. Make sure the validation tokens are the same."
        );
      }
    });

    this.app
      .post(this.webhook, (req, res) => {
        var data = req.body;
        if (data.object !== "page") {
          return;
        }

        this.handleFacebookData(data);

        res.sendStatus(200);
      })
      .bind(this);
  }

  _verifyRequestSignature(req, res, buf) {
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
        throw new Error("Couldn't validate the request signature.");
      }
    }
  }
}