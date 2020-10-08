// This file implements the main event listener of the bot, which picks up messages, parses them for commands, and calls the appropriate functions.

// Import the discord.js module
const Discord = require('discord.js');


const auth = require('./files/auth.json');
process.env.serviceID = auth.serviceID;
process.env.token = auth.token;

// commands
var online = require('./online.js');
var bully = require('./bully.js');
var messageHandler = require('./messageHandler.js');

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
"!stopbullying"
]

var links = [
	"[GitHub page](https://github.com/jl4ntz/goblin-bot)",
	"[Invite bot](https://discord.com/api/oauth2/authorize?client_id=762870299330740254&permissions=18432&scope=bot)"
]

// Create an event listener for messages
client.on('message', message => {
	if(message.author == client.user){
		return;
	}
	
	if (message.content.match('!g$')){
		let tags = ["gobs", "fooi", "fiji"];
		for(x in tags){
			online.online(tags[x], 'ps2:v2')
				.then(res => messageHandler.send(message.channel, res, "PC Online", true))
				.catch(err => messageHandler.handleError(message.channel, err, "PC Online"))
		}
	}
	else if (message.content.toLowerCase() == '!isfrogstupid'){
		bully.getBullyResponse(message);
	}
	else if (bully.doBully() && message.content.toLowerCase() == "!stopbullying") {
		bully.showBullyDisabledMessage(message);
	} 
	else if (!bully.doBully() && message.content.toLowerCase() == bully.getCorrectEnableAnswer()) {
		bully.reenableBully(message);
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
