var got = require('got');
const Discord = require('discord.js');
var messageHandler = require('./messageHandler.js');

const characterNotFoundMessage = "Character not found"

var characterInfo = async function(inPlayerList, playerName) {
	let uri = 'https://census.daybreakgames.com/s:'+process.env.serviceID+'/get/ps2:v2/character?name.first_lower='+playerName+'&c:resolve=world,outfit(alias)&c:show=character_id,name.first,faction_id,world_id';
	let response = "";
	
	try{
		response = await got(uri).json();
	} catch(err) {
		return new Promise(function(res, reject){
			reject("API Unreachable");
		})
	}
	
	if(typeof(response.error) !== 'undefined') {
		return new Promise(function(res,reject){
			reject(response.error);
		})
	}
	
	if(typeof(response.returned) === 'undefined'){
		return new Promise(function(res,reject){
			reject("Bad response from census API")
		})
	}
	
	if(response.returned != 1){
		return new Promise(function(res,reject){
			reject(characterNotFoundMessage + ': ' + playerName);
		})
	}
	
	let characterInfoResponse = {
		inPlayerList: inPlayerList,
		character_id: response.character_list[0].character_id,
		name: response.character_list[0].name.first,
		faction_id: response.character_list[0].faction_id,
		world_id: response.character_list[0].world_id,
		outfitAlias: response.character_list[0].outfit.alias,
		eventList: []
	}
	
	return new Promise(function(res,reject){
		res(characterInfoResponse)
	})
}

var characterEvents = async function(character){
	let uri = 'https://census.daybreakgames.com/s:'+process.env.serviceID+'/get/ps2:v2/characters_event_grouped?character_id='+character.character_id+'&type=KILL&c:join=character^show:faction_id'
	let response = ""
	
	try{
		response = await got(uri).json();
	} catch(err) {
		return new Promise(function(res, reject){
			reject("API Unreachable");
		})
	}
	
	if(typeof(response.error) !== 'undefined') {
		return new Promise(function(res,reject){
			reject(response.error);
		})
	}
	
	if(typeof(response.returned) === 'undefined'){
		return new Promise(function(res,reject){
			reject("Bad response from census API")
		})
	}
	
	character.eventList = response.characters_event_grouped_list;
	
	return new Promise(function(res,reject){
		res(character)
	})
}

function getCharacterRetrievePromiseList(player1List, player2List){
	var promiseList = [];
	for(var i in player1List){
		promiseList.push(characterInfo(1,player1List[i]));
	}
	for(var i in player2List){
		promiseList.push(characterInfo(2,player2List[i]));
	}
	return promiseList;
}

function getCharacterEventsPromiseList(foundCharacters){
	var promiseList = [];
	for(var i in foundCharacters){
		promiseList.push(characterEvents(foundCharacters[i]))
	}
	return promiseList
}

const worlds = {
	"19":"Jaeger",
	"10":"Miller",
	"13":"Cobalt",
	"17":"Emerald",
	"1":"Connery",
	"40":"SolTech",
	"24":"Apex",
	"25":"Briggs"
}

const factions = {
	"1":"VS",
	"2":"NC",
	"3":"TR",
	"4":"NSO"
}

function getPrintableCharacterNameListList(playerList) {
	return playerList.map(x => {
		var printedName = "";
		if (x.outfitAlias.trim().length > 0){
			printedName += '[' + x.outfitAlias + ']';
		}
		printedName += x.name + '\t-\t' + factions[x.faction_id] + '\t-\t' + worlds[x.world_id]
		return printedName;
	});
}

module.exports = {
	head2head: async function(player1List, player2List){
		if(messageHandler.badListQuery(player1List) || messageHandler.badListQuery(player2List)){
			return new Promise(function(resolve, reject){
                reject("Player list contains disallowed characters");
            })
		}
		
		if(player1List.length + player2List.length > 10) {
			return new Promise(function(resolve, reject){
                reject("Maximum 10 total characters allowed");
            })
		}
		
		let characterRetrievePromiseList = getCharacterRetrievePromiseList(player1List, player2List);
		let errors = [];
		let foundCharacters = [];
		
		let resObj = {
			characterList1: [],
			characterList2: [],
			list1Kills:0,
			list2Kills:0,
			list1TeamKills:0,
			list2TeamKills:0
		}
		
		var	h2hInfo = await Promise.allSettled(characterRetrievePromiseList).then(res => {
				res.filter(r => r.status === 'rejected').map(r => r.reason).forEach(r => errors.push(r));
				res.filter(r => r.status === 'fulfilled').map(r => r.value).forEach(r => foundCharacters.push(r));
				resObj.characterList1 = foundCharacters.filter(x => x.inPlayerList == 1);
				resObj.characterList2 = foundCharacters.filter(x => x.inPlayerList == 2);
			})
			.then(async res => {
				let characterEventsPromiseList = getCharacterEventsPromiseList(foundCharacters);
				let foundEventLists = [];
				await Promise.allSettled(characterEventsPromiseList).then(r => {
					r.filter(x => x.status === 'rejected').map(x => x.reason).forEach(x => errors.push(x));
					r.filter(x => x.status === 'fulfilled').map(x => x.value).forEach(x => foundEventLists.push(x));
				
					let playerList1CharacterIDs = foundEventLists.filter(x=>x.inPlayerList==1).map(x=>x.character_id);
					let playerList2CharacterIDs = foundEventLists.filter(x=>x.inPlayerList==2).map(x=>x.character_id);
					
					foundEventLists.filter(x=>x.inPlayerList == 1).forEach(x => {
						let countedEvents = x.eventList.filter(e => playerList2CharacterIDs.includes(e.character_id));
						for(var i in countedEvents){
							if(countedEvents[i].character_id_join_character.faction_id !== x.faction_id){
								resObj.list1Kills = resObj.list1Kills + Number(countedEvents[i].count)
							} else {
								resObj.list1TeamKills = resObj.list1TeamKills + Number(countedEvents[i].count)
							}
						}
					});
					
					foundEventLists.filter(x=>x.inPlayerList == 2).forEach(x => {
						let countedEvents = x.eventList.filter(e => playerList1CharacterIDs.includes(e.character_id));
						for(var i in countedEvents){
							if(countedEvents[i].character_id_join_character.faction_id !== x.faction_id){
								resObj.list2Kills = resObj.list2Kills + Number(countedEvents[i].count)
							} else {
								resObj.list2TeamKills = resObj.list2TeamKills + Number(countedEvents[i].count)
							}
						}
					});
				})
			})
			
			let resEmbed = new Discord.MessageEmbed();
			resEmbed.setTitle('Versus');
			resEmbed.addField('Player 1 characters', getPrintableCharacterNameListList(resObj.characterList1), true);
			resEmbed.addField('Kills', resObj.list1Kills,true)
			resEmbed.addField('Team kills', resObj.list1TeamKills, true)
			resEmbed.addField('Player 2 characters', getPrintableCharacterNameListList(resObj.characterList2), true);
			resEmbed.addField('Kills', resObj.list2Kills, true)
			resEmbed.addField('Team kills', resObj.list2TeamKills, true)
			
			if(errors.length > 0) {
				resEmbed.addField('errors', errors)
			}
			return new Promise(function(res,reject){
				res(resEmbed)	
			})
	}
}