const Discord = require('discord.js');
var messageHandler = require('./messageHandler.js');
var frogMikeIsStupid = require('./files/stupid.json');
var bullyQuestions = require('./files/bullyQuestions.json');

const BULLY_DISABLED_MESSAGE = "👁 Bullying features have been globally disabled by "
const BULLY_ENABLED_MESSAGE = "Bullying features have been globally enabled by "
const BULLY_DETAILS = "To globally re-enable bullying features answer the following question in the form of a command.  *e.g. \"!The Answer\"*";

var doBully = true;
var currentBullyQuestionNum = 0;
var currentBullyAnswers = bullyQuestions[currentBullyQuestionNum].correctAnswers
var userWhoDisabledBullying = "";

function showBullyDisabledMessage(message) {
	let bullyEmbed = new Discord.MessageEmbed()
		.setColor('#780707')
		.setTitle(BULLY_DISABLED_MESSAGE + userWhoDisabledBullying + ". 👁")
		.setDescription(BULLY_DETAILS)
		.addField('Question', bullyQuestions[currentBullyQuestionNum].question)
		.addField('Resources', 'https://www.stopbullying.gov/')
	messageHandler.send(message.channel, bullyEmbed, "PC Online", true);
}

function sendBullyRenabledEmbed(message) {
	let embed = new Discord.MessageEmbed()
		.setColor('#033800')
		.setTitle(BULLY_ENABLED_MESSAGE + message.member.displayName)
		.setDescription("Disable bullying features with !stopbullying")
	messageHandler.send(message.channel, embed, "PC Online", true);
}

module.exports = {
	getBullyResponse: function(message) {
		if (doBully) {
			let jokeTitle = frogMikeIsStupid[Math.floor(Math.random() * frogMikeIsStupid.length)];

			let embed = new Discord.MessageEmbed()
				.setTitle(jokeTitle)
				.setDescription("To disable bullying features, use !stopbullying")

			messageHandler.send(message.channel, embed, "PC Online", false);
		}
		else {
			showBullyDisabledMessage(message);
		}
	},
	showBullyDisabledMessage: function(message) {
		userWhoDisabledBullying = message.member.displayName;
		showBullyDisabledMessage(message);
		doBully = false;
		console.log('doBully after setting to false: ' + doBully)
	},
	reenableBully: function(message) {
		doBully = true;
		console.log('doBully after setting to true: ' + doBully)
		currentBullyQuestionNum++;
		if (currentBullyQuestionNum == bullyQuestions.length) {
			currentBullyQuestionNum = 0;
		}
		sendBullyRenabledEmbed(message);
	},
	getCorrectEnableAnswer: function() {
		let answers = bullyQuestions[currentBullyQuestionNum].correctAnswers;
		return answers;
	},
	doBully: function() {
		return doBully
	},
	dtb: function(message) {
		if (doBully) {
			let embed = new Discord.MessageEmbed()
				.setDescription("<@!217033022803935233>,\n An assessment of DeeTeeBee's intelligence has been requeseted by <@!" + message.author + ">.  Please respond in this channel as soon as possible, thank you.\n\n_To disable bullying features, use !stopbullying_");
			messageHandler.send(message.channel, embed, "PC Online", false);
		}
		else {
			showBullyDisabledMessage(message);
		}

	}
}
