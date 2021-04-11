// This file implements the main event listener of the bot, which picks up messages, parses them for commands, and calls the appropriate functions.

// Import the discord.js module
const Discord = require('discord.js');


const auth = require('./files/auth.json');
process.env.serviceID = auth.serviceID;
process.env.token = auth.token;

// commands
var online = require('./online.js');
var bully = require('./bully.js');
var headtohead = require('./headtohead.js');
var messageHandler = require('./messageHandler.js');
var time = require('./time.js');

const client = new Discord.Client();
// https://discordapp.com/developers/applications/me
const token = process.env.token;

client.on('ready', () => {
	console.log('Running on '+client.guilds.cache.size+' servers!');
	client.user.setActivity('!g')
});

var listOfCommands = [
"!g",
"!isfrogstupid",
"!isdtbstupid",
"!stopbullying",
"!vs <comma delimited list of players> <comma delimited list of players>",
"!time <timestamp>   (timestamp format example: 2021-04-20 04:20 PST)"
]

var links = [
	"[GitHub page](https://github.com/jl4ntz/goblin-bot)",
]

// Create an event listener for messages
client.on('message', message => {
	if(message.author == client.user){
		return;
	}
	
	if (message.content.toLowerCase().match('!g$')) {
		online.onlineGoblins(message);
	}
	else if (message.content.toLowerCase().substr(0,6) == "!time ") {
		time.timeUntil(message);
	}
	else if (message.content.toLowerCase() == '!isfrogstupid'){
		bully.getBullyResponse(message);
	}
	else if (message.content.toLowerCase() == '!isdtbstupid') {
		bully.dtb(message);
	}	
	else if (bully.doBully() && message.content.toLowerCase() == "!stopbullying") {
		bully.showBullyDisabledMessage(message);
	} 
	else if (!bully.doBully() && bully.getCorrectEnableAnswer().indexOf(message.content.toLocaleLowerCase()) !== -1) {
		bully.reenableBully(message);
	}
	else if(message.content.substring(0,4).toLowerCase() == '!vs '){
		let playerLists = message.content.substring(4).toLowerCase().split(" ");
		headtohead.head2head(playerLists[0].split(","),playerLists[1].split(","))
			.then(res => messageHandler.send(message.channel, res, "PC Online", true))
			.catch(err => messageHandler.handleError(message.channel, err, "PC Online"))		
	}
	else if (message.content.toLowerCase() == '!help' || message.content.toLowerCase() == '!about'){
		//show list of commands and relevant links
		let helpEmbed = new Discord.MessageEmbed();
		helpEmbed.setTitle("GoblinBot");
		helpEmbed.setColor("GREEN");
		helpEmbed.addField("Commands", listOfCommands);
		helpEmbed.addField("Links", links);
		messageHandler.send(message.channel, helpEmbed, 'help', true);
	}
});

// Log bot in
client.login(token);
