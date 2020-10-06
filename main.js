// This file implements the main event listener of the bot, which picks up messages, parses them for commands, and calls the appropriate functions.

// Import the discord.js module
const Discord = require('discord.js');

// auth file
var runningOnline = false; //The assumption is an auth file will be present iff running offline
try{
	var auth = require('./auth.json');
	process.env.serviceID = auth.serviceID;
	process.env.token = auth.token;
}
catch(e){
	console.log('No auth file found');
	runningOnline = true;
}

// commands
var online = require('./online.js');
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
"!isfrogstupid"
]

var links = [
	"[GitHub page](https://github.com/jl4ntz/goblin-bot)",
	"[Invite bot](https://discord.com/api/oauth2/authorize?client_id=762870299330740254&permissions=18432&scope=bot)"
]

var frogMikeIsStupid = [
		"frog mike is so stupid that when an intruder broke into his house, he ran downstairs, dialed 9-1-1 on the microwave, and couldn't find the \"CALL\" button.",
		"frog mike is so stupid, he put two quarters in his ears and thought he was listening to 50 Cent.",
		"frog mike is so stupid he stuck a battery up his ass and said, \"I GOT THE POWER!\"",
		"frog mike is so stupid, when he was driving to Disneyland, he saw a sign that said \"Disneyland left\" so he went home.",
		"frog mike is so stupid he climbed over a glass wall to see what was on the other side.",
		"frog mike is so stupid he brought a spoon to the super bowl.",
		"frog mike is so stupid he took a ruler to bed to see how long he slept.",
		"frog mike is so stupid that he thought Dunkin' Donuts was a basketball team.",
		"frog mike is so stupid that when thieves broke in and stole the tv, he ran outside and yelled to them, \"Hey, you forgot the remote!\"",
		"frog mike is so stupid that he sat on the TV to watch the couch.",
		"frog mike is so stupid, he got hit by a parked car.",
		"frog mike is so stupid, he returned a donut because it had a hole in it.",
		"frog mike is so stupid he put airbags on his computer in case it crashed.",
		"frog mike is so stupid he tried to put M&M's in alphabetical order.",
		"frog mike is so stupid he tried to make an appointment with Dr. Pepper.",
		"frog mike is so stupid his password needed 8 characters, so he typed \"Snow White and the 7 dwarfs.\"",
		"frog mike is so stupid he tried to save a fish from drowning.",
		"frog mike is so stupid he stuck a phone up his butt and thought he was making a booty call!",
		"frog mike is so stupid when the judge said, \"Order! Order!\" he said, \"Fries and coke please.\"",
		"frog mike is so stupid when I said, \"Drinks on the house,\" he got a ladder.",
		"frog mike is so stupid he put two M&M's in his ear and said he was listening to Eminem.",
		"frog mike is so stupid that when he was locked in a grocery store he starved!",
		"frog mike is so stupid, he stopped his car at a stop sign and he's still waiting for it to turn green.",
		"frog mike is so stupid he tried to surf the microwave",
		"frog mike is so stupid he thought Bruno Mars was a planet.",
		"frog mike is so stupid I told him spring was around the corner and he went looking for it.",
		"frog mike is so stupid he sold his car for gas money.",
		"frog mike is so stupid, he steals samples from stores!",
		"frog mike is so stupid when I told him Christmas is right around the corner he went looking for it.",
		"frog mike is so stupid, he tried to hug his reflection in the pool thinking it was his long lost twin, and drowned.",
		"frog mike is so stupid it took him four hours to watch \"60 Minutes.\"",
		"frog mike is so dumb he tripped over a cordless phone."
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
		let theMessage = frogMikeIsStupid[Math.floor(Math.random() * frogMikeIsStupid.length)];
		messageHandler.send(message.channel, theMessage, "PC Online", false);
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
