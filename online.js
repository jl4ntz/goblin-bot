const Discord = require('discord.js');
var got = require('got');
var messageHandler = require('./messageHandler.js');

var onlineInfo = async function(oTag, platform) {
	let uri = 'http://census.daybreakgames.com/s:' + process.env.serviceID + '/get/' + platform + '/outfit?alias_lower=' + oTag + '&c:resolve=member_online_status,rank,member_character_name&c:join=character^on:leader_character_id^to:character_id&c:join=characters_world^on:leader_character_id^to:character_id';
	let response = "";
	try {
		response = await got(uri).json();
	}
	catch (err) {
		if (err.message.indexOf('404') > -1) {
			return new Promise(function(resolve, reject) {
				reject("API error searching for " + oTag);
			})
		}
	}
	
	if (typeof(response.error) !== 'undefined') {
		if (response.error == 'service_unavailable') {
			return new Promise(function(resolve, reject) {
				reject("Census API currently unavailable");
			})
		}
		return new Promise(function(resolve, reject) {
			reject(response.error);
		})
	}
	if (typeof(response.outfit_list) === 'undefined') {
		return new Promise(function(resolve, reject) {
			reject("API Error searching for " + oTag);
		})
	}
	if (typeof(response.outfit_list[0]) === 'undefined') {
		return new Promise(function(resolve, reject) {
			reject(oTag + " not found");
		})
	}
	let urlBase = 'https://ps2.fisu.pw/player/?name=';
	if (platform == 'ps2ps4us:v2') {
		urlBase = 'https://ps4us.ps2.fisu.pw/player/?name=';
	}
	else if (platform == 'ps2ps4eu:v2') {
		urlBase = 'https://ps4eu.ps2.fisu.pw/player/?name=';
	}
	let data = response.outfit_list[0];
	let resObj = {
		name: data.name,
		alias: data.alias,
		memberCount: data.member_count,
		onlineCount: 0
	}
	if (data.members[0].online_status == "service_unavailable") {
		resObj.onlineCount = oTag + " online member count unavailable";
		return new Promise(function(resolve, reject) {
			resolve(resObj);
		})
	}
	if (typeof(data.members[0].name) === 'undefined') {
		return new Promise(function(resolve, reject) {
			reject(oTag + " API error: names not returned")
		})
	}
	if (typeof(data.leader_character_id_join_character) !== 'undefined') {
		resObj.faction = data.leader_character_id_join_character.faction_id;
		if (data.leader_character_id_join_characters_world.world_id == "1") {
			resObj.world = "Connery"
		}
		if (data.leader_character_id_join_characters_world.world_id == "17") {
			resObj.world = "Emerald"
		}
	}
	let pcModifier = 0;
	let rankNames = ["", "", "", "", "", "", "", ""];
	let onlineMembers = [
		[],
		[],
		[],
		[],
		[],
		[],
		[],
		[]
	];
	if (typeof(data.ranks) !== 'undefined') {
		pcModifier = 1;
		for (let rank of data.ranks) {
			rankNames[Number.parseInt(rank.ordinal) - pcModifier] = rank.name;
		}
	}
	for (i in data.members) {
		if (data.members[i].online_status > 0) {
			resObj.onlineCount += 1;
			onlineMembers[Number.parseInt(data.members[i].rank_ordinal) - pcModifier].push("[" + data.members[i].name.first + "](" + urlBase + data.members[i].name.first + ")");
		}
		if (pcModifier == 0 && rankNames[Number.parseInt(data.members[i].rank_ordinal)] == "") {
			rankNames[Number.parseInt(data.members[i].rank_ordinal)] = data.members[i].rank;
		}
	}
	for (i in onlineMembers) {
		onlineMembers[i].sort(function(a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); }); //This sorts ignoring case: https://stackoverflow.com/questions/8996963/how-to-perform-case-insensitive-sorting-in-javascript#9645447
	}
	resObj.onlineMembers = onlineMembers;
	resObj.rankNames = rankNames;
	return new Promise(function(resolve, reject) {
		resolve(resObj);
	})
}

function handleAPIErrors(errors, message) {
	if (errors.length > 0) {
		var errorStrings = "";
		errors.forEach(error => {
			errorStrings += error + "\n";
		})

		let resEmbed = new Discord.MessageEmbed();
		resEmbed.setTitle("Errors");
		resEmbed.setDescription(errorStrings);
		messageHandler.send(message.channel, resEmbed, "PC Online", true);
	}
}

module.exports = {
	onlineGoblins: async function(message) {
		let tags = ["gobs", "fooi", "fiji", "gob", "rent", "fool"];
		let errors = [];
		let foundOnline = [];
		var promiseList = [];

		for (var x in tags) {
			promiseList.push(onlineInfo(tags[x], 'ps2:v2'))
		}

		var onlineInfoResults = await Promise.allSettled(promiseList).then(res => {
				res.filter(r => r.status === 'rejected').map(r => r.reason).forEach(r => errors.push(r));
				res.filter(r => r.status === 'fulfilled').map(r => r.value).forEach(r => foundOnline.push(r));
			})
			.then(r => {

				handleAPIErrors(errors, message)

				var noOneOnline = true;
				for (var x in foundOnline) {
					if (foundOnline[x].onlineCount > 0) {
						noOneOnline = false;
					}
				}

				if (noOneOnline && errors.length === 0) {
					let resEmbed = new Discord.MessageEmbed();
					resEmbed.setTitle("#deadfit");
					messageHandler.send(message.channel, resEmbed, "PC Online", true)
				}
				else {
					for (var x in foundOnline) {
						let resEmbed = new Discord.MessageEmbed();
						resEmbed.setTitle(foundOnline[x].name + " - " + foundOnline[x].world);
						resEmbed.setDescription(foundOnline[x].alias + "\n" + foundOnline[x].onlineCount + "/" + foundOnline[x].memberCount + " online");
						resEmbed.setTimestamp();
						resEmbed.setURL('http://ps2.fisu.pw/outfit/?name=' + foundOnline[x].alias);

						if (foundOnline[x].onlineCount > 0) {
							switch (foundOnline[x].faction) {
								case "1":
									resEmbed.setColor('PURPLE');
									break;
								case "2":
									resEmbed.setColor('BLUE');
									break;
								case "3":
									resEmbed.setColor('RED');
									break;
								default:
									resEmbed.setColor('GREY');
							}
							for (let i = 0; i < 8; i++) {
								if (foundOnline[x].onlineMembers[i].length > 0) {
									anyOn = true;
									try {
										resEmbed.addField(foundOnline[x].rankNames[i], foundOnline[x].onlineMembers[i], true);
									}
									catch {
										resEmbed.addField(foundOnline[x].rankNames[i], "Too many to display", true);
									}

								}
							}
							messageHandler.send(message.channel, resEmbed, "PC Online", true);
						}
					}
				}
			})
	}
}
