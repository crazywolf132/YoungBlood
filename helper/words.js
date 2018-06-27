var share = (module.exports = {});
var positiveWords = require("positiveWords");
var negativeWords = require("negativeWords");

share.positivity = (incomming) => {

    var tokens = incomming.toLowerCase().split(" ");
    var hits = 0;
    var words = [];

    tokens.forEach((item) => {
        if (positiveWords.indexOf(item) > -1) {
            hits++;
            words.push(item);
        }
    });

    return { score: hits, comparative: hits / tokens.length, words: words};
}

share.negativity = (incomming) => {

    var tokens = incomming.toLowerCase().split(" ");
    var hits = 0;
    var words = [];

    tokens.forEach((item) => {
        if (negativeWords.indexOf(item) > -1) {
            hits++;
            words.push(item);
        }
    });

    return { score: hits, comparative: hits / tokens.length, words: words};

}

share.analyze = (incomming) => {
    let pos = share.positivity(incomming);
    let neg = share.negativity(incomming);

    return { socre: pos.score - neg.score };
}

share.censor = (incomming) => {

}

share.findSwears = (incomming) => {

}