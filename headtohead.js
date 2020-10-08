var got = require('got');
const Discord = require('discord.js');
var messageHandler = require('./messageHandler.js');


var head2headInfo = async function (player1List, player2List){
	var player1CharacterIDList = [];
	for (i in player1List) {
		let uri = 'https://census.daybreakgames.com/s:'+process.env.serviceID+'/get/ps2:v2/character?name.first_lower=' + player1List[i] + '&c:show=character_id'
		let response = "";
		try{
			response = await got(uri).json(); 
		}
		catch(err){
			if(err.message.indexOf('404') > -1){
				return new Promise(function(resolve, reject){
					reject("API Unreachable");
				})
			}
		}
		if(typeof(response.error) !== 'undefined'){
			if(response.error == 'service_unavailable'){
				return new Promise(function(resolve, reject){
					reject("Census API currently unavailable");
				})
			}
			return new Promise(function(resolve, reject){
				reject(response.error);	
			})
		}
		if(typeof(response.character_list[0]) === 'undefined'){
			return new Promise(function(resolve, reject){
				reject("API Error");
			})
		}
		
		player1CharacterIDList.push(response.character_list[0].character_id)
	}
	
	var player1ListKills=0;
	var player2ListKills=0;

	let uri = 'https://census.daybreakgames.com/s:'+process.env.serviceID+'/get/ps2:v2/characters_event_grouped?character_id=' + player1CharacterIDList + '&c:resolve=character_name'
	let response = "";
	try{
		response = await got(uri).json(); 
	}
	catch(err){
		if(err.message.indexOf('404') > -1){
			return new Promise(function(resolve, reject){
				reject("API Unreachable");
			})
		}
	}
	if(typeof(response.error) !== 'undefined'){
		if(response.error == 'service_unavailable'){
			return new Promise(function(resolve, reject){
				reject("Census API currently unavailable");
			})
		}
		return new Promise(function(resolve, reject){
			reject(response.error);	
		})
	}
	if(typeof(response.characters_event_grouped_list[0]) === 'undefined'){
		return new Promise(function(resolve, reject){
			reject("API Error");
		})
	}
	
	var player1KillCount=0;
	var player2KillCount=0;
	
	for(var i in response.characters_event_grouped_list){
		
		for(var p2 in player2List) {
			
			if(typeof response.characters_event_grouped_list[i].character !== 'undefined'){
				
				if(typeof response.characters_event_grouped_list[i].character.name !== 'undefined') {
					
					if(response.characters_event_grouped_list[i].character.name.first_lower === player2List[p2]){
						if(response.characters_event_grouped_list[i].table_type === "DEATH") {
							player2KillCount=player2KillCount + Number(response.characters_event_grouped_list[i].count)
						}
						if(response.characters_event_grouped_list[i].table_type === "KILL") {
							player1KillCount=player1KillCount + Number(response.characters_event_grouped_list[i].count)
						}
					}			
				}
			}
		}
	}
	
	let resObj = {
		player1List: player1List,
		player1KillCount: player1KillCount,
		player2List: player2List,
		player2KillCount: player2KillCount
	}
	
	return new Promise(function(resolve, reject){
		resolve(resObj);
	})
}


module.exports = {
	head2head: async function(player1List, player2List){
		if(messageHandler.badListQuery(player1List) || messageHandler.badListQuery(player2List)){
			return new Promise(function(resolve, reject){
                reject("Player list contains disallowed characters");
            })
		}
		try{
			var h2hInfo = await head2headInfo(player1List, player2List);
		}
		catch(error){
			return new Promise(function(resolve, reject){
				reject(error);
			})
		}
		let resEmbed = new Discord.MessageEmbed()
		.setTitle(player1List.toString() + ' vs ' + player2List.toString())
		.addField(player1List.toString() + ' kills', h2hInfo.player1KillCount)
		.addField(player2List.toString() + ' kills', h2hInfo.player2KillCount)
		return new Promise(function(resolve, reject){
			resolve(resEmbed);
		})
	}
}